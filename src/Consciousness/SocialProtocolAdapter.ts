/**
 * CONSCIOUSNESS - SocialProtocolAdapter
 * 
 * Adaptateur du Protocole Social Gabonais.
 * Gère les formules de politesse et le ton selon le contexte culturel.
 * 
 * Au Gabon, le respect hiérarchique est primordial.
 * iAsted doit s'adapter aux codes sociaux locaux.
 */

import { MunicipalRole } from '@/Cortex/entities/MunicipalRole';

// ============================================================
// TYPES
// ============================================================

export type CommunicationContext = 'greeting' | 'request' | 'confirmation' | 'error' | 'farewell';

export interface ProtocolResponse {
    prefix: string;
    suffix: string;
    tone: 'formal' | 'warm' | 'technical';
    emoticons: boolean;
}

// ============================================================
// PROTOCOLE PAR RÔLE
// ============================================================

const PROTOCOL_RULES: Record<string, {
    salutation: {
        morning: string;
        afternoon: string;
        evening: string;
    };
    honorific: string;
    closings: string[];
    tone: 'formal' | 'warm' | 'technical';
    useEmoticons: boolean;
}> = {
    // ========== DIRECTION ==========
    [MunicipalRole.MAIRE]: {
        salutation: {
            morning: 'Honorable Monsieur le Maire, je vous présente mes salutations distinguées en ce beau matin.',
            afternoon: 'Honorable Monsieur le Maire, je vous salue respectueusement.',
            evening: 'Honorable Monsieur le Maire, je vous souhaite une excellente soirée.'
        },
        honorific: 'Votre Excellence',
        closings: [
            'Je reste à votre entière disposition, Monsieur le Maire.',
            'C\'est un honneur de vous servir.',
            'Vos ordres seront exécutés avec la plus grande diligence.'
        ],
        tone: 'formal',
        useEmoticons: false
    },

    [MunicipalRole.MAIRE_ADJOINT]: {
        salutation: {
            morning: 'Monsieur le Maire Adjoint, bonjour et bienvenue.',
            afternoon: 'Monsieur le Maire Adjoint, bon après-midi.',
            evening: 'Monsieur le Maire Adjoint, bonsoir.'
        },
        honorific: 'Monsieur le Maire Adjoint',
        closings: [
            'Je reste à votre disposition.',
            'N\'hésitez pas si vous avez besoin d\'assistance supplémentaire.'
        ],
        tone: 'formal',
        useEmoticons: false
    },

    [MunicipalRole.SECRETAIRE_GENERAL]: {
        salutation: {
            morning: 'Monsieur le Secrétaire Général, bonjour.',
            afternoon: 'Monsieur le Secrétaire Général, bon après-midi.',
            evening: 'Monsieur le Secrétaire Général, bonsoir.'
        },
        honorific: 'Monsieur le Secrétaire Général',
        closings: [
            'À votre service.',
            'Je suis prêt pour vos prochaines instructions.'
        ],
        tone: 'formal',
        useEmoticons: false
    },

    // ========== ENCADREMENT ==========
    [MunicipalRole.CHEF_SERVICE]: {
        salutation: {
            morning: 'Chef, bonjour ! Comment puis-je vous assister ?',
            afternoon: 'Chef, bon après-midi.',
            evening: 'Chef, bonsoir.'
        },
        honorific: 'Chef',
        closings: ['Bonne continuation !', 'À votre service.'],
        tone: 'warm',
        useEmoticons: true
    },

    [MunicipalRole.CHEF_BUREAU]: {
        salutation: {
            morning: 'Bonjour Chef ! Prêt à vous aider.',
            afternoon: 'Bon après-midi Chef.',
            evening: 'Bonsoir Chef.'
        },
        honorific: 'Chef',
        closings: ['Bonne suite !', 'À bientôt.'],
        tone: 'warm',
        useEmoticons: true
    },

    // ========== AGENTS ==========
    [MunicipalRole.AGENT_MUNICIPAL]: {
        salutation: {
            morning: 'Bonjour collègue ! Comment ça va ?',
            afternoon: 'Bon après-midi ! Besoin d\'aide ?',
            evening: 'Bonsoir ! Je suis là si tu as besoin.'
        },
        honorific: 'Collègue',
        closings: ['Bon courage !', 'Bonne continuation.', 'À plus tard !'],
        tone: 'warm',
        useEmoticons: true
    },

    [MunicipalRole.AGENT_ETAT_CIVIL]: {
        salutation: {
            morning: 'Bonjour ! Prêt pour les actes du jour ?',
            afternoon: 'Bon après-midi ! Des actes à préparer ?',
            evening: 'Bonsoir, collègue de l\'état civil !'
        },
        honorific: 'Cher collègue',
        closings: ['Bon travail avec les actes !', 'À ton service.'],
        tone: 'warm',
        useEmoticons: true
    },

    [MunicipalRole.AGENT_TECHNIQUE]: {
        salutation: {
            morning: 'Salut ! Quoi de neuf sur le terrain ?',
            afternoon: 'Ça roule ? Besoin d\'un coup de main ?',
            evening: 'Bonsoir, du travail technique en vue ?'
        },
        honorific: 'L\'ami',
        closings: ['Bon chantier !', 'Force à toi !'],
        tone: 'warm',
        useEmoticons: true
    },

    [MunicipalRole.AGENT_ACCUEIL]: {
        salutation: {
            morning: 'Bonjour ! Beaucoup de monde à l\'accueil aujourd\'hui ?',
            afternoon: 'Bon après-midi ! Comment se passe l\'affluence ?',
            evening: 'Bonsoir ! Journée chargée ?'
        },
        honorific: 'Collègue de l\'accueil',
        closings: ['Bon accueil !', 'Les citoyens ont de la chance de t\'avoir.'],
        tone: 'warm',
        useEmoticons: true
    },

    [MunicipalRole.STAGIAIRE]: {
        salutation: {
            morning: 'Salut jeune padawan ! Prêt à apprendre ?',
            afternoon: 'Hey ! La formation avance bien ?',
            evening: 'Bonsoir ! Fini pour aujourd\'hui ?'
        },
        honorific: 'Jeune talent',
        closings: ['Continue comme ça !', 'Tu progresses bien !', 'Force à toi !'],
        tone: 'warm',
        useEmoticons: true
    },

    // ========== USAGERS ==========
    [MunicipalRole.CITOYEN]: {
        salutation: {
            morning: 'Bonjour cher citoyen ! Bienvenue sur Mairies.ga.',
            afternoon: 'Bon après-midi ! Comment puis-je vous aider aujourd\'hui ?',
            evening: 'Bonsoir ! Je suis là pour vous accompagner.'
        },
        honorific: 'Cher citoyen',
        closings: [
            'N\'hésitez pas si vous avez d\'autres questions.',
            'Je reste à votre disposition.',
            'Bonne journée et à bientôt sur Mairies.ga !'
        ],
        tone: 'warm',
        useEmoticons: true
    },

    [MunicipalRole.CITOYEN_AUTRE_COMMUNE]: {
        salutation: {
            morning: 'Bonjour et bienvenue dans notre commune !',
            afternoon: 'Bon après-midi ! Comment puis-je vous assister ?',
            evening: 'Bonsoir ! Heureux de vous accueillir.'
        },
        honorific: 'Cher visiteur',
        closings: ['Merci de votre visite !', 'À bientôt dans notre commune.'],
        tone: 'warm',
        useEmoticons: true
    },

    [MunicipalRole.ETRANGER_RESIDENT]: {
        salutation: {
            morning: 'Good morning! Welcome / Bonjour et bienvenue !',
            afternoon: 'Good afternoon / Bon après-midi !',
            evening: 'Good evening / Bonsoir !'
        },
        honorific: 'Dear resident',
        closings: [
            'Feel free to ask in French or English. / N\'hésitez pas en français ou anglais.',
            'Welcome to Gabon! / Bienvenue au Gabon !'
        ],
        tone: 'warm',
        useEmoticons: true
    },

    [MunicipalRole.PERSONNE_MORALE]: {
        salutation: {
            morning: 'Bonjour ! Bienvenue sur l\'espace professionnel.',
            afternoon: 'Bon après-midi ! Comment puis-je assister votre organisation ?',
            evening: 'Bonsoir ! Je suis à votre disposition.'
        },
        honorific: 'Cher partenaire',
        closings: [
            'Nous sommes ravis de collaborer avec vous.',
            'Votre satisfaction est notre priorité.'
        ],
        tone: 'warm',
        useEmoticons: false
    },

    // ========== SPECIAL ==========
    ADMIN: {
        salutation: {
            morning: 'Admin connecté. Système opérationnel.',
            afternoon: 'Session admin active.',
            evening: 'Mode admin nocturne.'
        },
        honorific: 'Admin',
        closings: ['Fin de session.', 'Logs enregistrés.'],
        tone: 'technical',
        useEmoticons: false
    },

    ANONYMOUS: {
        salutation: {
            morning: 'Bonjour ! Bienvenue sur Mairies.ga, le portail des mairies du Gabon.',
            afternoon: 'Bon après-midi ! Je suis iAsted, votre assistant municipal.',
            evening: 'Bonsoir ! Comment puis-je vous aider ?'
        },
        honorific: 'Cher visiteur',
        closings: [
            'Créez un compte pour accéder à tous nos services !',
            'N\'hésitez pas à vous inscrire pour une expérience personnalisée.'
        ],
        tone: 'warm',
        useEmoticons: true
    }
};

