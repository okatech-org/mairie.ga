/**
 * Assisted Registration Hook
 * Manages the chat-based registration flow with document analysis
 */

import { useState, useCallback, useRef } from 'react';
import {
    analyzeDocument,
    analyzeMultipleDocuments,
    DocumentAnalysis,
    ExtractedData,
    DocumentType,
    detectDocumentType,
    getMissingRegistrationFields
} from '@/services/documentOCRService';
import { formAssistantStore } from '@/stores/formAssistantStore';
import { uploadToVault } from '@/services/documentVaultService';
import type { DocumentCategory } from '@/services/documentVaultService';

export type RegistrationMode = 'autonomous' | 'form_preview';

interface PendingDocument {
    file: File;
    preview?: string;
    suggestedType?: DocumentType;
    analysis?: DocumentAnalysis;
    status: 'pending' | 'analyzing' | 'complete' | 'error';
}

interface AssistedRegistrationState {
    mode: RegistrationMode | null;
    documents: PendingDocument[];
    extractedData: ExtractedData;
    uncertainFields: string[];
    missingFields: string[];
    conflicts: { field: string; values: { value: string; source: DocumentType }[] }[];
    currentQuestion: string | null;
    isAnalyzing: boolean;
    isComplete: boolean;
    error: string | null;
}

const INITIAL_STATE: AssistedRegistrationState = {
    mode: null,
    documents: [],
    extractedData: {},
    uncertainFields: [],
    missingFields: [],
    conflicts: [],
    currentQuestion: null,
    isAnalyzing: false,
    isComplete: false,
    error: null
};

// Map document types to vault categories
const TYPE_TO_CATEGORY: Record<DocumentType, DocumentCategory> = {
    cni: 'photo_identity',
    passport: 'passport',
    birth_certificate: 'birth_certificate',
    residence_proof: 'residence_proof',
    family_record: 'family_record',
    other: 'other'
};

