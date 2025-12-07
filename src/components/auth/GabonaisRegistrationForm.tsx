import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Upload, Loader2, FileText, User, Users, MapPin, Briefcase, Eye, Key, Copy, Check, Sparkles, Brain, X, Image, Pencil, Save } from "lucide-react";
import { formAssistantStore, useFormAssistant } from "@/stores/formAssistantStore";
import { IAstedLabel, IAstedInput, IAstedSelectIndicator, getIAstedSelectClasses } from "@/components/ui/iasted-form-fields";
import { registerUser, generatePinCode } from "@/services/authService";
import { PinCodeInput } from "./PinCodeInput";
import { toast } from "sonner";
import { analyzeDocument, DocumentAnalysis, detectDocumentType } from "@/services/documentOCRService";

// Types for OCR-enabled file uploads
interface UploadedDocument {
    id: string;
    file: File;
    type: 'photo' | 'passport' | 'birthCert' | 'proofOfAddress';
    status: 'pending' | 'analyzing' | 'completed' | 'error';
    progress: number;
    analysis?: DocumentAnalysis;
    error?: string;
}

// Composant d'édition inline pour les champs OCR
interface EditableOCRFieldProps {
    field: string;
    label: string;
    value: string;
    isDate?: boolean;
    onSave: (newValue: string) => void;
}

function EditableOCRField({ field, label, value, isDate, onSave }: EditableOCRFieldProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const inputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (editValue.trim() !== value) {
            onSave(editValue.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setEditValue(value);
            setIsEditing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background/80 border rounded-lg p-2 text-xs group relative"
        >
            <div className="flex items-center justify-between gap-1">
                <p className="text-muted-foreground font-medium">{label}</p>
                {!isEditing && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setIsEditing(true)}
                    >
                        <Pencil className="w-3 h-3 text-muted-foreground" />
                    </Button>
                )}
            </div>
            
            {isEditing ? (
                <div className="flex items-center gap-1 mt-1">
                    <Input
                        ref={inputRef}
                        type={isDate ? 'date' : 'text'}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleSave}
                        className="h-6 text-xs px-2 py-1"
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                        onClick={handleSave}
                    >
                        <Save className="w-3 h-3" />
                    </Button>
                </div>
            ) : (
                <p 
                    className="text-foreground font-medium cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setIsEditing(true)}
                >
                    {isDate && value ? new Date(value).toLocaleDateString('fr-FR') : value}
                </p>
            )}
        </motion.div>
    );
}

