import { useRef, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  CheckCircle2, 
  Calendar, 
  User, 
  FileText, 
  Printer,
  QrCode,
  Mail,
  Phone,
  MapPin,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface RequestReceiptModalProps {
  request: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RequestReceiptModal = ({ 
  request, 
  open, 
  onOpenChange 
}: RequestReceiptModalProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (request?.numero_dossier) {
      const trackingUrl = `${window.location.origin}/suivi/${request.numero_dossier}`;
      QRCode.toDataURL(trackingUrl, {
        width: 150,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }).then(setQrCodeUrl);
    }
  }, [request?.numero_dossier]);

  if (!request) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = margin;

      // Header
      pdf.setFillColor(0, 85, 34); // Green color
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RÉPUBLIQUE GABONAISE', pageWidth / 2, 15, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Union - Travail - Justice', pageWidth / 2, 22, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RÉCÉPISSÉ DE DEMANDE', pageWidth / 2, 35, { align: 'center' });

      yPos = 55;

      // Request number box
      pdf.setTextColor(0, 0, 0);
      pdf.setFillColor(240, 240, 240);
      pdf.roundedRect(margin, yPos, pageWidth - 2 * margin, 20, 3, 3, 'F');
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('N° de Dossier:', margin + 5, yPos + 8);
      pdf.setFontSize(16);
      pdf.setTextColor(0, 85, 34);
      pdf.text(request.numero_dossier || 'N/A', margin + 50, yPos + 8);
      
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Date: ${format(new Date(request.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, margin + 5, yPos + 16);

      yPos += 30;

      // Service info
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SERVICE DEMANDÉ', margin, yPos);
      yPos += 7;
      
      pdf.setFontSize(14);
      pdf.text(request.subject || request.service?.name || 'N/A', margin, yPos);
      yPos += 7;
      
      if (request.service?.description) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        const descLines = pdf.splitTextToSize(request.service.description, pageWidth - 2 * margin);
        pdf.text(descLines, margin, yPos);
        yPos += descLines.length * 5 + 5;
      }

      yPos += 5;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // Applicant info
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INFORMATIONS DU DEMANDEUR', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const infoItems = [
        { label: 'Nom', value: request.citizen_name },
        { label: 'Email', value: request.citizen_email },
        { label: 'Téléphone', value: request.citizen_phone || 'Non renseigné' },
        { label: 'Adresse', value: request.address || 'Non renseignée' },
      ];

      infoItems.forEach(item => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${item.label}:`, margin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(item.value, margin + 30, yPos);
        yPos += 6;
      });

      yPos += 5;
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // Processing info
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INFORMATIONS DE TRAITEMENT', margin, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const statusMap: Record<string, string> = {
        'PENDING': 'En attente',
        'IN_PROGRESS': 'En cours',
        'AWAITING_DOCUMENTS': 'Documents requis',
        'VALIDATED': 'Validée',
        'REJECTED': 'Rejetée',
        'COMPLETED': 'Terminée'
      };

      pdf.setFont('helvetica', 'bold');
      pdf.text('Statut:', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      pdf.text(statusMap[request.status] || request.status, margin + 30, yPos);
      yPos += 6;

      if (request.service?.processingDays) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Délai estimé:', margin, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${request.service.processingDays} jour(s)`, margin + 30, yPos);
        yPos += 6;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.text('Frais:', margin, yPos);
      pdf.setFont('helvetica', 'normal');
      const price = request.montant_frais || request.service?.price || 0;
      pdf.text(price === 0 ? 'Gratuit' : `${price.toLocaleString()} FCFA`, margin + 30, yPos);
      yPos += 10;

      // QR Code
      if (qrCodeUrl) {
        const qrSize = 40;
        const qrX = pageWidth - margin - qrSize;
        const qrY = yPos;
        
        pdf.addImage(qrCodeUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text('Scannez pour suivre', qrX + qrSize / 2, qrY + qrSize + 5, { align: 'center' });
        pdf.text('votre demande', qrX + qrSize / 2, qrY + qrSize + 9, { align: 'center' });
      }

      // Documents list on left side
      if (request.required_documents?.length > 0) {
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Documents requis:', margin, yPos);
        yPos += 6;
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        request.required_documents.forEach((doc: string, index: number) => {
          pdf.text(`• ${doc}`, margin + 3, yPos);
          yPos += 5;
        });
      }

      yPos = Math.max(yPos, 230);

      // Footer
      pdf.setFillColor(0, 85, 34);
      pdf.rect(0, pdf.internal.pageSize.getHeight() - 25, pageWidth, 25, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text(
        'Ce document est un récépissé officiel. Conservez-le précieusement.',
        pageWidth / 2,
        pdf.internal.pageSize.getHeight() - 15,
        { align: 'center' }
      );
      pdf.text(
        `Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })} | www.egabon.ga`,
        pageWidth / 2,
        pdf.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );

      // Save PDF
      pdf.save(`Recepisse_${request.numero_dossier}.pdf`);
      
      toast.success("PDF téléchargé avec succès");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:max-w-none print:overflow-visible">
        <DialogHeader className="print:hidden">
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-6 w-6" />
            Demande créée avec succès!
          </DialogTitle>
        </DialogHeader>

        {/* Printable Receipt Content */}
        <div ref={receiptRef} className="space-y-6 print:p-8">
          {/* Header */}
          <div className="text-center space-y-2 pb-4 border-b">
            <h2 className="text-xl font-bold text-primary">RÉPUBLIQUE GABONAISE</h2>
            <p className="text-sm text-muted-foreground">Union - Travail - Justice</p>
            <h3 className="text-lg font-semibold">RÉCÉPISSÉ DE DEMANDE</h3>
          </div>

          {/* Request Number */}
          <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Numéro de dossier</p>
              <p className="text-2xl font-bold text-primary">{request.numero_dossier}</p>
            </div>
            <Badge variant="outline" className="gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(request.created_at), 'dd MMM yyyy', { locale: fr })}
            </Badge>
          </div>

          {/* Service Info */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Service demandé
            </h4>
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="font-medium">{request.subject || request.service?.name}</p>
              {request.service?.description && (
                <p className="text-sm text-muted-foreground mt-1">{request.service.description}</p>
              )}
              <div className="flex gap-4 mt-3">
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {request.service?.processingDays || '?'} jours
                </Badge>
                <Badge variant={request.montant_frais === 0 ? "default" : "secondary"}>
                  {request.montant_frais === 0 ? "Gratuit" : `${(request.montant_frais || 0).toLocaleString()} FCFA`}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Applicant Info */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Informations du demandeur
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{request.citizen_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{request.citizen_email}</span>
              </div>
              {request.citizen_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{request.citizen_phone}</span>
                </div>
              )}
              {request.address && (
                <div className="flex items-center gap-2 md:col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{request.address}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* QR Code & Documents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Documents requis */}
            {request.required_documents?.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Documents requis</h4>
                <ul className="space-y-1 text-sm">
                  {request.required_documents.map((doc: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center space-y-2">
              {qrCodeUrl && (
                <>
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <img src={qrCodeUrl} alt="QR Code de suivi" className="h-32 w-32" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <QrCode className="h-3 w-3" />
                      Scannez pour suivre votre demande
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer info */}
          <div className="bg-primary/5 rounded-lg p-4 text-sm text-muted-foreground print:bg-gray-100">
            <p className="font-medium text-foreground mb-2">Informations importantes</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Conservez ce récépissé précieusement</li>
              <li>Utilisez le numéro de dossier pour suivre votre demande</li>
              <li>Vous recevrez une notification par email à chaque mise à jour</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 print:hidden">
          <Button 
            variant="outline" 
            className="flex-1 gap-2"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
          <Button 
            className="flex-1 gap-2"
            onClick={handleExportPDF}
          >
            <Download className="h-4 w-4" />
            Télécharger PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
