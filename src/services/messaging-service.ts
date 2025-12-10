/**
 * Messaging Service
 * 
 * Manages conversations and messages for the iBoîte feature.
 * In demo mode, provides user-specific mock data.
 * In production, connects to Supabase tables.
 */

import { supabase } from '@/integrations/supabase/client';
import { Conversation, Message } from '@/types/messaging';

// Demo conversations organized by user email/role
const DEMO_CONVERSATIONS: Record<string, Conversation[]> = {
    // Super Admin - sees all mairie-related conversations
    'super.admin@mairie.ga': [
        {
            id: 'conv_admin_1',
            participants: ['super.admin@mairie.ga', 'system'],
            subject: 'Bienvenue sur la plateforme Mairie.ga',
            type: 'OFFICIAL',
            unreadCount: 0,
            lastMessage: {
                id: 'msg_admin_1',
                senderId: 'system',
                senderName: 'Système Mairie.ga',
                senderRole: 'MANAGER',
                content: 'Bienvenue ! En tant que Super Administrateur, vous avez accès à toutes les fonctionnalités de la plateforme.',
                timestamp: new Date().toISOString(),
                isRead: true
            }
        },
        {
            id: 'conv_admin_2',
            participants: ['super.admin@mairie.ga', 'support'],
            subject: 'Rapport de performance système',
            type: 'OFFICIAL',
            unreadCount: 1,
            lastMessage: {
                id: 'msg_admin_2',
                senderId: 'support',
                senderName: 'Support Technique',
                senderRole: 'MANAGER',
                content: 'Le rapport mensuel de performance est disponible. Temps de réponse moyen: 1.2s.',
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                isRead: false
            }
        }
    ],

    // Maire de Libreville (estuaire-libreville-centrale)
    'estuaire-libreville-centrale-maire@demo.mairie.ga': [
        {
            id: 'conv_maire_lib_1',
            participants: ['estuaire-libreville-centrale-maire@demo.mairie.ga', 'prefet'],
            subject: 'Réunion Préfecture - Ordre du jour',
            type: 'OFFICIAL',
            unreadCount: 1,
            lastMessage: {
                id: 'msg_maire_1',
                senderId: 'prefet',
                senderName: 'Préfecture de l\'Estuaire',
                senderRole: 'MANAGER',
                content: 'La réunion des maires de la province est prévue pour le 20 décembre. Merci de confirmer votre présence.',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                isRead: false
            }
        },
        {
            id: 'conv_maire_lib_2',
            participants: ['estuaire-libreville-centrale-maire@demo.mairie.ga', 'citoyen-1'],
            subject: 'Demande d\'audience - M. Obame',
            type: 'OFFICIAL',
            unreadCount: 0,
            lastMessage: {
                id: 'msg_maire_2',
                senderId: 'estuaire-libreville-centrale-maire@demo.mairie.ga',
                senderName: 'Cabinet du Maire',
                senderRole: 'MANAGER',
                content: 'Votre demande d\'audience a été acceptée. Rendez-vous le 15 décembre à 10h00.',
                timestamp: new Date(Date.now() - 172800000).toISOString(),
                isRead: true
            }
        },
        {
            id: 'conv_maire_lib_3',
            participants: ['estuaire-libreville-centrale-maire@demo.mairie.ga', 'dgb'],
            subject: 'Budget 2025 - Validation',
            type: 'OFFICIAL',
            unreadCount: 2,
            lastMessage: {
                id: 'msg_maire_3',
                senderId: 'dgb',
                senderName: 'Direction Générale du Budget',
                senderRole: 'MANAGER',
                content: 'Le budget prévisionnel 2025 requiert des ajustements sur les postes d\'investissement.',
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                isRead: false
            }
        }
    ],

    // Maire de Port-Gentil
    'ogooue-maritime-port-gentil-maire@demo.mairie.ga': [
        {
            id: 'conv_maire_pg_1',
            participants: ['ogooue-maritime-port-gentil-maire@demo.mairie.ga', 'petrolier'],
            subject: 'Projet infrastructure portuaire',
            type: 'OFFICIAL',
            unreadCount: 1,
            lastMessage: {
                id: 'msg_pg_1',
                senderId: 'petrolier',
                senderName: 'Total Energies Gabon',
                senderRole: 'ENTREPRENEUR',
                content: 'Suite à notre réunion, nous vous transmettons l\'étude d\'impact environnemental.',
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                isRead: false
            }
        },
        {
            id: 'conv_maire_pg_2',
            participants: ['ogooue-maritime-port-gentil-maire@demo.mairie.ga', 'ministere'],
            subject: 'Subvention travaux maritimes',
            type: 'OFFICIAL',
            unreadCount: 0,
            lastMessage: {
                id: 'msg_pg_2',
                senderId: 'ogooue-maritime-port-gentil-maire@demo.mairie.ga',
                senderName: 'Mairie de Port-Gentil',
                senderRole: 'MANAGER',
                content: 'Nous avons bien reçu la notification de subvention. Les travaux débuteront en janvier.',
                timestamp: new Date(Date.now() - 259200000).toISOString(),
                isRead: true
            }
        }
    ],

    // Citoyen résident (Jean Obame)
    'jean.obame@example.com': [
        {
            id: 'conv_citoyen_1',
            participants: ['jean.obame@example.com', 'etat-civil'],
            subject: 'Votre demande d\'acte de naissance',
            type: 'OFFICIAL',
            unreadCount: 1,
            lastMessage: {
                id: 'msg_cit_1',
                senderId: 'etat-civil',
                senderName: 'Service État Civil',
                senderRole: 'MANAGER',
                content: 'Votre acte de naissance est prêt. Vous pouvez venir le retirer au guichet n°3.',
                timestamp: new Date(Date.now() - 43200000).toISOString(),
                isRead: false
            }
        },
        {
            id: 'conv_citoyen_2',
            participants: ['jean.obame@example.com', 'urbanisme'],
            subject: 'Permis de construire - Dossier #PC-2024-0892',
            type: 'OFFICIAL',
            unreadCount: 0,
            lastMessage: {
                id: 'msg_cit_2',
                senderId: 'urbanisme',
                senderName: 'Service Urbanisme',
                senderRole: 'MANAGER',
                content: 'Votre dossier est complet. L\'instruction est en cours, délai estimé: 2 mois.',
                timestamp: new Date(Date.now() - 604800000).toISOString(),
                isRead: true
            }
        }
    ],

    // Citoyen d'une autre commune (Marie Ndong)
    'marie.ndong@example.com': [
        {
            id: 'conv_marie_1',
            participants: ['marie.ndong@example.com', 'mairie-oyem'],
            subject: 'Demande de certificat de résidence',
            type: 'OFFICIAL',
            unreadCount: 1,
            lastMessage: {
                id: 'msg_marie_1',
                senderId: 'mairie-oyem',
                senderName: 'Mairie d\'Oyem',
                senderRole: 'MANAGER',
                content: 'Veuillez fournir un justificatif de domicile récent pour compléter votre dossier.',
                timestamp: new Date(Date.now() - 172800000).toISOString(),
                isRead: false
            }
        }
    ],

    // Étranger résident (John Smith)
    'john.smith@example.com': [
        {
            id: 'conv_john_1',
            participants: ['john.smith@example.com', 'consulat'],
            subject: 'Renouvellement carte de séjour',
            type: 'OFFICIAL',
            unreadCount: 2,
            lastMessage: {
                id: 'msg_john_1',
                senderId: 'consulat',
                senderName: 'Direction de l\'Immigration',
                senderRole: 'MANAGER',
                content: 'Votre demande de renouvellement a été enregistrée. Numéro de suivi: CS-2024-4521.',
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                isRead: false
            }
        },
        {
            id: 'conv_john_2',
            participants: ['john.smith@example.com', 'ambassade-usa'],
            subject: 'Services consulaires américains',
            type: 'OFFICIAL',
            unreadCount: 0,
            lastMessage: {
                id: 'msg_john_2',
                senderId: 'ambassade-usa',
                senderName: 'Ambassade des États-Unis',
                senderRole: 'MANAGER',
                content: 'Rappel: N\'oubliez pas de renouveler votre passeport avant expiration.',
                timestamp: new Date(Date.now() - 432000000).toISOString(),
                isRead: true
            }
        }
    ],

    // Agent municipal
    'marie.agent@mairie.ga': [
        {
            id: 'conv_agent_1',
            participants: ['marie.agent@mairie.ga', 'rh'],
            subject: 'Planning congés décembre',
            type: 'OFFICIAL',
            unreadCount: 0,
            lastMessage: {
                id: 'msg_agent_1',
                senderId: 'rh',
                senderName: 'Service RH',
                senderRole: 'MANAGER',
                content: 'Votre demande de congés du 23 au 31 décembre a été approuvée.',
                timestamp: new Date(Date.now() - 259200000).toISOString(),
                isRead: true
            }
        },
        {
            id: 'conv_agent_2',
            participants: ['marie.agent@mairie.ga', 'citoyen-123'],
            subject: 'Dossier état civil - M. Nguema',
            type: 'OFFICIAL',
            unreadCount: 1,
            lastMessage: {
                id: 'msg_agent_2',
                senderId: 'citoyen-123',
                senderName: 'Pierre Nguema',
                senderRole: 'CITIZEN',
                content: 'Merci pour votre aide. Quand pourrai-je récupérer mon document ?',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                isRead: false
            }
        }
    ]
};

