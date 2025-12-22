/**
 * iAsted Local Command Router v2.0
 * 
 * Système de routage intelligent des commandes vocales :
 * - Matching par regex pour les commandes exactes
 * - Matching par mots-clés pour une reconnaissance plus flexible
 * - Matching par similarité pour les commandes approximatives
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
    confidence?: number; // 0-1, higher is better
}

// Normalize text for matching (lowercase, remove accents, trim, remove punctuation)
const normalize = (text: string): string => {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[.,!?;:'"()]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
};

// Simple Levenshtein distance for fuzzy matching
const levenshteinDistance = (a: string, b: string): number => {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

// Calculate similarity ratio (0-1)
const similarity = (a: string, b: string): number => {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    return 1 - levenshteinDistance(a, b) / maxLen;
};

// Check if text contains all required keywords
const containsKeywords = (text: string, keywords: string[]): boolean => {
    return keywords.every(kw => text.includes(kw));
};

// Check if text contains any of the keywords
const containsAnyKeyword = (text: string, keywords: string[]): boolean => {
    return keywords.some(kw => text.includes(kw));
};

interface CommandDef {
    // Regex patterns for exact matching (highest priority)
    patterns?: RegExp[];
    // Required keywords that must all be present (medium priority)
    requiredKeywords?: string[];
    // Any of these keywords + any action keyword (lower priority)
    anyKeywords?: string[];
    // Action keywords that indicate intent
    actionKeywords?: string[];
    // Exact phrases for fuzzy matching
    exactPhrases?: string[];
    // Tool to execute
    toolName: string;
    toolArgs?: Record<string, any>;
    response: string;
}

// Command definitions with multiple matching strategies
const COMMAND_DEFINITIONS: CommandDef[] = [
    // ========== OUVRIR LE CHAT ==========
    {
        patterns: [
            /ouvre\s*(le\s*|la\s*)?chat/,
            /ouvre\s*(la\s*)?fenetre\s*(de|du)\s*chat/,
            /affiche\s*(le\s*|la\s*)?chat/,
            /affiche\s*(la\s*)?fenetre\s*(de|du)\s*chat/,
            /montre\s*(le\s*|la\s*)?chat/,
            /montre\s*(la\s*)?fenetre\s*(de|du)\s*chat/,
            /ouvre\s*(la\s*)?conversation/,
            /lance\s*(le\s*)?chat/,
            /demarre\s*(le\s*)?chat/,
            /ouvrir\s*(le\s*|la\s*)?chat/,
            /ouvrir\s*(la\s*)?fenetre/,
            /parler\s*(par\s*)?(ecrit|texte)/,
            /mode\s*texte/,
            /mode\s*ecrit/,
        ],
        requiredKeywords: ['ouvr', 'chat'],
        anyKeywords: ['chat', 'fenetre', 'conversation', 'texte', 'ecrit'],
        actionKeywords: ['ouvre', 'ouvrir', 'affiche', 'montre', 'lance', 'demarre'],
        exactPhrases: [
            'ouvre le chat',
            'ouvre la fenetre du chat',
            'ouvre la fenetre de chat',
            'affiche le chat',
            'montre le chat',
            'mode texte'
        ],
        toolName: 'manage_chat',
        toolArgs: { action: 'open' },
        response: 'Chat ouvert.'
    },

    // ========== FERMER LE CHAT ==========
    {
        patterns: [
            /ferme\s*(le\s*|la\s*)?chat/,
            /ferme\s*(la\s*)?fenetre\s*(de|du)?\s*chat/,
            /ferme\s*(la\s*)?fenetre/,
            /cache\s*(le\s*|la\s*)?chat/,
            /masque\s*(le\s*)?chat/,
            /quitte\s*(le\s*)?chat/,
            /fermer\s*(le\s*|la\s*)?chat/,
            /fermer\s*(la\s*)?fenetre/,
            /sort\s*(du\s*)?chat/,
            /sors\s*(du\s*)?chat/,
        ],
        requiredKeywords: ['ferm', 'chat'],
        anyKeywords: ['chat', 'fenetre', 'conversation'],
        actionKeywords: ['ferme', 'fermer', 'cache', 'masque', 'quitte', 'quitter', 'sort', 'sors'],
        exactPhrases: [
            'ferme le chat',
            'ferme la fenetre',
            'ferme la fenetre du chat',
            'cache le chat',
            'quitte le chat'
        ],
        toolName: 'manage_chat',
        toolArgs: { action: 'close' },
        response: 'Chat fermé.'
    },

    // ========== EFFACER LA CONVERSATION ==========
    {
        patterns: [
            /efface\s*(la\s*)?conversation/,
            /nouvelle\s*conversation/,
            /recommence/,
            /clear\s*chat/,
            /efface\s*(l\s*)?historique/,
            /supprime\s*(la\s*)?conversation/,
            /nettoie\s*(le\s*)?chat/,
        ],
        requiredKeywords: ['effac', 'conversation'],
        exactPhrases: [
            'efface la conversation',
            'nouvelle conversation',
            'recommence',
            'effacer historique'
        ],
        toolName: 'manage_chat',
        toolArgs: { action: 'clear' },
        response: 'Conversation effacée.'
    },

    // ========== THÈME SOMBRE ==========
    {
        patterns: [
            /mode\s*sombre/,
            /theme\s*sombre/,
            /dark\s*mode/,
            /passe\s*(en\s*)?sombre/,
            /active\s*(le\s*)?mode\s*sombre/,
            /mets\s*(le\s*)?mode\s*sombre/,
            /theme\s*noir/,
            /mode\s*noir/,
            /mode\s*nuit/,
        ],
        requiredKeywords: ['mode', 'sombre'],
        anyKeywords: ['sombre', 'noir', 'dark', 'nuit'],
        actionKeywords: ['mode', 'theme', 'passe', 'active', 'mets'],
        exactPhrases: ['mode sombre', 'theme sombre', 'dark mode'],
        toolName: 'control_ui',
        toolArgs: { action: 'set_theme_dark' },
        response: 'Mode sombre activé.'
    },

    // ========== THÈME CLAIR ==========
    {
        patterns: [
            /mode\s*clair/,
            /theme\s*clair/,
            /light\s*mode/,
            /passe\s*(en\s*)?clair/,
            /active\s*(le\s*)?mode\s*clair/,
            /mets\s*(le\s*)?mode\s*clair/,
            /mode\s*jour/,
        ],
        requiredKeywords: ['mode', 'clair'],
        anyKeywords: ['clair', 'light', 'jour', 'blanc'],
        actionKeywords: ['mode', 'theme', 'passe', 'active', 'mets'],
        exactPhrases: ['mode clair', 'theme clair', 'light mode'],
        toolName: 'control_ui',
        toolArgs: { action: 'set_theme_light' },
        response: 'Mode clair activé.'
    },

    // ========== TOGGLE THÈME ==========
    {
        patterns: [
            /change\s*(le\s*)?theme/,
            /bascule\s*(le\s*)?theme/,
            /toggle\s*theme/,
            /inverse\s*(le\s*)?theme/,
        ],
        toolName: 'control_ui',
        toolArgs: { action: 'toggle_theme' },
        response: 'Thème changé.'
    },

    // ========== NAVIGATION - DOCUMENTS ==========
    {
        patterns: [
            /mes\s*documents/,
            /ouvre\s*(mes\s*)?documents/,
            /va\s*(aux|a\s*mes)\s*documents/,
            /affiche\s*(mes\s*)?documents/,
            /voir\s*(mes\s*)?documents/,
            /montre\s*(mes\s*)?documents/,
        ],
        requiredKeywords: ['document'],
        toolName: 'global_navigate',
        toolArgs: { query: 'documents' },
        response: 'Navigation vers vos documents.'
    },

    // ========== NAVIGATION - DEMANDES ==========
    // Ne matcher que les patterns explicites de navigation vers les demandes
    {
        patterns: [
            /^mes\s*demandes$/,
            /ouvre\s*(mes\s*)?demandes/,
            /va\s*(aux|a\s*mes)\s*demandes/,
            /suivi\s*(de\s*mes\s*)?(demandes|dossiers)/,
            /voir\s*(mes\s*)?demandes/,
            /consulte\s*(mes\s*)?demandes/,
        ],
        // Pas de requiredKeywords car "demandé" peut apparaître dans d'autres contextes
        exactPhrases: [
            'mes demandes',
            'ouvre mes demandes',
            'suivi des demandes'
        ],
        toolName: 'global_navigate',
        toolArgs: { query: 'demandes' },
        response: 'Navigation vers vos demandes.'
    },

    // ========== NAVIGATION - TABLEAU DE BORD ==========
    {
        patterns: [
            /tableau\s*de\s*bord/,
            /dashboard/,
            /accueil/,
            /page\s*principale/,
            /va\s*(a\s*l\s*)?accueil/,
        ],
        anyKeywords: ['tableau', 'bord', 'dashboard', 'accueil'],
        toolName: 'global_navigate',
        toolArgs: { query: 'tableau de bord' },
        response: 'Navigation vers le tableau de bord.'
    },

    // ========== NAVIGATION - SECTIONS MAIRE (Navigations spécifiques) ==========
    // Ces navigations utilisent global_navigate qui résoudra la route selon le contexte du rôle
    {
        patterns: [
            /budget/,
            /finances/,
            /gestion\s*budgetaire/,
            /va\s*(au|a\s*la\s*section)?\s*budget/,
            /ouvre\s*(le\s*)?budget/,
            /section\s*budget/,
        ],
        anyKeywords: ['budget', 'finances', 'tresorerie'],
        toolName: 'global_navigate',
        toolArgs: { query: 'budget' },
        response: 'Navigation vers le budget.'
    },
    {
        patterns: [
            /deliberations?/,
            /conseil\s*municipal/,
            /seances?/,
            /votes?/,
        ],
        anyKeywords: ['deliberation', 'conseil', 'seance'],
        toolName: 'global_navigate',
        toolArgs: { query: 'délibérations' },
        response: 'Navigation vers les délibérations.'
    },
    {
        patterns: [
            /arretes?\s*(municipaux)?/,
            /decrets?/,
            /ordonnances?/,
        ],
        anyKeywords: ['arrete', 'decret', 'ordonnance'],
        toolName: 'global_navigate',
        toolArgs: { query: 'arrêtés' },
        response: 'Navigation vers les arrêtés.'
    },
    {
        patterns: [
            /urbanisme/,
            /permis\s*(de\s*)?construire/,
            /construction/,
            /amenagement/,
        ],
        anyKeywords: ['urbanisme', 'permis', 'construction'],
        toolName: 'global_navigate',
        toolArgs: { query: 'urbanisme' },
        response: 'Navigation vers l\'urbanisme.'
    },
    {
        patterns: [
            /agenda/,
            /calendrier/,
            /planning/,
            /emploi\s*du\s*temps/,
        ],
        anyKeywords: ['agenda', 'calendrier', 'planning'],
        toolName: 'global_navigate',
        toolArgs: { query: 'agenda' },
        response: 'Navigation vers l\'agenda.'
    },
    {
        patterns: [
            /statistiques/,
            /analytics/,
            /indicateurs/,
            /metriques/,
        ],
        anyKeywords: ['statistiques', 'analytics', 'indicateurs'],
        toolName: 'global_navigate',
        toolArgs: { query: 'statistiques' },
        response: 'Navigation vers les statistiques.'
    },
    {
        patterns: [
            /communications?/,
            /communiques?/,
            /presse/,
            /medias?/,
        ],
        anyKeywords: ['communication', 'communique', 'presse'],
        toolName: 'global_navigate',
        toolArgs: { query: 'communications' },
        response: 'Navigation vers les communications.'
    },

    // ========== NAVIGATION - MESSAGERIE (iBoîte) ==========
    // IMPORTANT: Ne PAS matcher "courrier" seul car ça peut être une demande de génération de document
    // Matcher uniquement les demandes explicites de navigation vers la messagerie
    {
        patterns: [
            /^messagerie$/,
            /^iboite$/,
            /^i\s*boite$/,
            /ouvre\s*(la\s*)?messagerie/,
            /ouvre\s*(la\s*)?iboite/,
            /ouvre\s*(mes\s*)?emails/,
            /ouvre\s*(mes\s*)?mails/,
            /va\s*(a\s*)?(la\s*)?messagerie/,
            /va\s*(a\s*)?(la\s*)?iboite/,
            /consulte\s*(mes\s*)?(emails|mails|messages)/,
            /voir\s*(mes\s*)?(emails|mails)/,
            /mes\s*emails/,
            /mes\s*mails/,
            /envoie\s*(un\s*)?(email|mail|message)/,
            /ecris\s*(un\s*)?(email|mail|message)/,
            /reponds\s*(a\s*)?(un\s*)?(email|mail|message)/,
        ],
        // Ne PAS utiliser anyKeywords car "courrier" ou "message" peuvent apparaître dans des demandes de documents
        exactPhrases: [
            'ouvre la messagerie',
            'ouvre iboite',
            'va a la messagerie',
            'mes emails',
            'mes mails',
            'envoie un email',
            'envoie un mail'
        ],
        toolName: 'global_navigate',
        toolArgs: { query: 'messagerie' },
        response: 'Navigation vers la messagerie.'
    },

    // ========== NAVIGATION - PARAMÈTRES ==========
    {
        patterns: [
            /parametres/,
            /reglages/,
            /settings/,
            /ouvre\s*(les\s*)?parametres/,
            /configuration/,
        ],
        anyKeywords: ['parametre', 'reglage', 'setting', 'config'],
        toolName: 'global_navigate',
        toolArgs: { query: 'parametres' },
        response: 'Navigation vers les paramètres.'
    },

    // ========== NAVIGATION - CONTACTS ==========
    {
        patterns: [
            /ouvre\s*(les\s*)?contacts/,
            /affiche\s*(les\s*)?contacts/,
            /montre\s*(les\s*)?contacts/,
            /va\s*(aux\s*)?contacts/,
            /annuaire/,
            /liste\s*(des\s*)?contacts/,
            /repertoire\s*(des\s*)?contacts/,
            /carnet\s*(d'adresses|de\s*contacts)/,
        ],
        anyKeywords: ['contact', 'annuaire', 'repertoire'],
        exactPhrases: [
            'ouvre les contacts',
            'mes contacts',
            'annuaire',
            'liste des contacts'
        ],
        toolName: 'open_contacts',
        toolArgs: {},
        response: 'Ouverture de l\'annuaire des contacts.'
    },
    {
        patterns: [
            /contacts?\s*(des\s*)?collaborateurs?/,
            /mes\s*collegues/,
            /equipe/,
        ],
        toolName: 'open_contacts',
        toolArgs: { category: 'collaborator' },
        response: 'Ouverture des contacts collaborateurs.'
    },
    {
        patterns: [
            /contacts?\s*(des\s*)?entreprises?/,
            /societes/,
        ],
        toolName: 'open_contacts',
        toolArgs: { category: 'enterprise' },
        response: 'Ouverture des contacts entreprises.'
    },
    {
        patterns: [
            /contacts?\s*(des\s*)?mairies?/,
            /inter[\s-]?municipalite/,
            /autres?\s*mairies?/,
        ],
        toolName: 'open_contacts',
        toolArgs: { category: 'inter_municipality' },
        response: 'Ouverture des contacts inter-municipalité.'
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

    // ========== ARRÊT / DÉCONNEXION VOCALE ==========
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
            /deconnecte\s*(toi|la\s*voix)/,
            /arrete\s*(la\s*)?voix/,
            /coupe\s*(la\s*)?voix/,
            /stop\s*ecoute/,
            /arrete\s*ecouter/,
        ],
        anyKeywords: ['stop', 'arrete', 'bye', 'revoir', 'silence', 'tais', 'deconnect', 'coupe'],
        exactPhrases: ['stop', 'arrete', 'au revoir', 'tais toi', 'deconnecte toi'],
        toolName: 'stop_conversation',
        toolArgs: {},
        response: 'Au revoir !'
    },

    // ========== DÉCONNEXION UTILISATEUR ==========
    {
        patterns: [
            /deconnexion/,
            /deconnecte\s*moi/,
            /logout/,
            /log\s*out/,
            /me\s*deconnecter/,
        ],
        requiredKeywords: ['deconnect'],
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
            /montre\s*(la\s*)?sidebar/,
        ],
        requiredKeywords: ['menu'],
        actionKeywords: ['ouvre', 'deplie', 'affiche', 'montre'],
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
        requiredKeywords: ['menu'],
        actionKeywords: ['ferme', 'cache', 'replie'],
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
        requiredKeywords: ['presentation'],
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

    // ========== PARLER PLUS VITE/LENTEMENT ==========
    {
        patterns: [
            /parle\s*plus\s*vite/,
            /parle\s*plus\s*rapidement/,
            /accelere\s*(ta|la)?\s*(voix|parole|vitesse)?/,
            /vitesse\s*(de\s*)?(parole|voix)?\s*plus\s*(vite|rapide)/,
            /parle\s*rapidement/,
            /parler\s*plus\s*vite/,
        ],
        requiredKeywords: ['parle', 'vite'],
        toolName: 'control_ui',
        toolArgs: { action: 'set_speech_rate', value: '1.3' },
        response: 'Je parle plus vite maintenant.'
    },
    {
        patterns: [
            /parle\s*plus\s*lentement/,
            /ralentis/,
            /moins\s*vite/,
            /plus\s*lent/,
        ],
        toolName: 'control_ui',
        toolArgs: { action: 'set_speech_rate', value: '0.8' },
        response: 'Je parle plus lentement maintenant.'
    },
];

/**
 * Match une commande vocale avec plusieurs stratégies
 * @param transcript - Le texte transcrit de la commande vocale
 * @returns Le résultat du matching (matched: true si trouvé)
 */
