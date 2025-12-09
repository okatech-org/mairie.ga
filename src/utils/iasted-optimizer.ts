/**
 * iAsted Intelligent Router & Cost Optimizer
 * 
 * Implémente l'architecture hybride pour réduire les coûts API de ~60-80%:
 * 1. Cache local pour les FAQ
 * 2. Routeur de complexité (GPT-4o vs GPT-4o-mini)
 * 3. Quotas utilisateurs
 * 4. Gestion des tokens
 */

// ================================
// TYPES
// ================================

export type ModelTier = 'local' | 'mini' | 'full';
export type UserTier = 'anonymous' | 'citizen' | 'agent' | 'admin' | 'maire';

export interface RoutingResult {
    tier: ModelTier;
    model: string;
    cached: boolean;
    cachedResponse?: string;
    reason: string;
    estimatedCost: number; // en cents
}

export interface UserQuota {
    tier: UserTier;
    dailyLimit: number;
    used: number;
    remaining: number;
    resetAt: string;
}

export interface ConversationContext {
    messageCount: number;
    lastSummary?: string;
    tokenEstimate: number;
}

// ================================
// CONFIGURATION
// ================================

const CONFIG = {
    // Quotas par type d'utilisateur
    quotas: {
        anonymous: 3,
        citizen: 20,
        agent: 100,
        admin: 500,
        maire: Infinity
    },

    // Limites de tokens
    tokens: {
        maxHistory: 10,          // Garder seulement les 10 derniers messages
        maxResponseVoice: 500,   // Max tokens pour réponses vocales
        maxResponseChat: 1000,   // Max tokens pour chat
        summarizeAfter: 5        // Résumer après 5 échanges
    },

    // Coûts estimés (en cents par requête)
    costs: {
        local: 0,
        mini: 0.1,   // GPT-4o-mini
        full: 3      // GPT-4o
    },

    // Modèles
    models: {
        mini: 'gpt-4o-mini',
        full: 'gpt-4o',
        realtime: 'gpt-4o-realtime-preview-2024-12-17'
    }
};

// ================================
// CACHE FAQ LOCAL
// ================================

const FAQ_CACHE: Record<string, { response: string; category: string }> = {
    // Horaires et informations générales
    'horaires mairie': {
        response: 'La mairie est ouverte du lundi au vendredi de 8h à 16h30, et le samedi de 9h à 12h.',
        category: 'info'
    },
    'horaires ouverture': {
        response: 'Nos services sont ouverts du lundi au vendredi de 8h à 16h30.',
        category: 'info'
    },
    'adresse mairie': {
        response: 'L\'adresse de la mairie est disponible dans la section Contact de notre site.',
        category: 'info'
    },
    'contact mairie': {
        response: 'Vous pouvez nous contacter par téléphone ou via le formulaire de contact sur le site.',
        category: 'info'
    },

    // État Civil
    'acte naissance': {
        response: 'Pour obtenir un acte de naissance, vous devez fournir : pièce d\'identité, livret de famille si disponible. Délai : 3-5 jours ouvrés. Coût : gratuit.',
        category: 'etat_civil'
    },
    'acte mariage': {
        response: 'Pour un acte de mariage, présentez-vous avec votre pièce d\'identité. Délai : 3-5 jours ouvrés.',
        category: 'etat_civil'
    },
    'acte deces': {
        response: 'Pour un acte de décès, munissez-vous du certificat médical et de la pièce d\'identité du déclarant.',
        category: 'etat_civil'
    },
    'livret famille': {
        response: 'Le livret de famille est délivré automatiquement lors du mariage ou de la première naissance.',
        category: 'etat_civil'
    },

    // Urbanisme
    'permis construire': {
        response: 'Pour un permis de construire, vous devez déposer un dossier complet incluant les plans, le formulaire Cerfa, et les documents du terrain. Délai : 2-3 mois.',
        category: 'urbanisme'
    },
    'certificat urbanisme': {
        response: 'Le certificat d\'urbanisme indique les règles applicables à votre terrain. Délai : 1-2 mois.',
        category: 'urbanisme'
    },

    // Fiscalité
    'patente': {
        response: 'La patente commerciale est obligatoire pour toute activité commerciale. Rendez-vous au service fiscal avec votre registre de commerce.',
        category: 'fiscalite'
    },
    'taxe fonciere': {
        response: 'La taxe foncière est calculée selon la valeur locative de votre propriété. Paiement annuel.',
        category: 'fiscalite'
    },

    // Services
    'inscription': {
        response: 'Pour vous inscrire, cliquez sur "S\'inscrire" et suivez les étapes. Vous aurez besoin de votre pièce d\'identité et d\'un justificatif de domicile.',
        category: 'service'
    },
    'rendez-vous': {
        response: 'Vous pouvez prendre rendez-vous en ligne via votre espace citoyen, rubrique "Mes rendez-vous".',
        category: 'service'
    },
    'suivi demande': {
        response: 'Pour suivre votre demande, connectez-vous à votre espace citoyen et consultez "Mes demandes".',
        category: 'service'
    }
};

