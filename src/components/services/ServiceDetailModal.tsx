import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MunicipalServiceInfo, ServiceCategory } from "@/types/municipal-services";
import { 
  Clock, 
  FileText, 
  Download, 
  CheckCircle2, 
  Users, 
  Building2,
  Coins,
  Heart,
  Stamp,
  Store,
  TreePine,
  Truck,
  Landmark
} from "lucide-react";
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

interface ServiceDetailModalProps {
  service: MunicipalServiceInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRequest?: (service: MunicipalServiceInfo) => void;
}

export const ServiceDetailModal = ({ 
  service, 
  open, 
  onOpenChange,
  onCreateRequest 
}: ServiceDetailModalProps) => {
  if (!service) return null;

  const categoryInfo = CATEGORY_INFO[service.category];
  const Icon = service.icon;
  const CategoryIcon = categoryInfo.icon;

  const handleDownloadForm = () => {
    // Simulate form download
    toast.success("Formulaire téléchargé", {
      description: `Formulaire de demande pour ${service.name}`
    });
  };

  const handleCreateRequest = () => {
    if (onCreateRequest) {
      onCreateRequest(service);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${categoryInfo.color}/10`}>
              <Icon className={`h-8 w-8 ${service.color}`} />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{service.name}</DialogTitle>
              <DialogDescription className="mt-2">
                {service.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Info badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <CategoryIcon className="h-3 w-3" />
              {categoryInfo.label}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {service.processingDays} jour{service.processingDays > 1 ? 's' : ''}
            </Badge>
            <Badge 
              variant={service.price === 0 ? "default" : "secondary"}
              className={service.price === 0 ? "bg-green-600" : ""}
            >
              {service.price === 0 ? (
                "Gratuit"
              ) : service.priceRange ? (
                `${service.priceRange.min.toLocaleString()} - ${service.priceRange.max.toLocaleString()} FCFA`
              ) : (
                `${service.price.toLocaleString()} FCFA`
              )}
            </Badge>
          </div>

          {/* Eligible */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Bénéficiaires éligibles
            </h4>
            <div className="flex flex-wrap gap-2">
              {service.forCitoyen && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Citoyens gabonais
                </Badge>
              )}
              {service.forEtranger && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Étrangers résidents
                </Badge>
              )}
              {service.forPersonneMorale && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Entreprises / Personnes morales
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Documents requis */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Documents requis ({service.requiredDocuments.length})
            </h4>
            <ul className="space-y-2">
              {service.requiredDocuments.map((doc, index) => (
                <li 
                  key={index}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="text-sm">{doc}</span>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={handleDownloadForm}
            >
              <Download className="h-4 w-4" />
              Télécharger le formulaire
            </Button>
            <Button 
              className="flex-1 gap-2"
              onClick={handleCreateRequest}
            >
              <FileText className="h-4 w-4" />
              Créer une demande
            </Button>
          </div>

          {/* Info supplémentaire */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Informations importantes</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Les documents doivent être originaux ou copies certifiées conformes</li>
              <li>Le délai de traitement est indicatif et peut varier selon la mairie</li>
              <li>Présentez-vous avec une pièce d'identité valide</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