export function matchLocalCommand(transcript: string): LocalCommandResult {
    const normalized = normalize(transcript);

    // Skip very short or obviously non-command text
    if (normalized.length < 3) {
        return { matched: false };
    }

    console.log(`🔍 [LocalRouter] Checking: "${transcript}" → normalized: "${normalized}"`);

    let bestMatch: { cmd: CommandDef; confidence: number } | null = null;

    for (const cmd of COMMAND_DEFINITIONS) {
        let confidence = 0;

        // Strategy 1: Regex pattern matching (highest confidence: 1.0)
        if (cmd.patterns) {
            for (const pattern of cmd.patterns) {
                if (pattern.test(normalized)) {
                    confidence = 1.0;
                    console.log(`✅ [LocalRouter] REGEX MATCH: "${normalized}" → ${cmd.toolName}`);
                    return {
                        matched: true,
                        action: cmd.toolName,
                        toolName: cmd.toolName,
                        toolArgs: cmd.toolArgs || {},
                        response: cmd.response,
                        confidence: 1.0
                    };
                }
            }
        }

        // Strategy 2: Required keywords (confidence: 0.8)
        if (cmd.requiredKeywords && containsKeywords(normalized, cmd.requiredKeywords)) {
            confidence = Math.max(confidence, 0.8);
        }

        // Strategy 3: Action + any keyword combination (confidence: 0.7)
        if (cmd.actionKeywords && cmd.anyKeywords) {
            if (containsAnyKeyword(normalized, cmd.actionKeywords) &&
                containsAnyKeyword(normalized, cmd.anyKeywords)) {
                confidence = Math.max(confidence, 0.7);
            }
        }

        // Strategy 4: Any keywords alone (confidence: 0.5)
        if (cmd.anyKeywords && containsAnyKeyword(normalized, cmd.anyKeywords)) {
            // Only if the text is short enough to be a command
            if (normalized.split(' ').length <= 5) {
                confidence = Math.max(confidence, 0.5);
            }
        }

        // Strategy 5: Fuzzy matching with exact phrases (confidence: 0.6-0.9)
        if (cmd.exactPhrases) {
            for (const phrase of cmd.exactPhrases) {
                const sim = similarity(normalized, phrase);
                if (sim > 0.7) { // 70% similarity threshold
                    const fuzzyConfidence = 0.6 + (sim - 0.7) * 1.0; // 0.6 to 0.9
                    confidence = Math.max(confidence, fuzzyConfidence);
                }
            }
        }

        // Update best match if this one is better
        if (confidence > 0 && (!bestMatch || confidence > bestMatch.confidence)) {
            bestMatch = { cmd, confidence };
        }
    }

    // Return best match if confidence is above threshold
    if (bestMatch && bestMatch.confidence >= 0.6) {
        console.log(`✅ [LocalRouter] FUZZY MATCH (${(bestMatch.confidence * 100).toFixed(0)}%): "${normalized}" → ${bestMatch.cmd.toolName}`);
        return {
            matched: true,
            action: bestMatch.cmd.toolName,
            toolName: bestMatch.cmd.toolName,
            toolArgs: bestMatch.cmd.toolArgs || {},
            response: bestMatch.cmd.response,
            confidence: bestMatch.confidence
        };
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
        totalCommands: COMMAND_DEFINITIONS.length,
        categories: {
            chat: COMMAND_DEFINITIONS.filter(c => c.toolName === 'manage_chat').length,
            theme: COMMAND_DEFINITIONS.filter(c => c.toolName === 'control_ui').length,
            navigation: COMMAND_DEFINITIONS.filter(c => c.toolName === 'global_navigate').length,
            voice: COMMAND_DEFINITIONS.filter(c => c.toolName === 'change_voice').length,
            other: COMMAND_DEFINITIONS.filter(c =>
                !['control_ui', 'global_navigate', 'manage_chat', 'change_voice'].includes(c.toolName)
            ).length
        }
    };
}
