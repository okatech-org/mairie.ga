import { useState, useMemo, useRef } from "react";
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
  TrendingUp,
  ChevronDown,
  X
} from "lucide-react";
import {
  MUNICIPAL_SERVICE_CATALOG,
  ServiceCategory,
  MunicipalServiceInfo
} from "@/types/municipal-services";
import { useTranslation } from "react-i18next";
import { useFavoriteServices } from "@/hooks/useFavoriteServices";
import { AnimatePresence, motion } from "framer-motion";
import { FavoriteServiceCard } from "@/components/services/FavoriteServiceCard";
import heroImage from "@/assets/service-municipal.jpg";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ServiceDetailModal } from "@/components/services/ServiceDetailModal";
import { RequestCreationForm } from "@/components/requests/RequestCreationForm";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

// Les 12 services les plus demandés (IDs)
const POPULAR_SERVICE_IDS = [
  'acte_naissance_copie',
  'acte_mariage_copie',
  'acte_deces_copie',
  'certificat_residence',
  'certificat_vie',
  'certificat_nationalite',
  'legalisation_document',
  'casier_judiciaire',
  'permis_construire',
  'patente_commerciale',
  'certificat_urbanisme',
  'mariage_civil'
];

interface ServiceCardProps {
  service: MunicipalServiceInfo;
  onClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const ServiceCard = ({ service, onClick, isFavorite, onToggleFavorite }: ServiceCardProps) => {
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
      </CardContent>
    </Card>
  );
};

// Compact card for search results
const CompactServiceCard = ({ service, onClick }: { service: MunicipalServiceInfo; onClick: () => void }) => {
  const categoryInfo = CATEGORY_INFO[service.category];
  const Icon = service.icon;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/50 transition-all flex items-center gap-3"
    >
      <div className={`p-2 rounded-lg ${categoryInfo.color}/10 flex-shrink-0`}>
        <Icon className={`h-4 w-4 ${service.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{service.name}</p>
        <p className="text-xs text-muted-foreground">{categoryInfo.label} • {service.price === 0 ? 'Gratuit' : `${service.price.toLocaleString()} FCFA`}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
};

const ServicesCatalog = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedService, setSelectedService] = useState<MunicipalServiceInfo | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [serviceForRequest, setServiceForRequest] = useState<MunicipalServiceInfo | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const { favorites, toggleFavorite, isFavorite } = useFavoriteServices();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleServiceClick = (service: MunicipalServiceInfo) => {
    setSelectedService(service);
    setDetailModalOpen(true);
    setSearchQuery("");
    setIsSearchFocused(false);
  };

  const handleCreateRequest = (service: MunicipalServiceInfo) => {
    setServiceForRequest(service);
    setRequestFormOpen(true);
  };

  const handleRequestSuccess = (requestId: string) => {
    toast.success("Demande créée avec succès!");
  };

  const services = useMemo(() => Object.values(MUNICIPAL_SERVICE_CATALOG), []);

  // 12 services les plus populaires
  const popularServices = useMemo(() => {
    return POPULAR_SERVICE_IDS
      .map(id => MUNICIPAL_SERVICE_CATALOG[id])
      .filter(Boolean);
  }, []);

  // Other services (not in popular)
  const otherServices = useMemo(() => {
    return services.filter(s => !POPULAR_SERVICE_IDS.includes(s.id));
  }, [services]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return services
      .filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        CATEGORY_INFO[s.category].label.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [searchQuery, services]);

  // Group other services by category
  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, MunicipalServiceInfo[]> = {};
    otherServices.forEach(service => {
      if (!grouped[service.category]) {
        grouped[service.category] = [];
      }
      grouped[service.category].push(service);
    });
    return grouped;
  }, [otherServices]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const favoriteServices = useMemo(() => {
    return favorites
      .map(id => MUNICIPAL_SERVICE_CATALOG[id])
      .filter(Boolean);
  }, [favorites]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] md:min-h-[55vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Services municipaux"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center gap-2 text-sm mb-4 text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Services Municipaux</span>
          </div>

          <div className="max-w-2xl">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 px-4 py-1.5">
              <Sparkles className="h-3 w-3 mr-2" />
              {services.length}+ services disponibles
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
              <span className="block">Catalogue des</span>
              <span className="text-primary">Services Municipaux</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
              Trouvez rapidement le service dont vous avez besoin. Les 12 services les plus demandés sont affichés en premier.
            </p>

            {/* Smart Search */}
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Rechercher un service (ex: acte de naissance, permis...)"
                className="pl-12 pr-10 h-12 md:h-14 bg-card/90 backdrop-blur-sm border-border/50 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              {/* Search Results Dropdown */}
              <AnimatePresence>
                {isSearchFocused && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="p-2 space-y-1">
                      {searchResults.map(service => (
                        <CompactServiceCard
                          key={service.id}
                          service={service}
                          onClick={() => handleServiceClick(service)}
                        />
                      ))}
                    </div>
                    <div className="border-t px-4 py-2 bg-muted/50">
                      <p className="text-xs text-muted-foreground">
                        {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Favorites Section */}
        {favoriteServices.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              <h2 className="text-lg font-semibold">Mes services favoris</h2>
              <Badge variant="secondary">{favoriteServices.length}</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
            <Separator className="mt-8" />
          </div>
        )}

        {/* Popular Services - 12 cards */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Services les plus demandés</h2>
            <Badge variant="secondary">{popularServices.length}</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            {popularServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onClick={() => handleServiceClick(service)}
                isFavorite={isFavorite(service.id)}
                onToggleFavorite={() => toggleFavorite(service.id)}
              />
            ))}
          </div>
        </section>

        {/* Other Services by Category */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Tous les autres services</h2>
              <Badge variant="secondary">{otherServices.length}</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedCategories(
                expandedCategories.length === Object.keys(servicesByCategory).length
                  ? []
                  : Object.keys(servicesByCategory)
              )}
            >
              {expandedCategories.length === Object.keys(servicesByCategory).length ? 'Tout réduire' : 'Tout développer'}
            </Button>
          </div>

          <div className="space-y-3">
            {Object.entries(servicesByCategory).map(([category, categoryServices]) => {
              const info = CATEGORY_INFO[category as ServiceCategory];
              if (!info) return null;
              const Icon = info.icon;
              const isExpanded = expandedCategories.includes(category);

              return (
                <Collapsible
                  key={category}
                  open={isExpanded}
                  onOpenChange={() => toggleCategory(category)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-14 px-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${info.color}/10`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="font-medium">{info.label}</span>
                        <Badge variant="secondary">{categoryServices.length}</Badge>
                      </div>
                      <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-b-lg border border-t-0"
                    >
                      {categoryServices.map(service => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          onClick={() => handleServiceClick(service)}
                          isFavorite={isFavorite(service.id)}
                          onToggleFavorite={() => toggleFavorite(service.id)}
                        />
                      ))}
                    </motion.div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </section>

        {/* Info Section */}
        <div className="mt-12 md:mt-16 bg-muted/50 rounded-xl p-6 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Comment effectuer une démarche ?</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {[
              { step: "1", title: "Choisissez votre service", desc: "Parcourez les services populaires ou recherchez celui dont vous avez besoin" },
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
