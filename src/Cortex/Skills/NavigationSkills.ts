/**
 * CORTEX - SKILLS: NavigationSkills
 * 
 * Compétences cognitives de navigation d'iAsted.
 * Ces neurones gèrent la navigation dans l'application:
 * - Navigation globale (changement de page)
 * - Scroll et focus
 * - Gestion des conversations
 * - Contrôle de l'interface
 * 
 * RÈGLE CRUCIALE: Ces skills ne s'exécutent jamais seuls.
 * Ils doivent recevoir un Signal d'Activation signé par iAstedSoul.
 */

import { iAstedSoul, SoulState, ContextMemory } from '@/Consciousness';

// ============================================================
// TYPES
// ============================================================

export interface SkillActivationSignal {
    skillName: string;
    activatedBy: 'voice' | 'text' | 'click' | 'context' | 'system';
    soulState: SoulState;
    timestamp: Date;
    priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface SkillResult<T = unknown> {
    success: boolean;
    skillName: string;
    data?: T;
    error?: string;
    executionTime: number;
    vocalFeedback: string;
}

export interface NavigationTarget {
    path: string;
    label: string;
    section?: string;     // Section spécifique sur la page
    elementId?: string;   // Élément à focus
}

export interface ScrollTarget {
    elementId?: string;
    position?: ScrollLogicalPosition;  // 'start' | 'center' | 'end' | 'nearest'
    offset?: number;
}

// ============================================================
// NAVIGATION MAP - Cartographie de l'application
// ============================================================

const NAVIGATION_MAP: Record<string, NavigationTarget> = {
    // Pages principales
    'accueil': { path: '/', label: 'Accueil' },
    'tableau_de_bord': { path: '/dashboard/citizen', label: 'Tableau de bord' },
    'dashboard': { path: '/dashboard/citizen', label: 'Tableau de bord' },

    // Citoyen
    'mes_demandes': { path: '/dashboard/citizen/requests', label: 'Mes demandes' },
    'mes_documents': { path: '/dashboard/citizen/documents', label: 'Mes documents' },
    'mon_cv': { path: '/dashboard/citizen/cv', label: 'Mon CV' },
    'associations': { path: '/dashboard/citizen/associations', label: 'Associations' },
    'entreprises': { path: '/dashboard/citizen/companies', label: 'Entreprises' },

    // Services
    'services': { path: '/dashboard/services', label: 'Services' },
    'catalogue_services': { path: '/services', label: 'Catalogue des services' },

    // État Civil
    'etat_civil': { path: '/dashboard/services', section: 'etat-civil', label: 'État civil' },
    'acte_naissance': { path: '/dashboard/services', section: 'acte-naissance', label: 'Acte de naissance' },
    'acte_mariage': { path: '/dashboard/services', section: 'acte-mariage', label: 'Acte de mariage' },

    // Administratif
    'urbanisme': { path: '/dashboard/services', section: 'urbanisme', label: 'Urbanisme' },
    'fiscalite': { path: '/dashboard/services', section: 'fiscalite', label: 'Fiscalité' },

    // Communication
    'iboite': { path: '/iboite', label: 'iBoîte - Messagerie' },
    'messagerie': { path: '/iboite', label: 'Messagerie' },

    // Réglages
    'parametres': { path: '/dashboard/citizen/settings', label: 'Paramètres' },
    'profil': { path: '/dashboard/citizen/settings', section: 'profil', label: 'Profil' },

    // Auth
    'connexion': { path: '/login', label: 'Connexion' },
    'inscription': { path: '/register', label: 'Inscription' },
    'deconnexion': { path: '/logout', label: 'Déconnexion' },

    // Maire
    'agenda_maire': { path: '/dashboard/maire/agenda', label: 'Agenda du Maire' },
    'budget': { path: '/dashboard/maire/budget', label: 'Budget' },
    'deliberations': { path: '/dashboard/maire/deliberations', label: 'Délibérations' },
    'arretes': { path: '/dashboard/maire/arretes', label: 'Arrêtés' },
    'analytics': { path: '/dashboard/maire/analytics', label: 'Statistiques' }
};

// ============================================================
// BASE SKILL CLASS
// ============================================================

abstract class BaseSkill {
    protected soulState: SoulState | null = null;

