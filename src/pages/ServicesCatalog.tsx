import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Filter,
  Clock, 
  FileText,
  ChevronRight,
  Landmark,
  Building2,
  Coins,
  Heart,
  Stamp,
  Store,
  TreePine,
  Truck
} from "lucide-react";
import { 
  MUNICIPAL_SERVICE_CATALOG, 
  ServiceCategory,
  MunicipalServiceInfo 
} from "@/types/municipal-services";
import { useTranslation } from "react-i18next";

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

interface ServiceCardProps {
  service: MunicipalServiceInfo;
  onClick: () => void;
}

const ServiceCard = ({ service, onClick }: ServiceCardProps) => {
  const Icon = service.icon;
  const categoryInfo = CATEGORY_INFO[service.category];
  
  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={`p-2 rounded-lg ${categoryInfo.color}/10`}>
            <Icon className={`h-5 w-5 ${service.color}`} />
          </div>
          <Badge variant="outline" className="text-xs">
            {categoryInfo.label}
          </Badge>
        </div>
        <CardTitle className="text-lg mt-3 group-hover:text-primary transition-colors">
          {service.name}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {service.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{service.processingDays} jour{service.processingDays > 1 ? 's' : ''}</span>
          </div>
          <div className="font-semibold text-foreground">
            {service.price === 0 ? (
              <span className="text-green-600">Gratuit</span>
            ) : service.priceRange ? (
              <span>{service.priceRange.min.toLocaleString()} - {service.priceRange.max.toLocaleString()} FCFA</span>
            ) : (
              <span>{service.price.toLocaleString()} FCFA</span>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {service.forCitoyen && (
            <Badge variant="secondary" className="text-xs">Citoyens</Badge>
          )}
          {service.forEtranger && (
            <Badge variant="secondary" className="text-xs">Étrangers</Badge>
          )}
          {service.forPersonneMorale && (
            <Badge variant="secondary" className="text-xs">Entreprises</Badge>
          )}
        </div>

        <div className="flex items-center text-sm text-muted-foreground">
          <FileText className="h-3.5 w-3.5 mr-1" />
          <span>{service.requiredDocuments.length} document{service.requiredDocuments.length > 1 ? 's' : ''} requis</span>
        </div>
      </CardContent>
    </Card>
  );
};

import { ServiceDetailModal } from "@/components/services/ServiceDetailModal";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ServicesCatalog = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | "all">("all");
  const [selectedService, setSelectedService] = useState<MunicipalServiceInfo | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const handleServiceClick = (service: MunicipalServiceInfo) => {
    setSelectedService(service);
    setDetailModalOpen(true);
  };

  const handleCreateRequest = (service: MunicipalServiceInfo) => {
    toast.success("Demande initiée", {
      description: `Vous allez créer une demande pour : ${service.name}`
    });
    navigate("/dashboard/citizen/requests");
  };
  
  const services = useMemo(() => Object.values(MUNICIPAL_SERVICE_CATALOG), []);
  
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch = 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: services.length };
    services.forEach(service => {
      counts[service.category] = (counts[service.category] || 0) + 1;
    });
    return counts;
  }, [services]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-hero text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm mb-4 opacity-80">
            <Link to="/" className="hover:underline">Accueil</Link>
            <ChevronRight className="h-4 w-4" />
            <span>Services Municipaux</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Catalogue des Services Municipaux</h1>
          <p className="text-lg opacity-90 max-w-2xl">
            Découvrez l'ensemble des services proposés par les mairies du Gabon. 
            Consultez les tarifs, délais et documents requis pour chaque démarche.
          </p>
          
          {/* Search Bar */}
          <div className="mt-8 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher un service (ex: acte de naissance, permis...)"
                className="pl-10 h-12 bg-background text-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Tous les services
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
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {info.label}
                <Badge variant="secondary" className="ml-1">{count}</Badge>
              </Button>
            );
          })}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {filteredServices.length} service{filteredServices.length > 1 ? 's' : ''} trouvé{filteredServices.length > 1 ? 's' : ''}
            {searchQuery && ` pour "${searchQuery}"`}
          </p>
        </div>

        {/* Services Grid */}
        {filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard 
                key={service.id} 
                service={service} 
                onClick={() => handleServiceClick(service)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucun service trouvé</h3>
            <p className="text-muted-foreground mb-4">
              Essayez de modifier vos critères de recherche
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}>
              Réinitialiser les filtres
            </Button>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16 bg-muted/50 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4">Comment effectuer une démarche ?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Choisissez votre service</h3>
                <p className="text-sm text-muted-foreground">
                  Parcourez le catalogue et identifiez le service dont vous avez besoin
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Préparez vos documents</h3>
                <p className="text-sm text-muted-foreground">
                  Rassemblez tous les documents requis pour votre démarche
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Rendez-vous en mairie</h3>
                <p className="text-sm text-muted-foreground">
                  Prenez rendez-vous ou présentez-vous à votre mairie de rattachement
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ServiceDetailModal
        service={selectedService}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onCreateRequest={handleCreateRequest}
      />
    </div>
  );
};

export default ServicesCatalog;
