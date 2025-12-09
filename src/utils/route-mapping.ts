/**
 * Route Mapping for iAsted Navigation Intelligence
 * Maps natural language queries to actual application routes
 * Comprehensive mapping for all user roles and spaces
 */

export interface RouteInfo {
    path: string;
    aliases: string[];
    role?: string; // Optional role restriction
    description: string;
}

export const ROUTE_MAP: RouteInfo[] = [
    // ========== PUBLIC ROUTES ==========
    {
        path: '/',
        aliases: ['accueil', 'home', 'page d\'accueil', 'démarrage', 'start', 'sortir', 'quitter'],
        description: 'Page d\'accueil'
    },
    {
        path: '/login',
        aliases: ['connexion', 'login', 'authentification', 'auth', 'se connecter', 'log in', 'identifier'],
        description: 'Page de connexion'
    },
    {
        path: '/register',
        aliases: ['inscription', 'register', 's\'inscrire', 'créer un compte', 'créer compte', 'nouveau compte', 'enregistrement'],
        description: 'Page de choix d\'inscription'
    },
    {
        path: '/register/gabonais',
        aliases: ['inscription gabonais', 'gabonais', 'citoyen gabonais', 'register gabonais', 'formulaire gabonais'],
        description: 'Formulaire d\'inscription gabonais'
    },
    {
        path: '/register/etranger',
        aliases: ['inscription étranger', 'etranger', 'étranger', 'foreigner', 'register foreigner', 'formulaire étranger', 'résident étranger'],
        description: 'Formulaire d\'inscription étranger'
    },
    {
        path: '/services',
        aliases: ['services', 'catalogue', 'services municipaux', 'catalog', 'liste services', 'voir services'],
        description: 'Catalogue des services municipaux'
    },
    {
        path: '/actualites',
        aliases: ['actualités', 'news', 'informations', 'actu', 'nouvelles', 'infos'],
        description: 'Actualités municipales'
    },
    {
        path: '/demo-portal',
        aliases: ['demo', 'démo', 'démonstration', 'portail démo', 'simulation', 'tester', 'essayer'],
        description: 'Portail de démonstration'
    },

    // ========== CITIZEN DASHBOARD ==========
    {
        path: '/dashboard/citizen',
        aliases: ['espace citoyen', 'mon espace', 'tableau de bord citoyen', 'dashboard citoyen', 'citizen dashboard', 'mon tableau de bord', 'accueil citoyen'],
        role: 'citizen',
        description: 'Tableau de bord citoyen'
    },
    {
        path: '/dashboard/citizen/requests',
        aliases: ['mes demandes', 'demandes citoyen', 'suivi demandes', 'my requests', 'demandes', 'suivi', 'mes dossiers', 'dossiers'],
        role: 'citizen',
        description: 'Mes demandes en cours'
    },
    {
        path: '/dashboard/citizen/documents',
        aliases: ['mes documents', 'documents', 'my documents', 'fichiers', 'pièces', 'papiers'],
        role: 'citizen',
        description: 'Mes documents'
    },
    {
        path: '/dashboard/citizen/associations',
        aliases: ['associations', 'mes associations', 'vie associative', 'assos'],
        role: 'citizen',
        description: 'Mes associations'
    },
    {
        path: '/dashboard/citizen/companies',
        aliases: ['entreprises', 'mes entreprises', 'sociétés', 'companies', 'mes sociétés'],
        role: 'citizen',
        description: 'Mes entreprises'
    },
    {
        path: '/dashboard/citizen/cv',
        aliases: ['cv', 'curriculum', 'mon cv', 'profil professionnel'],
        role: 'citizen',
        description: 'Mon CV'
    },
    {
        path: '/dashboard/citizen/services',
        aliases: ['services citoyen', 'mes services', 'demarches', 'démarches', 'faire une demande', 'nouvelle demande'],
        role: 'citizen',
        description: 'Catalogue des services citoyen'
    },
    {
        path: '/dashboard/citizen/settings',
        aliases: ['paramètres citoyen', 'mes paramètres', 'réglages', 'compte', 'profil'],
        role: 'citizen',
        description: 'Paramètres du compte citoyen'
    },

    // ========== FOREIGNER DASHBOARD ==========
    {
        path: '/dashboard/foreigner',
        aliases: ['espace étranger', 'espace résident', 'dashboard foreigner', 'tableau de bord étranger'],
        role: 'foreigner',
        description: 'Tableau de bord résident étranger'
    },

    // ========== MUNICIPAL STAFF - DIRECTION ==========
    {
        path: '/dashboard/maire',
        aliases: ['cockpit', 'espace maire', 'cockpit maire', 'tableau de bord maire', 'direction', 'pilotage'],
        role: 'maire',
        description: 'Cockpit du Maire'
    },
    {
        path: '/dashboard/sg',
        aliases: ['secrétariat', 'secrétaire général', 'espace sg', 'coordination'],
        role: 'secretaire_general',
        description: 'Espace Secrétaire Général'
    },
    {
        path: '/dashboard/chef-service',
        aliases: ['espace chef', 'mon service', 'chef de service', 'gestion service'],
        role: 'chef_service',
        description: 'Espace Chef de Service'
    },

    // ========== AGENT DASHBOARD ==========
    {
        path: '/dashboard/agent',
        aliases: ['espace agent', 'tableau de bord agent', 'dashboard agent', 'mon espace agent', 'guichet'],
        role: 'agent',
        description: 'Tableau de bord agent'
    },
    {
        path: '/dashboard/agent/requests',
        aliases: ['demandes agent', 'requêtes agent', 'agent requests', 'traitement demandes', 'dossiers à traiter', 'demandes en cours', 'dossiers en cours'],
        role: 'agent',
        description: 'Demandes à traiter'
    },
    {
        path: '/dashboard/agent/appointments',
        aliases: ['rendez-vous', 'rdv', 'appointments', 'agenda', 'planning', 'calendrier'],
        role: 'agent',
        description: 'Gestion des rendez-vous'
    },

    // ========== ADMIN DASHBOARD ==========
    {
        path: '/admin',
        aliases: ['admin', 'administration', 'espace admin', 'dashboard admin', 'back office'],
        role: 'admin',
        description: 'Espace administration'
    },
    {
        path: '/dashboard/admin/agents',
        aliases: ['agents', 'personnel', 'gestion agents', 'liste agents', 'équipe', 'collaborateurs', 'employés', 'mes agents', 'mon équipe'],
        role: 'admin',
        description: 'Gestion des agents/personnel'
    },
    {
        path: '/dashboard/admin/settings',
        aliases: ['paramètres mairie', 'configuration mairie', 'settings admin', 'paramètres admin', 'configuration'],
        role: 'admin',
        description: 'Paramètres de la mairie'
    },

    // ========== SUPER ADMIN DASHBOARD ==========
    {
        path: '/dashboard/super-admin',
        aliases: ['super admin', 'superadmin', 'admin national', 'tableau de bord national', 'réseau mairies'],
        role: 'super_admin',
        description: 'Tableau de bord Super Admin'
    },
    {
        path: '/dashboard/super-admin/organizations',
        aliases: ['organisations', 'orgs', 'gestion organisations', 'mairies', 'liste mairies', 'réseau'],
        role: 'super_admin',
        description: 'Gestion des mairies'
    },
    {
        path: '/dashboard/super-admin/users',
        aliases: ['utilisateurs', 'users', 'gestion utilisateurs', 'comptes', 'tous les utilisateurs'],
        role: 'super_admin',
        description: 'Gestion des utilisateurs nationaux'
    },
    {
        path: '/dashboard/super-admin/services',
        aliases: ['services admin', 'gestion services', 'services super admin', 'catalogue admin'],
        role: 'super_admin',
        description: 'Gestion des services (Super Admin)'
    },
    {
        path: '/dashboard/super-admin/settings',
        aliases: ['paramètres super admin', 'paramètres système', 'configuration système', 'settings système'],
        role: 'super_admin',
        description: 'Paramètres système'
    },
    {
        path: '/dashboard/super-admin/analytics',
        aliases: ['analytics', 'statistiques', 'analytique', 'rapports', 'métriques', 'indicateurs'],
        role: 'super_admin',
        description: 'Statistiques et analytiques'
    },
    {
        path: '/dashboard/super-admin/iasted',
        aliases: ['ia', 'iasted config', 'configuration ia', 'intelligence artificielle', 'agent ia'],
        role: 'super_admin',
        description: 'Configuration iAsted (IA)'
    },
    {
        path: '/dashboard/super-admin/knowledge-base',
        aliases: ['base de connaissance', 'knowledge base', 'documentation', 'base documentaire', 'savoir'],
        role: 'super_admin',
        description: 'Base de connaissance'
    },

    // ========== SERVICES CATALOG ==========
    {
        path: '/dashboard/services',
        aliases: ['services catalogue', 'catalogue services dashboard', 'services disponibles'],
        description: 'Catalogue des services (dans dashboard)'
    },

    // ========== MESSAGING (iBoîte) ==========
    {
        path: '/iboite',
        aliases: ['iboîte', 'iboite', 'messagerie', 'courrier', 'messages', 'mails', 'boîte de réception', 'inbox', 'communications'],
        description: 'iBoîte - Messagerie'
    },

    // ========== SETTINGS ==========
    {
        path: '/settings',
        aliases: ['paramètres', 'settings', 'configuration', 'réglages', 'préférences'],
        description: 'Paramètres généraux'
    },
];

