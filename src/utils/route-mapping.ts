
/**
 * Route Mapping for Super Admin Navigation Intelligence
 * Maps natural language queries to actual application routes
 */

export interface RouteInfo {
    path: string;
    aliases: string[];
    role?: string;
    description: string;
}

export const ROUTE_MAP: RouteInfo[] = [
    {
        path: '/',
        aliases: ['accueil', 'home', 'page d\'accueil', 'démarrage', 'start'],
        description: 'Page d\'accueil'
    },
    // Routes d'inscription
    {
        path: '/register',
        aliases: ['inscription', 'register', 's\'inscrire', 'créer un compte', 'créer compte', 'nouveau compte', 'enregistrement'],
        description: 'Page de choix d\'inscription (gabonais ou étranger)'
    },
    {
        path: '/register/gabonais',
        aliases: ['inscription gabonais', 'gabonais', 'citoyen gabonais', 'register gabonais', 'formulaire gabonais'],
        description: 'Formulaire d\'inscription pour citoyen gabonais'
    },
    {
        path: '/register/etranger',
        aliases: ['inscription étranger', 'etranger', 'étranger', 'foreigner', 'register foreigner', 'formulaire étranger', 'résident étranger'],
        description: 'Formulaire d\'inscription pour résident étranger'
    },
    // Connexion
    {
        path: '/login',
        aliases: ['connexion', 'login', 'authentification', 'auth', 'se connecter', 'log in'],
        description: 'Page de connexion'
    },
    // Dashboards
    {
        path: '/dashboard/citizen',
        aliases: ['espace citoyen', 'mon espace', 'tableau de bord citoyen', 'dashboard citoyen', 'citizen dashboard'],
        description: 'Espace citoyen / Tableau de bord'
    },
    {
        path: '/dashboard/citizen/requests',
        aliases: ['mes demandes', 'demandes citoyen', 'suivi demandes', 'my requests'],
        description: 'Mes demandes en cours'
    },
    {
        path: '/dashboard/citizen/documents',
        aliases: ['mes documents', 'documents', 'my documents'],
        description: 'Mes documents'
    },
    {
        path: '/dashboard/agent/requests',
        aliases: ['demandes agent', 'requêtes agent', 'agent requests', 'traitement demandes'],
        description: 'Page des demandes agents'
    },
    {
        path: '/dashboard/admin/agents',
        aliases: ['agents', 'gestion agents', 'liste agents'],
        description: 'Page de gestion des agents'
    },
    {
        path: '/dashboard/admin',
        aliases: ['espace admin', 'administration', 'admin', 'dashboard admin'],
        description: 'Espace administration'
    },
    {
        path: '/dashboard/super-admin/users',
        aliases: ['utilisateurs', 'users', 'gestion utilisateurs'],
        description: 'Gestion des utilisateurs (Super Admin)'
    },
    {
        path: '/dashboard/super-admin/organizations',
        aliases: ['organisations', 'orgs', 'gestion organisations', 'mairies'],
        description: 'Gestion des organisations (Super Admin)'
    },
    {
        path: '/services',
        aliases: ['services', 'catalogue', 'services municipaux', 'catalog'],
        description: 'Catalogue des services municipaux'
    },
    {
        path: '/settings',
        aliases: ['paramètres', 'settings', 'configuration'],
        description: 'Paramètres de l\'application'
    },
    {
        path: '/actualites',
        aliases: ['actualités', 'news', 'informations', 'actu'],
        description: 'Actualités municipales'
    }
];

/**
 * Resolve a natural language query to an actual route
 * Uses fuzzy matching on aliases
 */
export function resolveRoute(query: string): string | null {
    const normalizedQuery = query.toLowerCase().trim();

    // Exact path match first
    const exactMatch = ROUTE_MAP.find(route => route.path === normalizedQuery);
    if (exactMatch) return exactMatch.path;

    // Alias matching
    for (const route of ROUTE_MAP) {
        for (const alias of route.aliases) {
            if (normalizedQuery.includes(alias) || alias.includes(normalizedQuery)) {
                return route.path;
            }
        }
    }

    // Fuzzy matching on description
    const fuzzyMatch = ROUTE_MAP.find(route =>
        route.description.toLowerCase().includes(normalizedQuery) ||
        normalizedQuery.includes(route.description.toLowerCase())
    );

    return fuzzyMatch ? fuzzyMatch.path : null;
}

/**
 * Get route information for system prompt
 */
export function getRouteKnowledgePrompt(): string {
    const routeList = ROUTE_MAP.map(route =>
        `- **${route.path}** : ${route.description}\n  Aliases: ${route.aliases.join(', ')}`
    ).join('\n');

    return `# CARTOGRAPHIE DES ROUTES DISPONIBLES\n${routeList}\n\nIMPORTANT: Utilise TOUJOURS ces chemins exacts. Si l'utilisateur demande "page d'accueil" ou "home", utilise "/" et NON "/home".`;
}
