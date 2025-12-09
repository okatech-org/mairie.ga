import { Building2, Plus, Search, MapPin, Globe, Settings, LayoutDashboard, Users, Flag } from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { COUNTRY_FLAGS, Organization, OrganizationType } from "@/types/organization";
import { useState, useEffect } from "react";
import { OrganizationDialog } from "@/components/super-admin/OrganizationDialog";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { organizationService } from "@/services/organizationService";
import { Badge } from "@/components/ui/badge";

export default function SuperAdminOrganizations() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedEntity, setSelectedEntity] = useState<Organization | null>(null);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterProvince, setFilterProvince] = useState<string>("all");

    useEffect(() => {
        loadOrganizations();
    }, []);

    const loadOrganizations = async () => {
        try {
            const data = await organizationService.getAll();
            setOrganizations(data);
        } catch (error) {
            console.error("Failed to load organizations", error);
            toast({
                title: "Erreur",
                description: "Impossible de charger les organisations.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Get unique provinces for filtering
    const uniqueProvinces = [...new Set(organizations.map(o =>
        (o.metadata as any)?.province
    ).filter(Boolean))].sort();

    const filteredEntities = organizations.filter(entity => {
        const matchesSearch = entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ((entity.metadata as any)?.city && (entity.metadata as any).city.toLowerCase().includes(searchTerm.toLowerCase())) ||
            ((entity.metadata as any)?.province && (entity.metadata as any).province.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesProvince = filterProvince === "all" || (entity.metadata as any)?.province === filterProvince;

        return matchesSearch && matchesProvince;
    });

    const handleAdd = () => {
        setSelectedEntity(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (entity: Organization) => {
        setSelectedEntity(entity);
        setIsDialogOpen(true);
    };

    const handleSave = async (data: Partial<Organization> & { adminUser?: { email: string; firstName: string; lastName: string } }) => {
        try {
            if (selectedEntity) {
                await organizationService.update(selectedEntity.id, data as any);
                toast({
                    title: "Organisation modifiée",
                    description: `L'organisation ${data.name} a été mise à jour.`,
                });
            } else {
                // For creation, we need to ensure type is set
                if (!data.type) data.type = OrganizationType.AMBASSADE;

                // 1. Create Organization
                const newOrg = await organizationService.create(data as any);

                // 2. Handle Admin User Creation (Mock/Stub)
                if (data.adminUser && data.adminUser.email) {
                    console.log("[SuperAdmin] Creating Admin User for Org:", newOrg.id, data.adminUser);
                    toast({
                        title: "Organisation et Admin créés",
                        description: `L'organisation ${data.name} est créée. Un e-mail d'invitation serait envoyé à ${data.adminUser.email}.`,
                        duration: 6000,
                    });
                } else {
                    toast({
                        title: "Organisation créée",
                        description: `L'organisation ${data.name} a été créée avec succès.`,
                    });
                }
            }
            loadOrganizations();
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Failed to save organization", error);
            toast({
                title: "Erreur",
                description: "Une erreur est survenue lors de l'enregistrement.",
                variant: "destructive"
            });
        }
    };

    // Format population
    const formatPopulation = (pop?: number) => {
        if (!pop) return "N/A";
        if (pop >= 1000000) return `${(pop / 1000000).toFixed(1)}M`;
        if (pop >= 1000) return `${(pop / 1000).toFixed(0)}K`;
        return pop.toString();
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Municipalités</h1>
                        <p className="text-muted-foreground">
                            Réseau des {organizations.length} mairies du Gabon
                        </p>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="neu-raised px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-primary hover:shadow-neo-md transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Nouvelle Mairie
                    </button>
                </div>

                {/* Filters */}
                <div className="neu-raised p-4 rounded-xl flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Rechercher une mairie, département ou province..."
                            className="w-full bg-transparent border-none focus:ring-0 pl-9 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        value={filterProvince}
                        onChange={(e) => setFilterProvince(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-background border text-sm"
                    >
                        <option value="all">Toutes les provinces</option>
                        {uniqueProvinces.map(prov => (
                            <option key={prov} value={prov}>{prov}</option>
                        ))}
                    </select>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="neu-raised p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-primary">{organizations.length}</div>
                        <div className="text-sm text-muted-foreground">Mairies</div>
                    </div>
                    <div className="neu-raised p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-green-600">{uniqueProvinces.length}</div>
                        <div className="text-sm text-muted-foreground">Provinces</div>
                    </div>
                    <div className="neu-raised p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {organizations.filter(o => (o.metadata as any)?.isCapitalProvince).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Capitales</div>
                    </div>
                    <div className="neu-raised p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-orange-600">{filteredEntities.length}</div>
                        <div className="text-sm text-muted-foreground">Affichées</div>
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="text-center py-10 text-muted-foreground">Chargement...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEntities.map((entity) => {
                            const metadata = entity.metadata as any;
                            const isCapital = metadata?.isCapitalProvince;
                            const provinceColor = metadata?.color || '#009e49';

                            return (
                                <div key={entity.id} className="neu-raised p-6 rounded-xl group hover:scale-[1.01] transition-transform flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                                            style={{ backgroundColor: provinceColor }}
                                        >
                                            {entity.name.charAt(10) || entity.name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {isCapital && (
                                                <Badge className="bg-yellow-500 text-white text-xs">
                                                    <Flag className="w-3 h-3 mr-1" />
                                                    Capitale
                                                </Badge>
                                            )}
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${entity.type === 'MAIRIE_CENTRALE'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                                }`}>
                                                {entity.type === 'MAIRIE_CENTRALE' ? 'Centrale' : 'Arrondissement'}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{entity.name}</h3>

                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                        <MapPin className="w-4 h-4" />
                                        {metadata?.city || "Département"}, {metadata?.province || "Province"}
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                        <Users className="w-4 h-4" />
                                        Population: <span className="font-medium">{formatPopulation(metadata?.population)}</span>
                                    </div>

                                    <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800 flex-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Province</span>
                                            <span
                                                className="font-medium px-2 py-0.5 rounded text-white text-xs"
                                                style={{ backgroundColor: provinceColor }}
                                            >
                                                {metadata?.province}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Personnel</span>
                                            <span className="font-bold">--</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => navigate(`/dashboard/super-admin/organizations/${entity.id}?tab=activity`)}
                                            className="neu-raised py-2 rounded-lg text-sm font-medium hover:text-primary transition-colors flex items-center justify-center gap-2"
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                            Gérer
                                        </button>
                                        <button
                                            onClick={() => navigate(`/dashboard/super-admin/organizations/${entity.id}?tab=general`)}
                                            className="neu-raised py-2 rounded-lg text-sm font-medium hover:text-primary transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Paramétrer
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <OrganizationDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    initialData={selectedEntity}
                    onSave={handleSave}
                />
            </div>
        </DashboardLayout>
    );
}
