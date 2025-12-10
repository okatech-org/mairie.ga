/**
 * Municipal Data Service
 * 
 * Service unifié pour les données municipales (délibérations, arrêtés, urbanisme).
 * Supporte à la fois les données mockées et Supabase.
 */

import { supabase } from '@/integrations/supabase/client';

// Types
export interface Deliberation {
    id: string;
    numero: string;
    titre: string;
    objet: string;
    dateSeance: string;
    resultat: 'adopté' | 'rejeté' | 'ajourné' | 'en_cours';
    votePour?: number;
    voteContre?: number;
    abstention?: number;
    rapporteur?: string;
    commission?: string;
    documentUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Arrete {
    id: string;
    numero: string;
    titre: string;
    objet: string;
    type: 'reglementaire' | 'individuel' | 'police' | 'urbanisme';
    status: 'projet' | 'signé' | 'publié' | 'abrogé';
    datePrise?: string;
    datePublication?: string;
    signataire?: string;
    documentUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface UrbanismeDossier {
    id: string;
    numero: string;
    type: 'permis_construire' | 'declaration_prealable' | 'permis_amenager' | 'permis_demolir';
    demandeur: string;
    adresse: string;
    parcelle?: string;
    description: string;
    status: 'déposé' | 'instruction' | 'attente_pieces' | 'accordé' | 'refusé' | 'sans_suite';
    dateDepot: string;
    dateDecision?: string;
    surface?: number;
    instructeur?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuditLog {
    id: string;
    userId: string;
    userEmail: string;
    action: string;
    resource: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    timestamp: string;
}

export interface KnowledgeBaseArticle {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    author: string;
    status: 'draft' | 'published' | 'archived';
    views: number;
    createdAt: string;
    updatedAt: string;
}

// Mock Data
const MOCK_DELIBERATIONS: Deliberation[] = [
    {
        id: 'del-1',
        numero: 'DEL-2024-001',
        titre: 'Adoption du budget primitif 2024',
        objet: 'Vote du budget primitif de la commune pour l\'exercice 2024',
        dateSeance: '2024-01-15',
        resultat: 'adopté',
        votePour: 25,
        voteContre: 3,
        abstention: 2,
        rapporteur: 'M. Finance',
        commission: 'Commission Finances',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
    },
    {
        id: 'del-2',
        numero: 'DEL-2024-002',
        titre: 'Projet de rénovation du marché central',
        objet: 'Approbation du projet de rénovation du marché central de Libreville',
        dateSeance: '2024-02-20',
        resultat: 'adopté',
        votePour: 28,
        voteContre: 1,
        abstention: 1,
        rapporteur: 'Mme Urbanisme',
        commission: 'Commission Urbanisme',
        createdAt: '2024-02-20T10:00:00Z',
        updatedAt: '2024-02-20T10:00:00Z'
    },
    {
        id: 'del-3',
        numero: 'DEL-2024-003',
        titre: 'Tarifs des services municipaux 2024',
        objet: 'Révision des tarifs des services municipaux pour l\'année 2024',
        dateSeance: '2024-03-10',
        resultat: 'en_cours',
        createdAt: '2024-03-10T10:00:00Z',
        updatedAt: '2024-03-10T10:00:00Z'
    }
];

const MOCK_ARRETES: Arrete[] = [
    {
        id: 'arr-1',
        numero: 'ARR-2024-001',
        titre: 'Interdiction de stationnement Avenue de l\'Indépendance',
        objet: 'Interdiction temporaire de stationnement pour travaux de voirie',
        type: 'police',
        status: 'publié',
        datePrise: '2024-01-10',
        datePublication: '2024-01-11',
        signataire: 'Le Maire',
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-01-11T10:00:00Z'
    },
    {
        id: 'arr-2',
        numero: 'ARR-2024-002',
        titre: 'Autorisation d\'occupation du domaine public',
        objet: 'Autorisation d\'installation de terrasse pour le restaurant Le Palmier',
        type: 'individuel',
        status: 'signé',
        datePrise: '2024-02-15',
        signataire: 'Le Maire',
        createdAt: '2024-02-15T10:00:00Z',
        updatedAt: '2024-02-15T10:00:00Z'
    },
    {
        id: 'arr-3',
        numero: 'ARR-2024-003',
        titre: 'Règlement des marchés publics',
        objet: 'Nouveau règlement des marchés couverts de la commune',
        type: 'reglementaire',
        status: 'projet',
        createdAt: '2024-03-01T10:00:00Z',
        updatedAt: '2024-03-01T10:00:00Z'
    }
];

const MOCK_DOSSIERS: UrbanismeDossier[] = [
    {
        id: 'urb-1',
        numero: 'PC-2024-001',
        type: 'permis_construire',
        demandeur: 'SARL Construction Gabon',
        adresse: '123 Boulevard Triomphal',
        parcelle: 'AB-123',
        description: 'Construction d\'un immeuble R+5 à usage mixte',
        status: 'instruction',
        dateDepot: '2024-01-20',
        surface: 2500,
        instructeur: 'Agent Urbanisme 1',
        createdAt: '2024-01-20T10:00:00Z',
        updatedAt: '2024-01-20T10:00:00Z'
    },
    {
        id: 'urb-2',
        numero: 'DP-2024-001',
        type: 'declaration_prealable',
        demandeur: 'M. Jean Obame',
        adresse: '45 Rue des Fleurs',
        description: 'Extension d\'une maison individuelle',
        status: 'accordé',
        dateDepot: '2024-01-15',
        dateDecision: '2024-02-15',
        surface: 50,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-02-15T10:00:00Z'
    },
    {
        id: 'urb-3',
        numero: 'PC-2024-002',
        type: 'permis_construire',
        demandeur: 'Association Culturelle Gabon',
        adresse: '78 Avenue de la Liberté',
        description: 'Construction d\'un centre culturel',
        status: 'attente_pieces',
        dateDepot: '2024-02-01',
        surface: 800,
        createdAt: '2024-02-01T10:00:00Z',
        updatedAt: '2024-02-01T10:00:00Z'
    }
];

const MOCK_AUDIT_LOGS: AuditLog[] = [
    {
        id: 'log-1',
        userId: 'user-1',
        userEmail: 'admin@mairie.ga',
        action: 'LOGIN',
        resource: 'session',
        timestamp: new Date().toISOString()
    },
    {
        id: 'log-2',
        userId: 'user-1',
        userEmail: 'admin@mairie.ga',
        action: 'UPDATE',
        resource: 'settings',
        resourceId: 'general',
        details: { section: 'appearance' },
        timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
        id: 'log-3',
        userId: 'user-2',
        userEmail: 'agent@mairie.ga',
        action: 'CREATE',
        resource: 'request',
        resourceId: 'req-123',
        timestamp: new Date(Date.now() - 7200000).toISOString()
    }
];

const MOCK_KB_ARTICLES: KnowledgeBaseArticle[] = [
    {
        id: 'kb-1',
        title: 'Comment traiter une demande de passeport',
        content: 'Guide complet pour le traitement des demandes de passeport...',
        category: 'Procédures',
        tags: ['passeport', 'identité', 'document'],
        author: 'Admin Système',
        status: 'published',
        views: 156,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
    },
    {
        id: 'kb-2',
        title: 'Gestion des rendez-vous',
        content: 'Procédure de gestion des rendez-vous citoyens...',
        category: 'Formation',
        tags: ['rendez-vous', 'agenda', 'planning'],
        author: 'Admin Système',
        status: 'published',
        views: 89,
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-01-10T10:00:00Z'
    }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MunicipalDataService {
    private useSupabase = false;

    constructor() {
        this.checkSupabaseConnection();
    }

    private async checkSupabaseConnection(): Promise<void> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                console.log('[MunicipalDataService] No session, using mock data');
                return;
            }
            this.useSupabase = true;
        } catch {
            this.useSupabase = false;
        }
    }

    // ==================== DELIBERATIONS ====================

    async getDeliberations(filter?: {
        resultat?: Deliberation['resultat'];
        search?: string;
    }): Promise<Deliberation[]> {
        await delay(300);

        let results = [...MOCK_DELIBERATIONS];

        if (filter?.resultat) {
            results = results.filter(d => d.resultat === filter.resultat);
        }

        if (filter?.search) {
            const search = filter.search.toLowerCase();
            results = results.filter(d =>
                d.titre.toLowerCase().includes(search) ||
                d.objet.toLowerCase().includes(search) ||
                d.numero.toLowerCase().includes(search)
            );
        }

        return results;
    }

    async getDeliberationById(id: string): Promise<Deliberation | undefined> {
        await delay(200);
        return MOCK_DELIBERATIONS.find(d => d.id === id);
    }

    async createDeliberation(data: Omit<Deliberation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deliberation> {
        await delay(500);
        const newDelib: Deliberation = {
            ...data,
            id: `del-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        MOCK_DELIBERATIONS.push(newDelib);
        return newDelib;
    }

    // ==================== ARRÊTÉS ====================

    async getArretes(filter?: {
        status?: Arrete['status'];
        type?: Arrete['type'];
        search?: string;
    }): Promise<Arrete[]> {
        await delay(300);

        let results = [...MOCK_ARRETES];

        if (filter?.status) {
            results = results.filter(a => a.status === filter.status);
        }

        if (filter?.type) {
            results = results.filter(a => a.type === filter.type);
        }

        if (filter?.search) {
            const search = filter.search.toLowerCase();
            results = results.filter(a =>
                a.titre.toLowerCase().includes(search) ||
                a.objet.toLowerCase().includes(search) ||
                a.numero.toLowerCase().includes(search)
            );
        }

        return results;
    }

    async getArreteById(id: string): Promise<Arrete | undefined> {
        await delay(200);
        return MOCK_ARRETES.find(a => a.id === id);
    }

    async createArrete(data: Omit<Arrete, 'id' | 'createdAt' | 'updatedAt'>): Promise<Arrete> {
        await delay(500);
        const newArrete: Arrete = {
            ...data,
            id: `arr-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        MOCK_ARRETES.push(newArrete);
        return newArrete;
    }

    async signArrete(id: string): Promise<Arrete> {
        await delay(300);
        const arrete = MOCK_ARRETES.find(a => a.id === id);
        if (!arrete) throw new Error('Arrêté non trouvé');
        arrete.status = 'signé';
        arrete.datePrise = new Date().toISOString().split('T')[0];
        arrete.updatedAt = new Date().toISOString();
        return arrete;
    }

    async publishArrete(id: string): Promise<Arrete> {
        await delay(300);
        const arrete = MOCK_ARRETES.find(a => a.id === id);
        if (!arrete) throw new Error('Arrêté non trouvé');
        arrete.status = 'publié';
        arrete.datePublication = new Date().toISOString().split('T')[0];
        arrete.updatedAt = new Date().toISOString();
        return arrete;
    }

    // ==================== URBANISME ====================

    async getUrbanismeDossiers(filter?: {
        status?: UrbanismeDossier['status'];
        type?: UrbanismeDossier['type'];
        search?: string;
    }): Promise<UrbanismeDossier[]> {
        await delay(300);

        let results = [...MOCK_DOSSIERS];

        if (filter?.status) {
            results = results.filter(d => d.status === filter.status);
        }

        if (filter?.type) {
            results = results.filter(d => d.type === filter.type);
        }

        if (filter?.search) {
            const search = filter.search.toLowerCase();
            results = results.filter(d =>
                d.demandeur.toLowerCase().includes(search) ||
                d.adresse.toLowerCase().includes(search) ||
                d.numero.toLowerCase().includes(search)
            );
        }

        return results;
    }

    async getUrbanismeDossierById(id: string): Promise<UrbanismeDossier | undefined> {
        await delay(200);
        return MOCK_DOSSIERS.find(d => d.id === id);
    }

    async updateUrbanismeDossierStatus(
        id: string,
        status: UrbanismeDossier['status']
    ): Promise<UrbanismeDossier> {
        await delay(300);
        const dossier = MOCK_DOSSIERS.find(d => d.id === id);
        if (!dossier) throw new Error('Dossier non trouvé');
        dossier.status = status;
        if (status === 'accordé' || status === 'refusé') {
            dossier.dateDecision = new Date().toISOString().split('T')[0];
        }
        dossier.updatedAt = new Date().toISOString();
        return dossier;
    }

    // ==================== AUDIT LOGS ====================

    async getAuditLogs(filter?: {
        action?: string;
        userId?: string;
        limit?: number;
    }): Promise<AuditLog[]> {
        await delay(300);

        let results = [...MOCK_AUDIT_LOGS];

        if (filter?.action) {
            results = results.filter(l => l.action === filter.action);
        }

        if (filter?.userId) {
            results = results.filter(l => l.userId === filter.userId);
        }

        if (filter?.limit) {
            results = results.slice(0, filter.limit);
        }

        return results.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }

    async logAction(data: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
        const log: AuditLog = {
            ...data,
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString()
        };
        MOCK_AUDIT_LOGS.unshift(log);
    }

    // ==================== KNOWLEDGE BASE ====================

    async getKnowledgeBaseArticles(filter?: {
        category?: string;
        status?: KnowledgeBaseArticle['status'];
        search?: string;
    }): Promise<KnowledgeBaseArticle[]> {
        await delay(300);

        let results = [...MOCK_KB_ARTICLES];

        if (filter?.category) {
            results = results.filter(a => a.category === filter.category);
        }

        if (filter?.status) {
            results = results.filter(a => a.status === filter.status);
        }

        if (filter?.search) {
            const search = filter.search.toLowerCase();
            results = results.filter(a =>
                a.title.toLowerCase().includes(search) ||
                a.content.toLowerCase().includes(search) ||
                a.tags.some(t => t.toLowerCase().includes(search))
            );
        }

        return results;
    }

    async getKnowledgeBaseArticleById(id: string): Promise<KnowledgeBaseArticle | undefined> {
        await delay(200);
        const article = MOCK_KB_ARTICLES.find(a => a.id === id);
        if (article) {
            article.views++;
        }
        return article;
    }

    async createKnowledgeBaseArticle(
        data: Omit<KnowledgeBaseArticle, 'id' | 'views' | 'createdAt' | 'updatedAt'>
    ): Promise<KnowledgeBaseArticle> {
        await delay(500);
        const newArticle: KnowledgeBaseArticle = {
            ...data,
            id: `kb-${Date.now()}`,
            views: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        MOCK_KB_ARTICLES.push(newArticle);
        return newArticle;
    }

    async updateKnowledgeBaseArticle(
        id: string,
        data: Partial<KnowledgeBaseArticle>
    ): Promise<KnowledgeBaseArticle> {
        await delay(300);
        const article = MOCK_KB_ARTICLES.find(a => a.id === id);
        if (!article) throw new Error('Article non trouvé');
        Object.assign(article, data, { updatedAt: new Date().toISOString() });
        return article;
    }

    async deleteKnowledgeBaseArticle(id: string): Promise<void> {
        await delay(300);
        const index = MOCK_KB_ARTICLES.findIndex(a => a.id === id);
        if (index !== -1) {
            MOCK_KB_ARTICLES.splice(index, 1);
        }
    }

    // ==================== STATISTICS ====================

    getDeliberationStats() {
        return {
            total: MOCK_DELIBERATIONS.length,
            adoptees: MOCK_DELIBERATIONS.filter(d => d.resultat === 'adopté').length,
            rejetees: MOCK_DELIBERATIONS.filter(d => d.resultat === 'rejeté').length,
            enCours: MOCK_DELIBERATIONS.filter(d => d.resultat === 'en_cours').length,
            ajournees: MOCK_DELIBERATIONS.filter(d => d.resultat === 'ajourné').length
        };
    }

    getArretesStats() {
        return {
            total: MOCK_ARRETES.length,
            projets: MOCK_ARRETES.filter(a => a.status === 'projet').length,
            signes: MOCK_ARRETES.filter(a => a.status === 'signé').length,
            publies: MOCK_ARRETES.filter(a => a.status === 'publié').length,
            abroges: MOCK_ARRETES.filter(a => a.status === 'abrogé').length
        };
    }

    getUrbanismeStats() {
        return {
            total: MOCK_DOSSIERS.length,
            enInstruction: MOCK_DOSSIERS.filter(d => d.status === 'instruction').length,
            attentesPieces: MOCK_DOSSIERS.filter(d => d.status === 'attente_pieces').length,
            accordes: MOCK_DOSSIERS.filter(d => d.status === 'accordé').length,
            refuses: MOCK_DOSSIERS.filter(d => d.status === 'refusé').length
        };
    }
}

export const municipalDataService = new MunicipalDataService();
