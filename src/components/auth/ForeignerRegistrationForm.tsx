import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Upload, Loader2, Clock, AlertTriangle, Plane, MapPin, User, FileText, Briefcase } from "lucide-react";
import { RequestReason } from "@/types/citizen";
import { formAssistantStore, useFormAssistant } from "@/stores/formAssistantStore";
import { IAstedLabel, IAstedInput, IAstedSelectIndicator, getIAstedSelectClasses } from "@/components/ui/iasted-form-fields";

export function ForeignerRegistrationForm() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState<string>("");
    
    // Tracker les champs remplis par iAsted
    const [filledByIasted, setFilledByIasted] = useState<Set<string>>(new Set());
    
    // Données du formulaire
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        nationality: '',
        dateOfBirth: '',
        profession: '',
        address: '',
        city: '',
        country: '',
        phone: '',
        email: '',
        passportNumber: '',
        passportCountry: '',
        passportExpiry: '',
        arrivalDate: '',
        departureDate: '',
        accommodationType: '',
        gabonAddress: '',
        additionalNotes: '',
    });

    // Écouter les événements d'iAsted
    useEffect(() => {
        formAssistantStore.setCurrentForm('foreigner_registration');

        const handleFillField = (event: CustomEvent) => {
            const { field, value } = event.detail;
            setFormData(prev => ({ ...prev, [field]: value }));
            // Marquer le champ comme rempli par iAsted
            setFilledByIasted(prev => new Set([...prev, field]));
            
            // Cas spécial pour le motif
            if (field === 'reason') {
                setReason(value);
            }
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
        { id: 1, label: "Identité", icon: User },
        { id: 2, label: "Coordonnées", icon: MapPin },
        { id: 3, label: "Passeport", icon: FileText },
        { id: 4, label: "Motif", icon: Briefcase },
        { id: 5, label: "Documents", icon: Upload },
        { id: 6, label: "Validation", icon: CheckCircle2 },
    ];

    const handleNext = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setStep(step + 1);
        }, 800);
    };

    const handleSubmit = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            alert("Demande d'inscription visiteur soumise !");
        }, 1500);
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Progress Steps */}
            <div className="flex justify-between mb-8 overflow-x-auto pb-4">
                {steps.map((s, index) => (
                    <div key={s.id} className="flex flex-col items-center min-w-[80px] relative z-10">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${step >= s.id ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"
                                }`}
                        >
                            {step > s.id ? <CheckCircle2 className="h-6 w-6" /> : <s.icon className="h-5 w-5" />}
                        </div>
                        <span className={`text-xs mt-2 font-medium ${step === s.id ? 'text-blue-600' : 'text-muted-foreground'}`}>
                            {s.label}
                        </span>
                        {index < steps.length - 1 && (
                            <div
                                className={`absolute top-5 left-1/2 w-full h-[2px] -z-10 ${step > s.id ? 'bg-blue-600' : 'bg-muted'
                                    }`}
                                style={{ width: '100%' }}
                            />
                        )}
                    </div>
                ))}
            </div>

            <Card className="border-blue-100 dark:border-blue-900/50">
                <CardHeader>
                    <CardTitle>
                        {step === 1 && "Identité & État Civil"}
                        {step === 2 && "Coordonnées & Contact"}
                        {step === 3 && "Document de Voyage"}
                        {step === 4 && "Motif du Séjour"}
                        {step === 5 && "Pièces Justificatives"}
                        {step === 6 && "Confirmation"}
                    </CardTitle>
                    <CardDescription>
                        {step === 1 && "Vos informations personnelles"}
                        {step === 2 && "Où résidez-vous actuellement ?"}
                        {step === 3 && "Informations de votre passeport"}
                        {step === 4 && "Pourquoi souhaitez-vous vous inscrire ?"}
                        {step === 5 && "Documents requis pour l'analyse"}
                        {step === 6 && "Engagement et soumission"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {step === 1 && (
                        <div className="grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <IAstedLabel filledByIasted={filledByIasted.has('firstName')}>Prénom(s) *</IAstedLabel>
                                    <IAstedInput 
                                        placeholder="John" 
                                        value={formData.firstName}
                                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                                        filledByIasted={filledByIasted.has('firstName')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <IAstedLabel filledByIasted={filledByIasted.has('lastName')}>Nom(s) *</IAstedLabel>
                                    <IAstedInput 
                                        placeholder="Doe" 
                                        value={formData.lastName}
                                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                                        filledByIasted={filledByIasted.has('lastName')}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <IAstedLabel filledByIasted={filledByIasted.has('nationality')}>Nationalité *</IAstedLabel>
                                    <IAstedInput 
                                        placeholder="Ex: Française" 
                                        value={formData.nationality}
                                        onChange={(e) => handleInputChange('nationality', e.target.value)}
                                        filledByIasted={filledByIasted.has('nationality')}
                                    />
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
                            <div className="space-y-2">
                                <IAstedLabel filledByIasted={filledByIasted.has('profession')}>Profession</IAstedLabel>
                                <IAstedInput 
                                    placeholder="Ex: Ingénieur" 
                                    value={formData.profession}
                                    onChange={(e) => handleInputChange('profession', e.target.value)}
                                    filledByIasted={filledByIasted.has('profession')}
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <IAstedLabel filledByIasted={filledByIasted.has('address')}>Adresse de résidence actuelle *</IAstedLabel>
                                <IAstedInput 
                                    placeholder="Numéro et nom de rue" 
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
                                    <IAstedLabel filledByIasted={filledByIasted.has('country')}>Pays *</IAstedLabel>
                                    <IAstedInput 
                                        value={formData.country}
                                        onChange={(e) => handleInputChange('country', e.target.value)}
                                        filledByIasted={filledByIasted.has('country')}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <IAstedLabel filledByIasted={filledByIasted.has('phone')}>Téléphone *</IAstedLabel>
                                    <IAstedInput 
                                        placeholder="+33..." 
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        filledByIasted={filledByIasted.has('phone')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <IAstedLabel filledByIasted={filledByIasted.has('email')}>Email *</IAstedLabel>
                                    <IAstedInput 
                                        type="email" 
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        filledByIasted={filledByIasted.has('email')}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <IAstedLabel filledByIasted={filledByIasted.has('passportNumber')}>Numéro de Passeport *</IAstedLabel>
                                <IAstedInput 
                                    placeholder="Ex: 12AB34567" 
                                    value={formData.passportNumber}
                                    onChange={(e) => handleInputChange('passportNumber', e.target.value)}
                                    filledByIasted={filledByIasted.has('passportNumber')}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <IAstedLabel filledByIasted={filledByIasted.has('passportCountry')}>Pays d'émission *</IAstedLabel>
                                    <IAstedInput 
                                        value={formData.passportCountry}
                                        onChange={(e) => handleInputChange('passportCountry', e.target.value)}
                                        filledByIasted={filledByIasted.has('passportCountry')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <IAstedLabel filledByIasted={filledByIasted.has('passportExpiry')}>Date d'expiration *</IAstedLabel>
                                    <IAstedInput 
                                        type="date" 
                                        value={formData.passportExpiry}
                                        onChange={(e) => handleInputChange('passportExpiry', e.target.value)}
                                        filledByIasted={filledByIasted.has('passportExpiry')}
                                    />
                                </div>
                            </div>
                            <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Validité du Passeport</AlertTitle>
                                <AlertDescription>
                                    Votre passeport doit être valide au moins 6 mois après la date prévue de votre entrée au Gabon.
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <IAstedLabel filledByIasted={filledByIasted.has('reason')}>Motif principal *</IAstedLabel>
                                <Select 
                                    value={reason}
                                    onValueChange={(value) => {
                                        setReason(value);
                                        handleInputChange('reason', value);
                                    }}
                                >
                                    <SelectTrigger className={getIAstedSelectClasses(filledByIasted.has('reason'), 'blue')}>
                                        <SelectValue placeholder="Sélectionnez un motif" />
                                        <IAstedSelectIndicator filledByIasted={filledByIasted.has('reason')} variant="blue" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={RequestReason.VISA_REQUEST}>Demande de Visa</SelectItem>
                                        <SelectItem value={RequestReason.LEGALIZATION}>Légalisation / Certification</SelectItem>
                                        <SelectItem value={RequestReason.OTHER}>Autre demande</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {reason === RequestReason.VISA_REQUEST && (
                                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg space-y-4 border border-blue-100 dark:border-blue-900/50 animate-in fade-in slide-in-from-top-2">
                                    <h3 className="font-medium text-blue-900 dark:text-blue-300 flex items-center gap-2">
                                        <Plane className="h-4 w-4" /> Détails du Voyage
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
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
                                        <IAstedLabel filledByIasted={filledByIasted.has('accommodationType')}>Type d'hébergement</IAstedLabel>
                                        <Select 
                                            value={formData.accommodationType}
                                            onValueChange={(value) => handleInputChange('accommodationType', value)}
                                        >
                                            <SelectTrigger className={getIAstedSelectClasses(filledByIasted.has('accommodationType'), 'blue')}>
                                                <SelectValue placeholder="Sélectionner" />
                                                <IAstedSelectIndicator filledByIasted={filledByIasted.has('accommodationType')} variant="blue" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="HOTEL">Hôtel</SelectItem>
                                                <SelectItem value="FAMILY">Famille / Amis</SelectItem>
                                                <SelectItem value="BUSINESS">Invitation Professionnelle</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <IAstedLabel filledByIasted={filledByIasted.has('gabonAddress')}>Adresse au Gabon</IAstedLabel>
                                        <IAstedInput 
                                            placeholder="Nom de l'hôtel ou adresse de l'hôte" 
                                            value={formData.gabonAddress}
                                            onChange={(e) => handleInputChange('gabonAddress', e.target.value)}
                                            filledByIasted={filledByIasted.has('gabonAddress')}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <IAstedLabel filledByIasted={filledByIasted.has('additionalNotes')}>Précisions supplémentaires</IAstedLabel>
                                <Textarea 
                                    placeholder="Détails utiles pour l'agent consulaire..." 
                                    value={formData.additionalNotes}
                                    onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                                    className={filledByIasted.has('additionalNotes') ? "border-blue-500/30 bg-blue-500/5" : ""}
                                />
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer transition-colors border-blue-200 dark:border-blue-900/50">
                                    <Upload className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                                    <p className="font-medium">Photo d'identité *</p>
                                    <p className="text-xs text-muted-foreground">Fond blanc, sans lunettes</p>
                                </div>
                                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer transition-colors border-blue-200 dark:border-blue-900/50">
                                    <Upload className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                                    <p className="font-medium">Copie du Passeport *</p>
                                    <p className="text-xs text-muted-foreground">Page avec photo</p>
                                </div>
                                {reason === RequestReason.VISA_REQUEST && (
                                    <>
                                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer transition-colors border-blue-200 dark:border-blue-900/50">
                                            <Upload className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                                            <p className="font-medium">Réservation Billet *</p>
                                            <p className="text-xs text-muted-foreground">Aller-Retour</p>
                                        </div>
                                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer transition-colors border-blue-200 dark:border-blue-900/50">
                                            <Upload className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                                            <p className="font-medium">Justificatif Hébergement *</p>
                                            <p className="text-xs text-muted-foreground">Réservation hôtel ou Certificat hébergement</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 6 && (
                        <div className="space-y-6">
                            <Alert className="bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900/50">
                                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                <AlertTitle>Délai de traitement</AlertTitle>
                                <AlertDescription>
                                    L'analyse de votre dossier prendra entre <strong>48h et 72h ouvrées</strong>.
                                    Vous ne pourrez pas prendre de rendez-vous avant la validation de votre compte.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="terms1" />
                                    <label htmlFor="terms1" className="text-sm font-medium leading-none">
                                        Je certifie que toutes les informations sont exactes
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="terms2" />
                                    <label htmlFor="terms2" className="text-sm font-medium leading-none">
                                        Je m'engage à respecter les lois de la République Gabonaise
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between pt-4">
                        {step > 1 && (
                            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={loading}>
                                Précédent
                            </Button>
                        )}
                        <div className="ml-auto">
                            {step < 6 ? (
                                <Button onClick={handleNext} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Suivant
                                </Button>
                            ) : (
                                <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Soumettre la demande
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