/**
 * Resolve a natural language query to an actual route
 * Uses fuzzy matching on aliases with priority scoring
 */
export function resolveRoute(query: string): string | null {
    if (!query) return null;

    const normalizedQuery = query.toLowerCase().trim();
    console.log(`🔍 [resolveRoute] Searching for: "${normalizedQuery}"`);

    // Exact path match first (if user says the exact path)
    const exactPathMatch = ROUTE_MAP.find(route => route.path.toLowerCase() === normalizedQuery);
    if (exactPathMatch) {
        console.log(`✅ [resolveRoute] Exact path match: ${exactPathMatch.path}`);
        return exactPathMatch.path;
    }

    // Build a scoring system for better matches
    let bestMatch: { route: RouteInfo; score: number } | null = null;

    for (const route of ROUTE_MAP) {
        let score = 0;

        // Exact alias match (highest priority)
        for (const alias of route.aliases) {
            if (normalizedQuery === alias) {
                score = 100;
                break;
            }
            // Query contains the alias
            if (normalizedQuery.includes(alias)) {
                score = Math.max(score, 50 + alias.length);
            }
            // Alias contains the query
            if (alias.includes(normalizedQuery)) {
                score = Math.max(score, 40 + normalizedQuery.length);
            }
        }

        // Description matching (lower priority)
        if (route.description.toLowerCase().includes(normalizedQuery)) {
            score = Math.max(score, 30);
        }
        if (normalizedQuery.includes(route.description.toLowerCase())) {
            score = Math.max(score, 25);
        }

        // Update best match
        if (score > 0 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { route, score };
        }
    }

    if (bestMatch) {
        console.log(`✅ [resolveRoute] Best match: ${bestMatch.route.path} (score: ${bestMatch.score})`);
        return bestMatch.route.path;
    }

    console.log(`❌ [resolveRoute] No match found for: "${normalizedQuery}"`);
    return null;
}

/**
 * Get route information for system prompt
 */
export function getRouteKnowledgePrompt(): string {
    const routeList = ROUTE_MAP.map(route =>
        `- **${route.path}** : ${route.description}\n  Aliases: ${route.aliases.slice(0, 5).join(', ')}${route.aliases.length > 5 ? '...' : ''}`
    ).join('\n');

    return `# CARTOGRAPHIE DES ROUTES DISPONIBLES\n${routeList}\n\nIMPORTANT: Utilise TOUJOURS ces chemins exacts. Si l'utilisateur demande "page d'accueil" ou "home", utilise "/" et NON "/home".`;
}

/**
 * Get all routes for a specific role
 */
export function getRoutesForRole(role: string): RouteInfo[] {
    return ROUTE_MAP.filter(route => !route.role || route.role === role);
}
