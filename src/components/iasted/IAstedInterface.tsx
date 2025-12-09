import React, { useMemo, useState, useEffect } from 'react';
import { IAstedChatModal } from '@/components/iasted/IAstedChatModal';
import IAstedPresentationWrapper from "@/components/iasted/IAstedPresentationWrapper";
import { useRealtimeVoiceWebRTC } from '@/hooks/useRealtimeVoiceWebRTC';
import { IASTED_SYSTEM_PROMPT } from '@/config/iasted-config';
import { buildContextualPrompt } from '@/config/iasted-prompt-lite';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from 'next-themes';
import { useNavigate, useLocation } from 'react-router-dom';
import { resolveRoute } from '@/utils/route-mapping';
import { formAssistantStore } from '@/stores/formAssistantStore';
import { usePresentationSafe } from '@/contexts/PresentationContext';

interface IAstedInterfaceProps {
    userRole?: string;
    userFirstName?: string;
    defaultOpen?: boolean;
    isOpen?: boolean; // Allow external control
    onClose?: () => void; // Allow external control
    onToolCall?: (toolName: string, args: any) => void;
    externalPresentationMode?: boolean; // External control of presentation mode
    onExternalPresentationClose?: () => void; // Callback when presentation closes
}

/**
 * Complete IAsted Agent Interface.
 * Includes the floating button and the chat modal.
 * Manages its own connection and visibility state.
 */