// Default conversations for unknown users
const DEFAULT_CONVERSATIONS: Conversation[] = [
    {
        id: 'conv_default_1',
        participants: ['user', 'system'],
        subject: 'Bienvenue sur iBoîte',
        type: 'OFFICIAL',
        unreadCount: 1,
        lastMessage: {
            id: 'msg_default_1',
            senderId: 'system',
            senderName: 'Mairie.ga',
            senderRole: 'MANAGER',
            content: 'Bienvenue sur votre messagerie sécurisée. Utilisez iBoîte pour communiquer avec les services municipaux.',
            timestamp: new Date().toISOString(),
            isRead: false
        }
    }
];

// Demo messages for each conversation
const DEMO_MESSAGES: Record<string, Message[]> = {
    'conv_admin_1': [
        {
            id: 'msg_admin_1',
            senderId: 'system',
            senderName: 'Système Mairie.ga',
            senderRole: 'MANAGER',
            content: 'Bienvenue ! En tant que Super Administrateur, vous avez accès à toutes les fonctionnalités de la plateforme.',
            timestamp: new Date().toISOString(),
            isRead: true
        }
    ],
    'conv_maire_lib_1': [
        {
            id: 'msg_maire_1_init',
            senderId: 'prefet',
            senderName: 'Préfecture de l\'Estuaire',
            senderRole: 'MANAGER',
            content: 'Monsieur le Maire,\n\nLa réunion des maires de la province est prévue pour le 20 décembre à 10h00 à la Préfecture.\n\nOrdre du jour:\n1. Bilan 2024\n2. Budget 2025\n3. Projets d\'infrastructure\n\nMerci de confirmer votre présence.',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            isRead: false
        }
    ],
    'conv_citoyen_1': [
        {
            id: 'msg_cit_1_req',
            senderId: 'jean.obame@example.com',
            senderName: 'Jean Obame',
            senderRole: 'CITIZEN',
            content: 'Bonjour,\n\nJe souhaite obtenir une copie de mon acte de naissance.\n\nCordialement,\nJean Obame',
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            isRead: true
        },
        {
            id: 'msg_cit_1',
            senderId: 'etat-civil',
            senderName: 'Service État Civil',
            senderRole: 'MANAGER',
            content: 'Bonjour M. Obame,\n\nVotre acte de naissance est prêt. Vous pouvez venir le retirer au guichet n°3 muni de votre pièce d\'identité.\n\nHoraires: 8h-15h du lundi au vendredi.\n\nCordialement,\nService État Civil',
            timestamp: new Date(Date.now() - 43200000).toISOString(),
            isRead: false
        }
    ]
};

