import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Search,
    FileText,
    Clock,
    ChevronRight,
    Landmark,
    Building2,
    Coins,
    Heart,
    Stamp,
    Store,
    TreePine,
    Truck,
    Star,
    Filter,
    Users,
    TrendingUp
} from "lucide-react";
import {
    MUNICIPAL_SERVICE_CATALOG,
    ServiceCategory,
    MunicipalServiceInfo
} from "@/types/municipal-services";
import { ServiceDetailModal } from "@/components/services/ServiceDetailModal";
import { RequestCreationForm } from "@/components/requests/RequestCreationForm";
import { BeneficiaryFilter, BeneficiaryType } from "@/components/services/BeneficiaryFilter";
import { useFavoriteServices } from "@/hooks/useFavoriteServices";
import { toast } from "sonner";

const CATEGORY_INFO: Record<ServiceCategory, { label: string; icon: typeof Landmark; color: string }> = {
    [ServiceCategory.ETAT_CIVIL]: { label: "État Civil", icon: FileText, color: "bg-blue-500" },
    [ServiceCategory.URBANISME]: { label: "Urbanisme", icon: Building2, color: "bg-orange-500" },
    [ServiceCategory.FISCALITE]: { label: "Fiscalité", icon: Coins, color: "bg-amber-500" },
    [ServiceCategory.AFFAIRES_SOCIALES]: { label: "Affaires Sociales", icon: Heart, color: "bg-red-500" },
    [ServiceCategory.LEGALISATION]: { label: "Légalisation", icon: Stamp, color: "bg-purple-500" },
    [ServiceCategory.ENTREPRISES]: { label: "Entreprises", icon: Store, color: "bg-emerald-500" },
    [ServiceCategory.ENVIRONNEMENT]: { label: "Environnement", icon: TreePine, color: "bg-green-500" },
    [ServiceCategory.VOIRIE]: { label: "Voirie", icon: Truck, color: "bg-slate-500" }
};

