import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ServiceRequest, RequestStatus } from "@/types/request";
import { RequestTimeline } from "./RequestTimeline";
import { 
  FileText, 
  Download, 
  MessageSquare,
  Calendar,
  Building2,
  User
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface RequestDetailModalProps {
  request: ServiceRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RequestDetailModal = ({ 
  request, 
  open, 
  onOpenChange 
}: RequestDetailModalProps) => {
  if (!request) return null;

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.COMPLETED:
      case RequestStatus.VALIDATED:
        return "bg-green-500";
      case RequestStatus.IN_PROGRESS:
      case RequestStatus.PENDING:
        return "bg-blue-500";
      case RequestStatus.AWAITING_DOCUMENTS:
        return "bg-amber-500";
      case RequestStatus.REJECTED:
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  const getStatusLabel = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.COMPLETED:
        return "Terminé";
      case RequestStatus.VALIDATED:
        return "Validé";
      case RequestStatus.IN_PROGRESS:
        return "En cours";
      case RequestStatus.PENDING:
        return "En attente";
      case RequestStatus.AWAITING_DOCUMENTS:
        return "Documents requis";
      case RequestStatus.REJECTED:
        return "Rejeté";
      default:
        return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl">
                {request.service?.name || request.subject}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Dossier N° {request.numero_dossier || request.id.substring(0, 8).toUpperCase()}
              </p>
            </div>
            <Badge className={getStatusColor(request.status)}>
              {getStatusLabel(request.status)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Info cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Créée le</p>
              <p className="text-sm font-medium">
                {format(new Date(request.created_at), 'dd MMM yyyy', { locale: fr })}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <User className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Demandeur</p>
              <p className="text-sm font-medium truncate">{request.citizen_name}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <Building2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Assigné à</p>
              <p className="text-sm font-medium truncate">
                {request.assigned_to_name || 'Non assigné'}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <FileText className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="text-sm font-medium">{request.type}</p>
            </div>
          </div>

          {request.description && (
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {request.description}
              </p>
            </div>
          )}

          <Separator />

          {/* Timeline */}
          <div>
            <h4 className="font-semibold mb-4">Suivi de la demande</h4>
            <RequestTimeline
              currentStatus={request.status}
              createdAt={request.created_at}
              updatedAt={request.updated_at}
              isRejected={request.status === RequestStatus.REJECTED}
              rejectionReason={request.motif_rejet || undefined}
            />
          </div>

          <Separator />

          {/* Documents */}
          {request.required_documents && request.required_documents.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Documents requis</h4>
              <div className="space-y-2">
                {request.required_documents.map((doc, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{doc}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {request.attached_documents?.includes(doc) ? 'Fourni' : 'Requis'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="outline" className="flex-1 gap-2">
              <MessageSquare className="h-4 w-4" />
              Contacter l'agent
            </Button>
            <Button variant="outline" className="flex-1 gap-2">
              <Download className="h-4 w-4" />
              Télécharger récépissé
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
