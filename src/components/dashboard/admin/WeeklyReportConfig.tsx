import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Clock, Calendar, Plus, Trash2, Save, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ReportConfig {
  enabled: boolean;
  dayOfWeek: string;
  timeOfDay: string;
  recipients: string[];
  includeSummary: boolean;
  includeCharts: boolean;
  includeUnresolvedAlerts: boolean;
}

const DAYS_OF_WEEK = [
  { value: "1", label: "Lundi" },
  { value: "2", label: "Mardi" },
  { value: "3", label: "Mercredi" },
  { value: "4", label: "Jeudi" },
  { value: "5", label: "Vendredi" },
  { value: "6", label: "Samedi" },
  { value: "0", label: "Dimanche" }
];

const DEFAULT_CONFIG: ReportConfig = {
  enabled: false,
  dayOfWeek: "1",
  timeOfDay: "09:00",
  recipients: [],
  includeSummary: true,
  includeCharts: true,
  includeUnresolvedAlerts: true
};

export function WeeklyReportConfig() {
  const [config, setConfig] = useState<ReportConfig>(DEFAULT_CONFIG);
  const [newEmail, setNewEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);

  useEffect(() => {
    const savedConfig = localStorage.getItem("weekly_report_config");
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
    
    const lastSentDate = localStorage.getItem("weekly_report_last_sent");
    if (lastSentDate) {
      setLastSent(lastSentDate);
    }
  }, []);

  const saveConfig = (newConfig: ReportConfig) => {
    setConfig(newConfig);
    localStorage.setItem("weekly_report_config", JSON.stringify(newConfig));
    toast.success("Configuration sauvegardée");
  };

  const addRecipient = () => {
    if (!newEmail.trim()) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error("Adresse email invalide");
      return;
    }

    if (config.recipients.includes(newEmail.toLowerCase())) {
      toast.error("Cette adresse est déjà dans la liste");
      return;
    }

    saveConfig({
      ...config,
      recipients: [...config.recipients, newEmail.toLowerCase()]
    });
    setNewEmail("");
  };

  const removeRecipient = (email: string) => {
    saveConfig({
      ...config,
      recipients: config.recipients.filter(r => r !== email)
    });
  };

  const sendTestReport = async () => {
    if (config.recipients.length === 0) {
      toast.error("Ajoutez au moins un destinataire");
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-security-report", {
        body: {
          recipients: config.recipients,
          isTest: true,
          config: {
            includeSummary: config.includeSummary,
            includeCharts: config.includeCharts,
            includeUnresolvedAlerts: config.includeUnresolvedAlerts
          }
        }
      });

      if (error) throw error;

      toast.success("Rapport de test envoyé avec succès");
      const now = new Date().toISOString();
      setLastSent(now);
      localStorage.setItem("weekly_report_last_sent", now);
    } catch (error) {
      console.error("Error sending test report:", error);
      toast.error("Erreur lors de l'envoi du rapport");
    } finally {
      setIsSending(false);
    }
  };

  const getDayLabel = (value: string) => {
    return DAYS_OF_WEEK.find(d => d.value === value)?.label || value;
  };

  return (
    <Card className="neu-raised">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Rapports Hebdomadaires par Email
        </CardTitle>
        <CardDescription>
          Configurez l'envoi automatique de rapports de sécurité aux super administrateurs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
          <div>
            <h4 className="font-medium">Activer les rapports automatiques</h4>
            <p className="text-sm text-muted-foreground">
              Envoyer un résumé de sécurité chaque semaine
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(enabled) => saveConfig({ ...config, enabled })}
          />
        </div>

        {/* Schedule */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Jour d'envoi
            </Label>
            <Select
              value={config.dayOfWeek}
              onValueChange={(dayOfWeek) => saveConfig({ ...config, dayOfWeek })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Heure d'envoi
            </Label>
            <Input
              type="time"
              value={config.timeOfDay}
              onChange={(e) => saveConfig({ ...config, timeOfDay: e.target.value })}
            />
          </div>
        </div>

        {/* Recipients */}
        <div className="space-y-3">
          <Label>Destinataires</Label>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Ajouter un email..."
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addRecipient()}
            />
            <Button onClick={addRecipient} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {config.recipients.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-2">
              {config.recipients.map((email) => (
                <Badge key={email} variant="secondary" className="flex items-center gap-1 py-1 px-2">
                  <Mail className="h-3 w-3" />
                  {email}
                  <button
                    onClick={() => removeRecipient(email)}
                    className="ml-1 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun destinataire configuré</p>
          )}
        </div>

        {/* Content Options */}
        <div className="space-y-3">
          <Label>Contenu du rapport</Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm">Résumé des statistiques</span>
              <Switch
                checked={config.includeSummary}
                onCheckedChange={(includeSummary) => saveConfig({ ...config, includeSummary })}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm">Graphiques de tendance</span>
              <Switch
                checked={config.includeCharts}
                onCheckedChange={(includeCharts) => saveConfig({ ...config, includeCharts })}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm">Liste des alertes non résolues</span>
              <Switch
                checked={config.includeUnresolvedAlerts}
                onCheckedChange={(includeUnresolvedAlerts) => saveConfig({ ...config, includeUnresolvedAlerts })}
              />
            </div>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {config.enabled ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>
                  Prochain envoi: {getDayLabel(config.dayOfWeek)} à {config.timeOfDay}
                </span>
              </div>
            ) : (
              <span>Rapports automatiques désactivés</span>
            )}
            {lastSent && (
              <p className="mt-1 text-xs">
                Dernier envoi: {format(new Date(lastSent), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
              </p>
            )}
          </div>
          
          <Button 
            onClick={sendTestReport} 
            disabled={isSending || config.recipients.length === 0}
            variant="outline"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSending ? "Envoi..." : "Envoyer un rapport test"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