export default function IAstedInterface({
    userRole = 'user',
    userFirstName,
    defaultOpen = false,
    isOpen: controlledIsOpen,
    onClose: controlledOnClose,
    onToolCall,
    externalPresentationMode = false,
    onExternalPresentationClose
}: IAstedInterfaceProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);

    // Use controlled state if provided, otherwise use internal state
    const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
    const setIsOpen = controlledOnClose ? (value: boolean) => {
        if (!value) controlledOnClose();
    } : setInternalIsOpen;

    const [selectedVoice, setSelectedVoice] = useState<'echo' | 'ash' | 'shimmer'>('ash');
    const [pendingDocument, setPendingDocument] = useState<any>(null);
    const [questionsRemaining, setQuestionsRemaining] = useState(3);
    const [internalPresentationMode, setInternalPresentationMode] = useState(false);
    const { setTheme, theme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    // Connect to global presentation context
    const { showPresentation: contextPresentationMode, stopPresentation: contextStopPresentation } = usePresentationSafe();

    // Combine all sources of presentation mode
    const isPresentationMode = internalPresentationMode || externalPresentationMode || contextPresentationMode;

    // Debug: Log presentation mode state
    useEffect(() => {
        console.log('🎬 [IAstedInterface] Presentation state:', {
            internalPresentationMode,
            externalPresentationMode,
            contextPresentationMode,
            isPresentationMode
        });
    }, [internalPresentationMode, externalPresentationMode, contextPresentationMode, isPresentationMode]);

    // Sync external presentation mode with internal state
    useEffect(() => {
        if (externalPresentationMode) {
            console.log('🎬 [IAstedInterface] External presentation triggered, setting internal');
            setInternalPresentationMode(true);
        }
    }, [externalPresentationMode]);

    // Handle presentation close
    const handlePresentationClose = () => {
        setInternalPresentationMode(false);
        contextStopPresentation();
        onExternalPresentationClose?.();
    };

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
        // Si on a le prénom, on l'utilise pour personnaliser
        const firstName = userFirstName;

        switch (userRole) {
            // Personnel municipal
            case 'MAIRE':
            case 'maire':
                return firstName ? `Monsieur le Maire ${firstName}` : 'Monsieur le Maire';
            case 'MAIRE_ADJOINT':
            case 'maire_adjoint':
                return firstName ? `Monsieur l'Adjoint ${firstName}` : 'Monsieur le Maire Adjoint';
            case 'SECRETAIRE_GENERAL':
            case 'secretaire_general':
                return firstName ? `Monsieur ${firstName}` : 'Monsieur le Secrétaire Général';
            case 'CHEF_SERVICE':
            case 'chef_service':
                return firstName ? `Monsieur ${firstName}` : 'Monsieur le Chef de Service';
            case 'AGENT':
            case 'agent':
                return firstName ? `Cher ${firstName}` : 'Cher collègue';
            case 'super_admin':
            case 'SUPER_ADMIN':
                return firstName ? `Monsieur ${firstName}` : 'Monsieur l\'Administrateur';
            case 'admin':
            case 'ADMIN':
                return firstName ? `Monsieur ${firstName}` : 'Monsieur le Directeur';
            // Usagers - Citoyens
            case 'citizen':
            case 'CITIZEN':
            case 'resident':
                return firstName ? `Cher ${firstName}` : 'Cher administré';
            case 'citizen_other':
            case 'autre_commune':
                return firstName ? `Cher ${firstName}` : 'Cher visiteur';
            case 'foreigner':
            case 'etranger':
                return firstName ? `Cher ${firstName}` : 'Cher résident';
            case 'company':
            case 'entreprise':
            case 'association':
                return firstName ? `Cher ${firstName}` : 'Cher partenaire';
            // Non identifié (page d'accueil)
            default:
                return 'Bonjour';
        }
    }, [userRole, userFirstName]);

    // Détermine si on est sur une page de formulaire d'inscription
    const isOnRegistrationPage = location.pathname.startsWith('/register');
    const isOnHomePage = location.pathname === '/';
    const registrationFormType = location.pathname.includes('/gabonais') ? 'gabonais'
        : location.pathname.includes('/etranger') ? 'etranger'
            : 'choice';

    // Format system prompt with full user context
    const formattedSystemPrompt = useMemo(() => {
        // Détermine si l'utilisateur est identifié ou non
        const isIdentified = userRole && userRole !== 'user' && userRole !== 'unknown';

        // Build the contextualized prompt using the new function
        let prompt = buildContextualPrompt({
            userTitle: isIdentified ? userTitle : 'Visiteur',
            userRole: userRole || 'unknown',
            isConnected: isIdentified,
            currentPage: location.pathname,
            timeOfDay: timeOfDay,
            userFirstName: userFirstName
        });

        // Add form assistance context if on registration page
        if (isOnRegistrationPage) {
            const currentStep = formAssistantStore.getCurrentStep();
            const formData = formAssistantStore.getFormData();
            const filledFields = Object.keys(formData).filter(k => formData[k]);

            prompt += `\n\n## CONTEXTE FORMULAIRE\n`;
            prompt += `**Type de formulaire**: ${registrationFormType}\n`;
            prompt += `**Étape actuelle**: ${currentStep}/6\n`;
            prompt += `**Champs remplis**: ${filledFields.length > 0 ? filledFields.join(', ') : 'aucun'}\n`;
            prompt += `MODE ASSISTANCE FORMULAIRE ACTIF - Guidez l'utilisateur pour remplir le formulaire.\n`;
        } else if (isOnHomePage) {
            prompt += `\n\n## CONTEXTE PAGE D'ACCUEIL\n`;
            prompt += `L'utilisateur est sur la page d'accueil. Proposez-lui les services disponibles.\n`;
        }

        // Note: We use only the lite contextual prompt to stay within Realtime API limits
        // The tools are defined separately in updateSession()
        return prompt;
    }, [timeOfDay, userTitle, userRole, userFirstName, isOnRegistrationPage, isOnHomePage, registrationFormType, location.pathname]);

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
            return { success: true, message: 'Chat ouvert' };
        }

        if (toolName === 'close_chat') {
            setIsOpen(false);
            return { success: true, message: 'Chat fermé' };
        }

        // ========== MODE PRÉSENTATION ==========

        if (toolName === 'start_presentation') {
            console.log('🎬 [IAstedInterface] Démarrage mode présentation');
            setInternalPresentationMode(true);
            toast.success('Mode présentation activé !');
            return {
                success: true,
                message: 'Mode présentation démarré. Je vais vous faire découvrir MAIRIE.GA en moins de 2 minutes.'
            };
        }

        if (toolName === 'stop_presentation') {
            console.log('🎬 [IAstedInterface] Arrêt mode présentation');
            setInternalPresentationMode(false);
            contextStopPresentation();
            return { success: true, message: 'Mode présentation arrêté.' };
        }

        // ========== COMMUNICATION & COLLABORATION ==========

        if (toolName === 'start_call') {
            console.log('📞 [IAstedInterface] Démarrage appel:', args);
            const { recipient, video } = args;
            const callType = video ? 'vidéo' : 'audio';

            toast.info(`Appel ${callType} en cours vers ${recipient}...`, {
                duration: 5000,
            });

            // Dispatch event for call system
            window.dispatchEvent(new CustomEvent('iasted-start-call', {
                detail: { recipient, video: video || false }
            }));

            return { success: true, message: `Appel ${callType} initié vers ${recipient}` };
        }

        if (toolName === 'end_call') {
            console.log('📞 [IAstedInterface] Fin d\'appel');

            toast.success('Appel terminé');

            window.dispatchEvent(new CustomEvent('iasted-end-call'));

            return { success: true, message: 'Appel terminé' };
        }

        if (toolName === 'manage_meeting') {
            console.log('📅 [IAstedInterface] Gestion réunion:', args);
            const { action, subject, time, participants } = args;

            switch (action) {
                case 'schedule':
                    toast.success(`Réunion "${subject || 'Sans titre'}" planifiée${time ? ` pour ${time}` : ''}`);
                    window.dispatchEvent(new CustomEvent('iasted-schedule-meeting', {
                        detail: { subject, time, participants }
                    }));
                    return { success: true, message: `Réunion planifiée: ${subject}` };

                case 'join':
                    toast.info(`Connexion à la réunion "${subject || 'en cours'}"...`);
                    window.dispatchEvent(new CustomEvent('iasted-join-meeting', {
                        detail: { subject }
                    }));
                    return { success: true, message: `Connexion à la réunion` };

                case 'cancel':
                    toast.warning(`Réunion "${subject}" annulée`);
                    return { success: true, message: 'Réunion annulée' };

                case 'list':
                    navigate('/dashboard/citizen/requests?tab=meetings');
                    return { success: true, message: 'Affichage de vos réunions' };

                default:
                    return { success: false, message: 'Action de réunion non reconnue' };
            }
        }

        if (toolName === 'manage_chat') {
            console.log('💬 [IAstedInterface] Gestion chat:', args);
            const { action, query } = args;

            switch (action) {
                case 'open':
                    setIsOpen(true);
                    return { success: true, message: 'Interface de chat ouverte' };

                case 'close':
                    setIsOpen(false);
                    return { success: true, message: 'Interface de chat fermée' };

                case 'summarize':
                    toast.info('Génération du résumé de conversation...');
                    // This would typically call an AI summarization endpoint
                    return { success: true, message: 'Résumé en cours de génération...' };

                case 'search':
                    toast.info(`Recherche dans l'historique: "${query}"`);
                    window.dispatchEvent(new CustomEvent('iasted-search-chat', { detail: { query } }));
                    return { success: true, message: `Recherche: ${query}` };

                case 'clear':
                    window.dispatchEvent(new CustomEvent('iasted-clear-chat'));
                    toast.success('Historique de conversation effacé');
                    return { success: true, message: 'Historique effacé' };

                default:
                    return { success: false, message: 'Action de chat non reconnue' };
            }
        }

        // ========== MESSAGING (iBoîte) ==========

        if (toolName === 'send_mail') {
            console.log('📧 [IAstedInterface] Envoi de mail:', args);
            const { recipient, subject, body, priority } = args;

            // Navigate to iBoîte and prefill the composer
            toast.success(`Mail envoyé à ${recipient}`);

            // Dispatch event to iBoîte to compose the mail
            window.dispatchEvent(new CustomEvent('iasted-compose-mail', {
                detail: { recipient, subject, body, priority: priority || 'normal' }
            }));

            // Navigate to messaging
            setTimeout(() => {
                navigate('/iboite', {
                    state: {
                        compose: true,
                        recipient,
                        subject,
                        body,
                        priority: priority || 'normal'
                    }
                });
            }, 500);

            return { success: true, message: `Mail envoyé à ${recipient}` };
        }

        if (toolName === 'send_message') {
            console.log('💬 [IAstedInterface] Envoi de message:', args);
            const { recipient, content, reply_to } = args;

            toast.success(`Message envoyé à ${recipient}`);

            // Dispatch event for messaging system
            window.dispatchEvent(new CustomEvent('iasted-send-message', {
                detail: { recipient, content, reply_to }
            }));

            // Navigate to messaging
            setTimeout(() => {
                navigate('/iboite', {
                    state: {
                        compose: true,
                        recipient,
                        body: content,
                        reply_to
                    }
                });
            }, 500);

            return { success: true, message: `Message envoyé à ${recipient}` };
        }

        // ========== CONSULTATION COMMUNICATION ==========

        if (toolName === 'read_mail') {
            console.log('📧 [IAstedInterface] Lecture mail:', args);
            const { mail_id, filter } = args;

            // Mock mail data - in real app, would fetch from iBoîte
            const mockMail = {
                from: 'Service Urbanisme',
                subject: 'Votre demande de permis de construire',
                preview: 'Suite à votre demande du 15 novembre, nous avons le plaisir de vous informer que votre dossier est complet...',
                date: 'Hier 14:30'
            };

            toast.info(`Lecture du mail de ${mockMail.from}`);

            // Navigate to iBoîte to show the mail
            navigate('/iboite', {
                state: { openMail: mail_id || 'latest', filter }
            });

            return {
                success: true,
                message: `Mail de ${mockMail.from} : "${mockMail.subject}"`,
                mail: mockMail
            };
        }

        if (toolName === 'get_call_history') {
            console.log('📞 [IAstedInterface] Historique appels:', args);
            const { filter, limit } = args;

            // Mock call history - in real app, would fetch from call logs
            const mockCalls = [
                { name: 'M. Dupont', time: '14:30', type: 'missed' },
                { name: 'Service RH', time: '15:45', type: 'missed' },
                { name: 'Agent Koumba', time: '10:00', type: 'incoming' }
            ];

            const filteredCalls = filter && filter !== 'all'
                ? mockCalls.filter(c => c.type === filter)
                : mockCalls;

            const missedCount = mockCalls.filter(c => c.type === 'missed').length;

            if (filter === 'missed' && missedCount > 0) {
                toast.warning(`${missedCount} appel(s) manqué(s)`);
            } else {
                toast.info(`${filteredCalls.length} appel(s) récent(s)`);
            }

            // Dispatch event to show call history
            window.dispatchEvent(new CustomEvent('iasted-show-calls', {
                detail: { filter, limit }
            }));

            return {
                success: true,
                message: `Vous avez ${missedCount} appel(s) manqué(s) et ${mockCalls.length} appel(s) au total`,
                calls: filteredCalls.slice(0, limit || 10)
            };
        }

        if (toolName === 'get_unread_count') {
            console.log('📬 [IAstedInterface] Compteur non-lus');

            // Mock unread counts - in real app, would fetch from backend
            const unreadMails = 5;
            const unreadMessages = 2;
            const missedCalls = 1;

            const total = unreadMails + unreadMessages + missedCalls;

            if (total > 0) {
                toast.info(`${total} notification(s) non lue(s)`);
            } else {
                toast.success('Tout est à jour !');
            }

            return {
                success: true,
                message: `Vous avez ${unreadMails} email(s) non lu(s), ${unreadMessages} message(s) et ${missedCalls} appel(s) manqué(s)`,
                unread: { mails: unreadMails, messages: unreadMessages, calls: missedCalls }
            };
        }

        if (toolName === 'search_communications') {
            console.log('🔍 [IAstedInterface] Recherche communications:', args);
            const { query, type, date_range } = args;

            // Mock search results
            const mockResults = [
                { type: 'mail', from: 'Urbanisme', subject: `Permis ${query}`, date: '15/11' },
                { type: 'mail', from: 'État Civil', subject: `Demande ${query}`, date: '12/11' },
            ];

            toast.info(`Recherche "${query}" dans ${type || 'tous'}`);

            // Navigate to iBoîte with search
            navigate('/iboite', {
                state: { search: query, searchType: type }
            });

            return {
                success: true,
                message: `${mockResults.length} résultat(s) trouvé(s) pour "${query}"`,
                results: mockResults
            };
        }

        // ========== MODE GUIDE & AIDE ==========

        if (toolName === 'start_guide') {
            console.log('📚 [IAstedInterface] Démarrage guide:', args);
            const { topic } = args;

            toast.info(topic ? `Guide: ${topic}` : 'Mode guide activé');

            // Dispatch event for guide overlay component
            window.dispatchEvent(new CustomEvent('iasted-start-guide', {
                detail: { topic, page: location.pathname }
            }));

            return {
                success: true,
                message: `Mode guide activé pour ${topic || 'cette page'}`,
                current_page: location.pathname
            };
        }

        if (toolName === 'explain_context') {
            console.log('❓ [IAstedInterface] Explication contexte:', args);
            const { element_id } = args;

            // Get page context info
            const pageContextMap: Record<string, string> = {
                '/dashboard/citizen': 'Votre tableau de bord citoyen avec un aperçu de vos demandes, documents et services disponibles.',
                '/dashboard/citizen/requests': 'La liste de vos demandes en cours et leur statut de traitement.',
                '/dashboard/citizen/documents': 'Vos documents officiels téléchargeables et leur historique.',
                '/dashboard/agent': 'Votre espace agent pour traiter les demandes des citoyens.',
                '/dashboard/super-admin': 'L\'administration système pour gérer le réseau des mairies.',
                '/iboite': 'Votre messagerie pour communiquer avec les services municipaux.',
                '/services': 'Le catalogue complet des services municipaux disponibles.',
                '/': 'La page d\'accueil du portail municipal. Connectez-vous pour accéder à vos services personnalisés.'
            };

            const contextInfo = pageContextMap[location.pathname] ||
                `Vous êtes sur la page ${location.pathname}. Je peux vous aider à naviguer.`;

            if (element_id) {
                const element = document.getElementById(element_id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
                    setTimeout(() => {
                        element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
                    }, 3000);
                }
            }

            return {
                success: true,
                message: contextInfo,
                page: location.pathname,
                element_found: element_id ? !!document.getElementById(element_id) : null
            };
        }

        // ========== STOP CONVERSATION ==========

        if (toolName === 'stop_conversation') {
            console.log('🛑 [IAstedInterface] Arrêt de la conversation');

            openaiRTC.disconnect();
            toast.info('Conversation terminée');

            return { success: true, message: 'Conversation arrêtée' };
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

            // Accept both 'path' and 'route' parameters for compatibility
            const targetRoute = args.path || args.route;

            if (targetRoute) {
                console.log(`🚀 [IAstedInterface] Navigating to: ${targetRoute}`);
                navigate(targetRoute);
                toast.success(`Navigation vers ${targetRoute}`);

                // Si module_id est spécifié, scroll après navigation
                if (args.module_id) {
                    setTimeout(() => {
                        const element = document.getElementById(args.module_id);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }, 500);
                }
            } else {
                console.warn('⚠️ [IAstedInterface] navigate_app called without path or route');
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

                // Note: chameleon_role feature removed for security - role impersonation must be validated server-side
                if (args.target_role) {
                    console.log(`🦎 [IAstedInterface] Mode Caméléon demandé: ${args.target_role} (ignoré pour sécurité - validation côté serveur requise)`);
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
            const { field } = args;
            let { value } = args;

            // === FORMATAGE INTELLIGENT DES NOMS ===
            // Les noms de famille sont convertis en MAJUSCULES
            // Les prénoms sont convertis en Title Case (première lettre majuscule)
            const formatToUpperCase = (str: string): string => str.toUpperCase().trim();
            const formatToTitleCase = (str: string): string => {
                return str
                    .toLowerCase()
                    .split(/[\s-]+/)
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(str.includes('-') ? '-' : ' ')
                    .trim();
            };

            // Appliquer le formatage selon le type de champ
            if (['lastName', 'fatherName', 'motherName', 'emergencyContactLastName'].includes(field)) {
                // Noms de famille → MAJUSCULES
                value = formatToUpperCase(value);
                console.log(`🔠 [Format] ${field}: "${args.value}" → "${value}" (MAJUSCULES)`);
            } else if (['firstName', 'emergencyContactFirstName'].includes(field)) {
                // Prénoms → Title Case
                value = formatToTitleCase(value);
                console.log(`🔠 [Format] ${field}: "${args.value}" → "${value}" (Title Case)`);
            }

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
                formAssistantStore.clearForm();
                toast.success('Formulaire d\'inscription Gabonais sélectionné');
            } else if (type === 'etranger') {
                navigate('/register/etranger');
                formAssistantStore.setCurrentForm('foreigner_registration');
                formAssistantStore.clearForm();
                toast.success('Formulaire d\'inscription Étranger sélectionné');
            }

            return { success: true, type, message: `Type ${type} sélectionné, navigation vers le formulaire` };
        }

        // Nouvel outil pour démarrer le processus d'inscription
        if (toolName === 'start_registration_flow') {
            console.log('🚀 [IAstedInterface] Démarrage du processus d\'inscription:', args);
            const { citizen_type } = args;

            // Réinitialiser le store
            formAssistantStore.clearForm();

            if (citizen_type === 'gabonais') {
                formAssistantStore.setCurrentForm('gabonais_registration');
                navigate('/register/gabonais');
                toast.success('Bienvenue ! Je vous accompagne dans votre inscription.');
                return {
                    success: true,
                    message: 'Navigation vers le formulaire Gabonais. Étape 1: Documents. Prêt à vous aider à remplir le formulaire.',
                    current_step: 1,
                    total_steps: 6
                };
            } else if (citizen_type === 'etranger') {
                formAssistantStore.setCurrentForm('foreigner_registration');
                navigate('/register/etranger');
                toast.success('Bienvenue ! Je vous accompagne dans votre inscription.');
                return {
                    success: true,
                    message: 'Navigation vers le formulaire Étranger. Étape 1: Documents. Prêt à vous aider à remplir le formulaire.',
                    current_step: 1,
                    total_steps: 6
                };
            } else {
                // Si type non spécifié, aller à la page de choix
                formAssistantStore.setCurrentForm('registration_choice');
                navigate('/register');
                toast.info('Choisissez votre type de profil pour commencer.');
                return {
                    success: true,
                    message: 'Navigation vers la page de choix d\'inscription. Demandez à l\'utilisateur s\'il est gabonais ou étranger.',
                    options: ['gabonais', 'etranger']
                };
            }
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

        // ========== OUTILS DU COFFRE-FORT DE DOCUMENTS ==========

        if (toolName === 'import_document') {
            console.log('📂 [IAstedInterface] Import document:', args);
            const { source, category, for_field } = args;

            // Dispatch event to open the appropriate picker
            window.dispatchEvent(new CustomEvent('iasted-import-document', {
                detail: { source, category, for_field }
            }));

            const sourceLabels: Record<string, string> = {
                local: 'fichiers locaux',
                camera: 'la caméra',
                vault: 'le coffre-fort'
            };

            toast.info(`Ouverture de ${sourceLabels[source] || source}...`);
            return {
                success: true,
                message: `Import depuis ${sourceLabels[source]} en cours. Sélectionnez votre document.`
            };
        }

        if (toolName === 'open_document_vault') {
            console.log('🔐 [IAstedInterface] Ouvrir coffre-fort:', args);
            const { category_filter, selection_mode } = args;

            window.dispatchEvent(new CustomEvent('iasted-open-vault', {
                detail: { category: category_filter, selectionMode: selection_mode || false }
            }));

            toast.info('Ouverture du coffre-fort de documents...');
            return {
                success: true,
                message: selection_mode
                    ? 'Coffre-fort ouvert en mode sélection. Choisissez un document.'
                    : 'Coffre-fort ouvert. Gérez vos documents.'
            };
        }

        if (toolName === 'list_saved_documents') {
            console.log('📋 [IAstedInterface] Lister documents:', args);
            const { category } = args;

            // Get documents from vault store
            const { documentVaultStore } = await import('@/stores/documentVaultStore');
            await documentVaultStore.fetchDocuments();

            let documents = documentVaultStore.getDocuments();
            if (category) {
                documents = documents.filter(doc => doc.category === category);
            }

            const categoryLabels: Record<string, string> = {
                photo_identity: 'Photo d\'identité',
                passport: 'Passeport',
                birth_certificate: 'Acte de naissance',
                residence_proof: 'Justificatif de domicile',
                marriage_certificate: 'Acte de mariage',
                family_record: 'Livret de famille',
                diploma: 'Diplôme',
                cv: 'CV',
                other: 'Autre'
            };

            const summary = documents.map(doc => ({
                id: doc.id,
                name: doc.name,
                category: categoryLabels[doc.category] || doc.category,
                created: new Date(doc.created_at).toLocaleDateString('fr-FR')
            }));

            return {
                success: true,
                documents: summary,
                count: documents.length,
                message: documents.length > 0
                    ? `Vous avez ${documents.length} document(s) dans votre coffre-fort${category ? ` (catégorie: ${categoryLabels[category]})` : ''}.`
                    : 'Votre coffre-fort est vide. Voulez-vous importer un document ?'
            };
        }

        if (toolName === 'use_saved_document') {
            console.log('📎 [IAstedInterface] Utiliser document:', args);
            const { document_id, for_field } = args;

            // Get document from vault
            const { getVaultDocument, markDocumentUsed } = await import('@/services/documentVaultService');
            const { data: doc, error } = await getVaultDocument(document_id);

            if (error || !doc) {
                toast.error('Document non trouvé');
                return { success: false, message: 'Document non trouvé dans le coffre-fort' };
            }

            // Mark as used
            await markDocumentUsed(document_id);

            // Dispatch event to attach document to form field
            window.dispatchEvent(new CustomEvent('iasted-use-document', {
                detail: { document: doc, field: for_field }
            }));

            toast.success(`${doc.name} sélectionné pour ${for_field}`);
            return {
                success: true,
                document: { id: doc.id, name: doc.name, category: doc.category },
                message: `Document "${doc.name}" utilisé pour le champ ${for_field}`
            };
        }

        // ========== OUTILS D'ANALYSE DE DOCUMENTS ==========

        if (toolName === 'analyze_dropped_documents') {
            console.log('🔍 [IAstedInterface] Analyser documents:', args);
            const { auto_fill } = args;

            // Dispatch event to trigger analysis
            window.dispatchEvent(new CustomEvent('iasted-analyze-documents', {
                detail: { autoFill: auto_fill !== false }
            }));

            toast.info('Analyse des documents en cours...');
            return {
                success: true,
                message: 'J\'analyse vos documents. Cela peut prendre quelques secondes...'
            };
        }

        if (toolName === 'analyze_user_documents') {
            console.log('🔍 [IAstedInterface] Analyser documents utilisateur:', args);
            const { document_ids, document_types } = args;

            // Dispatch event to trigger OCR analysis on user's stored documents
            window.dispatchEvent(new CustomEvent('iasted-analyze-user-documents', {
                detail: { documentIds: document_ids, documentTypes: document_types }
            }));

            toast.info('Analyse OCR des documents en cours...');
            return {
                success: true,
                message: 'J\'analyse vos documents avec OCR. Cela peut prendre quelques secondes...'
            };
        }

        if (toolName === 'start_assisted_registration') {
            console.log('🚀 [IAstedInterface] Inscription assistée:', args);
            const { mode } = args;

            // Dispatch event to start assisted registration
            window.dispatchEvent(new CustomEvent('iasted-start-assisted-registration', {
                detail: { mode: mode || 'form_preview' }
            }));

            const modeLabel = mode === 'autonomous'
                ? 'Je vais vous inscrire directement après l\'analyse.'
                : 'Je vais pré-remplir le formulaire avec les informations extraites.';

            return {
                success: true,
                mode: mode || 'form_preview',
                message: `Mode inscription assistée activé. ${modeLabel} Vous pouvez déposer vos documents dans le chat.`
            };
        }

        if (toolName === 'confirm_extracted_field') {
            console.log('✅ [IAstedInterface] Confirmer champ:', args);
            const { field, confirmed_value } = args;

            // Dispatch event to confirm field
            window.dispatchEvent(new CustomEvent('iasted-confirm-field', {
                detail: { field, value: confirmed_value }
            }));

            // Also update form
            formAssistantStore.setField(field, confirmed_value);
            window.dispatchEvent(new CustomEvent('iasted-fill-field', {
                detail: { field, value: confirmed_value }
            }));

            toast.success(`${field} confirmé: ${confirmed_value}`);
            return {
                success: true,
                field,
                value: confirmed_value,
                message: `Le champ ${field} a été mis à jour avec "${confirmed_value}".`
            };
        }

        if (toolName === 'get_extraction_summary') {
            console.log('📋 [IAstedInterface] Résumé extraction');

            // Get summary from assisted registration state
            const summaryEvent = new CustomEvent('iasted-get-extraction-summary', {
                detail: { callback: null }
            });
            window.dispatchEvent(summaryEvent);

            // Dispatch event to request summary (will be handled by chat modal)
            window.dispatchEvent(new CustomEvent('iasted-request-summary'));

            return {
                success: true,
                message: 'Voici le résumé des informations extraites de vos documents.'
            };
        }

        // SECURITY: security_override tool removed - all authorization must be server-side via RLS

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
            <IAstedPresentationWrapper
                showPresentation={isPresentationMode}
                onClosePresentation={handlePresentationClose}
                onOpenInterface={handleButtonClick}
                isInterfaceOpen={isOpen}
                voiceListening={openaiRTC.voiceState === 'listening'}
                voiceSpeaking={openaiRTC.voiceState === 'speaking'}
                voiceProcessing={openaiRTC.voiceState === 'connecting' || openaiRTC.voiceState === 'thinking'}
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