    protected validateActivation(signal: SkillActivationSignal): boolean {
        if (!signal.soulState.isAwake) {
            console.warn(`⚠️ [${signal.skillName}] Rejeté: iAsted n'est pas éveillé`);
            return false;
        }
        this.soulState = signal.soulState;
        console.log(`🔓 [${signal.skillName}] Activé par ${signal.activatedBy}`);
        return true;
    }

    protected generateVocalFeedback(action: string, success: boolean): string {
        const soul = iAstedSoul.getState();

        if (success) {
            return iAstedSoul.generateActionConfirmation(action);
        } else {
            if (soul.persona.formalityLevel === 3) {
                return `Veuillez m'excuser, je n'ai pas pu ${action}.`;
            }
            return `Désolé, il y a eu un souci avec ${action}.`;
        }
    }
}

// ============================================================
// NAVIGATION SKILLS
// ============================================================

class NavigationSkillsClass extends BaseSkill {
    private static instance: NavigationSkillsClass;
    private navigationCallback: ((path: string) => void) | null = null;

    private constructor() {
        super();
        console.log('🧭 [NavigationSkills] Compétences de navigation chargées');
    }

    public static getInstance(): NavigationSkillsClass {
        if (!NavigationSkillsClass.instance) {
            NavigationSkillsClass.instance = new NavigationSkillsClass();
        }
        return NavigationSkillsClass.instance;
    }

    /**
     * Configure le callback de navigation (à appeler depuis le Router React)
     */
    public setNavigationCallback(callback: (path: string) => void): void {
        this.navigationCallback = callback;
        console.log('🔗 [NavigationSkills] Callback de navigation configuré');
    }

    // ========== NAVIGATION GLOBALE ==========

    /**
     * Navigue vers une page par son nom ou son chemin
     */
    public async navigateTo(
        signal: SkillActivationSignal,
        target: string
    ): Promise<SkillResult<NavigationTarget>> {
        const startTime = Date.now();

        if (!this.validateActivation(signal)) {
            return {
                success: false,
                skillName: 'NavigateTo',
                error: 'Activation non autorisée',
                executionTime: Date.now() - startTime,
                vocalFeedback: ''
            };
        }

        // Chercher dans la map de navigation
        const normalizedTarget = target.toLowerCase()
            .replace(/\s+/g, '_')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        const navTarget = NAVIGATION_MAP[normalizedTarget];

        if (!navTarget) {
            // Essayer de trouver une correspondance partielle
            const partialMatch = Object.entries(NAVIGATION_MAP)
                .find(([key, value]) =>
                    key.includes(normalizedTarget) ||
                    value.label.toLowerCase().includes(target.toLowerCase())
                );

            if (!partialMatch) {
                return {
                    success: false,
                    skillName: 'NavigateTo',
                    error: `Page "${target}" non trouvée`,
                    executionTime: Date.now() - startTime,
                    vocalFeedback: `Je ne connais pas la page "${target}". Pouvez-vous préciser ?`
                };
            }

            return this.performNavigation(partialMatch[1], startTime);
        }

        return this.performNavigation(navTarget, startTime);
    }

    private async performNavigation(
        target: NavigationTarget,
        startTime: number
    ): Promise<SkillResult<NavigationTarget>> {
        try {
            iAstedSoul.setProcessing(true);
            iAstedSoul.queueAction(`Navigation vers ${target.label}`);

            console.log(`🧭 [NavigateTo] ${target.path} (${target.label})`);

            // Mise à jour de la conscience spatiale
            iAstedSoul.updateSpatialAwareness({
                currentUrl: target.path,
                currentPage: target.label
            });

            // Effectuer la navigation
            if (this.navigationCallback) {
                this.navigationCallback(target.path);
            } else if (typeof window !== 'undefined') {
                window.location.href = target.path;
            }

            iAstedSoul.completeAction(`Navigation vers ${target.label}`);
            iAstedSoul.setProcessing(false);

            const soul = iAstedSoul.getState();
            let feedback: string;

            if (soul.persona.formalityLevel === 3) {
                feedback = `${soul.persona.honorificPrefix}, nous voici sur la page ${target.label}.`;
            } else {
                feedback = `C'est parti ! Voici la page ${target.label}.`;
            }

            return {
                success: true,
                skillName: 'NavigateTo',
                data: target,
                executionTime: Date.now() - startTime,
                vocalFeedback: feedback
            };

        } catch (error) {
            iAstedSoul.setProcessing(false);
            return {
                success: false,
                skillName: 'NavigateTo',
                error: error instanceof Error ? error.message : 'Erreur de navigation',
                executionTime: Date.now() - startTime,
                vocalFeedback: this.generateVocalFeedback('naviguer', false)
            };
        }
    }