// ================================
// DÉTECTION DE COMPLEXITÉ
// ================================

interface ComplexityFactors {
    hasMultipleQuestions: boolean;
    requiresPersonalData: boolean;
    requiresCalculation: boolean;
    requiresCreativity: boolean;
    isFormAssistance: boolean;
    isDocumentAnalysis: boolean;
    wordCount: number;
}

function analyzeComplexity(text: string): ComplexityFactors {
    const lower = text.toLowerCase();
    const words = text.split(/\s+/).length;

    return {
        hasMultipleQuestions: (text.match(/\?/g) || []).length > 1,
        requiresPersonalData: /mon|ma|mes|je|moi/.test(lower) && /dossier|demande|document/.test(lower),
        requiresCalculation: /calcul|combien|total|somme|montant/.test(lower),
        requiresCreativity: /redige|ecris|compose|genere|cree/.test(lower),
        isFormAssistance: /formulaire|inscription|rempli|champ/.test(lower),
        isDocumentAnalysis: /analyse|lis|extrait|ocr|document|passeport|cni/.test(lower),
        wordCount: words
    };
}

function calculateComplexityScore(factors: ComplexityFactors): number {
    let score = 0;

    if (factors.hasMultipleQuestions) score += 2;
    if (factors.requiresPersonalData) score += 2;
    if (factors.requiresCalculation) score += 1;
    if (factors.requiresCreativity) score += 3;
    if (factors.isFormAssistance) score += 2;
    if (factors.isDocumentAnalysis) score += 4;
    if (factors.wordCount > 20) score += 1;
    if (factors.wordCount > 50) score += 2;

    return score;
}

// ================================
// RECHERCHE DANS LE CACHE
// ================================

function searchCache(query: string): string | null {
    const normalized = query
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[?!.,]/g, '');

    // Recherche directe par clé
    for (const [key, value] of Object.entries(FAQ_CACHE)) {
        if (normalized.includes(key)) {
            console.log(`📦 [Cache] HIT: "${key}"`);
            return value.response;
        }
    }

    // Recherche par mots-clés similaires
    const keywords = normalized.split(/\s+/);
    for (const [key, value] of Object.entries(FAQ_CACHE)) {
        const keyWords = key.split(/\s+/);
        const matchCount = keyWords.filter(kw => keywords.includes(kw)).length;
        if (matchCount >= keyWords.length * 0.7) { // 70% de correspondance
            console.log(`📦 [Cache] PARTIAL HIT: "${key}" (${matchCount}/${keyWords.length} words)`);
            return value.response;
        }
    }

    console.log(`📦 [Cache] MISS: "${normalized.substring(0, 50)}..."`);
    return null;
}

// ================================
// ROUTEUR PRINCIPAL
// ================================

export function routeRequest(
    query: string,
    userTier: UserTier = 'citizen',
    isVoice: boolean = false
): RoutingResult {
    console.log(`🧠 [Router] Analyzing: "${query.substring(0, 50)}..."`);

    // 1. Vérifier le cache local d'abord
    const cachedResponse = searchCache(query);
    if (cachedResponse) {
        return {
            tier: 'local',
            model: 'cache',
            cached: true,
            cachedResponse,
            reason: 'Réponse trouvée dans le cache FAQ',
            estimatedCost: CONFIG.costs.local
        };
    }

    // 2. Analyser la complexité
    const factors = analyzeComplexity(query);
    const complexityScore = calculateComplexityScore(factors);

    console.log(`🧠 [Router] Complexity score: ${complexityScore}`, factors);

    // 3. Décision basée sur la complexité
    if (complexityScore <= 2) {
        // Simple → GPT-4o-mini
        return {
            tier: 'mini',
            model: CONFIG.models.mini,
            cached: false,
            reason: `Requête simple (score: ${complexityScore})`,
            estimatedCost: CONFIG.costs.mini
        };
    } else if (complexityScore <= 5) {
        // Modéré → GPT-4o-mini avec prompt enrichi
        return {
            tier: 'mini',
            model: CONFIG.models.mini,
            cached: false,
            reason: `Requête modérée (score: ${complexityScore})`,
            estimatedCost: CONFIG.costs.mini
        };
    } else {
        // Complexe → GPT-4o complet
        return {
            tier: 'full',
            model: CONFIG.models.full,
            cached: false,
            reason: `Requête complexe (score: ${complexityScore})`,
            estimatedCost: CONFIG.costs.full
        };
    }
}

