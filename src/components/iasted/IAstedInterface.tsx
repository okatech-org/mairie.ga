import React, { useMemo, useState, useEffect } from 'react';
import { IAstedChatModal } from '@/components/iasted/IAstedChatModal';
import IAstedButtonFull from "@/components/iasted/IAstedButtonFull";
import { useRealtimeVoiceWebRTC } from '@/hooks/useRealtimeVoiceWebRTC';
import { IASTED_SYSTEM_PROMPT } from '@/config/iasted-config';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from 'next-themes';
import { useNavigate, useLocation } from 'react-router-dom';
import { resolveRoute } from '@/utils/route-mapping';
import { formAssistantStore } from '@/stores/formAssistantStore';

interface IAstedInterfaceProps {
    userRole?: string;
    defaultOpen?: boolean;
    isOpen?: boolean; // Allow external control
    onClose?: () => void; // Allow external control
    onToolCall?: (toolName: string, args: any) => void;
}

/**
 * Complete IAsted Agent Interface.
 * Includes the floating button and the chat modal.
 * Manages its own connection and visibility state.
 */
export default function IAstedInterface({ userRole = 'user', defaultOpen = false, isOpen: controlledIsOpen, onClose: controlledOnClose, onToolCall }: IAstedInterfaceProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);

    // Use controlled state if provided, otherwise use internal state
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    const setIsOpen = controlledOnClose ? (value: boolean) => {
        if (!value) controlledOnClose();
    } : setInternalIsOpen;

    const [selectedVoice, setSelectedVoice] = useState<'echo' | 'ash' | 'shimmer'>('ash');
    const [pendingDocument, setPendingDocument] = useState<any>(null);
    const [questionsRemaining, setQuestionsRemaining] = useState(3);
    const { setTheme, theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    // Initialize voice from localStorage and reset question counter on new session
    useEffect(() => {
        const savedVoice = localStorage.getItem('iasted-voice-selection') as 'echo' | 'ash' | 'shimmer';
        if (savedVoice) setSelectedVoice(savedVoice);
        
        // Check if user is not identified (anonymous mode)
        const isAnonymous = !userRole || userRole === 'user' || userRole === 'unknown';
        if (isAnonymous) {
            const storedQuestions = sessionStorage.getItem('iasted-questions-remaining');
            if (storedQuestions) {
                setQuestionsRemaining(parseInt(storedQuestions, 10));
            }
        }
    }, [userRole]);

    // Calculate time-based greeting
    const timeOfDay = useMemo(() => {
        const hour = new Date().getHours();
        return hour >= 5 && hour < 18 ? "Bonjour" : "Bonsoir";
    }, []);

    // Map user role to appropriate title (contexte municipal)
    const userTitle = useMemo(() => {
        switch (userRole) {
            // Personnel municipal
            case 'MAIRE':
            case 'maire':
                return 'Monsieur le Maire';
            case 'MAIRE_ADJOINT':
            case 'maire_adjoint':
                return 'Monsieur le Maire Adjoint';
            case 'SECRETAIRE_GENERAL':
            case 'secretaire_general':
                return 'Monsieur le Secrétaire Général';
            case 'CHEF_SERVICE':
            case 'chef_service':
                return 'Monsieur le Chef de Service';
            case 'AGENT':
            case 'agent':
                return 'Cher collègue'; // Agent municipal
            case 'super_admin':
            case 'SUPER_ADMIN':
                return 'Monsieur l\'Administrateur';
            case 'admin':
            case 'ADMIN':
                return 'Monsieur le Directeur';
            // Usagers - Citoyens
            case 'citizen':
            case 'CITIZEN':
            case 'resident':
                return 'Cher administré';
            case 'citizen_other':
            case 'autre_commune':
                return 'Cher visiteur';
            case 'foreigner':
            case 'etranger':
                return 'Cher résident';
            case 'company':
            case 'entreprise':
            case 'association':
                return 'Cher partenaire';
            // Non identifié (page d'accueil)
            default:
                return 'Bonjour';
        }
    }, [userRole]);

    // Détermine si on est sur une page de formulaire d'inscription
    const isOnRegistrationPage = location.pathname.startsWith('/register');
    const registrationFormType = location.pathname.includes('/gabonais') ? 'gabonais' 
        : location.pathname.includes('/etranger') ? 'etranger' 
        : 'choice';

    // Format system prompt with context
    const formattedSystemPrompt = useMemo(() => {
        // Détermine si l'utilisateur est identifié ou non
        const isIdentified = userRole && userRole !== 'user' && userRole !== 'unknown';
        const displayTitle = isIdentified ? userTitle : '';
        const identificationMode = isIdentified ? 'DÉSACTIVÉ' : 'ACTIVÉ';
        
        // Contexte d'assistance au formulaire
        const formContext = isOnRegistrationPage 
            ? `\n\n## MODE ASSISTANCE FORMULAIRE ACTIF\nVous êtes actuellement sur la page d'inscription (${registrationFormType}). Aidez l'utilisateur à remplir le formulaire en lui posant des questions et en remplissant les champs avec les outils disponibles.\n\nÉtape actuelle: ${formAssistantStore.getCurrentStep()}/6\nChamps remplis: ${JSON.stringify(formAssistantStore.getFormData())}\n\nPour aider l'utilisateur:\n1. Demandez-lui ses informations une par une\n2. Utilisez fill_form_field pour remplir chaque champ\n3. Utilisez navigate_form_step pour passer à l'étape suivante\n4. Confirmez ce que vous avez rempli\n\nExemple: "Quel est votre prénom ?" → utilisateur répond "Jean" → call fill_form_field(field="firstName", value="Jean") → "Parfait Jean, et quel est votre nom de famille ?"`
            : '';
        
        return IASTED_SYSTEM_PROMPT
            .replace(/{USER_TITLE}/g, displayTitle)
            .replace(/{CURRENT_TIME_OF_DAY}/g, timeOfDay)
            .replace(/{APPELLATION_COURTE}/g, isIdentified ? (userTitle.split(' ').slice(-1)[0] || '') : '')
            .replace(/{IDENTIFICATION_MODE}/g, identificationMode)
            .replace(/{QUESTIONS_REMAINING}/g, String(questionsRemaining))
            + formContext;
    }, [timeOfDay, userTitle, userRole, questionsRemaining, isOnRegistrationPage, registrationFormType]);

    // Initialize OpenAI RTC with tool call handler
    const openaiRTC = useRealtimeVoiceWebRTC(async (toolName, args) => {
        console.log(`🔧 [IAstedInterface] Tool call: ${toolName}`, args);

        // 1. Internal Handlers
        if (toolName === 'change_voice') {
            console.log('🎙️ [IAstedInterface] Changement de voix demandé');

            // Si voice_id spécifique fourni, l'utiliser
            if (args.voice_id) {
                setSelectedVoice(args.voice_id as any);
                toast.success(`Voix modifiée : ${args.voice_id === 'ash' ? 'Homme (Ash)' : args.voice_id === 'shimmer' ? 'Femme (Shimmer)' : 'Standard (Echo)'}`);
            }
            // Sinon, alterner homme↔femme selon voix actuelle
            else {
                const currentVoice = selectedVoice;
                const isCurrentlyMale = currentVoice === 'ash' || currentVoice === 'echo';
                const newVoice = isCurrentlyMale ? 'shimmer' : 'ash';

                console.log(`🎙️ [IAstedInterface] Alternance voix: ${currentVoice} (${isCurrentlyMale ? 'homme' : 'femme'}) -> ${newVoice} (${isCurrentlyMale ? 'femme' : 'homme'})`);
                setSelectedVoice(newVoice);
                toast.success(`Voix changée : ${newVoice === 'shimmer' ? 'Femme (Shimmer)' : 'Homme (Ash)'}`);
            }

            return { success: true, message: `Voix modifiée` };
        }

        if (toolName === 'logout_user') {
            console.log('👋 [IAstedInterface] Déconnexion demandée par l\'utilisateur');
            toast.info("Déconnexion en cours...");
            setTimeout(async () => {
                await supabase.auth.signOut();
                window.location.href = '/';
            }, 1500);
        }

        // Handler pour le mode identification - prompt_login
        if (toolName === 'prompt_login') {
            console.log('🔐 [IAstedInterface] Invitation à se connecter:', args);
            const reason = args.reason || 'accéder à toutes les fonctionnalités';
            const redirectAfter = args.redirect_after || '/dashboard/citizen';
            
            // Stocker la redirection pour après connexion
            sessionStorage.setItem('iasted-redirect-after-login', redirectAfter);
            
            toast.info(`Connexion recommandée pour ${reason}`, {
                duration: 5000,
                action: {
                    label: 'Se connecter',
                    onClick: () => navigate('/login')
                }
            });
            
            // Naviguer vers la page de connexion après un délai
            setTimeout(() => {
                navigate('/login');
            }, 2000);
            
            return { success: true, message: 'Redirection vers la page de connexion' };
        }

        // Décrémenter le compteur de questions pour les utilisateurs non identifiés
        if (toolName === 'decrement_questions') {
            const isAnonymous = !userRole || userRole === 'user' || userRole === 'unknown';
            if (isAnonymous && questionsRemaining > 0) {
                const newCount = questionsRemaining - 1;
                setQuestionsRemaining(newCount);
                sessionStorage.setItem('iasted-questions-remaining', String(newCount));
                console.log(`📊 [IAstedInterface] Questions restantes: ${newCount}`);
                
                if (newCount === 0) {
                    toast.warning('Vous avez utilisé vos 3 questions gratuites. Connectez-vous pour continuer !', {
                        duration: 6000,
                        action: {
                            label: 'Créer un compte',
                            onClick: () => navigate('/login')
                        }
                    });
                }
                return { success: true, remaining: newCount };
            }
            return { success: true, remaining: questionsRemaining };
        }

        if (toolName === 'open_chat') {
            setIsOpen(true);
        }

        if (toolName === 'close_chat') {
            setIsOpen(false);
        }

        if (toolName === 'generate_document') {
            console.log('📝 [IAstedInterface] Génération document:', args);
            setPendingDocument({
                type: args.type,
                recipient: args.recipient,
                subject: args.subject,
                contentPoints: args.content_points || [],
                format: args.format || 'pdf'
            });
            setIsOpen(true);
            toast.success(`Génération de ${args.type} pour ${args.recipient}...`);
        }

        if (toolName === 'control_ui') {
            console.log('🎨 [IAstedInterface] Contrôle UI:', args);
            console.log('🎨 [IAstedInterface] Thème actuel:', theme);

            if (args.action === 'set_theme_dark') {
                console.log('🎨 [IAstedInterface] Activation du mode sombre...');
                setTheme('dark');
                setTimeout(() => {
                    toast.success("Mode sombre activé");
                    console.log('✅ [IAstedInterface] Thème changé vers dark');
                }, 100);
                return { success: true, message: 'Mode sombre activé' };
            } else if (args.action === 'set_theme_light') {
                console.log('🎨 [IAstedInterface] Activation du mode clair...');
                setTheme('light');
                setTimeout(() => {
                    toast.success("Mode clair activé");
                    console.log('✅ [IAstedInterface] Thème changé vers light');
                }, 100);
                return { success: true, message: 'Mode clair activé' };
            } else if (args.action === 'toggle_theme') {
                const newTheme = theme === 'dark' ? 'light' : 'dark';
                console.log(`🎨 [IAstedInterface] Basculement: ${theme} -> ${newTheme}`);
                setTheme(newTheme);
                setTimeout(() => {
                    toast.success(`Thème basculé vers ${newTheme === 'dark' ? 'sombre' : 'clair'}`);
                    console.log(`✅ [IAstedInterface] Thème basculé vers ${newTheme}`);
                }, 100);
                return { success: true, message: `Thème basculé vers ${newTheme === 'dark' ? 'sombre' : 'clair'}` };
            }

            if (args.action === 'toggle_sidebar') {
                // Dispatch event for sidebar since it's often controlled by layout
                window.dispatchEvent(new CustomEvent('iasted-sidebar-toggle'));
                return { success: true, message: 'Sidebar basculée' };
            }

            if (args.action === 'set_speech_rate') {
                // Ajuster la vitesse de parole (0.5 à 2.0)
                const rate = parseFloat(args.value || '1.0');
                const clampedRate = Math.max(0.5, Math.min(2.0, rate));

                console.log(`🎚️ [IAstedInterface] Ajustement vitesse: ${rate} -> ${clampedRate}`);
                openaiRTC.setSpeechRate(clampedRate);

                const speedDescription = clampedRate < 0.8 ? 'ralenti'
                    : clampedRate > 1.2 ? 'accéléré'
                        : 'normal';

                setTimeout(() => {
                    toast.success(`Vitesse de parole ajustée (${speedDescription}: ${clampedRate}x)`);
                }, 100);

                return { success: true, message: `Vitesse ajustée à ${clampedRate}x` };
            }
        }

        if (toolName === 'navigate_within_space') {
            console.log('📍 [IAstedInterface] Navigation dans l\'espace présidentiel:', args);

            // Scroll vers le module dans la page actuelle (président uniquement)
            const moduleId = args.module_id;
            if (moduleId) {
                const element = document.getElementById(moduleId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    toast.success(`Module ${moduleId} affiché`);
                    console.log(`✅ [IAstedInterface] Scroll vers module: ${moduleId}`);
                } else {
                    console.error(`❌ [IAstedInterface] Module non trouvé: ${moduleId}`);
                    toast.error(`Module ${moduleId} introuvable`);
                }
            }
        }

        if (toolName === 'navigate_app') {
            console.log('🌍 [IAstedInterface] Navigation Globale (Admin):', args);

            // Navigation complète vers une autre route (admin uniquement)
            if (args.route) {
                navigate(args.route);
                toast.success(`Navigation vers ${args.route}`);
                console.log(`✅ [IAstedInterface] Navigation vers: ${args.route}`);

                // Si module_id est spécifié, scroll après navigation
                if (args.module_id) {
                    setTimeout(() => {
                        const element = document.getElementById(args.module_id);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 500);
                }
            }
        }

        if (toolName === 'global_navigate') {
            console.log('🌍 [IAstedInterface] Navigation Globale:', args);

            // Use intelligent route resolution
            const resolvedPath = resolveRoute(args.query);

            if (resolvedPath) {
                console.log(`✅ [IAstedInterface] Route resolved: "${args.query}" -> ${resolvedPath}`);
                navigate(resolvedPath);
                toast.success(`Navigation vers ${resolvedPath}`);

                // If chameleon mode is requested (target_role), we could store it or handle it
                if (args.target_role) {
                    console.log(`🦎 [IAstedInterface] Mode Caméléon: ${args.target_role}`);
                    localStorage.setItem('chameleon_role', args.target_role);
                }

                return { success: true, message: `Navigation vers ${resolvedPath} effectuée` };
            } else {
                console.error(`❌ [IAstedInterface] Route not found for: "${args.query}"`);
                toast.error(`Impossible de trouver la route pour "${args.query}"`);
                return { success: false, message: `Route "${args.query}" introuvable` };
            }
        }

        if (toolName === 'request_consular_service') {
            console.log('📋 [IAstedInterface] Demande de service consulaire:', args);
            const serviceNames: Record<string, string> = {
                passport: 'passeport',
                visa: 'visa',
                residence_certificate: 'attestation de résidence',
                nationality_certificate: 'certificat de nationalité',
                consular_card: 'carte consulaire',
                document_legalization: 'légalisation de documents',
                birth_certificate: 'acte de naissance',
                marriage_certificate: 'acte de mariage'
            };
            
            const serviceName = serviceNames[args.service_type] || args.service_type;
            const urgencyText = args.urgency === 'urgent' ? ' urgente' : '';
            
            toast.success(`Initiation de la demande de ${serviceName}${urgencyText}`);
            
            // Navigate to the appropriate service request page
            setTimeout(() => {
                navigate('/dashboard/citizen/requests', {
                    state: {
                        prefilledService: args.service_type,
                        urgency: args.urgency,
                        notes: args.notes
                    }
                });
            }, 1000);
            
            return { success: true, message: `Demande de ${serviceName} initiée` };
        }

        if (toolName === 'schedule_appointment') {
            console.log('📅 [IAstedInterface] Prise de rendez-vous:', args);
            toast.success('Ouverture du calendrier de rendez-vous');
            
            setTimeout(() => {
                navigate('/dashboard/citizen/requests', {
                    state: {
                        openAppointmentModal: true,
                        serviceType: args.service_type,
                        preferredDate: args.preferred_date,
                        notes: args.notes
                    }
                });
            }, 1000);
            
            return { success: true, message: 'Calendrier de rendez-vous ouvert' };
        }

        if (toolName === 'view_requests') {
            console.log('📋 [IAstedInterface] Consultation des demandes:', args);
            const filterText = args.filter === 'pending' ? 'en attente' :
                              args.filter === 'in_progress' ? 'en cours' :
                              args.filter === 'completed' ? 'terminées' : '';
            
            toast.success(`Affichage des demandes ${filterText || 'toutes'}`);
            
            navigate('/dashboard/citizen/requests', {
                state: { filter: args.filter }
            });
            
            return { success: true, message: 'Navigation vers vos demandes' };
        }

        if (toolName === 'get_service_info') {
            console.log('ℹ️ [IAstedInterface] Informations sur le service:', args);
            
            // This would typically fetch from a service catalog
            // For now, we'll just acknowledge and could open a modal with info
            toast.info(`Recherche d'informations sur le service ${args.service_type}...`);
            
            // Could navigate to a service info page or open a modal
            setTimeout(() => {
                // You could implement a service info modal here
                console.log('Service info for:', args.service_type);
            }, 500);
            
            return { success: true, message: `Informations sur ${args.service_type}` };
        }

        // ========== OUTILS D'ASSISTANCE AU FORMULAIRE ==========
        
        if (toolName === 'fill_form_field') {
            console.log('📝 [IAstedInterface] Remplissage de champ:', args);
            const { field, value } = args;
            
            // Mettre à jour le store
            formAssistantStore.setField(field, value);
            
            // Déclencher un événement pour que le formulaire réagisse
            window.dispatchEvent(new CustomEvent('iasted-fill-field', { 
                detail: { field, value } 
            }));
            
            const fieldLabels: Record<string, string> = {
                firstName: 'Prénom',
                lastName: 'Nom',
                dateOfBirth: 'Date de naissance',
                placeOfBirth: 'Lieu de naissance',
                maritalStatus: 'Situation matrimoniale',
                fatherName: 'Nom du père',
                motherName: 'Nom de la mère',
                address: 'Adresse',
                city: 'Ville',
                postalCode: 'Code postal',
                emergencyContactName: 'Contact d\'urgence',
                emergencyContactPhone: 'Téléphone urgence',
                professionalStatus: 'Statut professionnel',
                employer: 'Employeur',
                profession: 'Profession',
                email: 'Email',
                phone: 'Téléphone'
            };
            
            toast.success(`${fieldLabels[field] || field} rempli: ${value}`);
            return { success: true, field, value, message: `Champ ${fieldLabels[field] || field} rempli avec "${value}"` };
        }

        if (toolName === 'select_citizen_type') {
            console.log('👤 [IAstedInterface] Sélection type citoyen:', args);
            const { type } = args;
            
            if (type === 'gabonais') {
                navigate('/register/gabonais');
                formAssistantStore.setCurrentForm('gabonais_registration');
                toast.success('Formulaire d\'inscription Gabonais sélectionné');
            } else if (type === 'etranger') {
                navigate('/register/etranger');
                formAssistantStore.setCurrentForm('foreigner_registration');
                toast.success('Formulaire d\'inscription Étranger sélectionné');
            }
            
            return { success: true, type, message: `Type ${type} sélectionné, navigation vers le formulaire` };
        }

        if (toolName === 'navigate_form_step') {
            console.log('📋 [IAstedInterface] Navigation étape formulaire:', args);
            const { step, direction } = args;
            
            let targetStep = formAssistantStore.getCurrentStep();
            
            if (direction === 'next') {
                targetStep = Math.min(6, targetStep + 1);
            } else if (direction === 'previous') {
                targetStep = Math.max(1, targetStep - 1);
            } else if (direction === 'goto' && step) {
                targetStep = Math.max(1, Math.min(6, step));
            }
            
            formAssistantStore.setCurrentStep(targetStep);
            
            // Déclencher l'événement pour le formulaire
            window.dispatchEvent(new CustomEvent('iasted-navigate-step', { 
                detail: { step: targetStep, direction } 
            }));
            
            const stepLabels = ['', 'Documents', 'Infos de base', 'Famille', 'Coordonnées', 'Profession', 'Révision'];
            toast.success(`Étape ${targetStep}: ${stepLabels[targetStep]}`);
            
            return { success: true, step: targetStep, message: `Navigation vers l'étape ${targetStep}: ${stepLabels[targetStep]}` };
        }

        if (toolName === 'get_form_status') {
            console.log('📊 [IAstedInterface] Statut du formulaire');
            const currentStep = formAssistantStore.getCurrentStep();
            const formData = formAssistantStore.getFormData();
            const filledFields = Object.keys(formData).filter(k => formData[k]);
            
            return { 
                success: true, 
                currentStep,
                totalSteps: 6,
                filledFields,
                formData,
                message: `Étape ${currentStep}/6, ${filledFields.length} champs remplis`
            };
        }

        if (toolName === 'submit_form') {
            console.log('✅ [IAstedInterface] Soumission du formulaire');
            
            // Déclencher la soumission via événement
            window.dispatchEvent(new CustomEvent('iasted-submit-form'));
            
            toast.success('Soumission du formulaire en cours...');
            return { success: true, message: 'Formulaire soumis pour validation' };
        }

        if (toolName === 'security_override') {
            console.log('🔓 [IAstedInterface] Override Sécurité:', args);
            if (args.action === 'unlock_admin_access') {
                localStorage.setItem('security_override', 'true');
                toast.warning("🔓 SÉCURITÉ DÉSACTIVÉE - ACCÈS ADMIN AUTORISÉ");
                window.dispatchEvent(new CustomEvent('security-override-activated'));
            }
        }

        // 2. External Handler (for navigation, specific actions)
        if (onToolCall) {
            onToolCall(toolName, args);
        }
    });

    const handleButtonClick = async () => {
        if (openaiRTC.isConnected) {
            openaiRTC.disconnect();
        } else {
            await openaiRTC.connect(selectedVoice, formattedSystemPrompt);
        }
    };

    return (
        <>
            <IAstedButtonFull
                voiceListening={openaiRTC.voiceState === 'listening'}
                voiceSpeaking={openaiRTC.voiceState === 'speaking'}
                voiceProcessing={openaiRTC.voiceState === 'connecting' || openaiRTC.voiceState === 'thinking'}
                audioLevel={openaiRTC.audioLevel}
                onClick={handleButtonClick}
                onDoubleClick={() => setIsOpen(true)}
            />

            <IAstedChatModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                openaiRTC={openaiRTC}
                currentVoice={selectedVoice}
                systemPrompt={formattedSystemPrompt}
                pendingDocument={pendingDocument}
                onClearPendingDocument={() => setPendingDocument(null)}
            />
        </>
    );
}
