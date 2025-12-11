import { Building2, FileText, Users, Globe, Activity, Plus, ShieldCheck, Settings, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { LoginAttemptsMonitor } from "@/components/dashboard/admin/LoginAttemptsMonitor";
import { AuditSummaryWidget } from "@/components/dashboard/admin/AuditSummaryWidget";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Organization, OrganizationType } from "@/types/organization";
import { organizationService } from "@/services/organizationService";
import { profileService, Profile } from "@/services/profileService";
import { ConsularRole } from "@/types/consular-roles";
import { COUNTRY_FLAGS } from "@/types/entity";
import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ITEMS_PER_PAGE = 5;

const variants = {
    enter: (direction: number) => {
        return {
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        };
    },
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => {
        return {
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        };
    }
};

export default function SuperAdminDashboard() {
    const navigate = useNavigate();
    const [page, setPage] = useState(0);
    const [direction, setDirection] = useState(0);
    const [entities, setEntities] = useState<Organization[]>([]);
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    // Global Search State
    const [globalSearch, setGlobalSearch] = useState("");
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [orgsData, usersData] = await Promise.all([
                    organizationService.getAll(),
                    profileService.getAll()
                ]);
                setEntities(orgsData);
                setUsers(usersData);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Global Search Logic
    const searchResults = useMemo(() => {
        if (!globalSearch || globalSearch.length < 2) return { users: [], entities: [] };

        const lowerTerm = globalSearch.toLowerCase();

        const filteredUsers = users.filter(u =>
            (u.first_name + " " + u.last_name).toLowerCase().includes(lowerTerm) ||
            u.email?.toLowerCase().includes(lowerTerm)
        ).slice(0, 5);

        const filteredEntities = entities.filter(e =>
            e.name.toLowerCase().includes(lowerTerm) ||
            e.metadata?.city?.toLowerCase().includes(lowerTerm) ||
            e.metadata?.country?.toLowerCase().includes(lowerTerm)
        ).slice(0, 5);

        return { users: filteredUsers, entities: filteredEntities };
    }, [globalSearch, users, entities]);

    // Calculate Real Stats
    const totalEntities = entities.length;
    const totalUsers = users.length;
    const uniqueCountries = new Set(entities.map(e => e.metadata?.countryCode).filter(Boolean)).size;
    const totalConsuls = users.filter(u => u.role === 'maire' || u.role === 'maire_adjoint' || u.role === ConsularRole.CONSUL_GENERAL || u.role === ConsularRole.CONSUL).length;

    const totalPages = Math.ceil(totalEntities / ITEMS_PER_PAGE);
    const startIndex = page * ITEMS_PER_PAGE;
    const paginatedEntities = entities.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection][0]);
        setDirection(newDirection);
    };

    const stats = [
        { label: "Organisations", value: totalEntities, icon: Building2, color: "text-blue-600" },
        { label: "Pays Couverts", value: uniqueCountries, icon: Globe, color: "text-orange-600" },
        { label: "Utilisateurs Total", value: totalUsers, icon: Users, color: "text-purple-600" },
        { label: "Consuls & Chefs", value: totalConsuls, icon: ShieldCheck, color: "text-green-600" },
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* Main Container - Mobile first spacing */}
            <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative">
                
                {/* Header Section - Stack on mobile, row on md+ */}
                <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:justify-between lg:items-center">
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
                            Super Admin
                        </h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                            Vue d'ensemble et administration du réseau consulaire
                        </p>
                    </div>

                    {/* Global Search Bar - Full width mobile, fixed width desktop */}
                    <div className="relative w-full lg:w-80 xl:w-96" ref={searchRef}>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Recherche globale..."
                                className="pl-9 pr-9 neu-inset w-full text-sm"
                                value={globalSearch}
                                onChange={(e) => {
                                    setGlobalSearch(e.target.value);
                                    setShowResults(true);
                                }}
                                onFocus={() => setShowResults(true)}
                            />
                            {globalSearch && (
                                <button
                                    onClick={() => { setGlobalSearch(""); setShowResults(false); }}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        <AnimatePresence>
                            {showResults && globalSearch.length >= 2 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 right-0 mt-2 z-50"
                                >
                                    <Card className="neu-raised shadow-xl border-primary/20">
                                        <CardContent className="p-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                                            {searchResults.users.length === 0 && searchResults.entities.length === 0 ? (
                                                <div className="p-4 text-center text-muted-foreground text-xs sm:text-sm">
                                                    Aucun résultat trouvé.
                                                </div>
                                            ) : (
                                                <>
                                                    {searchResults.entities.length > 0 && (
                                                        <div className="mb-2">
                                                            <h4 className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase px-2 py-1">Organisations</h4>
                                                            {searchResults.entities.map(entity => (
                                                                <div
                                                                    key={entity.id}
                                                                    className="flex items-center gap-2 sm:gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                                                                    onClick={() => navigate(`/dashboard/super-admin/organizations/${entity.id}`)}
                                                                >
                                                                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                                                        <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="text-xs sm:text-sm font-medium truncate">{entity.name}</div>
                                                                        <div className="text-[10px] sm:text-xs text-muted-foreground truncate">{entity.metadata?.city}, {entity.metadata?.country}</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {searchResults.users.length > 0 && (
                                                        <div>
                                                            <h4 className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase px-2 py-1">Utilisateurs</h4>
                                                            {searchResults.users.map(user => (
                                                                <div
                                                                    key={user.id}
                                                                    className="flex items-center gap-2 sm:gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                                                                    onClick={() => navigate(`/dashboard/super-admin/users?search=${user.last_name}`)}
                                                                >
                                                                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                                                                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="text-xs sm:text-sm font-medium truncate">{user.first_name} {user.last_name}</div>
                                                                        <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 flex-wrap">
                                                                            <Badge variant="outline" className="text-[9px] sm:text-[10px] h-4 px-1">{user.role || 'citizen'}</Badge>
                                                                            <span className="truncate">{user.email}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* STATS GRID - 2 cols on mobile, 4 cols on lg+ */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
                    {stats.map((stat) => (
                        <div key={stat.label} className="neu-raised p-3 sm:p-4 lg:p-6 rounded-xl flex items-center gap-2 sm:gap-3 lg:gap-4">
                            <div className="neu-inset p-2 sm:p-2.5 lg:p-3 rounded-full shrink-0">
                                <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${stat.color}`} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] sm:text-xs lg:text-sm font-medium text-muted-foreground truncate">{stat.label}</p>
                                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{stat.value}</h3>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid - Stack on mobile, 3 cols on lg+ */}
                <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
                    
                    {/* ENTITY MANAGEMENT - Full width mobile, 2/3 desktop */}
                    <div className="lg:col-span-2 space-y-3 sm:space-y-4 lg:space-y-6">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-foreground flex items-center gap-2 min-w-0">
                                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                                <span className="truncate">Réseau Diplomatique</span>
                            </h2>
                            <button className="neu-raised px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold text-primary flex items-center gap-1 shrink-0">
                                <Plus className="w-3 h-3" />
                                <span className="hidden sm:inline">Ajouter</span>
                            </button>
                        </div>

                        {/* Mobile: Card Stack / Desktop: Table */}
                        <div className="neu-raised rounded-xl overflow-hidden">
                            {/* Mobile Card View */}
                            <div className="block lg:hidden divide-y divide-border">
                                {paginatedEntities.map((entity) => (
                                    <div key={entity.id} className="p-3 sm:p-4 space-y-2 hover:bg-muted/30 transition-colors">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-sm font-medium text-foreground truncate">{entity.name}</h4>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    <span className="mr-1">{COUNTRY_FLAGS[entity.metadata?.countryCode || ''] || '🌐'}</span>
                                                    {entity.metadata?.city}, {entity.metadata?.country}
                                                </p>
                                            </div>
                                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-[10px] shrink-0">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400"></span>
                                                ACTIVE
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                                entity.type === OrganizationType.AMBASSADE ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                                entity.type === OrganizationType.CONSULAT_GENERAL ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                                entity.type === OrganizationType.CONSULAT ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                                                'bg-muted text-muted-foreground'
                                            }`}>
                                                {entity.type.replace(/_/g, ' ')}
                                            </span>
                                            <button className="text-primary text-xs font-medium hover:underline">Gérer</button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full text-sm text-left min-w-[600px]">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
                                        <tr>
                                            <th className="px-4 xl:px-6 py-3">Entité</th>
                                            <th className="px-4 xl:px-6 py-3">Type</th>
                                            <th className="px-4 xl:px-6 py-3">Ville/Pays</th>
                                            <th className="px-4 xl:px-6 py-3">Statut</th>
                                            <th className="px-4 xl:px-6 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <AnimatePresence mode="wait" custom={direction}>
                                        <motion.tbody
                                            key={page}
                                            custom={direction}
                                            variants={variants}
                                            initial="enter"
                                            animate="center"
                                            exit="exit"
                                            transition={{
                                                x: { type: "spring", stiffness: 300, damping: 30 },
                                                opacity: { duration: 0.2 }
                                            }}
                                            className="divide-y divide-border/50"
                                        >
                                            {paginatedEntities.map((entity) => (
                                                <tr key={entity.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 xl:px-6 py-4 font-medium text-foreground">
                                                        {entity.name}
                                                    </td>
                                                    <td className="px-4 xl:px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            entity.type === OrganizationType.AMBASSADE ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                                            entity.type === OrganizationType.CONSULAT_GENERAL ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                                            entity.type === OrganizationType.CONSULAT ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                                                            'bg-muted text-muted-foreground'
                                                        }`}>
                                                            {entity.type.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 xl:px-6 py-4 text-muted-foreground">
                                                        <span className="mr-2">{COUNTRY_FLAGS[entity.metadata?.countryCode || ''] || '🌐'}</span>
                                                        {entity.metadata?.city}, {entity.metadata?.country}
                                                    </td>
                                                    <td className="px-4 xl:px-6 py-4">
                                                        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-400"></span>
                                                            ACTIVE
                                                        </span>
                                                    </td>
                                                    <td className="px-4 xl:px-6 py-4 text-right">
                                                        <button className="text-primary hover:underline font-medium">Gérer</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </motion.tbody>
                                    </AnimatePresence>
                                </table>
                            </div>

                            {/* Pagination Controls - Responsive */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-t border-border bg-muted/20">
                                <div className="text-[10px] sm:text-xs text-muted-foreground order-2 sm:order-1">
                                    {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, totalEntities)} sur {totalEntities}
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
                                    <button
                                        onClick={() => paginate(-1)}
                                        disabled={page === 0}
                                        className="p-1.5 sm:p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-xs sm:text-sm font-medium px-2 text-foreground">
                                        {page + 1}/{totalPages}
                                    </span>
                                    <button
                                        onClick={() => paginate(1)}
                                        disabled={page === totalPages - 1}
                                        className="p-1.5 sm:p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SIDEBAR WIDGETS - Full width mobile, 1/3 desktop */}
                    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
                        <LoginAttemptsMonitor />
                        <AuditSummaryWidget />
                        
                        {/* Maintenance Widget */}
                        <div className="neu-raised rounded-xl p-4 sm:p-5 lg:p-6">
                            <h3 className="font-bold mb-3 sm:mb-4 text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">
                                Maintenance
                            </h3>
                            <div className="space-y-2 sm:space-y-3">
                                <div className="flex justify-between items-center text-xs sm:text-sm">
                                    <span className="text-muted-foreground">État du Serveur</span>
                                    <span className="text-green-600 dark:text-green-400 font-bold">Opérationnel</span>
                                </div>
                                <div className="flex justify-between items-center text-xs sm:text-sm">
                                    <span className="text-muted-foreground">Base de Données</span>
                                    <span className="text-green-600 dark:text-green-400 font-bold">Connecté</span>
                                </div>
                                <div className="flex justify-between items-center text-xs sm:text-sm">
                                    <span className="text-muted-foreground">Dernière Sauvegarde</span>
                                    <span className="text-muted-foreground">Il y a 12h</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