export function GabonaisRegistrationForm() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [registrationComplete, setRegistrationComplete] = useState(false);
    const [generatedPin, setGeneratedPin] = useState("");
    const [pinCopied, setPinCopied] = useState(false);

    // Tracker les champs remplis par iAsted
    const [filledByIasted, setFilledByIasted] = useState<Set<string>>(new Set());

    // Données du formulaire avec état local
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        placeOfBirth: '',
        maritalStatus: '',
        fatherName: '',
        motherName: '',
        address: '',
        city: '',
        postalCode: '',
        emergencyContactFirstName: '',
        emergencyContactLastName: '',
        emergencyContactPhone: '',
        professionalStatus: '',
        employer: '',
        profession: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });

    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptPrivacy, setAcceptPrivacy] = useState(false);

    // State pour les fichiers avec OCR
    const [files, setFiles] = useState<{
        photo?: File;
        passport?: File;
        birthCert?: File;
        proofOfAddress?: File;
    }>({});
    
    // State pour le suivi des documents OCR
    const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
    const [isOCRProcessing, setIsOCRProcessing] = useState(false);

    const handleFileChange = (key: string, file: File) => {
        setFiles(prev => ({ ...prev, [key]: file }));
    };

    // Mapping des données OCR vers les champs du formulaire
    const mapOCRToFormFields = (analysis: DocumentAnalysis) => {
        if (!analysis.extractedData) return;
        
        const data = analysis.extractedData;
        const mappings: Record<string, string> = {};
        const newFilledFields = new Set(filledByIasted);

        // Mapper les champs extraits
        if (data.firstName) { mappings.firstName = data.firstName; newFilledFields.add('firstName'); }
        if (data.lastName) { mappings.lastName = data.lastName; newFilledFields.add('lastName'); }
        if (data.dateOfBirth) { mappings.dateOfBirth = data.dateOfBirth; newFilledFields.add('dateOfBirth'); }
        if (data.placeOfBirth) { mappings.placeOfBirth = data.placeOfBirth; newFilledFields.add('placeOfBirth'); }
        if (data.fatherName) { mappings.fatherName = data.fatherName; newFilledFields.add('fatherName'); }
        if (data.motherName) { mappings.motherName = data.motherName; newFilledFields.add('motherName'); }
        if (data.address) { mappings.address = data.address; newFilledFields.add('address'); }
        if (data.city) { mappings.city = data.city; newFilledFields.add('city'); }
        if (data.nationality) { /* nationality is fixed for Gabonais */ }

        if (Object.keys(mappings).length > 0) {
            setFormData(prev => ({ ...prev, ...mappings }));
            setFilledByIasted(newFilledFields);
            
            toast.success(`${Object.keys(mappings).length} champs pré-remplis par OCR`, {
                description: "Vérifiez les informations extraites"
            });
        }
    };

    // Analyser un document avec OCR
    const analyzeDocumentWithOCR = async (doc: UploadedDocument) => {
        try {
            // Update status to analyzing
            setUploadedDocs(prev => prev.map(d => 
                d.id === doc.id ? { ...d, status: 'analyzing', progress: 25 } : d
            ));
            
            await new Promise(r => setTimeout(r, 300));
            setUploadedDocs(prev => prev.map(d => 
                d.id === doc.id ? { ...d, progress: 50 } : d
            ));

            // Perform OCR analysis
            const suggestedType = detectDocumentType(doc.file.name);
            const analysis = await analyzeDocument(doc.file, suggestedType);
            
            setUploadedDocs(prev => prev.map(d => 
                d.id === doc.id ? { ...d, progress: 85 } : d
            ));
            
            await new Promise(r => setTimeout(r, 200));

            if (analysis.error) {
                throw new Error(analysis.error);
            }

            // Update status to completed
            setUploadedDocs(prev => prev.map(d => 
                d.id === doc.id ? { ...d, status: 'completed', progress: 100, analysis } : d
            ));

            // Map extracted data to form
            mapOCRToFormFields(analysis);

            return analysis;
        } catch (error: any) {
            console.error('OCR Error:', error);
            setUploadedDocs(prev => prev.map(d => 
                d.id === doc.id ? { ...d, status: 'error', error: error.message } : d
            ));
            toast.error(`Erreur d'analyse: ${doc.file.name}`);
        }
    };

    // Handle drop zone
    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setIsOCRProcessing(true);
        
        const newDocs: UploadedDocument[] = acceptedFiles.map(file => {
            // Detect document type from file name
            let docType: UploadedDocument['type'] = 'passport';
            const lowerName = file.name.toLowerCase();
            
            if (lowerName.includes('photo') || lowerName.includes('identite') || lowerName.includes('portrait')) {
                docType = 'photo';
            } else if (lowerName.includes('passport') || lowerName.includes('passeport')) {
                docType = 'passport';
            } else if (lowerName.includes('naissance') || lowerName.includes('birth') || lowerName.includes('acte')) {
                docType = 'birthCert';
            } else if (lowerName.includes('domicile') || lowerName.includes('residence') || lowerName.includes('facture')) {
                docType = 'proofOfAddress';
            }
            
            return {
                id: crypto.randomUUID(),
                file,
                type: docType,
                status: 'pending' as const,
                progress: 0
            };
        });

        setUploadedDocs(prev => [...prev, ...newDocs]);

        // Also update the files state
        for (const doc of newDocs) {
            setFiles(prev => ({ ...prev, [doc.type]: doc.file }));
        }

        // Analyze each document
        for (const doc of newDocs) {
            await analyzeDocumentWithOCR(doc);
        }

        setIsOCRProcessing(false);
    }, [filledByIasted]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp']
        },
        multiple: true
    });

    const removeUploadedDoc = (id: string) => {
        const doc = uploadedDocs.find(d => d.id === id);
        if (doc) {
            setFiles(prev => {
                const newFiles = { ...prev };
                delete newFiles[doc.type];
                return newFiles;
            });
        }
        setUploadedDocs(prev => prev.filter(d => d.id !== id));
    };

    const getFileIcon = (type: UploadedDocument['type']) => {
        switch (type) {
            case 'photo': return <Image className="w-5 h-5" />;
            case 'passport': return <FileText className="w-5 h-5" />;
            case 'birthCert': return <FileText className="w-5 h-5" />;
            case 'proofOfAddress': return <FileText className="w-5 h-5" />;
        }
    };

    const getDocTypeLabel = (type: UploadedDocument['type']) => {
        switch (type) {
            case 'photo': return "Photo d'identité";
            case 'passport': return "Passeport";
            case 'birthCert': return "Acte de naissance";
            case 'proofOfAddress': return "Justificatif de domicile";
        }
    };

    // Écouter les événements d'iAsted
    useEffect(() => {
        formAssistantStore.setCurrentForm('gabonais_registration');

        const handleFillField = (event: CustomEvent) => {
            const { field, value } = event.detail;
            setFormData(prev => ({ ...prev, [field]: value }));
            // Marquer le champ comme rempli par iAsted
            setFilledByIasted(prev => new Set([...prev, field]));
        };

        const handleNavigateStep = (event: CustomEvent) => {
            const { step: targetStep } = event.detail;
            setStep(targetStep);
        };

        const handleSubmitForm = () => {
            handleSubmit();
        };

        window.addEventListener('iasted-fill-field', handleFillField as EventListener);
        window.addEventListener('iasted-navigate-step', handleNavigateStep as EventListener);
        window.addEventListener('iasted-submit-form', handleSubmitForm);

        return () => {
            window.removeEventListener('iasted-fill-field', handleFillField as EventListener);
            window.removeEventListener('iasted-navigate-step', handleNavigateStep as EventListener);
            window.removeEventListener('iasted-submit-form', handleSubmitForm);
        };
    }, []);

    // Synchroniser le step avec le store (sans créer de boucle)
    useEffect(() => {
        formAssistantStore.setCurrentStep(step);
    }, [step]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Si l'utilisateur modifie manuellement, retirer l'indicateur iAsted
        setFilledByIasted(prev => {
            const newSet = new Set(prev);
            newSet.delete(field);
            return newSet;
        });
    };

    const steps = [
        { id: 1, label: "Documents", icon: FileText },
        { id: 2, label: "Infos Base", icon: User },
        { id: 3, label: "Famille", icon: Users },
        { id: 4, label: "Contacts", icon: MapPin },
        { id: 5, label: "Profession", icon: Briefcase },
        { id: 6, label: "Révision", icon: Eye },
    ];

    const handleNext = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setStep(step + 1);
        }, 800);
    };

    const copyPinToClipboard = () => {
        navigator.clipboard.writeText(generatedPin);
        setPinCopied(true);
        toast.success("Code PIN copié !");
        setTimeout(() => setPinCopied(false), 2000);
    };

    const handleSubmit = async () => {
        setLoading(true);

        try {
            // Validate passwords match
            if (formData.password !== formData.confirmPassword) {
                toast.error("Les mots de passe ne correspondent pas");
                setLoading(false);
                return;
            }

            if (formData.password.length < 6) {
                toast.error("Le mot de passe doit contenir au moins 6 caractères");
                setLoading(false);
                return;
            }

            // Generate PIN code
            const pinCode = generatePinCode();
            setGeneratedPin(pinCode);

            // Register user
            await registerUser({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                dateOfBirth: formData.dateOfBirth,
                phone: formData.phone,
                nationality: 'Gabonaise',
                placeOfBirth: formData.placeOfBirth,
                profession: formData.profession,
                maritalStatus: formData.maritalStatus,
                address: formData.address,
                city: formData.city,
                postalCode: formData.postalCode,
                pinCode,
                // Extended fields
                fatherName: formData.fatherName,
                motherName: formData.motherName,
                emergencyContactFirstName: formData.emergencyContactFirstName,
                emergencyContactLastName: formData.emergencyContactLastName,
                emergencyContactPhone: formData.emergencyContactPhone,
                employer: formData.employer,
                // Files
                files
            });

            setRegistrationComplete(true);
            toast.success("Compte créé avec succès !");
        } catch (error: any) {
            console.error('Registration error:', error);
            if (error.message?.includes('User already registered')) {
                toast.error("Cet email est déjà utilisé");
            } else {
                toast.error(error.message || "Erreur lors de l'inscription");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Progress Steps */}
            <div className="flex justify-between mb-8 overflow-x-auto pb-4">
                {steps.map((s, index) => (
                    <div key={s.id} className="flex flex-col items-center min-w-[80px] relative z-10">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${step >= s.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                }`}
                        >
                            {step > s.id ? <CheckCircle2 className="h-6 w-6" /> : <s.icon className="h-5 w-5" />}
                        </div>
                        <span className={`text-xs mt-2 font-medium ${step === s.id ? 'text-primary' : 'text-muted-foreground'}`}>
                            {s.label}
                        </span>
                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                            <div
                                className={`absolute top-5 left-1/2 w-full h-[2px] -z-10 ${step > s.id ? 'bg-primary' : 'bg-muted'
                                    }`}
                                style={{ width: '100%' }}
                            />
                        )}
                    </div>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        {step === 1 && "Documents Requis"}
                        {step === 2 && "Informations de Base"}
                        {step === 3 && "Situation Familiale"}
                        {step === 4 && "Coordonnées"}
                        {step === 5 && "Situation Professionnelle"}
                        {step === 6 && "Révision et Soumission"}
                    </CardTitle>
                    <CardDescription>
                        {step === 1 && "Téléchargez les pièces justificatives obligatoires"}
                        {step === 2 && "Identité et naissance"}
                        {step === 3 && "Parents et situation matrimoniale"}
                        {step === 4 && "Adresse et contacts d'urgence"}
                        {step === 5 && "Emploi et activité"}
                        {step === 6 && "Vérifiez l'exactitude de vos informations"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {step === 1 && (
                        <div className="space-y-6">
                            {/* Zone de drag-and-drop principale avec OCR */}
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                                    isDragActive
                                        ? 'border-primary bg-primary/5 scale-[1.02] shadow-lg'
                                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                                }`}
                            >
                                <input {...getInputProps()} />
                                <motion.div
                                    animate={isDragActive ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <div className="flex justify-center mb-4">
                                        <div className={`p-4 rounded-full ${isDragActive ? 'bg-primary/20' : 'bg-muted'}`}>
                                            <Upload className={`w-8 h-8 ${isDragActive ? 'text-primary animate-bounce' : 'text-muted-foreground'}`} />
                                        </div>
                                    </div>
                                    <p className="text-lg font-semibold mb-1">
                                        {isDragActive ? 'Déposez vos documents ici' : 'Glissez-déposez vos documents'}
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Passeport, Acte de naissance, Justificatif de domicile
                                    </p>
                                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                        <Brain className="w-4 h-4 text-primary" />
                                        <span>OCR intelligent - pré-remplissage automatique du formulaire</span>
                                    </div>
                                </motion.div>
                                <Button variant="outline" size="sm" className="mt-4" type="button">
                                    Ou cliquez pour parcourir
                                </Button>
                            </div>

                            {/* Liste des documents uploadés avec statut OCR */}
                            <AnimatePresence>
                                {uploadedDocs.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-3"
                                    >
                                        <h4 className="text-sm font-medium flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-primary" />
                                            Documents analysés ({uploadedDocs.filter(d => d.status === 'completed').length}/{uploadedDocs.length})
                                        </h4>
                                        
                                        {uploadedDocs.map((doc) => (
                                            <motion.div
                                                key={doc.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="bg-card border rounded-lg p-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* Icon */}
                                                    <div className={`p-2 rounded-lg ${
                                                        doc.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                                                        doc.status === 'analyzing' ? 'bg-primary/10 text-primary' :
                                                        doc.status === 'error' ? 'bg-destructive/10 text-destructive' :
                                                        'bg-muted text-muted-foreground'
                                                    }`}>
                                                        {doc.status === 'completed' ? (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                transition={{ type: "spring", stiffness: 500 }}
                                                            >
                                                                <CheckCircle2 className="w-5 h-5" />
                                                            </motion.div>
                                                        ) : doc.status === 'analyzing' ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            getFileIcon(doc.type)
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{doc.file.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {getDocTypeLabel(doc.type)}
                                                            {doc.status === 'analyzing' && (
                                                                <span className="ml-2 text-primary">
                                                                    Analyse IA en cours
                                                                    <motion.span
                                                                        animate={{ opacity: [0, 1, 0] }}
                                                                        transition={{ duration: 1.5, repeat: Infinity }}
                                                                    >...</motion.span>
                                                                </span>
                                                            )}
                                                            {doc.status === 'completed' && doc.analysis?.extractedData && (
                                                                <span className="ml-2 text-green-600">
                                                                    • {Object.keys(doc.analysis.extractedData).length} champs extraits
                                                                </span>
                                                            )}
                                                        </p>
                                                        
                                                        {/* Progress bar */}
                                                        {(doc.status === 'pending' || doc.status === 'analyzing') && (
                                                            <div className="mt-2 relative">
                                                                <Progress value={doc.progress} className="h-1" />
                                                                <motion.div
                                                                    className="absolute inset-0 h-1 rounded-full overflow-hidden"
                                                                    style={{
                                                                        background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent)',
                                                                        backgroundSize: '200% 100%'
                                                                    }}
                                                                    animate={{
                                                                        backgroundPosition: ['100% 0%', '-100% 0%']
                                                                    }}
                                                                    transition={{
                                                                        duration: 1.5,
                                                                        repeat: Infinity,
                                                                        ease: 'linear'
                                                                    }}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Error */}
                                                        {doc.status === 'error' && (
                                                            <p className="text-xs text-destructive mt-1">{doc.error}</p>
                                                        )}
                                                    </div>

                                                    {/* Remove button */}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeUploadedDoc(doc.id)}
                                                        className="text-muted-foreground hover:text-destructive"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Bannière d'information OCR - affichée quand des champs sont pré-remplis */}
                            <AnimatePresence>
                                {filledByIasted.size > 0 && uploadedDocs.some(d => d.status === 'completed') && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20, height: 0 }}
                                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                                        exit={{ opacity: 0, y: -10, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <Alert className="border-primary/30 bg-primary/5">
                                            <Sparkles className="h-4 w-4 text-primary" />
                                            <AlertTitle className="flex items-center gap-2">
                                                <span>Données extraites automatiquement</span>
                                                <span className="text-xs font-normal px-2 py-0.5 bg-primary/10 rounded-full text-primary">
                                                    {filledByIasted.size} champs
                                                </span>
                                            </AlertTitle>
                                            <AlertDescription className="mt-2 space-y-3">
                                                <p className="text-sm text-muted-foreground">
                                                    Cliquez sur un champ pour le modifier directement.
                                                </p>
                                                
                                                {/* Résumé des champs extraits avec édition inline */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                                                    {Array.from(filledByIasted).map(field => {
                                                        const value = formData[field as keyof typeof formData];
                                                        if (!value) return null;
                                                        
                                                        const fieldLabels: Record<string, string> = {
                                                            firstName: 'Prénom',
                                                            lastName: 'Nom',
                                                            dateOfBirth: 'Date de naissance',
                                                            placeOfBirth: 'Lieu de naissance',
                                                            fatherName: 'Nom du père',
                                                            motherName: 'Nom de la mère',
                                                            address: 'Adresse',
                                                            city: 'Ville'
                                                        };
                                                        
                                                        return (
                                                            <EditableOCRField
                                                                key={field}
                                                                field={field}
                                                                label={fieldLabels[field] || field}
                                                                value={value}
                                                                isDate={field === 'dateOfBirth'}
                                                                onSave={(newValue) => {
                                                                    setFormData(prev => ({ ...prev, [field]: newValue }));
                                                                    toast.success(`${fieldLabels[field] || field} mis à jour`);
                                                                }}
                                                            />
                                                        );
                                                    })}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-3 pt-2 border-t border-border/50 mt-3">
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <CheckCircle2 className="w-3 h-3 text-green-600" />
                                                        <span>Cliquez sur Suivant quand les informations sont correctes</span>
                                                    </div>
                                                </div>
                                            </AlertDescription>
                                        </Alert>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Zones d'upload individuelles (fallback) */}
                            {uploadedDocs.length === 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent/50 transition-colors relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => e.target.files?.[0] && handleFileChange('photo', e.target.files[0])}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="pointer-events-none">
                                            {files.photo ? (
                                                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                                            ) : (
                                                <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                                            )}
                                            <p className="font-medium">Photo d'identité *</p>
                                            <p className="text-xs text-muted-foreground">
                                                {files.photo ? files.photo.name : "JPG, PNG - Max 2MB"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent/50 transition-colors relative">
                                        <input
                                            type="file"
                                            accept=".pdf,image/*"
                                            onChange={(e) => e.target.files?.[0] && handleFileChange('passport', e.target.files[0])}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="pointer-events-none">
                                            {files.passport ? (
                                                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                                            ) : (
                                                <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                                            )}
                                            <p className="font-medium">Passeport *</p>
                                            <p className="text-xs text-muted-foreground">
                                                {files.passport ? files.passport.name : "PDF, JPG - Max 5MB"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent/50 transition-colors relative">
                                        <input
                                            type="file"
                                            accept=".pdf,image/*"
                                            onChange={(e) => e.target.files?.[0] && handleFileChange('birthCert', e.target.files[0])}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="pointer-events-none">
                                            {files.birthCert ? (
                                                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                                            ) : (
                                                <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                                            )}
                                            <p className="font-medium">Acte de Naissance *</p>
                                            <p className="text-xs text-muted-foreground">
                                                {files.birthCert ? files.birthCert.name : "PDF, JPG - Max 5MB"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-accent/50 transition-colors relative">
                                        <input
                                            type="file"
                                            accept=".pdf,image/*"
                                            onChange={(e) => e.target.files?.[0] && handleFileChange('proofOfAddress', e.target.files[0])}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="pointer-events-none">
                                            {files.proofOfAddress ? (
                                                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                                            ) : (
                                                <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                                            )}
                                            <p className="font-medium">Justificatif de Domicile *</p>
                                            <p className="text-xs text-muted-foreground">
                                                {files.proofOfAddress ? files.proofOfAddress.name : "Moins de 3 mois"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <IAstedLabel filledByIasted={filledByIasted.has('firstName')}>Prénom(s) *</IAstedLabel>
                                    <IAstedInput
                                        placeholder="Jean"
                                        value={formData.firstName}
                                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                                        filledByIasted={filledByIasted.has('firstName')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <IAstedLabel filledByIasted={filledByIasted.has('lastName')}>Nom(s) *</IAstedLabel>
                                    <IAstedInput
                                        placeholder="Mba"
                                        value={formData.lastName}
                                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                                        filledByIasted={filledByIasted.has('lastName')}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <IAstedLabel filledByIasted={filledByIasted.has('dateOfBirth')}>Date de naissance *</IAstedLabel>
                                    <IAstedInput
                                        type="date"
                                        value={formData.dateOfBirth}
                                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                        filledByIasted={filledByIasted.has('dateOfBirth')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <IAstedLabel filledByIasted={filledByIasted.has('placeOfBirth')}>Lieu de naissance *</IAstedLabel>
                                    <IAstedInput
                                        placeholder="Libreville"
                                        value={formData.placeOfBirth}
                                        onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
                                        filledByIasted={filledByIasted.has('placeOfBirth')}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Nationalité *</Label>
                                <Input defaultValue="Gabonaise" disabled />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <IAstedLabel filledByIasted={filledByIasted.has('maritalStatus')}>Situation Matrimoniale *</IAstedLabel>
                                <Select
                                    value={formData.maritalStatus}
                                    onValueChange={(value) => handleInputChange('maritalStatus', value)}
                                >
                                    <SelectTrigger className={getIAstedSelectClasses(filledByIasted.has('maritalStatus'))}>
                                        <SelectValue placeholder="Sélectionner" />
                                        <IAstedSelectIndicator filledByIasted={filledByIasted.has('maritalStatus')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SINGLE">Célibataire</SelectItem>
                                        <SelectItem value="MARRIED">Marié(e)</SelectItem>
                                        <SelectItem value="DIVORCED">Divorcé(e)</SelectItem>
                                        <SelectItem value="WIDOWED">Veuf/Veuve</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                                <h3 className="font-medium text-sm">Filiation</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <IAstedLabel filledByIasted={filledByIasted.has('fatherName')}>Nom du Père</IAstedLabel>
                                        <IAstedInput
                                            placeholder="Nom complet"
                                            value={formData.fatherName}
                                            onChange={(e) => handleInputChange('fatherName', e.target.value)}
                                            filledByIasted={filledByIasted.has('fatherName')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <IAstedLabel filledByIasted={filledByIasted.has('motherName')}>Nom de la Mère</IAstedLabel>
                                        <IAstedInput
                                            placeholder="Nom complet"
                                            value={formData.motherName}
                                            onChange={(e) => handleInputChange('motherName', e.target.value)}
                                            filledByIasted={filledByIasted.has('motherName')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <IAstedLabel filledByIasted={filledByIasted.has('address')}>Adresse Complète *</IAstedLabel>
                                <IAstedInput
                                    placeholder="Numéro, Rue, Apt"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    filledByIasted={filledByIasted.has('address')}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <IAstedLabel filledByIasted={filledByIasted.has('city')}>Ville *</IAstedLabel>
                                    <IAstedInput
                                        value={formData.city}
                                        onChange={(e) => handleInputChange('city', e.target.value)}
                                        filledByIasted={filledByIasted.has('city')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <IAstedLabel filledByIasted={filledByIasted.has('postalCode')}>Code Postal *</IAstedLabel>
                                    <IAstedInput
                                        value={formData.postalCode}
                                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                                        filledByIasted={filledByIasted.has('postalCode')}
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg space-y-4 border border-red-100 dark:border-red-900/50">
                                <h3 className="font-medium text-sm text-red-800 dark:text-red-300">Contact d'Urgence</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <IAstedLabel filledByIasted={filledByIasted.has('emergencyContactLastName')}>Nom *</IAstedLabel>
                                        <IAstedInput
                                            placeholder="NOM"
                                            value={formData.emergencyContactLastName}
                                            onChange={(e) => handleInputChange('emergencyContactLastName', e.target.value)}
                                            filledByIasted={filledByIasted.has('emergencyContactLastName')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <IAstedLabel filledByIasted={filledByIasted.has('emergencyContactFirstName')}>Prénom *</IAstedLabel>
                                        <IAstedInput
                                            placeholder="Prénom"
                                            value={formData.emergencyContactFirstName}
                                            onChange={(e) => handleInputChange('emergencyContactFirstName', e.target.value)}
                                            filledByIasted={filledByIasted.has('emergencyContactFirstName')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <IAstedLabel filledByIasted={filledByIasted.has('emergencyContactPhone')}>Téléphone *</IAstedLabel>
                                        <IAstedInput
                                            placeholder="+241..."
                                            value={formData.emergencyContactPhone}
                                            onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                                            filledByIasted={filledByIasted.has('emergencyContactPhone')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <IAstedLabel filledByIasted={filledByIasted.has('professionalStatus')}>Statut Professionnel</IAstedLabel>
                                <Select
                                    value={formData.professionalStatus}
                                    onValueChange={(value) => handleInputChange('professionalStatus', value)}
                                >
                                    <SelectTrigger className={getIAstedSelectClasses(filledByIasted.has('professionalStatus'))}>
                                        <SelectValue placeholder="Sélectionner" />
                                        <IAstedSelectIndicator filledByIasted={filledByIasted.has('professionalStatus')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EMPLOYED">Salarié</SelectItem>
                                        <SelectItem value="SELF_EMPLOYED">Indépendant</SelectItem>
                                        <SelectItem value="STUDENT">Étudiant</SelectItem>
                                        <SelectItem value="RETIRED">Retraité</SelectItem>
                                        <SelectItem value="UNEMPLOYED">Sans emploi</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <IAstedLabel filledByIasted={filledByIasted.has('employer')}>Employeur / Établissement</IAstedLabel>
                                <IAstedInput
                                    placeholder="Nom de l'entreprise ou école"
                                    value={formData.employer}
                                    onChange={(e) => handleInputChange('employer', e.target.value)}
                                    filledByIasted={filledByIasted.has('employer')}
                                />
                            </div>
                            <div className="space-y-2">
                                <IAstedLabel filledByIasted={filledByIasted.has('profession')}>Profession / Poste</IAstedLabel>
                                <IAstedInput
                                    placeholder="Intitulé du poste"
                                    value={formData.profession}
                                    onChange={(e) => handleInputChange('profession', e.target.value)}
                                    filledByIasted={filledByIasted.has('profession')}
                                />
                            </div>
                        </div>
                    )}

                    {step === 6 && (
                        <div className="space-y-6">
                            {/* Champs de contact et compte */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-sm text-muted-foreground">Créer votre compte</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <IAstedLabel filledByIasted={filledByIasted.has('email')}>Email *</IAstedLabel>
                                        <IAstedInput
                                            type="email"
                                            placeholder="votre@email.com"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            filledByIasted={filledByIasted.has('email')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <IAstedLabel filledByIasted={filledByIasted.has('phone')}>Téléphone *</IAstedLabel>
                                        <IAstedInput
                                            type="tel"
                                            placeholder="+241 XX XX XX XX"
                                            value={formData.phone}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            filledByIasted={filledByIasted.has('phone')}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Mot de passe *</Label>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={(e) => handleInputChange('password', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Confirmer mot de passe *</Label>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            value={formData.confirmPassword}
                                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Récapitulatif */}
                            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                                <h3 className="font-medium text-sm">Récapitulatif de votre inscription</h3>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Nom complet:</span>
                                        <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Date de naissance:</span>
                                        <span className="font-medium">{formData.dateOfBirth || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Lieu de naissance:</span>
                                        <span className="font-medium">{formData.placeOfBirth || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Situation:</span>
                                        <span className="font-medium">
                                            {formData.maritalStatus === 'SINGLE' ? 'Célibataire' :
                                                formData.maritalStatus === 'MARRIED' ? 'Marié(e)' :
                                                    formData.maritalStatus === 'DIVORCED' ? 'Divorcé(e)' :
                                                        formData.maritalStatus === 'WIDOWED' ? 'Veuf/Veuve' : '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Ville:</span>
                                        <span className="font-medium">{formData.city || '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Profession:</span>
                                        <span className="font-medium">{formData.profession || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {!registrationComplete && (
                                <Alert className="bg-primary/5 border-primary/20">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    <AlertTitle>Prêt à soumettre</AlertTitle>
                                    <AlertDescription>
                                        Votre dossier sera transmis au service municipal pour validation.
                                        Vous recevrez une notification par email dès que votre statut changera.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {registrationComplete && (
                                <div className="space-y-6">
                                    <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <AlertTitle className="text-green-800 dark:text-green-300">Inscription réussie !</AlertTitle>
                                        <AlertDescription className="text-green-700 dark:text-green-400">
                                            Votre compte a été créé avec succès. Conservez précieusement votre code PIN ci-dessous.
                                        </AlertDescription>
                                    </Alert>

                                    <div className="p-6 bg-primary/5 rounded-lg border-2 border-primary/20 space-y-4">
                                        <div className="flex items-center justify-center gap-2 text-primary">
                                            <Key className="h-5 w-5" />
                                            <h3 className="font-semibold">Votre Code PIN de Connexion</h3>
                                        </div>

                                        <PinCodeInput
                                            value={generatedPin}
                                            onChange={() => { }}
                                            disabled
                                        />

                                        <Button
                                            variant="outline"
                                            onClick={copyPinToClipboard}
                                            className="w-full"
                                        >
                                            {pinCopied ? (
                                                <>
                                                    <Check className="mr-2 h-4 w-4" />
                                                    Copié !
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    Copier le code PIN
                                                </>
                                            )}
                                        </Button>

                                        <p className="text-xs text-center text-muted-foreground">
                                            Ce code vous permettra de vous connecter rapidement lors de vos prochaines visites.
                                        </p>
                                    </div>

                                    <Button
                                        onClick={() => navigate('/login')}
                                        className="w-full"
                                    >
                                        Accéder à mon espace
                                    </Button>
                                </div>
                            )}

                            {!registrationComplete && (
                                <div className="space-y-3">
                                    <div className="flex items-start space-x-2">
                                        <Checkbox
                                            id="terms"
                                            checked={acceptTerms}
                                            onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                                        />
                                        <label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                                            Je certifie sur l'honneur l'exactitude des informations fournies et j'accepte les{' '}
                                            <a href="/cgu" className="text-primary underline">conditions générales d'utilisation</a>
                                        </label>
                                    </div>
                                    <div className="flex items-start space-x-2">
                                        <Checkbox
                                            id="privacy"
                                            checked={acceptPrivacy}
                                            onCheckedChange={(checked) => setAcceptPrivacy(checked === true)}
                                        />
                                        <label htmlFor="privacy" className="text-sm leading-tight cursor-pointer">
                                            J'accepte la{' '}
                                            <a href="/politique-confidentialite" className="text-primary underline">politique de confidentialité</a>{' '}
                                            et le traitement de mes données personnelles
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!registrationComplete && (
                        <div className="flex justify-between pt-4">
                            {step > 1 && (
                                <Button variant="outline" onClick={() => setStep(step - 1)} disabled={loading}>
                                    Précédent
                                </Button>
                            )}
                            <div className="ml-auto">
                                {step < 6 ? (
                                    <Button onClick={handleNext} disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Suivant
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading || !acceptTerms || !acceptPrivacy || !formData.email || !formData.password || formData.password !== formData.confirmPassword}
                                    >
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Créer mon compte
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