export default function DashboardServicesPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | "all">("all");
    const [selectedBeneficiary, setSelectedBeneficiary] = useState<BeneficiaryType>("all");
    const [selectedService, setSelectedService] = useState<MunicipalServiceInfo | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [requestFormOpen, setRequestFormOpen] = useState(false);
    const [serviceForRequest, setServiceForRequest] = useState<MunicipalServiceInfo | null>(null);
    const { favorites, toggleFavorite, isFavorite } = useFavoriteServices();

    const services = useMemo(() => Object.values(MUNICIPAL_SERVICE_CATALOG), []);

    const filteredServices = useMemo(() => {
        return services.filter((service) => {
            const matchesSearch =
                service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                service.description.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;

            const matchesBeneficiary = selectedBeneficiary === "all" ||
                (selectedBeneficiary === "citizen" && service.forCitoyen) ||
                (selectedBeneficiary === "foreigner" && service.forEtranger) ||
                (selectedBeneficiary === "business" && service.forPersonneMorale);

            return matchesSearch && matchesCategory && matchesBeneficiary;
        });
    }, [services, searchQuery, selectedCategory, selectedBeneficiary]);

    const beneficiaryCounts = useMemo(() => ({
        all: services.length,
        citizen: services.filter(s => s.forCitoyen).length,
        foreigner: services.filter(s => s.forEtranger).length,
        business: services.filter(s => s.forPersonneMorale).length,
    }), [services]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { all: services.length };
        services.forEach(service => {
            counts[service.category] = (counts[service.category] || 0) + 1;
        });
        return counts;
    }, [services]);

    const handleServiceClick = (service: MunicipalServiceInfo) => {
        setSelectedService(service);
        setDetailModalOpen(true);
    };

    const handleCreateRequest = (service: MunicipalServiceInfo) => {
        setServiceForRequest(service);
        setRequestFormOpen(true);
    };

    const handleRequestSuccess = () => {
        toast.success("Demande créée avec succès!");
    };

    return (
        <>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Catalogue des Services</h1>
                    <p className="text-muted-foreground mt-1">
                        Consultez et demandez les services municipaux disponibles
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="neu-raised gap-2">
                        <Star className="w-4 h-4" />
                        Mes Favoris ({favorites.length})
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="neu-raised p-5 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary">
                            <FileText size={20} />
                        </div>
                        <div className="flex items-center gap-1 text-success text-sm font-medium">
                            <TrendingUp size={14} />
                            100%
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium mb-1">Services</p>
                    <h3 className="text-2xl font-bold text-foreground">{services.length}</h3>
                </div>

                <div className="neu-raised p-5 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600">
                            <Landmark size={20} />
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium mb-1">Catégories</p>
                    <h3 className="text-2xl font-bold text-foreground">{Object.keys(CATEGORY_INFO).length}</h3>
                </div>

                <div className="neu-raised p-5 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600">
                            <Star size={20} />
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium mb-1">Favoris</p>
                    <h3 className="text-2xl font-bold text-foreground">{favorites.length}</h3>
                </div>

                <div className="neu-raised p-5 rounded-2xl hover:-translate-y-1 transition-transform duration-300">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600">
                            <Users size={20} />
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium mb-1">Bénéficiaires</p>
                    <h3 className="text-2xl font-bold text-foreground">3 types</h3>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="neu-inset p-6 rounded-2xl mb-8">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un service..."
                            className="pl-12 h-12 bg-background"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Beneficiary Filter */}
                <div className="mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Filtrer par bénéficiaire</p>
                    <BeneficiaryFilter
                        selected={selectedBeneficiary}
                        onChange={setSelectedBeneficiary}
                        counts={beneficiaryCounts}
                    />
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={selectedCategory === "all" ? "default" : "outline"}
                        onClick={() => setSelectedCategory("all")}
                        className="gap-2 neu-raised border-none"
                        size="sm"
                    >
                        <Filter className="h-4 w-4" />
                        Tous
                        <Badge variant="secondary" className="ml-1">{categoryCounts.all}</Badge>
                    </Button>

                    {Object.entries(CATEGORY_INFO).map(([category, info]) => {
                        const Icon = info.icon;
                        const count = categoryCounts[category] || 0;
                        if (count === 0) return null;

                        return (
                            <Button
                                key={category}
                                variant={selectedCategory === category ? "default" : "outline"}
                                onClick={() => setSelectedCategory(category as ServiceCategory)}
                                className="gap-2 neu-raised border-none"
                                size="sm"
                            >
                                <Icon className="h-4 w-4" />
                                {info.label}
                                <Badge variant="secondary" className="ml-1">{count}</Badge>
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                    {filteredServices.length} service{filteredServices.length > 1 ? 's' : ''} trouvé{filteredServices.length > 1 ? 's' : ''}
                    {searchQuery && <span> pour "{searchQuery}"</span>}
                </p>
            </div>

            {/* Services Grid */}
            {filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredServices.map((service) => {
                        const Icon = service.icon;
                        const categoryInfo = CATEGORY_INFO[service.category];
                        const favorite = isFavorite(service.id);

                        return (
                            <div
                                key={service.id}
                                className="neu-raised p-5 rounded-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative"
                                onClick={() => handleServiceClick(service)}
                            >
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`absolute top-3 right-3 h-8 w-8 ${favorite ? 'text-amber-500' : 'text-muted-foreground opacity-0 group-hover:opacity-100'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(service.id);
                                    }}
                                >
                                    <Star className={`h-4 w-4 ${favorite ? 'fill-current' : ''}`} />
                                </Button>

                                <div className="flex items-start justify-between pr-8 mb-4">
                                    <div className={`p-3 rounded-xl ${categoryInfo.color}/10`}>
                                        <Icon className={`h-5 w-5 ${service.color}`} />
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {categoryInfo.label}
                                    </Badge>
                                </div>

                                <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                    {service.name}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                    {service.description}
                                </p>

                                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>{service.processingDays} jour{service.processingDays > 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="font-semibold text-foreground">
                                        {service.price === 0 ? (
                                            <span className="text-green-600">Gratuit</span>
                                        ) : service.priceRange ? (
                                            <span>{service.priceRange.min.toLocaleString()}-{service.priceRange.max.toLocaleString()} FCFA</span>
                                        ) : (
                                            <span>{service.price.toLocaleString()} FCFA</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-1 mb-3">
                                    {service.forCitoyen && (
                                        <Badge variant="secondary" className="text-xs px-2 py-0">Citoyens</Badge>
                                    )}
                                    {service.forEtranger && (
                                        <Badge variant="secondary" className="text-xs px-2 py-0">Étrangers</Badge>
                                    )}
                                    {service.forPersonneMorale && (
                                        <Badge variant="secondary" className="text-xs px-2 py-0">Entreprises</Badge>
                                    )}
                                </div>

                                <div className="flex items-center text-xs text-muted-foreground">
                                    <FileText className="h-3 w-3 mr-1" />
                                    <span>{service.requiredDocuments.length} doc{service.requiredDocuments.length > 1 ? 's' : ''} requis</span>
                                    <ChevronRight className="h-3 w-3 ml-auto group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="neu-inset p-12 rounded-2xl text-center">
                    <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-semibold mb-2">Aucun service trouvé</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Essayez de modifier vos critères de recherche
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="neu-raised border-none"
                        onClick={() => {
                            setSearchQuery("");
                            setSelectedCategory("all");
                            setSelectedBeneficiary("all");
                        }}
                    >
                        Réinitialiser les filtres
                    </Button>
                </div>
            )}

            <ServiceDetailModal
                service={selectedService}
                open={detailModalOpen}
                onOpenChange={setDetailModalOpen}
                onCreateRequest={handleCreateRequest}
            />

            <RequestCreationForm
                service={serviceForRequest}
                open={requestFormOpen}
                onOpenChange={setRequestFormOpen}
                onSuccess={handleRequestSuccess}
            />
        </>
    );
}
