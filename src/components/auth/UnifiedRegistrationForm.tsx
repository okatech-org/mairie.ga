import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
    CheckCircle2,
    Upload,
    Loader2,
    FileText,
    User,
    Users,
    MapPin,
    Briefcase,
    Eye,
    Key,
    Copy,
    Check,
    Globe,
    Plane,
    ShieldCheck
} from "lucide-react";
import { formAssistantStore } from "@/stores/formAssistantStore";
import { IAstedLabel, IAstedInput, IAstedSelectIndicator, getIAstedSelectClasses } from "@/components/ui/iasted-form-fields";
import { registerUser, generatePinCode } from "@/services/authService";
import { PinCodeInput } from "./PinCodeInput";
import { toast } from "sonner";
import { RequestReason } from "@/types/citizen";
import { NATIONALITIES } from "@/data/nationalities";

export function UnifiedRegistrationForm() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [registrationComplete, setRegistrationComplete] = useState(false);
    const [generatedPin, setGeneratedPin] = useState("");
    const [pinCopied, setPinCopied] = useState(false);

    // Tracker les champs remplis par iAsted
    const [filledByIasted, setFilledByIasted] = useState<Set<string>>(new Set());

    // Données du formulaire
    const [formData, setFormData] = useState({
        // Identity
        firstName: '',
        lastName: '',
        gender: '',
        dateOfBirth: '',
        nationality: 'Gabonaise', // Par défaut

        // Birth & Civil
        placeOfBirth: '',
        maritalStatus: '',
        fatherFirstName: '',
        fatherLastName: '',
        motherFirstName: '',
        motherLastName: '',

        // Travel (Foreigner)
        passportNumber: '',
        passportCountry: '',
        passportExpiry: '',
        reason: '',
        arrivalDate: '',
        departureDate: '',
        accommodationType: '',
        gabonAddress: '',
        additionalNotes: '',

        // Residence
        address: '',
        city: '',
        postalCode: '',
        country: 'Gabon',

        // Emergency
        emergencyContactFirstName: '',
        emergencyContactLastName: '',
        emergencyContactPhone: '',

        // Professional
        professionalStatus: '',
        employer: '',
        profession: '',

        // Account
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
        identityDoc?: File; // Passport or CNI
        birthCert?: File;
        proofOfAddress?: File;
    }>({});

    const isGabonais = formData.nationality === 'Gabonaise';

    const handleFileChange = (key: string, file: File) => {
        setFiles(prev => ({ ...prev, [key]: file }));
    };

    // Écouter les événements d'iAsted
    useEffect(() => {
        formAssistantStore.setCurrentForm('unified_registration');

        const handleFillField = (event: CustomEvent) => {
            const { field, value } = event.detail;

            if (field === 'acceptTerms') {
                setAcceptTerms(value === true || value === 'true');
            } else if (field === 'acceptPrivacy') {
                setAcceptPrivacy(value === true || value === 'true');
            } else {
                setFormData(prev => ({ ...prev, [field]: value }));
            }
            setFilledByIasted(prev => new Set([...prev, field]));
        };

        const handleNavigateStep = (event: CustomEvent) => {
            const { step: targetStep } = event.detail;
            setStep(targetStep);
        };

        const handleSubmitForm = () => {
            if (!acceptTerms) setAcceptTerms(true);
            if (!acceptPrivacy) setAcceptPrivacy(true);

            setTimeout(() => {
                const submitBtn = document.getElementById('submit-registration-btn');
                if (submitBtn) {
                    submitBtn.click();
                } else {
                    handleSubmit();
                }
            }, 100);
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

    useEffect(() => {
        formAssistantStore.setCurrentStep(step);
    }, [step]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setFilledByIasted(prev => {
            const newSet = new Set(prev);
            newSet.delete(field);
            return newSet;
        });
    };

    const getSteps = () => {
        const commonSteps = [
            { id: 1, label: "Identité", icon: User },
            { id: 2, label: "État Civil", icon: Users },
            { id: 3, label: isGabonais ? "Filiation" : "Voyage", icon: isGabonais ? Users : Plane },
            { id: 4, label: "Résidence", icon: MapPin },
            { id: 5, label: "Documents", icon: FileText },
            { id: 6, label: "Compte", icon: ShieldCheck },
        ];
        return commonSteps;
    };

    const steps = getSteps();

    const handleNext = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setStep(step + 1);
            window.scrollTo(0, 0);
        }, 600);
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

            const pinCode = generatePinCode();
            setGeneratedPin(pinCode);

            // Mapper les données pour le service d'inscription
            await registerUser({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                dateOfBirth: formData.dateOfBirth,
                phone: formData.phone,
                nationality: formData.nationality,
                placeOfBirth: formData.placeOfBirth,
                profession: formData.profession,
                maritalStatus: formData.maritalStatus,
                address: formData.address,
                city: formData.city,
                postalCode: formData.postalCode,
                pinCode,
                // Chamos étendus
                fatherName: isGabonais ? `${formData.fatherLastName} ${formData.fatherFirstName}`.trim() : undefined,
                motherName: isGabonais ? `${formData.motherLastName} ${formData.motherFirstName}`.trim() : undefined,
                emergencyContactFirstName: formData.emergencyContactFirstName,
                emergencyContactLastName: formData.emergencyContactLastName,
                emergencyContactPhone: formData.emergencyContactPhone,
                employer: formData.employer,
                // Fichiers
                files: {
                    photo: files.photo,
                    passport: files.identityDoc, // On mappe identityDoc vers passport pour les étrangers
                    birthCert: files.birthCert,
                    proofOfAddress: files.proofOfAddress
                }
            });

            setRegistrationComplete(true);
            toast.success("Compte créé avec succès !");
        } catch (error: any) {
            console.error('Registration error:', error);
            toast.error(error.message || "Erreur lors de l'inscription");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4">
            {/* Progress Steps */}
            <div className="flex justify-between mb-8 overflow-x-auto pb-4 scrollbar-hide">
                {steps.map((s, index) => (
                    <div key={s.id} className="flex flex-col items-center min-w-[100px] relative z-10">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${step >= s.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground"
                                }`}
                        >
                            {step > s.id ? <CheckCircle2 className="h-6 w-6" /> : <s.icon className="h-5 w-5" />}
                        </div>
                        <span className={`text-xs mt-3 font-medium ${step === s.id ? 'text-primary uppercase tracking-wider' : 'text-muted-foreground'}`}>
                            {s.label}
                        </span>
                        {index < steps.length - 1 && (
                            <div
                                className={`absolute top-5 left-1/2 w-full h-[2px] -z-10 ${step > s.id ? 'bg-primary' : 'bg-muted'}`}
                                style={{ width: '100%' }}
                            />
                        )}
                    </div>
                ))}
            </div>

            <Card className="border-none shadow-2xl bg-background/60 backdrop-blur-xl neu-flat overflow-hidden">
                <div className="h-2 w-full bg-muted">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${(step / steps.length) * 100}%` }}
                    />
                </div>

                <CardHeader className="space-y-1 pb-8">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                        {step === 1 && "Profil & Identité"}
                        {step === 2 && "État Civil"}
                        {(step === 3 && isGabonais) && "Origines & Filiation"}
                        {(step === 3 && !isGabonais) && "Voyage & Motif"}
                        {step === 4 && "Résidence & Contacts"}
                        {step === 5 && "Pièces Justificatives"}
                        {step === 6 && "Sécurité du Compte"}
                    </CardTitle>
                    <CardDescription className="text-base">
                        {step === 1 && "Commençons par vos informations de base"}
                        {step === 2 && "Votre situation matrimoniale et naissance"}
                        {(step === 3 && isGabonais) && "Informations sur vos parents"}
                        {(step === 3 && !isGabonais) && "Informations sur votre séjour au Gabon"}
                        {step === 4 && "Où pouvons-nous vous joindre ?"}
                        {step === 5 && "Téléchargez les documents requis"}
                        {step === 6 && "Protégez l'accès à votre espace personnel"}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-8 min-h-[400px]">
                    {step === 1 && (
                        <div className="grid gap-6 animate-in fade-in duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <IAstedLabel filledByIasted={filledByIasted.has('firstName')}>Prénom(s) *</IAstedLabel>
                                    <IAstedInput
                                        placeholder="Jean-Pierre"
                                        value={formData.firstName}
                                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                                        filledByIasted={filledByIasted.has('firstName')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <IAstedLabel filledByIasted={filledByIasted.has('lastName')}>Nom(s) *</IAstedLabel>
                                    <IAstedInput
                                        placeholder="MBOUMBOU"
                                        value={formData.lastName}
                                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                                        filledByIasted={filledByIasted.has('lastName')}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <IAstedLabel filledByIasted={filledByIasted.has('gender')}>Sexe *</IAstedLabel>
                                    <Select
                                        value={formData.gender}
                                        onValueChange={(value) => handleInputChange('gender', value)}
                                    >
                                        <SelectTrigger className={getIAstedSelectClasses(filledByIasted.has('gender'))}>
                                            <SelectValue placeholder="Sélectionner" />
                                            <IAstedSelectIndicator filledByIasted={filledByIasted.has('gender')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="M">Masculin (M.)</SelectItem>
                                            <SelectItem value="F">Féminin (Mme)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <IAstedLabel filledByIasted={filledByIasted.has('nationality')}>Nationalité *</IAstedLabel>
                                    <Select
                                        value={formData.nationality}
                                        onValueChange={(value) => handleInputChange('nationality', value)}
                                    >
                                        <SelectTrigger className={getIAstedSelectClasses(filledByIasted.has('nationality'))}>
                                            <SelectValue placeholder="Sélectionner" />
                                            <IAstedSelectIndicator filledByIasted={filledByIasted.has('nationality')} />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            {NATIONALITIES.map((nat) => (
                                                <SelectItem key={nat.value} value={nat.value}>
                                                    <span className="flex items-center gap-2">
                                                        <span>{nat.flag}</span>
                                                        <span>{nat.label}</span>
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <IAstedLabel filledByIasted={filledByIasted.has('dateOfBirth')}>Date de naissance *</IAstedLabel>
                                <IAstedInput
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                    filledByIasted={filledByIasted.has('dateOfBirth')}
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="grid gap-6 animate-in fade-in duration-500">
                            <div className="space-y-2">
                                <IAstedLabel filledByIasted={filledByIasted.has('placeOfBirth')}>Lieu de naissance *</IAstedLabel>
                                <IAstedInput
                                    placeholder={isGabonais ? "Ex: Libreville, Gabon" : "Ex: Paris, France"}
                                    value={formData.placeOfBirth}
                                    onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
                                    filledByIasted={filledByIasted.has('placeOfBirth')}
                                />
                            </div>
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

                            <div className="space-y-2 pt-4 border-t border-border">
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
                                        <SelectItem value="SELF_EMPLOYED">Indépendant / Entrepreneur</SelectItem>
                                        <SelectItem value="STUDENT">Étudiant</SelectItem>
                                        <SelectItem value="RETIRED">Retraité</SelectItem>
                                        <SelectItem value="UNEMPLOYED">Sans emploi</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {step === 3 && isGabonais && (
                        <div className="grid gap-6 animate-in slide-in-from-right duration-500">
                            <div className="p-6 bg-muted/20 rounded-2xl border border-muted-foreground/10 space-y-6">
                                <h3 className="font-semibold text-primary flex items-center gap-2">
                                    <Users className="h-4 w-4" /> Filiation (Père)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <IAstedLabel filledByIasted={filledByIasted.has('fatherLastName')}>Nom du Père</IAstedLabel>
                                        <IAstedInput
                                            placeholder="Nom"
                                            value={formData.fatherLastName}
                                            onChange={(e) => handleInputChange('fatherLastName', e.target.value)}
                                            filledByIasted={filledByIasted.has('fatherLastName')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <IAstedLabel filledByIasted={filledByIasted.has('fatherFirstName')}>Prénom du Père</IAstedLabel>
                                        <IAstedInput
                                            placeholder="Prénom"
                                            value={formData.fatherFirstName}
                                            onChange={(e) => handleInputChange('fatherFirstName', e.target.value)}
                                            filledByIasted={filledByIasted.has('fatherFirstName')}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-muted/20 rounded-2xl border border-muted-foreground/10 space-y-6">
                                <h3 className="font-semibold text-primary flex items-center gap-2">
                                    <Users className="h-4 w-4" /> Filiation (Mère)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <IAstedLabel filledByIasted={filledByIasted.has('motherLastName')}>Nom de la Mère</IAstedLabel>
                                        <IAstedInput
                                            placeholder="Nom"
                                            value={formData.motherLastName}
                                            onChange={(e) => handleInputChange('motherLastName', e.target.value)}
                                            filledByIasted={filledByIasted.has('motherLastName')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <IAstedLabel filledByIasted={filledByIasted.has('motherFirstName')}>Prénom de la Mère</IAstedLabel>
                                        <IAstedInput
                                            placeholder="Prénom"
                                            value={formData.motherFirstName}
                                            onChange={(e) => handleInputChange('motherFirstName', e.target.value)}
                                            filledByIasted={filledByIasted.has('motherFirstName')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && !isGabonais && (
                        <div className="grid gap-6 animate-in slide-in-from-right duration-500">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <IAstedLabel filledByIasted={filledByIasted.has('reason')}>Motif principal de séjour *</IAstedLabel>
                                    <Select
                                        value={formData.reason}
                                        onValueChange={(value) => handleInputChange('reason', value)}
                                    >
                                        <SelectTrigger className={getIAstedSelectClasses(filledByIasted.has('reason'))}>
                                            <SelectValue placeholder="Sélectionnez un motif" />
                                            <IAstedSelectIndicator filledByIasted={filledByIasted.has('reason')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={RequestReason.VISA_REQUEST}>Demande de Visa</SelectItem>
                                            <SelectItem value={RequestReason.LEGALIZATION}>Légalisation de documents</SelectItem>
                                            <SelectItem value={RequestReason.OTHER}>Autre motif consulaire</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    <div className="space-y-2">
                                        <IAstedLabel filledByIasted={filledByIasted.has('arrivalDate')}>Date d'arrivée prévue</IAstedLabel>
                                        <IAstedInput
                                            type="date"
                                            value={formData.arrivalDate}
                                            onChange={(e) => handleInputChange('arrivalDate', e.target.value)}
                                            filledByIasted={filledByIasted.has('arrivalDate')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <IAstedLabel filledByIasted={filledByIasted.has('departureDate')}>Date de départ prévue</IAstedLabel>
                                        <IAstedInput
                                            type="date"
                                            value={formData.departureDate}
                                            onChange={(e) => handleInputChange('departureDate', e.target.value)}
                                            filledByIasted={filledByIasted.has('departureDate')}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <IAstedLabel filledByIasted={filledByIasted.has('passportNumber')}>Numéro de Passeport *</IAstedLabel>
                                    <IAstedInput
                                        placeholder="Ex: 12AB34567"
                                        value={formData.passportNumber}
                                        onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                                        filledByIasted={filledByIasted.has('passportNumber')}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="grid gap-6 animate-in fade-in duration-500">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <IAstedLabel filledByIasted={filledByIasted.has('address')}>Adresse Complète *</IAstedLabel>
                                    <IAstedInput
                                        placeholder="Numéro, Rue, Résidence"
                                        value={formData.address}
                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                        filledByIasted={filledByIasted.has('address')}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <IAstedLabel filledByIasted={filledByIasted.has('city')}>Ville *</IAstedLabel>
                                        <IAstedInput
                                            placeholder="Libreville"
                                            value={formData.city}
                                            onChange={(e) => handleInputChange('city', e.target.value)}
                                            filledByIasted={filledByIasted.has('city')}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <IAstedLabel filledByIasted={filledByIasted.has('country')}>Pays *</IAstedLabel>
                                        <IAstedInput
                                            value={formData.country}
                                            onChange={(e) => handleInputChange('country', e.target.value)}
                                            filledByIasted={filledByIasted.has('country')}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-red-500/5 rounded-2xl border border-red-500/10 space-y-4">
                                <h3 className="font-semibold text-red-600 flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4" /> Contact d'Urgence
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <IAstedLabel filledByIasted={filledByIasted.has('emergencyContactLastName')}>Nom *</IAstedLabel>
                                        <IAstedInput
                                            value={formData.emergencyContactLastName}
                                            onChange={(e) => handleInputChange('emergencyContactLastName', e.target.value)}
                                            filledByIasted={filledByIasted.has('emergencyContactLastName')}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
                            {[
                                { id: 'photo', label: "Photo d'identité *", sub: "Fond clair, visage dégagé", icon: User },
                                { id: 'identityDoc', label: isGabonais ? "CNI / Passeport *" : "Passeport complet *", sub: "Format PDF ou Image", icon: Globe },
                                { id: 'birthCert', label: "Acte de Naissance *", sub: "Dernier exemplaire", icon: FileText },
                                { id: 'proofOfAddress', label: "Justificatif Domicile *", sub: "EDG, Facture, Certificat", icon: MapPin },
                            ].map((doc) => (
                                <div
                                    key={doc.id}
                                    className="relative group border-2 border-dashed rounded-2xl p-8 text-center hover:bg-primary/5 hover:border-primary transition-all duration-300"
                                >
                                    <input
                                        type="file"
                                        accept=".pdf,image/*"
                                        onChange={(e) => e.target.files?.[0] && handleFileChange(doc.id, e.target.files[0])}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="space-y-3">
                                        <div className="w-12 h-12 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center mx-auto transition-colors">
                                            {files[doc.id as keyof typeof files] ? (
                                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                                            ) : (
                                                <doc.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-tight">{doc.label}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {files[doc.id as keyof typeof files] ? files[doc.id as keyof typeof files]!.name : doc.sub}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {step === 6 && (
                        <div className="grid gap-8 animate-in fade-in duration-500">
                            {!registrationComplete ? (
                                <>
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                    placeholder="+241 00 00 00 00"
                                                    value={formData.phone}
                                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                                    filledByIasted={filledByIasted.has('phone')}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                <Label>Confirmation *</Label>
                                                <Input
                                                    type="password"
                                                    placeholder="••••••••"
                                                    value={formData.confirmPassword}
                                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-muted/30 rounded-2xl space-y-4">
                                        <div className="flex items-start space-x-3">
                                            <Checkbox
                                                id="terms"
                                                checked={acceptTerms}
                                                onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                                            />
                                            <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer -mt-1">
                                                Je certifie l'exactitude des informations fournies et j'accepte les{' '}
                                                <a href="/cgu" className="text-primary font-bold hover:underline">CGU</a>
                                            </label>
                                        </div>
                                        <div className="flex items-start space-x-3">
                                            <Checkbox
                                                id="privacy"
                                                checked={acceptPrivacy}
                                                onCheckedChange={(checked) => setAcceptPrivacy(checked === true)}
                                            />
                                            <label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer -mt-1">
                                                J'accepte le traitement de mes données personnelles conformément à la{' '}
                                                <a href="/politique-confidentialite" className="text-primary font-bold hover:underline">Politique de Confidentialité</a>
                                            </label>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-8 py-4 animate-in zoom-in duration-500">
                                    <div className="p-8 bg-primary/5 rounded-3xl border-2 border-primary/20 text-center space-y-6">
                                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                                            <Key className="h-8 w-8 text-primary" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-bold tracking-tight">Votre Code PIN Universel</h3>
                                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                                Utilisez ce code pour vous connecter rapidement sur tous les portails publics (Mairie, État, Consulat).
                                            </p>
                                        </div>

                                        <PinCodeInput
                                            value={generatedPin}
                                            onChange={() => { }}
                                            disabled
                                        />

                                        <Button
                                            variant="secondary"
                                            onClick={copyPinToClipboard}
                                            className="w-full h-12 rounded-xl font-bold"
                                        >
                                            {pinCopied ? (
                                                <><Check className="mr-2 h-4 w-4" /> Code Copié !</>
                                            ) : (
                                                <><Copy className="mr-2 h-4 w-4" /> Copier le code PIN</>
                                            )}
                                        </Button>
                                    </div>

                                    <Button
                                        onClick={() => navigate('/login')}
                                        className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
                                    >
                                        Accéder à mon Espace Usager
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>

                {!registrationComplete && (
                    <div className="px-8 py-8 border-t border-border flex justify-between items-center bg-muted/10">
                        <Button
                            variant="ghost"
                            onClick={() => step > 1 ? setStep(step - 1) : navigate('/login')}
                            disabled={loading}
                            className="font-medium text-muted-foreground hover:text-foreground"
                        >
                            {step === 1 ? "Retour à l'accueil" : "Précédent"}
                        </Button>

                        <div className="flex gap-2">
                            {step < 6 ? (
                                <Button
                                    onClick={handleNext}
                                    disabled={loading}
                                    className="h-12 w-32 rounded-xl font-bold shadow-lg shadow-primary/10"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Suivant"}
                                </Button>
                            ) : (
                                <Button
                                    id="submit-registration-btn"
                                    onClick={handleSubmit}
                                    disabled={loading || !acceptTerms || !acceptPrivacy || !formData.email || !formData.password}
                                    className="h-12 w-48 rounded-xl font-bold shadow-xl shadow-primary/20"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer mon compte"}
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
