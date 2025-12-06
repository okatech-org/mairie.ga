import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MUNICIPAL_SERVICE_CATALOG, 
  MunicipalServiceInfo,
  ServiceCategory 
} from "@/types/municipal-services";
import { ServiceDetailModal } from "./ServiceDetailModal";
import { RequestCreationForm } from "@/components/requests/RequestCreationForm";
import { 
  Search, 
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

interface MunicipalServicesListProps {
  maxItems?: number;
  showSearch?: boolean;
  compact?: boolean;
}

export const MunicipalServicesList = ({ 
  maxItems, 
  showSearch = true,
  compact = false 
}: MunicipalServicesListProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<MunicipalServiceInfo | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [serviceForRequest, setServiceForRequest] = useState<MunicipalServiceInfo | null>(null);

  const services = useMemo(() => {
    let result = Object.values(MUNICIPAL_SERVICE_CATALOG);
    
    if (searchQuery) {
      result = result.filter((service) =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (maxItems) {
      result = result.slice(0, maxItems);
    }
    
    return result;
  }, [searchQuery, maxItems]);

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
    <div className="space-y-4">
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un service..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      <div className={compact ? "space-y-2" : "grid md:grid-cols-2 gap-4"}>
        {services.map((service) => {
          const Icon = service.icon;
          const categoryInfo = CATEGORY_INFO[service.category];
          
          if (compact) {
            return (
              <Button
                key={service.id}
                variant="ghost"
                className="w-full justify-between h-auto py-3 px-4 hover:bg-muted"
                onClick={() => handleServiceClick(service)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${categoryInfo.color}/10`}>
                    <Icon className={`h-4 w-4 ${service.color}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{service.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{service.processingDays}j</span>
                      <span>•</span>
                      <span>
                        {service.price === 0 ? "Gratuit" : `${service.price.toLocaleString()} FCFA`}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            );
          }
          
          return (
            <Card 
              key={service.id} 
              className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50 cursor-pointer"
              onClick={() => handleServiceClick(service)}
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
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{service.processingDays} jour{service.processingDays > 1 ? 's' : ''}</span>
                  </div>
                  <div className="font-semibold text-foreground">
                    {service.price === 0 ? (
                      <span className="text-green-600">Gratuit</span>
                    ) : (
                      <span>{service.price.toLocaleString()} FCFA</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  <span>{service.requiredDocuments.length} document{service.requiredDocuments.length > 1 ? 's' : ''}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {services.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Aucun service trouvé</p>
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
    </div>
  );
};
