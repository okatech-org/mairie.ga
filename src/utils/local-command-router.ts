/**
 * iAsted Local Command Router
 * 
 * Intercepte les commandes vocales simples et les exécute localement
 * sans passer par l'API OpenAI, économisant ~40-60% des coûts.
 * 
 * Pattern: commande vocale → match local → action immédiate (0 coût)
 *          commande vocale → pas de match → API OpenAI (payant)
 */

export interface LocalCommandResult {
    matched: boolean;
    action?: string;
    toolName?: string;
    toolArgs?: Record<string, any>;
    response?: string;
}

// Normalize text for matching (lowercase, remove accents, trim)
const normalize = (text: string): string => {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .trim();
};

// Command patterns with their actions
const COMMAND_PATTERNS: Array<{
    patterns: RegExp[];
    toolName: string;
    toolArgs?: Record<string, any>;
    response: string;
}> = [
        // ========== THÈME ==========
        {
            patterns: [
                /mode\s*sombre/,
                /theme\s*sombre/,
                /dark\s*mode/,
                /passe\s*(en\s*)?sombre/,
                /active\s*(le\s*)?mode\s*sombre/,
                /mets\s*(le\s*)?mode\s*sombre/,
            ],
            toolName: 'control_ui',
            toolArgs: { action: 'set_theme_dark' },
            response: 'Mode sombre activé.'
        },
        {
            patterns: [
                /mode\s*clair/,
                /theme\s*clair/,
                /light\s*mode/,
                /passe\s*(en\s*)?clair/,
                /active\s*(le\s*)?mode\s*clair/,
                /mets\s*(le\s*)?mode\s*clair/,
            ],
            toolName: 'control_ui',
            toolArgs: { action: 'set_theme_light' },
            response: 'Mode clair activé.'
        },
        {
            patterns: [
                /change\s*(le\s*)?theme/,
                /bascule\s*(le\s*)?theme/,
                /toggle\s*theme/,
            ],
            toolName: 'control_ui',
            toolArgs: { action: 'toggle_theme' },
            response: 'Thème changé.'
        },

        // ========== NAVIGATION PRINCIPALE ==========
        {
            patterns: [
                /mes\s*documents/,
                /ouvre\s*(mes\s*)?documents/,
                /va\s*(aux|a\s*mes)\s*documents/,
                /affiche\s*(mes\s*)?documents/,
            ],
            toolName: 'global_navigate',
            toolArgs: { query: 'documents' },
            response: 'Navigation vers vos documents.'
        },
        {
            patterns: [
                /mes\s*demandes/,
                /ouvre\s*(mes\s*)?demandes/,
                /va\s*(aux|a\s*mes)\s*demandes/,
                /suivi\s*(de\s*mes\s*)?demandes/,
            ],
            toolName: 'global_navigate',
            toolArgs: { query: 'demandes' },
            response: 'Navigation vers vos demandes.'
        },
        {
            patterns: [
                /tableau\s*de\s*bord/,
                /dashboard/,
                /accueil/,
                /page\s*principale/,
                /va\s*(a\s*l\s*)?accueil/,
            ],
            toolName: 'global_navigate',
            toolArgs: { query: 'tableau de bord' },
            response: 'Navigation vers le tableau de bord.'
        },
        {
            patterns: [
                /page\s*d\s*accueil/,
                /va\s*a\s*l\s*accueil/,
                /retour\s*accueil/,
            ],
            toolName: 'global_navigate',
            toolArgs: { query: 'accueil' },
            response: 'Retour à la page d\'accueil.'
        },
        {
            patterns: [
                /parametres/,
                /reglages/,
                /settings/,
                /ouvre\s*(les\s*)?parametres/,
            ],
            toolName: 'global_navigate',
            toolArgs: { query: 'parametres' },
            response: 'Navigation vers les paramètres.'
        },
        {
            patterns: [
                /messagerie/,
                /iboite/,
                /messages/,
                /courrier/,
                /ouvre\s*(la\s*)?messagerie/,
                /ouvre\s*(mes\s*)?messages/,
            ],
            toolName: 'global_navigate',
            toolArgs: { query: 'messagerie' },
            response: 'Navigation vers la messagerie.'
        },
        {
            patterns: [
                /services/,
                /catalogue/,
                /liste\s*des\s*services/,
                /ouvre\s*(les\s*)?services/,
            ],
            toolName: 'global_navigate',
            toolArgs: { query: 'services' },
            response: 'Navigation vers les services.'
        },

        // ========== CHAT ==========
        {
            patterns: [
                /ouvre\s*(le\s*)?chat/,
                /affiche\s*(le\s*)?chat/,
                /montre\s*(le\s*)?chat/,
            ],
            toolName: 'manage_chat',
            toolArgs: { action: 'open' },
            response: 'Chat ouvert.'
        },
        {
            patterns: [
                /ferme\s*(le\s*)?chat/,
                /cache\s*(le\s*)?chat/,
                /masque\s*(le\s*)?chat/,
            ],
            toolName: 'manage_chat',
            toolArgs: { action: 'close' },
            response: 'Chat fermé.'
        },
        {
            patterns: [
                /efface\s*(la\s*)?conversation/,
                /nouvelle\s*conversation/,
                /recommence/,
                /clear\s*chat/,
            ],
            toolName: 'manage_chat',
            toolArgs: { action: 'clear' },
            response: 'Conversation effacée.'
        },

        // ========== VOIX ==========
        {
            patterns: [
                /change\s*(de\s*)?voix/,
                /autre\s*voix/,
                /voix\s*differente/,
            ],
            toolName: 'change_voice',
            toolArgs: {},
            response: 'Voix changée.'
        },
        {
            patterns: [
                /voix\s*feminine/,
                /voix\s*femme/,
                /voix\s*de\s*femme/,
            ],
            toolName: 'change_voice',
            toolArgs: { voice_id: 'shimmer' },
            response: 'Voix féminine activée.'
        },
        {
            patterns: [
                /voix\s*masculine/,
                /voix\s*homme/,
                /voix\s*d\s*homme/,
            ],
            toolName: 'change_voice',
            toolArgs: { voice_id: 'ash' },
            response: 'Voix masculine activée.'
        },

        // ========== ARRÊT ==========
        {
            patterns: [
                /^stop$/,
                /^arrete$/,
                /arrete\s*toi/,
                /^au\s*revoir$/,
                /^bye$/,
                /ferme\s*toi/,
                /desactive\s*toi/,
                /^silence$/,
                /tais\s*toi/,
            ],
            toolName: 'stop_conversation',
            toolArgs: {},
            response: 'Au revoir !'
        },

        // ========== DÉCONNEXION ==========
        {
            patterns: [
                /deconnexion/,
                /deconnecte\s*moi/,
                /logout/,
                /log\s*out/,
            ],
            toolName: 'logout_user',
            toolArgs: {},
            response: 'Déconnexion en cours...'
        },

        // ========== SIDEBAR ==========
        {
            patterns: [
                /ouvre\s*(le\s*)?menu/,
                /deplie\s*(le\s*)?menu/,
                /affiche\s*(le\s*)?menu/,
                /montre\s*(le\s*)?menu\s*lateral/,
            ],
            toolName: 'control_ui',
            toolArgs: { action: 'toggle_sidebar' },
            response: 'Menu ouvert.'
        },
        {
            patterns: [
                /ferme\s*(le\s*)?menu/,
                /cache\s*(le\s*)?menu/,
                /replie\s*(le\s*)?menu/,
            ],
            toolName: 'control_ui',
            toolArgs: { action: 'toggle_sidebar' },
            response: 'Menu fermé.'
        },

        // ========== PRÉSENTATION ==========
        {
            patterns: [
                /lance\s*(la\s*)?presentation/,
                /demarre\s*(la\s*)?presentation/,
                /mode\s*presentation/,
                /presente\s*moi\s*(le\s*site|l\s*application)?/,
            ],
            toolName: 'start_presentation',
            toolArgs: {},
            response: 'Mode présentation activé.'
        },
        {
            patterns: [
                /arrete\s*(la\s*)?presentation/,
                /stop\s*presentation/,
                /quitte\s*(la\s*)?presentation/,
            ],
            toolName: 'stop_presentation',
            toolArgs: {},
            response: 'Présentation arrêtée.'
        },

        // ========== GUIDE ==========
        {
            patterns: [
                /guide\s*moi/,
                /aide\s*moi/,
                /comment\s*ca\s*marche/,
                /montre\s*moi\s*comment/,
                /explique\s*moi/,
            ],
            toolName: 'start_guide',
            toolArgs: {},
            response: 'Mode guide activé. Je vais vous accompagner.'
        },
        {
            patterns: [
                /c\s*est\s*quoi\s*(cette\s*page|ici)/,
                /a\s*quoi\s*sert\s*cette\s*page/,
                /ou\s*suis\s*je/,
                /qu\s*est\s*ce\s*que\s*je\s*vois/,
            ],
            toolName: 'explain_context',
            toolArgs: {},
            response: 'Je vais vous expliquer cette page.'
        },
    ];