    /**
     * Retourne à la page précédente
     */
    public async goBack(
        signal: SkillActivationSignal
    ): Promise<SkillResult> {
        const startTime = Date.now();

        if (!this.validateActivation(signal)) {
            return {
                success: false,
                skillName: 'GoBack',
                error: 'Activation non autorisée',
                executionTime: Date.now() - startTime,
                vocalFeedback: ''
            };
        }

        console.log('◀️ [GoBack] Retour en arrière');

        if (typeof window !== 'undefined') {
            window.history.back();
        }

        return {
            success: true,
            skillName: 'GoBack',
            executionTime: Date.now() - startTime,
            vocalFeedback: 'Retour à la page précédente.'
        };
    }

    // ========== SCROLL & FOCUS ==========

    /**
     * Fait défiler vers un élément ou une position
     */
    public async scrollTo(
        signal: SkillActivationSignal,
        target: ScrollTarget
    ): Promise<SkillResult> {
        const startTime = Date.now();

        if (!this.validateActivation(signal)) {
            return {
                success: false,
                skillName: 'ScrollTo',
                error: 'Activation non autorisée',
                executionTime: Date.now() - startTime,
                vocalFeedback: ''
            };
        }

        if (typeof document === 'undefined') {
            return {
                success: false,
                skillName: 'ScrollTo',
                error: 'Document non disponible',
                executionTime: Date.now() - startTime,
                vocalFeedback: ''
            };
        }

        try {
            if (target.elementId) {
                const element = document.getElementById(target.elementId);
                if (element) {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: target.position || 'center'
                    });
                    console.log(`📜 [ScrollTo] Element: ${target.elementId}`);
                } else {
                    return {
                        success: false,
                        skillName: 'ScrollTo',
                        error: `Élément #${target.elementId} non trouvé`,
                        executionTime: Date.now() - startTime,
                        vocalFeedback: `Je ne trouve pas l'élément ${target.elementId}.`
                    };
                }
            } else {
                window.scrollTo({
                    top: target.offset || 0,
                    behavior: 'smooth'
                });
            }

