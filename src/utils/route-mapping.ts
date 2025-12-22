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

    // ========== MUNICIPAL STAFF - MAIRE ==========
    {
        path: '/dashboard/maire',
        aliases: ['cockpit', 'espace maire', 'cockpit maire', 'tableau de bord maire', 'direction', 'pilotage', 'accueil maire', 'mon espace'],
        role: 'maire',
        description: 'Cockpit du Maire'
    },
    {
        path: '/dashboard/maire/budget',
        aliases: ['budget', 'finances', 'gestion budgétaire', 'budget municipal', 'trésorerie', 'finances municipales', 'section budget', 'page budget'],
        role: 'maire',
        description: 'Gestion du budget municipal'
    },
    {
        path: '/dashboard/maire/deliberations',
        aliases: ['délibérations', 'deliberations', 'conseil municipal', 'décisions', 'votes', 'séances'],
        role: 'maire',
        description: 'Délibérations du conseil municipal'
    },
    {
        path: '/dashboard/maire/arretes',
        aliases: ['arrêtés', 'arretes', 'arrêtés municipaux', 'décrets', 'ordonnances'],
        role: 'maire',
        description: 'Arrêtés municipaux'
    },
    {
        path: '/dashboard/maire/analytics',
        aliases: ['statistiques maire', 'analytics maire', 'indicateurs', 'métriques municipales', 'tableau de bord analytique'],
        role: 'maire',
        description: 'Statistiques et indicateurs'
    },
    {
        path: '/dashboard/maire/agenda',
        aliases: ['agenda maire', 'calendrier maire', 'planning maire', 'rendez-vous maire', 'emploi du temps'],
        role: 'maire',
        description: 'Agenda du Maire'
    },
    {
        path: '/dashboard/maire/urbanisme',
        aliases: ['urbanisme', 'permis de construire', 'construction', 'aménagement', 'plan local', 'PLU'],
        role: 'maire',
        description: 'Urbanisme et permis'
    },
    {
        path: '/dashboard/maire/documents',
        aliases: ['documents maire', 'archives', 'dossiers officiels', 'documents officiels'],
        role: 'maire',
        description: 'Documents officiels'
    },
    {
        path: '/dashboard/maire/communications',
        aliases: ['communications', 'presse', 'médias', 'actualités mairie', 'communiqués'],
        role: 'maire',
        description: 'Communications officielles'
    },
    {
        path: '/dashboard/maire/contacts',
        aliases: ['contacts maire', 'annuaire mairie', 'répertoire'],
        role: 'maire',
        description: 'Annuaire des contacts'
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
        aliases: ['rendez-vous agent', 'rdv agent', 'appointments', 'agenda agent', 'planning agent', 'calendrier agent'],
        role: 'agent',
        description: 'Gestion des rendez-vous'
    },

    // ========== ADMIN DASHBOARD (pour les directeurs, pas le Maire) ==========
    {
        path: '/admin',
        aliases: ['admin', 'administration', 'espace admin', 'dashboard admin', 'back office'],
        role: 'admin',
        description: 'Espace administration technique'
    },
    {
        path: '/dashboard/admin/agents',
        aliases: ['gestion agents admin', 'personnel admin'],
        role: 'admin',
        description: 'Gestion des agents (Admin)'
    },
    {
        path: '/dashboard/admin/settings',
        aliases: ['paramètres admin', 'configuration admin'],
        role: 'admin',
        description: 'Paramètres (Admin)'
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
 * IMPORTANT: Prend en compte le rôle de l'utilisateur et la route actuelle
 */
export function resolveRoute(query: string, userRole?: string, currentPath?: string): string | null {
    if (!query) return null;

    const normalizedQuery = query.toLowerCase().trim();
    console.log(`🔍 [resolveRoute] Searching for: "${normalizedQuery}", role: ${userRole}, currentPath: ${currentPath}`);

    // Détecter le contexte à partir de la route actuelle si le rôle n'est pas fourni
    const effectiveRole = userRole || detectRoleFromPath(currentPath);
    console.log(`🔍 [resolveRoute] Effective role: ${effectiveRole}`);

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

        // BONUS: Si la route correspond au rôle de l'utilisateur, augmenter le score
        if (score > 0 && route.role && effectiveRole) {
            if (route.role === effectiveRole || 
                (effectiveRole === 'maire' && route.role === 'maire') ||
                (effectiveRole === 'admin' && route.path.startsWith('/dashboard/maire'))) {
                // Si l'utilisateur est maire ou admin sur le dashboard maire, prioriser les routes maire
                score += 50;
                console.log(`📈 [resolveRoute] Bonus role match: ${route.path} +50`);
            }
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
 * Détecte le rôle à partir du chemin actuel
 */
function detectRoleFromPath(path?: string): string | null {
    if (!path) return null;
    
    if (path.startsWith('/dashboard/maire')) return 'maire';
    if (path.startsWith('/dashboard/super-admin')) return 'super_admin';
    if (path.startsWith('/dashboard/agent')) return 'agent';
    if (path.startsWith('/dashboard/citizen')) return 'citizen';
    if (path.startsWith('/dashboard/admin') || path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/dashboard/foreigner')) return 'foreigner';
    
    return null;
}

/**
 * Get route information for system prompt
 * Génère une liste de routes adaptée au rôle de l'utilisateur
 */
export function getRouteKnowledgePrompt(userRole?: string): string {
    // Filtrer les routes selon le rôle si fourni
    const filteredRoutes = userRole 
        ? ROUTE_MAP.filter(route => !route.role || route.role === userRole || route.role === 'public')
        : ROUTE_MAP;

    const routeList = filteredRoutes.map(route =>
        `- **${route.path}** : ${route.description}\n  Aliases: ${route.aliases.slice(0, 5).join(', ')}${route.aliases.length > 5 ? '...' : ''}`
    ).join('\n');

    return `# CARTOGRAPHIE DES ROUTES DISPONIBLES\n${routeList}\n\nIMPORTANT: Utilise TOUJOURS ces chemins exacts. NE JAMAIS inventer de routes comme /dashboard/admin/budget. Si l'utilisateur demande "budget", utilise la route correspondante à son rôle.`;
}

/**
 * Get all routes for a specific role
 */
export function getRoutesForRole(role: string): RouteInfo[] {
    return ROUTE_MAP.filter(route => !route.role || route.role === role);
}

/**
 * Résout une destination en tenant compte du contexte du Maire
 * IMPORTANT: Cette fonction est utilisée pour éviter les erreurs de navigation
 */
export function resolveRouteForMaire(query: string): string | null {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Mapping direct pour les sections du Maire
    const maireRouteMap: Record<string, string> = {
        'budget': '/dashboard/maire/budget',
        'finances': '/dashboard/maire/budget',
        'délibérations': '/dashboard/maire/deliberations',
        'deliberations': '/dashboard/maire/deliberations',
        'arrêtés': '/dashboard/maire/arretes',
        'arretes': '/dashboard/maire/arretes',
        'urbanisme': '/dashboard/maire/urbanisme',
        'agenda': '/dashboard/maire/agenda',
        'calendrier': '/dashboard/maire/agenda',
        'statistiques': '/dashboard/maire/analytics',
        'analytics': '/dashboard/maire/analytics',
        'documents': '/dashboard/maire/documents',
        'communications': '/dashboard/maire/communications',
        'contacts': '/dashboard/maire/contacts',
        'accueil': '/dashboard/maire',
        'cockpit': '/dashboard/maire',
        'tableau de bord': '/dashboard/maire',
    };
    
    for (const [keyword, path] of Object.entries(maireRouteMap)) {
        if (normalizedQuery.includes(keyword)) {
            console.log(`✅ [resolveRouteForMaire] Direct match: "${keyword}" → ${path}`);
            return path;
        }
    }
    
    return null;
}
