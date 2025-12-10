import React from "react";
import { LayoutDashboard, Settings, LogOut, FileText, Building2, Users, ShieldCheck, Globe, Mail, Bot, Database, LineChart, ScrollText, Shield, UserCheck, Briefcase, BookOpen, Calendar, ClipboardList, Home, FolderOpen, Wallet, Gavel, FileSignature, CalendarDays, Building, BarChart3 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { GlobalSettings } from "@/components/GlobalSettings";
import { useDemo } from "@/contexts/DemoContext";
import { SidebarAppearance } from "@/components/SidebarAppearance";
import { MunicipalRole } from "@/types/municipal-roles";
import { LogoutConfirmDialog } from "@/components/auth/LogoutConfirmDialog";

type NavItem = { label: string; icon: React.ElementType; path: string };
type NavGroup = { title: string; items: NavItem[] };
type NavConfig = NavItem[] | NavGroup[];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    const { currentUser } = useDemo();
    const userRole = currentUser?.role as string;

    // ========== ROLE DETECTION ==========

    // Super Admin (System-wide)
    const isSuperAdmin = userRole === 'ADMIN' && currentUser?.id === 'admin-system';

    // Direction (Maire, Maire Adjoint)
    const isMaire = userRole === MunicipalRole.MAIRE;
    const isMaireAdjoint = userRole === MunicipalRole.MAIRE_ADJOINT;
    const isDirection = isMaire || isMaireAdjoint;

    // Encadrement (Secrétaire Général, Chefs de Service/Bureau)
    const isSecretaireGeneral = userRole === MunicipalRole.SECRETAIRE_GENERAL;
    const isChefService = userRole === MunicipalRole.CHEF_SERVICE;
    const isChefBureau = userRole === MunicipalRole.CHEF_BUREAU;
    const isEncadrement = isSecretaireGeneral || isChefService || isChefBureau;

    // Agents
    const isOfficierEtatCivil = userRole === MunicipalRole.AGENT_ETAT_CIVIL;
    const isAgentMunicipal = userRole === MunicipalRole.AGENT_MUNICIPAL;
    const isAgentTechnique = userRole === MunicipalRole.AGENT_TECHNIQUE;
    const isAgentAccueil = userRole === MunicipalRole.AGENT_ACCUEIL;
    const isStagiaire = userRole === MunicipalRole.STAGIAIRE;
    const isAgent = isOfficierEtatCivil || isAgentMunicipal || isAgentTechnique || isAgentAccueil || isStagiaire;

    // Usagers
    const isCitizen = userRole === MunicipalRole.CITOYEN || userRole === 'CITIZEN';
    const isForeigner = userRole === MunicipalRole.ETRANGER_RESIDENT || userRole === 'FOREIGNER';
    const isPersonneMorale = userRole === MunicipalRole.PERSONNE_MORALE;

    // ========== NAVIGATION BY ROLE ==========

    const getNavItems = (): NavConfig => {
        // Super Admin National
        if (isSuperAdmin) {
            return [
                {
                    title: "VUE D'ENSEMBLE",
                    items: [
                        { label: "Tableau de Bord", icon: LayoutDashboard, path: "/dashboard/super-admin" },
                        { label: "Analytique", icon: LineChart, path: "/dashboard/super-admin/analytics" },
                    ]
                },
                {
                    title: "GESTION OPÉRATIONNELLE",
                    items: [
                        { label: "Organisations", icon: Building2, path: "/dashboard/super-admin/organizations" },
                        { label: "Utilisateurs", icon: Users, path: "/dashboard/super-admin/users" },
                        { label: "Services", icon: FileText, path: "/dashboard/super-admin/services" },
                    ]
                },
                {
                    title: "INTELLIGENCE ARTIFICIELLE",
                    items: [
                        { label: "Configuration IA", icon: Bot, path: "/dashboard/super-admin/iasted" },
                        { label: "Base de Connaissance", icon: Database, path: "/dashboard/super-admin/knowledge-base" },
                    ]
                },
                {
                    title: "COMMUNICATION",
                    items: [
                        { label: "iBoîte", icon: Mail, path: "/iboite" },
                    ]
                },
                {
                    title: "SYSTÈME",
                    items: [
                        { label: "Paramètres", icon: Settings, path: "/dashboard/super-admin/settings" },
                        { label: "Sécurité & Logs", icon: Shield, path: "/dashboard/super-admin/settings?tab=security" },
                    ]
                }
            ];
        }

        // Maire ou Maire Adjoint
        if (isMaire || isMaireAdjoint) {
            return [
                {
                    title: "PILOTAGE",
                    items: [
                        { label: "Cockpit", icon: LayoutDashboard, path: "/dashboard/maire" },
                        { label: "Analytiques", icon: BarChart3, path: "/dashboard/maire/analytics" },
                        { label: "Budget", icon: Wallet, path: "/dashboard/maire/budget" },
                    ]
                },
                {
                    title: "GOUVERNANCE",
                    items: [
                        { label: "Délibérations", icon: Gavel, path: "/dashboard/maire/deliberations" },
                        { label: "Arrêtés", icon: FileSignature, path: "/dashboard/maire/arretes" },
                        { label: "Agenda", icon: CalendarDays, path: "/dashboard/maire/agenda" },
                    ]
                },
                {
                    title: "GESTION MUNICIPALE",
                    items: [
                        { label: "Demandes", icon: ClipboardList, path: "/dashboard/agent/requests" },
                        { label: "Services", icon: FileText, path: "/dashboard/services" },
                        { label: "Personnel", icon: Users, path: "/dashboard/admin/agents" },
                        { label: "Rendez-vous", icon: Calendar, path: "/dashboard/agent/appointments" },
                    ]
                },
                {
                    title: "DOMAINES",
                    items: [
                        { label: "Urbanisme", icon: Building, path: "/dashboard/maire/urbanisme" },
                        { label: "État Civil", icon: BookOpen, path: "/dashboard/agent/requests?type=etat-civil" },
                    ]
                },
                {
                    title: "DOCUMENTS",
                    items: [
                        { label: "Mes Documents", icon: FolderOpen, path: "/dashboard/maire/documents" },
                    ]
                },
                {
                    title: "COMMUNICATION",
                    items: [
                        { label: "iBoîte", icon: Mail, path: "/iboite" },
                        { label: "Notifications", icon: BarChart3, path: "/dashboard/maire/communications" },
                    ]
                },
                {
                    title: "ADMINISTRATION",
                    items: [
                        { label: "Paramètres Mairie", icon: Settings, path: "/dashboard/admin/settings" },
                    ]
                }
            ];
        }

        // Secrétaire Général
        if (isSecretaireGeneral) {
            return [
                {
                    title: "COORDINATION",
                    items: [
                        { label: "Tableau de Bord", icon: LayoutDashboard, path: "/dashboard/sg" },
                        { label: "Suivi Dossiers", icon: ClipboardList, path: "/dashboard/agent/requests" },
                    ]
                },
                {
                    title: "RESSOURCES HUMAINES",
                    items: [
                        { label: "Personnel", icon: Users, path: "/dashboard/admin/agents" },
                        { label: "Planning", icon: Calendar, path: "/dashboard/agent/appointments" },
                    ]
                },
                {
                    title: "COMMUNICATION",
                    items: [
                        { label: "iBoîte", icon: Mail, path: "/iboite" },
                    ]
                }
            ];
        }

        // Chef de Service / Chef de Bureau
        if (isChefService || isChefBureau) {
            return [
                {
                    title: "MON SERVICE",
                    items: [
                        { label: "Tableau de Bord", icon: LayoutDashboard, path: "/dashboard/chef-service" },
                        { label: "Dossiers Équipe", icon: ClipboardList, path: "/dashboard/agent/requests" },
                        { label: "Mon Équipe", icon: Users, path: "/dashboard/admin/agents" },
                    ]
                },
                {
                    title: "PLANIFICATION",
                    items: [
                        { label: "Rendez-vous", icon: Calendar, path: "/dashboard/agent/appointments" },
                        { label: "iBoîte", icon: Mail, path: "/iboite" },
                    ]
                }
            ];
        }

        // Officier d'État Civil
        if (isOfficierEtatCivil) {
            return [
                { label: "Mon Espace", icon: LayoutDashboard, path: "/dashboard/agent" },
                { label: "Actes d'État Civil", icon: BookOpen, path: "/dashboard/agent/requests?type=etat-civil" },
                { label: "Célébrations", icon: Calendar, path: "/dashboard/agent/appointments" },
                { label: "Registres", icon: ScrollText, path: "/dashboard/agent/registres" },
                { label: "iBoîte", icon: Mail, path: "/iboite" },
            ];
        }

        // Agent Municipal / Agent Technique
        if (isAgentMunicipal || isAgentTechnique) {
            return [
                { label: "Mon Espace", icon: LayoutDashboard, path: "/dashboard/agent" },
                { label: "Dossiers en cours", icon: ClipboardList, path: "/dashboard/agent/requests" },
                { label: "Rendez-vous", icon: Calendar, path: "/dashboard/agent/appointments" },
                { label: "iBoîte", icon: Mail, path: "/iboite" },
            ];
        }

        // Agent d'Accueil
        if (isAgentAccueil) {
            return [
                { label: "Accueil", icon: Home, path: "/dashboard/agent" },
                { label: "File d'Attente", icon: Users, path: "/dashboard/agent/queue" },
                { label: "Orientation", icon: Briefcase, path: "/dashboard/agent/orientation" },
                { label: "iBoîte", icon: Mail, path: "/iboite" },
            ];
        }

        // Stagiaire
        if (isStagiaire) {
            return [
                { label: "Mon Espace", icon: LayoutDashboard, path: "/dashboard/agent" },
                { label: "Tâches Assignées", icon: ClipboardList, path: "/dashboard/agent/requests?assigned=me" },
                { label: "Formation", icon: BookOpen, path: "/dashboard/formation" },
                { label: "iBoîte", icon: Mail, path: "/iboite" },
            ];
        }

        // Étranger Résident
        if (isForeigner) {
            return [
                { label: "Tableau de Bord", icon: LayoutDashboard, path: "/dashboard/foreigner" },
                { label: "Mes Demandes", icon: FileText, path: "/dashboard/foreigner/requests" },
                { label: "Mes Documents", icon: ShieldCheck, path: "/dashboard/foreigner/documents" },
                { label: "iBoîte", icon: Mail, path: "/iboite" },
            ];
        }

        // Personne Morale (fallback to citizen nav)
        if (isPersonneMorale) {
            return [
                { label: "Tableau de Bord", icon: LayoutDashboard, path: "/dashboard/citizen" },
                { label: "Mes Demandes", icon: FileText, path: "/dashboard/citizen/requests" },
                { label: "Mes Documents", icon: ShieldCheck, path: "/dashboard/citizen/documents" },
                { label: "iBoîte", icon: Mail, path: "/iboite" },
            ];
        }

        // Citoyen (Default)
        return [
            { label: "Tableau de Bord", icon: LayoutDashboard, path: "/dashboard/citizen" },
            { label: "Mes Demandes", icon: FileText, path: "/dashboard/citizen/requests" },
            { label: "Mes Documents", icon: ShieldCheck, path: "/dashboard/citizen/documents" },
            { label: "Associations", icon: Users, path: "/dashboard/citizen/associations" },
            { label: "Entreprises", icon: Building2, path: "/dashboard/citizen/companies" },
            { label: "Mon CV", icon: FileText, path: "/dashboard/citizen/cv" },
            { label: "iBoîte", icon: Mail, path: "/iboite" },
        ];
    };

    const navItems = getNavItems();
    const isGroupedNav = navItems.length > 0 && 'title' in navItems[0];

    // Sidebar header based on role
    const getSidebarHeader = () => {
        if (isSuperAdmin) return { title: "MAIRIES.GA", subtitle: "Administration Nationale" };
        if (isMaire) return { title: "HÔTEL DE VILLE", subtitle: "Espace du Maire" };
        if (isMaireAdjoint) return { title: "HÔTEL DE VILLE", subtitle: "Maire Adjoint" };
        if (isSecretaireGeneral) return { title: "SECRÉTARIAT", subtitle: "Secrétaire Général" };
        if (isChefService) return { title: "SERVICE", subtitle: "Chef de Service" };
        if (isChefBureau) return { title: "BUREAU", subtitle: "Chef de Bureau" };
        if (isOfficierEtatCivil) return { title: "ÉTAT CIVIL", subtitle: "Officier" };
        if (isAgentMunicipal || isAgentTechnique) return { title: "MAIRIE", subtitle: "Agent Municipal" };
        if (isAgentAccueil) return { title: "ACCUEIL", subtitle: "Agent d'Accueil" };
        if (isStagiaire) return { title: "MAIRIE", subtitle: "Stagiaire" };
        if (isForeigner) return { title: "MAIRIE", subtitle: "Espace Résident" };
        if (isPersonneMorale) return { title: "MAIRIE", subtitle: "Espace Pro" };
        return { title: "MAIRIE", subtitle: "Espace Citoyen" };
    };

    const header = getSidebarHeader();

    return (
        <div className="min-h-screen bg-background p-4 md:p-6 font-sans theme-neumorphic">
            <div className="flex gap-6 max-w-[1600px] mx-auto">

                {/* Sidebar Détachée */}
                <aside className="neu-card w-64 flex-shrink-0 p-6 flex flex-col min-h-[calc(100vh-3rem)] sticky top-6 h-[calc(100vh-3rem)]">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="neu-raised w-12 h-12 rounded-full flex items-center justify-center text-primary">
                            <span className="font-bold text-xl">{header.title.charAt(0)}</span>
                        </div>
                        <div>
                            <div className="font-bold text-sm">{header.title}</div>
                            <div className="text-xs text-muted-foreground">{header.subtitle}</div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto pr-2 no-scrollbar">
                        {isGroupedNav ? (
                            // Grouped Navigation
                            (navItems as NavGroup[]).map((group, idx) => (
                                <div key={idx} className="mb-8 last:mb-0">
                                    <h3 className="px-3 mb-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                                        {group.title}
                                    </h3>
                                    <div className="space-y-3">
                                        {group.items.map((item) => (
                                            <button
                                                key={item.path}
                                                onClick={() => navigate(item.path)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive(item.path)
                                                    ? 'neu-nav-item active text-primary font-bold'
                                                    : 'neu-nav-item text-foreground/80 hover:text-primary'
                                                    }`}
                                            >
                                                <item.icon className="w-4 h-4 flex-shrink-0" />
                                                <span className="truncate">{item.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            // Flat Navigation
                            <div className="space-y-3">
                                {(navItems as NavItem[]).map((item) => (
                                    <button
                                        key={item.path}
                                        onClick={() => navigate(item.path)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive(item.path)
                                            ? 'neu-nav-item active text-primary font-bold'
                                            : 'neu-nav-item text-foreground/80 hover:text-primary'
                                            }`}
                                    >
                                        <item.icon className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Paramètres pour tous sauf Super Admin */}
                        {!isSuperAdmin && !isGroupedNav && (
                            <>
                                <div className="my-6 border-t border-gray-200/30"></div>
                                <button
                                    onClick={() => {
                                        if (isCitizen) navigate('/dashboard/citizen/settings');
                                        else navigate('/settings');
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${(isCitizen && isActive('/dashboard/citizen/settings'))
                                        ? 'neu-nav-item active text-primary font-bold'
                                        : 'neu-nav-item text-foreground/80 hover:text-primary'
                                        }`}
                                >
                                    <Settings className="w-4 h-4 flex-shrink-0" />
                                    <span>Paramètres</span>
                                </button>
                            </>
                        )}
                    </nav>

                    {/* Footer Sidebar */}
                    <div className="pt-4 border-t border-border/40 mt-auto space-y-3">
                        <SidebarAppearance />
                        <LogoutConfirmDialog>
                            <button
                                className="neu-nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:text-destructive transition-all"
                            >
                                <LogOut className="w-4 h-4 flex-shrink-0" />
                                <span>Déconnexion</span>
                            </button>
                        </LogoutConfirmDialog>
                    </div>
                </aside>

                {/* Contenu Principal */}
                <main className="flex-1 min-w-0">
                    <div className="neu-card p-8 min-h-[calc(100vh-3rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