export function useAssistedRegistration() {
    const [state, setState] = useState<AssistedRegistrationState>(INITIAL_STATE);
    const analysisInProgress = useRef(false);

    /**
     * Start the assisted registration process
     */
    const startAssistedRegistration = useCallback((mode: RegistrationMode = 'form_preview') => {
        setState({
            ...INITIAL_STATE,
            mode
        });
        formAssistantStore.setCurrentForm('gabonais_registration');
        formAssistantStore.clearForm();
    }, []);

    /**
     * Add a document to the pending list
     */
    const addDocument = useCallback((file: File) => {
        const suggestedType = detectDocumentType(file.name);
        const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;

        setState(prev => ({
            ...prev,
            documents: [
                ...prev.documents,
                { file, preview, suggestedType, status: 'pending' }
            ]
        }));

        return { file, suggestedType, preview };
    }, []);

    /**
     * Add multiple documents
     */
    const addDocuments = useCallback((files: File[]) => {
        return files.map(addDocument);
    }, [addDocument]);

    /**
     * Remove a document from the list
     */
    const removeDocument = useCallback((index: number) => {
        setState(prev => ({
            ...prev,
            documents: prev.documents.filter((_, i) => i !== index)
        }));
    }, []);

    /**
     * Analyze all pending documents
     */
    const analyzeDocuments = useCallback(async () => {
        if (analysisInProgress.current || state.documents.length === 0) {
            return null;
        }

        analysisInProgress.current = true;
        setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

        try {
            // Mark all as analyzing
            setState(prev => ({
                ...prev,
                documents: prev.documents.map(doc => ({ ...doc, status: 'analyzing' as const }))
            }));

            // Prepare files for analysis
            const filesToAnalyze = state.documents.map(doc => ({
                file: doc.file,
                suggestedType: doc.suggestedType
            }));

            // Analyze all documents
            const result = await analyzeMultipleDocuments(filesToAnalyze);

            // Update document statuses with their analyses
            const updatedDocs: PendingDocument[] = state.documents.map((doc, index) => {
                const analysis = result.analyses[index];
                const status: PendingDocument['status'] = analysis?.error ? 'error' : 'complete';
                return { ...doc, analysis, status };
            });

            // Get missing fields
            const missingFields = getMissingRegistrationFields(result.consolidatedData);

            setState(prev => ({
                ...prev,
                documents: updatedDocs,
                extractedData: result.consolidatedData,
                uncertainFields: result.uncertainFields,
                missingFields,
                conflicts: result.conflicts,
                isAnalyzing: false
            }));

            // Fill form with extracted data
            fillFormWithData(result.consolidatedData);

            // Save documents to vault
            await saveDocumentsToVault(updatedDocs);

            return {
                extractedData: result.consolidatedData,
                uncertainFields: result.uncertainFields,
                missingFields,
                conflicts: result.conflicts
            };

        } catch (error: any) {
            console.error('[AssistedRegistration] Analysis error:', error);
            setState(prev => ({
                ...prev,
                isAnalyzing: false,
                error: error.message
            }));
            return null;
        } finally {
            analysisInProgress.current = false;
        }
    }, [state.documents]);

    /**
     * Fill the form with extracted data
     */
    const fillFormWithData = useCallback((data: ExtractedData) => {
        const fieldMapping: Record<string, string> = {
            lastName: 'lastName',
            firstName: 'firstName',
            dateOfBirth: 'dateOfBirth',
            placeOfBirth: 'placeOfBirth',
            address: 'address',
            city: 'city',
            postalCode: 'postalCode',
            fatherName: 'fatherName',
            motherName: 'motherName',
            profession: 'profession',
            maritalStatus: 'maritalStatus'
        };

        for (const [extractedField, formField] of Object.entries(fieldMapping)) {
            const value = (data as any)[extractedField];
            if (value) {
                formAssistantStore.setField(formField, value);

                // Also dispatch event for form components
                window.dispatchEvent(new CustomEvent('iasted-fill-field', {
                    detail: { field: formField, value }
                }));
            }
        }
    }, []);

    /**
     * Save analyzed documents to vault
     */
    const saveDocumentsToVault = useCallback(async (docs: PendingDocument[]) => {
        for (const doc of docs) {
            if (doc.analysis && !doc.analysis.error) {
                const category = TYPE_TO_CATEGORY[doc.analysis.documentType] || 'other';
                await uploadToVault(doc.file, category, {
                    source: 'upload',
                    metadata: {
                        extractedData: doc.analysis.extractedData,
                        confidence: doc.analysis.confidence
                    }
                });
            }
        }
    }, []);

    /**
     * Update a specific field (from user confirmation)
     */
    const confirmField = useCallback((field: string, value: string) => {
        setState(prev => ({
            ...prev,
            extractedData: {
                ...prev.extractedData,
                [field]: value
            },
            uncertainFields: prev.uncertainFields.filter(f => f !== field),
            missingFields: prev.missingFields.filter(f => f !== field)
        }));

        // Update form
        formAssistantStore.setField(field, value);
        window.dispatchEvent(new CustomEvent('iasted-fill-field', {
            detail: { field, value }
        }));
    }, []);

    /**
     * Get the next question or action
     */
    const getNextQuestion = useCallback((): { type: 'uncertain' | 'missing' | 'conflict' | 'complete'; field?: string; message: string } => {
        // First handle conflicts
        if (state.conflicts.length > 0) {
            const conflict = state.conflicts[0];
            const valuesStr = conflict.values.map(v => `"${v.value}" (${v.source})`).join(' ou ');
            return {
                type: 'conflict',
                field: conflict.field,
                message: `J'ai trouvé des valeurs différentes pour "${conflict.field}": ${valuesStr}. Laquelle est correcte ?`
            };
        }

        // Then uncertain fields
        if (state.uncertainFields.length > 0) {
            const field = state.uncertainFields[0];
            const currentValue = (state.extractedData as any)[field];
            return {
                type: 'uncertain',
                field,
                message: currentValue
                    ? `Je n'ai pas pu lire clairement "${field}". J'ai compris "${currentValue}". Est-ce correct ?`
                    : `Je n'ai pas pu lire "${field}". Pouvez-vous me le donner ?`
            };
        }

        // Then missing required fields
        if (state.missingFields.length > 0) {
            const field = state.missingFields[0];
            const fieldLabels: Record<string, string> = {
                lastName: 'votre nom de famille',
                firstName: 'votre prénom',
                dateOfBirth: 'votre date de naissance',
                placeOfBirth: 'votre lieu de naissance',
                address: 'votre adresse',
                city: 'votre ville',
                email: 'votre email',
                phone: 'votre numéro de téléphone',
                emergencyContactFirstName: 'le prénom de votre contact d\'urgence',
                emergencyContactLastName: 'le nom de votre contact d\'urgence',
                emergencyContactPhone: 'le téléphone de votre contact d\'urgence'
            };
            return {
                type: 'missing',
                field,
                message: `Il me manque ${fieldLabels[field] || field}. Pouvez-vous me le donner ?`
            };
        }

        return {
            type: 'complete',
            message: 'J\'ai toutes les informations nécessaires !'
        };
    }, [state.conflicts, state.uncertainFields, state.missingFields, state.extractedData]);

    /**
     * Generate summary of extracted data
     */
    const getDataSummary = useCallback((): string => {
        const data = state.extractedData;
        const parts: string[] = [];

        if (data.lastName && data.firstName) {
            parts.push(`**Nom complet:** ${data.firstName} ${data.lastName}`);
        }
        if (data.dateOfBirth) {
            parts.push(`**Date de naissance:** ${data.dateOfBirth}`);
        }
        if (data.placeOfBirth) {
            parts.push(`**Lieu de naissance:** ${data.placeOfBirth}`);
        }
        if (data.address || data.city) {
            parts.push(`**Adresse:** ${[data.address, data.city, data.postalCode].filter(Boolean).join(', ')}`);
        }
        if (data.fatherName) {
            parts.push(`**Père:** ${data.fatherFirstName || ''} ${data.fatherName}`.trim());
        }
        if (data.motherName) {
            parts.push(`**Mère:** ${data.motherFirstName || ''} ${data.motherName}`.trim());
        }

        return parts.join('\n');
    }, [state.extractedData]);

    /**
     * Check if ready to submit
     */
    const isReadyToSubmit = useCallback((): boolean => {
        return state.missingFields.length === 0 &&
            state.uncertainFields.length === 0 &&
            state.conflicts.length === 0 &&
            state.documents.length > 0;
    }, [state]);

    /**
     * Reset the state
     */
    const reset = useCallback(() => {
        setState(INITIAL_STATE);
    }, []);

    return {
        // State
        ...state,

        // Actions
        startAssistedRegistration,
        addDocument,
        addDocuments,
        removeDocument,
        analyzeDocuments,
        confirmField,
        fillFormWithData,
        reset,

        // Helpers
        getNextQuestion,
        getDataSummary,
        isReadyToSubmit
    };
}

// Export type for external use
export type { AssistedRegistrationState, PendingDocument, ExtractedData };