            return {
                success: true,
                skillName: 'ScrollTo',
                executionTime: Date.now() - startTime,
                vocalFeedback: '' // Pas de feedback vocal pour le scroll
            };

        } catch (error) {
            return {
                success: false,
                skillName: 'ScrollTo',
                error: error instanceof Error ? error.message : 'Erreur de scroll',
                executionTime: Date.now() - startTime,
                vocalFeedback: ''
            };
        }
    }

    /**
     * Met le focus sur un élément
     */
    public async focusElement(
        signal: SkillActivationSignal,
        elementId: string
    ): Promise<SkillResult> {
        const startTime = Date.now();

        if (!this.validateActivation(signal)) {
            return {
                success: false,
                skillName: 'FocusElement',
                error: 'Activation non autorisée',
                executionTime: Date.now() - startTime,
                vocalFeedback: ''
            };
        }

        if (typeof document === 'undefined') {
            return {
                success: false,
                skillName: 'FocusElement',
                error: 'Document non disponible',
                executionTime: Date.now() - startTime,
                vocalFeedback: ''
            };
        }

        const element = document.getElementById(elementId) as HTMLElement;
        if (element && typeof element.focus === 'function') {
            element.focus();
            iAstedSoul.updateSpatialAwareness({ focusedElement: elementId });
            console.log(`🎯 [FocusElement] ${elementId}`);

            return {
                success: true,
                skillName: 'FocusElement',
                executionTime: Date.now() - startTime,
                vocalFeedback: ''
            };
        }

        return {
            success: false,
            skillName: 'FocusElement',
            error: `Élément #${elementId} non trouvé ou non focusable`,
            executionTime: Date.now() - startTime,
            vocalFeedback: ''
        };
    }

    // ========== CONVERSATION ==========

    /**
     * Arrête la conversation avec iAsted
     */
    public async stopConversation(
        signal: SkillActivationSignal
    ): Promise<SkillResult> {
        const startTime = Date.now();

        if (!this.validateActivation(signal)) {
            return {
                success: false,
                skillName: 'StopConversation',
                error: 'Activation non autorisée',
                executionTime: Date.now() - startTime,
                vocalFeedback: ''
            };
        }

        console.log('👋 [StopConversation] Fin de conversation');

        // Arrêter l'écoute et la parole
        iAstedSoul.stopListening();
        iAstedSoul.stopSpeaking();

        // Générer le message de fin approprié
        const soul = iAstedSoul.getState();
        let farewell: string;

        if (soul.persona.formalityLevel === 3) {
            farewell = `${soul.persona.honorificPrefix}, ce fut un honneur de vous assister. Je reste à votre disposition.`;
        } else if (soul.persona.formalityLevel === 2) {
            farewell = 'À bientôt ! N\'hésitez pas si vous avez besoin de moi.';
        } else {
            farewell = 'Session terminée.';
        }

        // Endormir iAsted
        iAstedSoul.sleep();

        return {
            success: true,
            skillName: 'StopConversation',
            executionTime: Date.now() - startTime,
            vocalFeedback: farewell
        };
    }

    /**
     * Réinitialise la conversation (nouveau contexte)
     */
    public async resetConversation(
        signal: SkillActivationSignal
    ): Promise<SkillResult> {
        const startTime = Date.now();

        if (!this.validateActivation(signal)) {
            return {
                success: false,
                skillName: 'ResetConversation',
                error: 'Activation non autorisée',
                executionTime: Date.now() - startTime,
                vocalFeedback: ''
            };
        }

        console.log('🔄 [ResetConversation] Réinitialisation');

        // Reset la mémoire
        ContextMemory.reset();

        return {
            success: true,
            skillName: 'ResetConversation',
            executionTime: Date.now() - startTime,
            vocalFeedback: 'Conversation réinitialisée. Comment puis-je vous aider ?'
        };
    }

    // ========== AIDE & EXPLORATION ==========

    /**
     * Liste les pages disponibles
     */
    public getAvailablePages(): NavigationTarget[] {
        return Object.values(NAVIGATION_MAP);
    }

    /**
     * Recherche une page par mot-clé
     */
    public searchPages(query: string): NavigationTarget[] {
        const normalized = query.toLowerCase();
        return Object.entries(NAVIGATION_MAP)
            .filter(([key, value]) =>
                key.includes(normalized) ||
                value.label.toLowerCase().includes(normalized)
            )
            .map(([, value]) => value);
    }

    /**
     * Fournit de l'aide sur la navigation
     */
    public async provideNavigationHelp(
        signal: SkillActivationSignal
    ): Promise<SkillResult<string[]>> {
        const startTime = Date.now();

        if (!this.validateActivation(signal)) {
            return {
                success: false,
                skillName: 'ProvideNavigationHelp',
                error: 'Activation non autorisée',
                executionTime: Date.now() - startTime,
                vocalFeedback: ''
            };
        }

        const pages = this.getAvailablePages().map(p => p.label);

        return {
            success: true,
            skillName: 'ProvideNavigationHelp',
            data: pages,
            executionTime: Date.now() - startTime,
            vocalFeedback: `Je peux vous emmener vers : ${pages.slice(0, 5).join(', ')}... et bien d'autres. Où souhaitez-vous aller ?`
        };
    }
}

// ============================================================
// EXPORT
// ============================================================

export const NavigationSkills = NavigationSkillsClass.getInstance();
export type { NavigationSkillsClass };
