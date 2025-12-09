/**
 * CONSCIOUSNESS - ContextMemory
 * 
 * Mémoire conversationnelle d'iAsted.
 * Garde trace du contexte, des intentions, et de l'historique.
 * 
 * Cette mémoire permet à iAsted de:
 * - Se souvenir des sujets abordés
 * - Comprendre les références ("ça", "le document", etc.)
 * - Maintenir une conversation cohérente
 * - Apprendre les préférences utilisateur
 */

// ============================================================
// TYPES
// ============================================================

/** Un message dans l'historique */
export interface ConversationMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    intent?: string;
    entities?: Record<string, string>;
    sentiment?: 'positive' | 'neutral' | 'negative';
}

/** Un sujet/topic discuté */
export interface ConversationTopic {
    name: string;
    firstMentioned: Date;
    lastMentioned: Date;
    mentionCount: number;
    relatedEntities: string[];
}

/** Référence contextuelle (pour résolution de "ça", "le", etc.) */
export interface ContextualReference {
    pronoun: string;
    resolvedTo: string;
    confidence: number;
    timestamp: Date;
}

/** Action en cours ou récente */
export interface TrackedAction {
    id: string;
    name: string;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    startedAt: Date;
    completedAt?: Date;
    result?: unknown;
}

/** État complet de la mémoire */
export interface MemoryState {
    sessionId: string;
    startedAt: Date;
    messages: ConversationMessage[];
    topics: ConversationTopic[];
    references: ContextualReference[];
    actions: TrackedAction[];
    userPreferences: Record<string, unknown>;
}

// ============================================================
// CONTEXT MEMORY CLASS
// ============================================================

class ContextMemoryClass {
    private static instance: ContextMemoryClass;
    private state: MemoryState;
    private maxMessages: number = 50; // Limite pour économiser la mémoire

    private constructor() {
        this.state = this.createEmptyState();
        console.log('🧠 [ContextMemory] Mémoire initialisée');
    }

    public static getInstance(): ContextMemoryClass {
        if (!ContextMemoryClass.instance) {
            ContextMemoryClass.instance = new ContextMemoryClass();
        }
        return ContextMemoryClass.instance;
    }

    private createEmptyState(): MemoryState {
        return {
            sessionId: this.generateId(),
            startedAt: new Date(),
            messages: [],
            topics: [],
            references: [],
            actions: [],
            userPreferences: {}
        };
    }