// ================================
// GESTION DES QUOTAS
// ================================

const QUOTA_STORAGE_KEY = 'iasted-quota';

export function getUserQuota(tier: UserTier): UserQuota {
    const stored = localStorage.getItem(QUOTA_STORAGE_KEY);
    const today = new Date().toISOString().split('T')[0];

    if (stored) {
        const data = JSON.parse(stored);
        if (data.date === today && data.tier === tier) {
            return {
                tier,
                dailyLimit: CONFIG.quotas[tier],
                used: data.used,
                remaining: Math.max(0, CONFIG.quotas[tier] - data.used),
                resetAt: `${today}T23:59:59`
            };
        }
    }

    // Nouveau jour ou nouveau tier → reset
    return {
        tier,
        dailyLimit: CONFIG.quotas[tier],
        used: 0,
        remaining: CONFIG.quotas[tier],
        resetAt: `${today}T23:59:59`
    };
}

export function incrementQuotaUsage(tier: UserTier): UserQuota {
    const quota = getUserQuota(tier);
    const today = new Date().toISOString().split('T')[0];

    const newUsed = quota.used + 1;
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify({
        tier,
        used: newUsed,
        date: today
    }));

    return {
        ...quota,
        used: newUsed,
        remaining: Math.max(0, quota.dailyLimit - newUsed)
    };
}

export function checkQuotaAvailable(tier: UserTier): boolean {
    const quota = getUserQuota(tier);
    return quota.remaining > 0;
}

// ================================
// GESTION DU CONTEXTE DE CONVERSATION
// ================================

export function trimConversationHistory<T extends { role: string; content: string }>(
    messages: T[],
    maxMessages: number = CONFIG.tokens.maxHistory
): T[] {
    if (messages.length <= maxMessages) {
        return messages;
    }

    // Garder le premier message (système) et les derniers messages
    const systemMsg = messages.find(m => m.role === 'system');
    const recentMessages = messages.slice(-maxMessages);

    if (systemMsg && !recentMessages.includes(systemMsg)) {
        return [systemMsg, ...recentMessages.slice(1)];
    }

    return recentMessages;
}

export function shouldSummarize(messageCount: number): boolean {
    return messageCount > 0 && messageCount % CONFIG.tokens.summarizeAfter === 0;
}

export function getMaxTokensForContext(isVoice: boolean): number {
    return isVoice ? CONFIG.tokens.maxResponseVoice : CONFIG.tokens.maxResponseChat;
}

// ================================
// EXPORT CONFIGURATION
// ================================

export const IASTED_OPTIMIZER_CONFIG = CONFIG;

// ================================
// STATISTIQUES
// ================================

export function getOptimizationStats() {
    const stored = localStorage.getItem('iasted-stats') || '{}';
    const stats = JSON.parse(stored);

    return {
        totalRequests: stats.total || 0,
        cachedRequests: stats.cached || 0,
        miniRequests: stats.mini || 0,
        fullRequests: stats.full || 0,
        estimatedSavings: stats.savings || 0
    };
}

export function recordRequest(tier: ModelTier, estimatedCost: number) {
    const stored = localStorage.getItem('iasted-stats') || '{}';
    const stats = JSON.parse(stored);

    stats.total = (stats.total || 0) + 1;
    if (tier === 'local') stats.cached = (stats.cached || 0) + 1;
    if (tier === 'mini') stats.mini = (stats.mini || 0) + 1;
    if (tier === 'full') stats.full = (stats.full || 0) + 1;

    // Économies = coût GPT-4o - coût réel
    const fullCost = CONFIG.costs.full;
    stats.savings = (stats.savings || 0) + (fullCost - estimatedCost);

    localStorage.setItem('iasted-stats', JSON.stringify(stats));
}