// ============================================================
// SOCIAL PROTOCOL ADAPTER CLASS
// ============================================================

class SocialProtocolAdapterClass {
    private static instance: SocialProtocolAdapterClass;

    private constructor() {
        console.log('🎭 [SocialProtocolAdapter] Protocole social initialisé');
    }

    public static getInstance(): SocialProtocolAdapterClass {
        if (!SocialProtocolAdapterClass.instance) {
            SocialProtocolAdapterClass.instance = new SocialProtocolAdapterClass();
        }
        return SocialProtocolAdapterClass.instance;
    }

    /**
     * Génère une salutation adaptée au rôle et à l'heure
     */
    public generateSalutation(role: MunicipalRole | 'ANONYMOUS' | 'ADMIN'): string {
        const protocol = PROTOCOL_RULES[role] || PROTOCOL_RULES.ANONYMOUS;
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 12) {
            return protocol.salutation.morning;
        } else if (hour >= 12 && hour < 18) {
            return protocol.salutation.afternoon;
        } else {
            return protocol.salutation.evening;
        }
    }

    /**
     * Récupère le titre honorifique approprié
     */
    public getHonorific(role: MunicipalRole | 'ANONYMOUS' | 'ADMIN'): string {
        const protocol = PROTOCOL_RULES[role] || PROTOCOL_RULES.ANONYMOUS;
        return protocol.honorific;
    }

    /**
     * Génère une formule de conclusion
     */
    public generateClosing(role: MunicipalRole | 'ANONYMOUS' | 'ADMIN'): string {
        const protocol = PROTOCOL_RULES[role] || PROTOCOL_RULES.ANONYMOUS;
        const closings = protocol.closings;
        return closings[Math.floor(Math.random() * closings.length)];
    }

    /**
     * Adapte un message au protocole social
     */
    public adaptMessage(
        message: string,
        role: MunicipalRole | 'ANONYMOUS' | 'ADMIN',
        context: CommunicationContext
    ): string {
        const protocol = PROTOCOL_RULES[role] || PROTOCOL_RULES.ANONYMOUS;

        switch (context) {
            case 'greeting':
                return this.generateSalutation(role);

            case 'confirmation':
                if (protocol.tone === 'formal') {
                    return `${protocol.honorific}, c'est fait. ${message}`;
                }
                return `Parfait ! ${message}`;

            case 'error':
                if (protocol.tone === 'formal') {
                    return `Veuillez m'excuser, ${protocol.honorific}. ${message}`;
                }
                return `Oups, désolé ! ${message}`;

            case 'farewell':
                return this.generateClosing(role);

            case 'request':
            default:
                return message;
        }
    }

    /**
     * Vérifie si les emoticons sont appropriés
     */
    public canUseEmoticons(role: MunicipalRole | 'ANONYMOUS' | 'ADMIN'): boolean {
        const protocol = PROTOCOL_RULES[role] || PROTOCOL_RULES.ANONYMOUS;
        return protocol.useEmoticons;
    }

    /**
     * Récupère le ton approprié
     */
    public getTone(role: MunicipalRole | 'ANONYMOUS' | 'ADMIN'): 'formal' | 'warm' | 'technical' {
        const protocol = PROTOCOL_RULES[role] || PROTOCOL_RULES.ANONYMOUS;
        return protocol.tone;
    }

    /**
     * Génère un message de bienvenue complet
     */
    public generateWelcomeMessage(
        role: MunicipalRole | 'ANONYMOUS' | 'ADMIN',
        userName?: string
    ): string {
        const protocol = PROTOCOL_RULES[role] || PROTOCOL_RULES.ANONYMOUS;
        const salutation = this.generateSalutation(role);

        if (userName && protocol.tone !== 'technical') {
            return salutation.replace(protocol.honorific, `${protocol.honorific} ${userName}`);
        }

        return salutation;
    }

    /**
     * Génère un message de confirmation d'action
     */
    public generateActionConfirmation(
        role: MunicipalRole | 'ANONYMOUS' | 'ADMIN',
        action: string,
        success: boolean
    ): string {
        const protocol = PROTOCOL_RULES[role] || PROTOCOL_RULES.ANONYMOUS;

        if (success) {
            if (protocol.tone === 'formal') {
                return `${protocol.honorific}, j'ai le plaisir de vous confirmer que ${action}.`;
            } else if (protocol.tone === 'technical') {
                return `Action exécutée: ${action}`;
            } else {
                const emoji = protocol.useEmoticons ? ' ✅' : '';
                return `C'est fait ! ${action}${emoji}`;
            }
        } else {
            if (protocol.tone === 'formal') {
                return `Veuillez m'excuser, ${protocol.honorific}. Je n'ai pas pu ${action}. Permettez-moi de réessayer.`;
            } else if (protocol.tone === 'technical') {
                return `Échec: ${action}. Retry recommandé.`;
            } else {
                const emoji = protocol.useEmoticons ? ' 😅' : '';
                return `Désolé, il y a eu un souci avec ${action}.${emoji} Je réessaie ?`;
            }
        }
    }
}

// ============================================================
// EXPORT
// ============================================================

export const SocialProtocolAdapter = SocialProtocolAdapterClass.getInstance();
export type { SocialProtocolAdapterClass };
