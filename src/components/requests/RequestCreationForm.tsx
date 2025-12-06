import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MunicipalServiceInfo } from "@/types/municipal-services";
import { DocumentUploadZone } from "./DocumentUploadZone";
import { 
  FileText, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Upload,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RequestReceiptModal } from "./RequestReceiptModal";

const requestFormSchema = z.object({
  citizenName: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  citizenEmail: z.string().email("Email invalide").max(255),
  citizenPhone: z.string().optional(),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères").max(500),
  demandeurType: z.enum(["citizen", "foreigner", "business"]),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères").max(2000),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

interface RequestCreationFormProps {
  service: MunicipalServiceInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (requestId: string) => void;
}

interface UploadedDocument {
  name: string;
  file: File;
  preview?: string;
}

export const RequestCreationForm = ({ 
  service, 
  open, 
  onOpenChange,
  onSuccess 
}: RequestCreationFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [createdRequest, setCreatedRequest] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      citizenName: "",
      citizenEmail: "",
      citizenPhone: "",
      address: "",
      demandeurType: "citizen",
      description: "",
    },
  });

  if (!service) return null;

  const handleFileUpload = (files: File[]) => {
    const newDocs = files.map(file => ({
      name: file.name,
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));
    setUploadedDocs(prev => [...prev, ...newDocs]);
    toast.success(`${files.length} document(s) ajouté(s)`);
  };

  const removeDocument = (index: number) => {
    setUploadedDocs(prev => {
      const newDocs = [...prev];
      if (newDocs[index].preview) {
        URL.revokeObjectURL(newDocs[index].preview!);
      }
      newDocs.splice(index, 1);
      return newDocs;
    });
  };

  const missingDocuments = service.requiredDocuments.filter(
    doc => !uploadedDocs.some(uploaded => 
      uploaded.name.toLowerCase().includes(doc.toLowerCase().split(' ')[0])
    )
  );

  const onSubmit = async (values: RequestFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Generate a unique request number
      const numeroDossier = `REQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Vous devez être connecté pour créer une demande");
        setIsSubmitting(false);
        return;
      }

      // Map service type to request type enum
      const requestTypeMap: Record<string, string> = {
        'ACTE_NAISSANCE': 'CIVIL_REGISTRY',
        'ACTE_NAISSANCE_COPIE': 'CIVIL_REGISTRY',
        'ACTE_MARIAGE': 'CIVIL_REGISTRY',
        'ACTE_DECES': 'CIVIL_REGISTRY',
        'CERTIFICAT_VIE': 'ATTESTATION',
        'CERTIFICAT_RESIDENCE': 'ATTESTATION',
        'CERTIFICAT_CELIBAT': 'ATTESTATION',
        'LEGALISATION_SIGNATURE': 'LEGALIZATION',
        'COPIE_CONFORME': 'LEGALIZATION',
        'PATENTE': 'ATTESTATION',
        'PERMIS_CONSTRUIRE': 'ATTESTATION',
        'PASSPORT': 'PASSPORT',
        'VISA': 'VISA',
        'CONSULAR_CARD': 'CONSULAR_CARD',
      };

      const requestType = requestTypeMap[service.id] || 'ATTESTATION';

      // Create the request
      const { data: request, error } = await supabase
        .from('requests')
        .insert({
          citizen_id: user.id,
          citizen_name: values.citizenName,
          citizen_email: values.citizenEmail,
          citizen_phone: values.citizenPhone || null,
          subject: service.name,
          description: values.description,
          type: requestType as any,
          status: 'PENDING',
          priority: 'NORMAL',
          demandeur_type: values.demandeurType,
          numero_dossier: numeroDossier,
          montant_frais: service.price,
          required_documents: service.requiredDocuments,
          attached_documents: uploadedDocs.map(d => d.name),
        })
        .select()
        .single();

      if (error) throw error;

      // Store created request for receipt
      setCreatedRequest({
        ...request,
        service,
        address: values.address,
      });

      toast.success("Demande créée avec succès!", {
        description: `Numéro de dossier: ${numeroDossier}`
      });

      // Show receipt modal
      setShowReceipt(true);
      
      if (onSuccess) {
        onSuccess(request.id);
      }

      // Reset form
      form.reset();
      setUploadedDocs([]);
      
    } catch (error: any) {
      console.error('Error creating request:', error);
      toast.error("Erreur lors de la création", {
        description: error.message || "Une erreur est survenue"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setCreatedRequest(null);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open && !showReceipt} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-2xl">Nouvelle Demande</DialogTitle>
                <DialogDescription className="mt-2">
                  {service.name} - {service.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {service.processingDays} jour{service.processingDays > 1 ? 's' : ''}
            </Badge>
            <Badge variant={service.price === 0 ? "default" : "secondary"}>
              {service.price === 0 ? "Gratuit" : `${service.price.toLocaleString()} FCFA`}
            </Badge>
          </div>

          <Separator className="my-4" />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Informations personnelles */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Informations du demandeur
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="citizenName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet *</FormLabel>
                        <FormControl>
                          <Input placeholder="Jean Dupont" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="demandeurType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de demandeur *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="citizen">Citoyen gabonais</SelectItem>
                            <SelectItem value="foreigner">Étranger résident</SelectItem>
                            <SelectItem value="business">Entreprise / Personne morale</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="citizenEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-10" placeholder="email@exemple.com" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="citizenPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-10" placeholder="+241 XX XX XX XX" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse complète *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Textarea className="pl-10 min-h-[80px]" placeholder="Quartier, Rue, Numéro..." {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Description de la demande */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Détails de la demande
                </h3>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description / Motif de la demande *</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="min-h-[120px]" 
                          placeholder="Décrivez votre demande en détail..."
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Expliquez le motif de votre demande et toute information utile
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Documents requis */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  Documents requis ({service.requiredDocuments.length})
                </h3>

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  {service.requiredDocuments.map((doc, index) => {
                    const isUploaded = uploadedDocs.some(
                      uploaded => uploaded.name.toLowerCase().includes(doc.toLowerCase().split(' ')[0])
                    );
                    return (
                      <div 
                        key={index}
                        className={`flex items-center gap-3 p-2 rounded ${isUploaded ? 'bg-green-500/10' : 'bg-background'}`}
                      >
                        {isUploaded ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                        )}
                        <span className="text-sm">{doc}</span>
                      </div>
                    );
                  })}
                </div>

                <DocumentUploadZone 
                  onFilesSelected={handleFileUpload}
                  uploadedFiles={uploadedDocs}
                  onRemoveFile={removeDocument}
                />

                {missingDocuments.length > 0 && (
                  <p className="text-sm text-amber-600 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {missingDocuments.length} document(s) manquant(s) - Vous pourrez les ajouter plus tard
                  </p>
                )}
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Soumettre la demande
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <RequestReceiptModal 
        request={createdRequest}
        open={showReceipt}
        onOpenChange={handleCloseReceipt}
      />
    </>
  );
};