export const messagingService = {
    /**
     * Get conversations for the current user
     */
    async getConversations(): Promise<Conversation[]> {
        try {
            // Check for authenticated user
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user?.email) {
                // Try to get from Supabase first (future implementation)
                // For now, return demo data based on user email
                const userEmail = session.user.email;
                console.log('[MessagingService] Loading conversations for:', userEmail);

                // Check if we have demo conversations for this user
                const conversations = DEMO_CONVERSATIONS[userEmail];
                if (conversations) {
                    return conversations;
                }

                // Check by partial email match (for demo accounts)
                for (const [email, convs] of Object.entries(DEMO_CONVERSATIONS)) {
                    if (userEmail.includes(email.split('@')[0]) || email.includes(userEmail.split('@')[0])) {
                        console.log('[MessagingService] Found conversations by partial match:', email);
                        return convs;
                    }
                }
            }

            // Return default for unauthenticated users
            console.log('[MessagingService] No session or unknown user, returning default conversations');
            return DEFAULT_CONVERSATIONS;

        } catch (error) {
            console.error('[MessagingService] Error loading conversations:', error);
            return DEFAULT_CONVERSATIONS;
        }
    },

    /**
     * Get messages for a specific conversation
     */
    async getMessages(conversationId: string): Promise<Message[]> {
        try {
            // Check for demo messages
            const messages = DEMO_MESSAGES[conversationId];
            if (messages) {
                return messages;
            }

            // Return empty array if no messages found
            return [];

        } catch (error) {
            console.error('[MessagingService] Error loading messages:', error);
            return [];
        }
    },

    /**
     * Mark a conversation as read
     */
    async markAsRead(conversationId: string): Promise<void> {
        console.log('[MessagingService] Marking conversation as read:', conversationId);
        // In production, update Supabase
        // For demo, this is a no-op
    },

    /**
     * Send a message
     */
    async sendMessage(conversationId: string, content: string): Promise<Message> {
        const { data: { session } } = await supabase.auth.getSession();

        const newMessage: Message = {
            id: `msg_${Date.now()}`,
            senderId: session?.user?.email || 'anonymous@mairie.ga',
            senderName: session?.user?.email?.split('@')[0] || 'Utilisateur',
            senderRole: 'CITIZEN',
            content,
            timestamp: new Date().toISOString(),
            isRead: true
        };

        console.log('[MessagingService] Message sent:', newMessage);
        return newMessage;
    },

    /**
     * Get unread count for current user
     */
    async getUnreadCount(): Promise<number> {
        const conversations = await this.getConversations();
        return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
    }
};
