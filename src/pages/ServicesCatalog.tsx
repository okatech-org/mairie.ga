import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  Truck,
  Star,
  Sparkles,
  ArrowRight,
  Users,
  CheckCircle2
} from "lucide-react";
import { 
  MUNICIPAL_SERVICE_CATALOG, 
  ServiceCategory,
  MunicipalServiceInfo 
} from "@/types/municipal-services";
import { useTranslation } from "react-i18next";
import { BeneficiaryFilter, BeneficiaryType } from "@/components/services/BeneficiaryFilter";
import { useFavoriteServices } from "@/hooks/useFavoriteServices";
import { AnimatePresence } from "framer-motion";
import { FavoriteServiceCard } from "@/components/services/FavoriteServiceCard";
import heroImage from "@/assets/service-municipal.jpg";

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

const ServiceCard = ({ service, onClick, isFavorite, onToggleFavorite }: ServiceCardProps & { isFavorite: boolean; onToggleFavorite: () => void }) => {
  const Icon = service.icon;
  const categoryInfo = CATEGORY_INFO[service.category];
  
  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 hover:-translate-y-1 cursor-pointer relative"
      onClick={onClick}
    >
      <Button
        variant="ghost"
        size="icon"
        className={`absolute top-2 right-2 h-8 w-8 z-10 ${isFavorite ? 'text-amber-500' : 'text-muted-foreground opacity-0 group-hover:opacity-100'}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
      >
        <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
      </Button>
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-start justify-between pr-8">
          <div className={`p-1.5 sm:p-2 rounded-lg ${categoryInfo.color}/10`}>
            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${service.color}`} />
          </div>
          <Badge variant="outline" className="text-[10px] sm:text-xs">
            {categoryInfo.label}
          </Badge>
        </div>
        <CardTitle className="text-base sm:text-lg mt-2 sm:mt-3 group-hover:text-primary transition-colors line-clamp-2">
          {service.name}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-xs sm:text-sm">
          {service.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>{service.processingDays} jour{service.processingDays > 1 ? 's' : ''}</span>
          </div>
          <div className="font-semibold text-foreground text-xs sm:text-sm">
            {service.price === 0 ? (
              <span className="text-green-600">Gratuit</span>
            ) : service.priceRange ? (
              <span>{service.priceRange.min.toLocaleString()} - {service.priceRange.max.toLocaleString()} FCFA</span>
            ) : (
              <span>{service.price.toLocaleString()} FCFA</span>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
          {service.forCitoyen && (
            <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0">Citoyens</Badge>
          )}
          {service.forEtranger && (
            <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0">Étrangers</Badge>
          )}
          {service.forPersonneMorale && (
            <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0">Entreprises</Badge>
          )}
        </div>

        <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
          <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
          <span>{service.requiredDocuments.length} doc{service.requiredDocuments.length > 1 ? 's' : ''} requis</span>
        </div>
      </CardContent>
    </Card>
  );
};

import { ServiceDetailModal } from "@/components/services/ServiceDetailModal";
import { RequestCreationForm } from "@/components/requests/RequestCreationForm";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ServicesCatalog = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | "all">("all");
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<BeneficiaryType>("all");
  const [selectedService, setSelectedService] = useState<MunicipalServiceInfo | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [serviceForRequest, setServiceForRequest] = useState<MunicipalServiceInfo | null>(null);
  const { favorites, toggleFavorite, isFavorite } = useFavoriteServices();

  const handleServiceClick = (service: MunicipalServiceInfo) => {
    setSelectedService(service);
    setDetailModalOpen(true);
  };

  const handleCreateRequest = (service: MunicipalServiceInfo) => {
    setServiceForRequest(service);
    setRequestFormOpen(true);
  };

  const handleRequestSuccess = (requestId: string) => {
    toast.success("Demande créée avec succès!");
  };
  
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

  const favoriteServices = useMemo(() => {
    return favorites
      .map(id => MUNICIPAL_SERVICE_CATALOG[id])
      .filter(Boolean);
  }, [favorites]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: services.length };
    services.forEach(service => {
      counts[service.category] = (counts[service.category] || 0) + 1;
    });
    return counts;
  }, [services]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Inspired by Home page */}
      <section className="relative min-h-[60vh] md:min-h-[70vh] flex items-center overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Services municipaux" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-64 h-64 md:w-96 md:h-96 rounded-full bg-primary/5 blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-10 w-48 h-48 md:w-72 md:h-72 rounded-full bg-secondary/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-4 md:mb-6 text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Services Municipaux</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <Badge className="mb-4 md:mb-6 bg-primary/20 text-primary border-primary/30 px-4 py-1.5">
                <Sparkles className="h-3 w-3 mr-2" />
                Démarches simplifiées
              </Badge>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
                <span className="block">Catalogue des</span>
                <span className="block text-primary">Services</span>
                <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-muted-foreground font-medium mt-2">
                  Municipaux
                </span>
              </h1>
              
              <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Découvrez l'ensemble des services proposés par les mairies du Gabon. 
                Consultez les tarifs, délais et documents requis pour chaque démarche.
              </p>

              {/* Search Bar */}
              <div className="max-w-xl mx-auto lg:mx-0">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un service..."
                    className="pl-12 h-12 md:h-14 bg-card/80 backdrop-blur-sm border-border/50 text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Mobile Stats */}
              <div className="grid grid-cols-3 gap-2 mt-6 lg:hidden">
                {[
                  { value: services.length + "+", label: "Services" },
                  { value: "8", label: "Catégories" },
                  { value: "100%", label: "En ligne" },
                ].map((stat, index) => (
                  <div 
                    key={index} 
                    className="p-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 text-center"
                  >
                    <div className="text-lg font-bold text-primary">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Stats Cards (Desktop) */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                { icon: FileText, value: services.length + "+", label: "Services disponibles", delay: "0.1s" },
                { icon: Landmark, value: "8", label: "Catégories", delay: "0.2s" },
                { icon: Users, value: "100K+", label: "Citoyens servis", delay: "0.3s" },
                { icon: CheckCircle2, value: "24/7", label: "Accessible", delay: "0.4s" },
              ].map((stat, index) => (
                <Card 
                  key={index} 
                  className="text-center p-6 hover:shadow-xl transition-all duration-300 bg-card/80 backdrop-blur-sm border-border/50 hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: stat.delay }}
                >
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mx-auto mb-4">
                    <stat.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-4xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Favorites Section */}
        {favoriteServices.length > 0 && (
          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Star className="h-4 w-4 md:h-5 md:w-5 text-amber-500 fill-amber-500" />
              <h2 className="text-base md:text-lg font-semibold">Mes services favoris</h2>
              <Badge variant="secondary" className="text-xs">{favoriteServices.length}</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              <AnimatePresence>
                {favoriteServices.map((service) => (
                  <FavoriteServiceCard
                    key={service.id}
                    service={service}
                    onRemove={() => toggleFavorite(service.id)}
                    onClick={() => handleServiceClick(service)}
                  />
                ))}
              </AnimatePresence>
            </div>
            <Separator className="mt-6 md:mt-8" />
          </div>
        )}

        {/* Beneficiary Filter */}
        <div className="mb-4 md:mb-6">
          <p className="text-xs md:text-sm font-medium text-muted-foreground mb-2 md:mb-3">Filtrer par bénéficiaire</p>
          <BeneficiaryFilter
            selected={selectedBeneficiary}
            onChange={setSelectedBeneficiary}
            counts={beneficiaryCounts}
          />
        </div>

        {/* Category Filters - Horizontal scroll on mobile */}
        <div className="mb-6 md:mb-8 -mx-4 px-4 overflow-x-auto">
          <div className="flex gap-2 pb-2 min-w-max">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4"
              size="sm"
            >
              <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Tous les services</span>
              <span className="sm:hidden">Tous</span>
              <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs">{categoryCounts.all}</Badge>
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
                  className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4 whitespace-nowrap"
                  size="sm"
                >
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden md:inline">{info.label}</span>
                  <span className="md:hidden">{info.label.split(' ')[0]}</span>
                  <Badge variant="secondary" className="ml-1 text-[10px] sm:text-xs">{count}</Badge>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredServices.length} service{filteredServices.length > 1 ? 's' : ''} trouvé{filteredServices.length > 1 ? 's' : ''}
            {searchQuery && <span className="hidden sm:inline"> pour "{searchQuery}"</span>}
          </p>
        </div>

        {/* Services Grid */}
        {filteredServices.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            {filteredServices.map((service) => (
              <ServiceCard 
                key={service.id} 
                service={service} 
                onClick={() => handleServiceClick(service)}
                isFavorite={isFavorite(service.id)}
                onToggleFavorite={() => toggleFavorite(service.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 md:py-16">
            <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-muted mb-4">
              <Search className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base md:text-lg font-semibold mb-2">Aucun service trouvé</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Essayez de modifier vos critères de recherche
            </p>
            <Button variant="outline" size="sm" onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setSelectedBeneficiary("all");
            }}>
              Réinitialiser les filtres
            </Button>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 md:mt-16 bg-muted/50 rounded-xl p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Comment effectuer une démarche ?</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[
              { step: "1", title: "Choisissez votre service", desc: "Parcourez le catalogue et identifiez le service dont vous avez besoin" },
              { step: "2", title: "Préparez vos documents", desc: "Rassemblez tous les documents requis pour votre démarche" },
              { step: "3", title: "Rendez-vous en mairie", desc: "Prenez rendez-vous ou présentez-vous à votre mairie de rattachement" },
            ].map((item) => (
              <div key={item.step} className="flex gap-3 md:gap-4">
                <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm md:text-base">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-sm md:text-base">{item.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default ServicesCatalog;
