import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Upload, Loader2, FileText, User, Users, MapPin, Briefcase, Eye, Key, Copy, Check } from "lucide-react";
import { formAssistantStore, useFormAssistant } from "@/stores/formAssistantStore";
import { IAstedLabel, IAstedInput, IAstedSelectIndicator, getIAstedSelectClasses } from "@/components/ui/iasted-form-fields";
import { registerUser, generatePinCode } from "@/services/authService";
import { PinCodeInput } from "./PinCodeInput";
import { toast } from "sonner";

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

    // State pour les fichiers
    const [files, setFiles] = useState<{
        photo?: File;
        passport?: File;
        birthCert?: File;
        proofOfAddress?: File;
    }>({});

    const handleFileChange = (key: string, file: File) => {
        setFiles(prev => ({ ...prev, [key]: file }));
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
