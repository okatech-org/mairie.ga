import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MunicipalServiceInfo, ServiceCategory } from "@/types/municipal-services";
import { Heart, Clock, ChevronRight, FileText, Building2, Coins, Stamp, Store, TreePine, Truck, Landmark } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORY_INFO: Record<ServiceCategory, { label: string; icon: typeof Landmark; color: string }> = {
  [ServiceCategory.ETAT_CIVIL]: { label: "État Civil", icon: FileText, color: "text-blue-500" },
  [ServiceCategory.URBANISME]: { label: "Urbanisme", icon: Building2, color: "text-orange-500" },
  [ServiceCategory.FISCALITE]: { label: "Fiscalité", icon: Coins, color: "text-amber-500" },
  [ServiceCategory.AFFAIRES_SOCIALES]: { label: "Affaires Sociales", icon: Heart, color: "text-red-500" },
  [ServiceCategory.LEGALISATION]: { label: "Légalisation", icon: Stamp, color: "text-purple-500" },
  [ServiceCategory.ENTREPRISES]: { label: "Entreprises", icon: Store, color: "text-emerald-500" },
  [ServiceCategory.ENVIRONNEMENT]: { label: "Environnement", icon: TreePine, color: "text-green-500" },
  [ServiceCategory.VOIRIE]: { label: "Voirie", icon: Truck, color: "text-slate-500" }
};

interface FavoriteServiceCardProps {
  service: MunicipalServiceInfo;
  onRemove: () => void;
  onClick: () => void;
}

export const FavoriteServiceCard = ({ service, onRemove, onClick }: FavoriteServiceCardProps) => {
  const Icon = service.icon;
  const categoryInfo = CATEGORY_INFO[service.category];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <Card className="group hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-muted`}>
              <Icon className={`h-5 w-5 ${service.color}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium truncate">{service.name}</h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{service.processingDays}j</span>
                    <span>•</span>
                    <span className={categoryInfo.color}>{categoryInfo.label}</span>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                >
                  <Heart className="h-4 w-4 fill-current" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <Badge variant="secondary" className="text-xs">
                  {service.price === 0 ? 'Gratuit' : `${service.price.toLocaleString()} FCFA`}
                </Badge>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 gap-1 text-xs"
                  onClick={onClick}
                >
                  Voir
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