    private generateId(): string {
        return `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // ========== MESSAGES ==========

    /**
     * Ajoute un message utilisateur
     */
    public addUserMessage(content: string, intent?: string, entities?: Record<string, string>): ConversationMessage {
        const message: ConversationMessage = {
            id: this.generateId(),
            role: 'user',
            content,
            timestamp: new Date(),
            intent,
            entities,
            sentiment: this.analyzeSentiment(content)
        };

        this.state.messages.push(message);
        this.trimMessages();
        this.extractTopics(content);
        this.updateReferences(content);

        console.log(`📝 [ContextMemory] User: "${content.substring(0, 50)}..."`);
        return message;
    }

    /**
     * Ajoute une réponse d'iAsted
     */
    public addAssistantMessage(content: string): ConversationMessage {
        const message: ConversationMessage = {
            id: this.generateId(),
            role: 'assistant',
            content,
            timestamp: new Date()
        };

        this.state.messages.push(message);
        this.trimMessages();

        return message;
    }

    /**
     * Ajoute un message système (contexte, instructions)
     */
    public addSystemMessage(content: string): ConversationMessage {
        const message: ConversationMessage = {
            id: this.generateId(),
            role: 'system',
            content,
            timestamp: new Date()
        };

        this.state.messages.push(message);
        return message;
    }

    private trimMessages(): void {
        if (this.state.messages.length > this.maxMessages) {
            // Garder les messages système + les plus récents
            const systemMessages = this.state.messages.filter(m => m.role === 'system');
            const recentMessages = this.state.messages
                .filter(m => m.role !== 'system')
                .slice(-this.maxMessages + systemMessages.length);

            this.state.messages = [...systemMessages, ...recentMessages];
        }
    }

    /**
     * Récupère les derniers messages (pour le contexte LLM)
     */
    public getRecentMessages(count: number = 10): ConversationMessage[] {
        return this.state.messages.slice(-count);
    }

    /**
     * Formate les messages pour l'API OpenAI
     */
    public formatForLLM(count: number = 10): Array<{ role: string; content: string }> {
        return this.getRecentMessages(count).map(m => ({
            role: m.role,
            content: m.content
        }));
    }

    // ========== TOPICS ==========

    private extractTopics(content: string): void {
        // Mots-clés administratifs gabonais
        const topicKeywords: Record<string, string[]> = {
            'acte_naissance': ['naissance', 'né', 'naître', 'accouchement'],
            'acte_mariage': ['mariage', 'marier', 'époux', 'union'],
            'acte_deces': ['décès', 'mort', 'décédé'],
            'urbanisme': ['permis', 'construire', 'terrain', 'bâtiment', 'construction'],
            'fiscalite': ['taxe', 'impôt', 'patente', 'foncier', 'payer'],
            'rendez_vous': ['rdv', 'rendez-vous', 'rencontrer', 'voir'],
            'document': ['document', 'papier', 'attestation', 'certificat'],
            'reclamation': ['plainte', 'réclamation', 'problème', 'signaler']
        };

        const lowerContent = content.toLowerCase();

        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            if (keywords.some(kw => lowerContent.includes(kw))) {
                this.mentionTopic(topic);
            }
        }
    }

    private mentionTopic(topicName: string): void {
        const existing = this.state.topics.find(t => t.name === topicName);

        if (existing) {
            existing.lastMentioned = new Date();
            existing.mentionCount++;
        } else {
            this.state.topics.push({
                name: topicName,
                firstMentioned: new Date(),
                lastMentioned: new Date(),
                mentionCount: 1,
                relatedEntities: []
            });
        }
    }

    /**
     * Récupère les topics actifs (mentionnés récemment)
     */
    public getActiveTopics(): ConversationTopic[] {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return this.state.topics.filter(t => t.lastMentioned > fiveMinutesAgo);
    }

    /**
     * Récupère le topic principal (le plus mentionné récemment)
     */
    public getPrimaryTopic(): ConversationTopic | null {
        const active = this.getActiveTopics();
        if (active.length === 0) return null;
        return active.reduce((a, b) => a.mentionCount > b.mentionCount ? a : b);
    }

    // ========== RÉFÉRENCES CONTEXTUELLES ==========

    private updateReferences(content: string): void {
        // Détecte les entités nommées pour la résolution de pronoms
        const namedEntities = this.extractNamedEntities(content);

        if (namedEntities.documents.length > 0) {
            this.state.references.push({
                pronoun: 'le document',
                resolvedTo: namedEntities.documents[0],
                confidence: 0.8,
                timestamp: new Date()
            });
        }

        if (namedEntities.people.length > 0) {
            this.state.references.push({
                pronoun: 'cette personne',
                resolvedTo: namedEntities.people[0],
                confidence: 0.8,
                timestamp: new Date()
            });
        }

        // Garder seulement les 10 dernières références
        this.state.references = this.state.references.slice(-10);
    }

    private extractNamedEntities(content: string): { documents: string[]; people: string[]; places: string[] } {
        const documents: string[] = [];
        const people: string[] = [];
        const places: string[] = [];

        // Patterns pour les documents
        const docPatterns = [
            /acte de (naissance|mariage|décès)/gi,
            /certificat de? \w+/gi,
            /attestation de? \w+/gi,
            /permis de? \w+/gi
        ];

        for (const pattern of docPatterns) {
            const matches = content.match(pattern);
            if (matches) documents.push(...matches);
        }

        // Patterns pour les lieux gabonais
        const gabonPlaces = ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda', 'Lambaréné'];
        for (const place of gabonPlaces) {
            if (content.includes(place)) places.push(place);
        }

        return { documents, people, places };
    }

    /**
     * Résout un pronom en utilisant le contexte
     */
    public resolveReference(pronoun: string): string | null {
        const reference = this.state.references
            .filter(r => r.pronoun.toLowerCase().includes(pronoun.toLowerCase()))
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

        return reference?.resolvedTo || null;
    }

    // ========== ACTIONS ==========

    /**
     * Démarre le tracking d'une action
     */
    public startAction(name: string): TrackedAction {
        const action: TrackedAction = {
            id: this.generateId(),
            name,
            status: 'pending',
            startedAt: new Date()
        };

        this.state.actions.push(action);
        console.log(`🎬 [ContextMemory] Action started: ${name}`);
        return action;
    }

    /**
     * Met à jour le statut d'une action
     */
    public updateAction(id: string, status: TrackedAction['status'], result?: unknown): void {
        const action = this.state.actions.find(a => a.id === id);
        if (action) {
            action.status = status;
            if (status === 'completed' || status === 'failed') {
                action.completedAt = new Date();
            }
            if (result !== undefined) {
                action.result = result;
            }
        }
    }

    /**
     * Récupère les actions en cours
     */
    public getPendingActions(): TrackedAction[] {
        return this.state.actions.filter(a => a.status === 'pending' || a.status === 'executing');
    }

    /**
     * Récupère la dernière action
     */
    public getLastAction(): TrackedAction | null {
        return this.state.actions.slice(-1)[0] || null;
    }

    // ========== PRÉFÉRENCES UTILISATEUR ==========

    /**
     * Enregistre une préférence utilisateur
     */
    public setPreference(key: string, value: unknown): void {
        this.state.userPreferences[key] = value;
    }

    /**
     * Récupère une préférence
     */
    public getPreference<T>(key: string, defaultValue: T): T {
        return (this.state.userPreferences[key] as T) ?? defaultValue;
    }

    // ========== ANALYSE ==========

    private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
        const positiveWords = ['merci', 'parfait', 'excellent', 'super', 'bien', 'génial', 'bravo'];
        const negativeWords = ['problème', 'erreur', 'bug', 'nul', 'mauvais', 'horrible', 'pire'];

        const lower = content.toLowerCase();
        const positiveCount = positiveWords.filter(w => lower.includes(w)).length;
        const negativeCount = negativeWords.filter(w => lower.includes(w)).length;

        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    /**
     * Récupère un résumé du contexte actuel
     */
    public getContextSummary(): string {
        const topics = this.getActiveTopics().map(t => t.name).join(', ');
        const pendingActions = this.getPendingActions().map(a => a.name).join(', ');
        const messageCount = this.state.messages.length;

        return `Session: ${this.state.sessionId} | Messages: ${messageCount} | Topics: ${topics || 'aucun'} | Actions en cours: ${pendingActions || 'aucune'}`;
    }

    // ========== LIFECYCLE ==========

    /**
     * Réinitialise la mémoire (nouvelle session)
     */
    public reset(): void {
        this.state = this.createEmptyState();
        console.log('🔄 [ContextMemory] Mémoire réinitialisée');
    }

    /**
     * Récupère l'état complet
     */
    public getState(): Readonly<MemoryState> {
        return { ...this.state };
    }
}

// ============================================================
// EXPORT
// ============================================================

export const ContextMemory = ContextMemoryClass.getInstance();
export type { ContextMemoryClass };