/**
 * Match une commande vocale avec les patterns locaux
 * @param transcript - Le texte transcrit de la commande vocale
 * @returns Le résultat du matching (matched: true si trouvé)
 */
export function matchLocalCommand(transcript: string): LocalCommandResult {
    const normalized = normalize(transcript);

    console.log(`🔍 [LocalRouter] Checking: "${transcript}" → normalized: "${normalized}"`);

    for (const cmd of COMMAND_PATTERNS) {
        for (const pattern of cmd.patterns) {
            if (pattern.test(normalized)) {
                console.log(`✅ [LocalRouter] MATCH: "${normalized}" → ${cmd.toolName}`);
                return {
                    matched: true,
                    action: cmd.toolName,
                    toolName: cmd.toolName,
                    toolArgs: cmd.toolArgs || {},
                    response: cmd.response
                };
            }
        }
    }

    console.log(`❌ [LocalRouter] No match for: "${normalized}" → forwarding to API`);
    return { matched: false };
}

/**
 * Vérifie si une commande peut être traitée localement
 * @param transcript - Le texte transcrit
 * @returns true si la commande peut être traitée sans API
 */
export function canHandleLocally(transcript: string): boolean {
    return matchLocalCommand(transcript).matched;
}

/**
 * Statistiques de matching (pour debug/analytics)
 */
export function getLocalCommandStats() {
    return {
        totalPatterns: COMMAND_PATTERNS.length,
        categories: {
            theme: COMMAND_PATTERNS.filter(c => c.toolName === 'control_ui').length,
            navigation: COMMAND_PATTERNS.filter(c => c.toolName === 'global_navigate').length,
            chat: COMMAND_PATTERNS.filter(c => c.toolName === 'manage_chat').length,
            voice: COMMAND_PATTERNS.filter(c => c.toolName === 'change_voice').length,
            other: COMMAND_PATTERNS.filter(c =>
                !['control_ui', 'global_navigate', 'manage_chat', 'change_voice'].includes(c.toolName)
            ).length
        }
    };
}
