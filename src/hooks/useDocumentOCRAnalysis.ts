/**
 * Hook for OCR analysis of user documents via iAsted
 * Listens for iasted-analyze-user-documents events and performs OCR
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { analyzeDocument, DocumentAnalysis, DocumentType as OCRDocumentType, ExtractedData } from '@/services/documentOCRService';
import { toast } from 'sonner';

interface DocumentToAnalyze {
    id: string;
    name: string;
    file_path: string;
    file_type: string;
    category?: string;
}

interface AnalysisResult {
    documentId: string;
    documentName: string;
    analysis: DocumentAnalysis;
}

// Map document categories to OCR document types
const mapCategoryToOCRType = (category: string, name: string): OCRDocumentType | undefined => {
    const lowerName = name.toLowerCase();
    const lowerCategory = category?.toLowerCase() || '';

    if (lowerName.includes('passeport') || lowerName.includes('passport') || lowerCategory.includes('passport')) {
        return 'passport';
    }
    if (lowerName.includes('cni') || lowerName.includes('identite') || lowerCategory.includes('id_card')) {
        return 'cni';
    }
    if (lowerName.includes('naissance') || lowerName.includes('acte') || lowerCategory.includes('birth')) {
        return 'birth_certificate';
    }
    if (lowerName.includes('domicile') || lowerName.includes('facture') || lowerName.includes('edf') || 
        lowerName.includes('justif') || lowerCategory.includes('residence_proof')) {
        return 'residence_proof';
    }
    if (lowerName.includes('livret') || lowerName.includes('famille') || lowerCategory.includes('family')) {
        return 'family_record';
    }
    if (lowerName.includes('sejour') || lowerCategory.includes('residence_permit')) {
        return 'cni'; // Treat residence permit like ID
    }

    return undefined;
};

export const useDocumentOCRAnalysis = () => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState<AnalysisResult[]>([]);
    const [consolidatedData, setConsolidatedData] = useState<ExtractedData | null>(null);

    const analyzeUserDocuments = useCallback(async (documentIds?: string[], documentTypes?: string[]) => {
        setIsAnalyzing(true);
        setResults([]);
        setConsolidatedData(null);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Vous devez être connecté pour analyser vos documents');
                return null;
            }

            // Fetch user's documents
            let query = supabase
                .from('documents')
                .select('id, name, file_path, file_type, category')
                .eq('user_id', user.id);

            if (documentIds && documentIds.length > 0) {
                query = query.in('id', documentIds);
            }

            const { data: documents, error } = await query;

            if (error) {
                console.error('[OCR Analysis] Error fetching documents:', error);
                toast.error('Impossible de récupérer les documents');
                return null;
            }

            if (!documents || documents.length === 0) {
                toast.warning('Aucun document trouvé à analyser');
                return null;
            }

            // Filter by document types if specified
            let docsToAnalyze = documents as DocumentToAnalyze[];
            if (documentTypes && documentTypes.length > 0) {
                docsToAnalyze = docsToAnalyze.filter(doc => {
                    const ocrType = mapCategoryToOCRType(doc.category || '', doc.name);
                    return ocrType && documentTypes.includes(ocrType);
                });
            }

            // Filter to only image documents
            docsToAnalyze = docsToAnalyze.filter(doc => 
                doc.file_type?.startsWith('image/') || 
                doc.file_path?.match(/\.(jpg|jpeg|png|webp|gif)$/i)
            );

            if (docsToAnalyze.length === 0) {
                toast.warning('Aucun document image trouvé à analyser');
                return null;
            }

            console.log(`[OCR Analysis] Analyzing ${docsToAnalyze.length} documents...`);
            toast.info(`Analyse OCR de ${docsToAnalyze.length} document(s)...`);

            const analysisResults: AnalysisResult[] = [];
            const consolidated: ExtractedData = {};

            // Analyze each document
            for (const doc of docsToAnalyze) {
                try {
                    // Get signed URL for the document
                    const { data: signedData } = await supabase.storage
                        .from('documents')
                        .createSignedUrl(doc.file_path, 60);

                    if (!signedData?.signedUrl) {
                        console.warn(`[OCR Analysis] Could not get URL for ${doc.name}`);
                        continue;
                    }

                    // Fetch the file
                    const response = await fetch(signedData.signedUrl);
                    const blob = await response.blob();
                    const file = new File([blob], doc.name, { type: doc.file_type || 'image/jpeg' });

                    // Determine document type
                    const ocrType = mapCategoryToOCRType(doc.category || '', doc.name);

                    // Perform OCR analysis
                    console.log(`[OCR Analysis] Analyzing: ${doc.name} (type: ${ocrType || 'auto'})`);
                    const analysis = await analyzeDocument(file, ocrType);

                    analysisResults.push({
                        documentId: doc.id,
                        documentName: doc.name,
                        analysis
                    });

                    // Merge extracted data
                    if (analysis.extractedData) {
                        Object.entries(analysis.extractedData).forEach(([key, value]) => {
                            if (value && !consolidated[key as keyof ExtractedData]) {
                                (consolidated as any)[key] = value;
                            }
                        });
                    }

                    console.log(`[OCR Analysis] ${doc.name}: confidence=${analysis.confidence}`);
                } catch (docError) {
                    console.error(`[OCR Analysis] Error analyzing ${doc.name}:`, docError);
                }
            }

            setResults(analysisResults);
            setConsolidatedData(consolidated);

            // Dispatch event with results for iAsted to read
            window.dispatchEvent(new CustomEvent('iasted-ocr-results', {
                detail: {
                    results: analysisResults,
                    consolidatedData: consolidated,
                    summary: formatSummary(consolidated, analysisResults)
                }
            }));

            const successCount = analysisResults.filter(r => r.analysis.confidence > 0).length;
            if (successCount > 0) {
                toast.success(`${successCount} document(s) analysé(s) avec succès`);
            }

            return { results: analysisResults, consolidatedData: consolidated };

        } catch (error) {
            console.error('[OCR Analysis] Error:', error);
            toast.error('Erreur lors de l\'analyse OCR');
            return null;
        } finally {
            setIsAnalyzing(false);
        }
    }, []);

    // Listen for iAsted events
    useEffect(() => {
        const handleAnalyzeRequest = (event: CustomEvent) => {
            const { documentIds, documentTypes } = event.detail || {};
            analyzeUserDocuments(documentIds, documentTypes);
        };

        window.addEventListener('iasted-analyze-user-documents', handleAnalyzeRequest as EventListener);
        return () => {
            window.removeEventListener('iasted-analyze-user-documents', handleAnalyzeRequest as EventListener);
        };
    }, [analyzeUserDocuments]);

    return {
        isAnalyzing,
        results,
        consolidatedData,
        analyzeUserDocuments
    };
};

// Format a readable summary for iAsted
function formatSummary(data: ExtractedData, results: AnalysisResult[]): string {
    const parts: string[] = [];

    if (data.lastName) parts.push(`Nom: ${data.lastName}`);
    if (data.firstName) parts.push(`Prénom: ${data.firstName}`);
    if (data.dateOfBirth) parts.push(`Date de naissance: ${data.dateOfBirth}`);
    if (data.placeOfBirth) parts.push(`Lieu de naissance: ${data.placeOfBirth}`);
    if (data.nationality) parts.push(`Nationalité: ${data.nationality}`);
    if (data.address) parts.push(`Adresse: ${data.address}`);
    if (data.city) parts.push(`Ville: ${data.city}`);
    if (data.fatherName) parts.push(`Nom du père: ${data.fatherName}`);
    if (data.motherName) parts.push(`Nom de la mère: ${data.motherName}`);
    if (data.documentNumber) parts.push(`N° document: ${data.documentNumber}`);
    if (data.expiryDate) parts.push(`Date d'expiration: ${data.expiryDate}`);

    const avgConfidence = results.length > 0 
        ? Math.round(results.reduce((acc, r) => acc + r.analysis.confidence, 0) / results.length * 100)
        : 0;

    return parts.length > 0 
        ? `Données extraites (confiance ${avgConfidence}%):\n${parts.join('\n')}`
        : 'Aucune donnée n\'a pu être extraite des documents.';
}

export default useDocumentOCRAnalysis;
