import { useDemo } from "@/contexts/DemoContext";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Globe } from "lucide-react";
import { KPITrendsCard } from "@/components/dashboard/admin/KPITrendsCard";
import { ServiceHealthWidget } from "@/components/dashboard/admin/ServiceHealthWidget";
import { SensitiveCasesSection } from "@/components/dashboard/admin/SensitiveCasesSection";
import { DiplomaticAgenda } from "@/components/dashboard/admin/DiplomaticAgenda";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WorldMapDashboard } from "@/components/admin/WorldMapDashboard";
import { ConsularRole } from "@/types/consular-roles";

export default function AdminDashboard() {
  const { currentUser } = useDemo();
  const navigate = useNavigate();

  // Protection: Access for ADMIN (Super Admin) and CONSUL_GENERAL
  const hasAccess = currentUser?.role === "ADMIN" || currentUser?.role === ConsularRole.CONSUL_GENERAL;

  if (!hasAccess) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Alert className="max-w-md border-destructive">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <AlertTitle>Accès Refusé</AlertTitle>
          <AlertDescription>
            Cette section est réservée aux Consuls Généraux et Administrateurs.
            <div className="mt-4">
              <Button onClick={() => navigate("/")} variant="outline">
                Retour à l'accueil
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cockpit du Consul Général</h1>
          <p className="text-muted-foreground">
            Bienvenue, {currentUser?.name || 'Consul Général'}. Aperçu stratégique de l'activité consulaire.
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="neu-raised gap-2">
            <Globe className="w-4 h-4" />
            Vue Réseau
          </Button>
        </div>
      </div>

      {/* KPI Trends - Strategic Indicators */}
      <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <KPITrendsCard />
      </div>

      {/* Two Column Layout: Service Health + Sensitive Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <ServiceHealthWidget />
        <SensitiveCasesSection />
      </div>

      {/* Geographic Distribution Map (Reusing existing component) */}
      <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
        <Card className="neu-raised">
          <CardHeader>
            <CardTitle>Répartition Géographique</CardTitle>
            <CardDescription>Visualisation des concentrations de profils consulaires</CardDescription>
          </CardHeader>
          <CardContent>
            <WorldMapDashboard />
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout: Diplomatic Agenda + Security Feed (Placeholder) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: "0.4s" }}>
        <DiplomaticAgenda />

        {/* Security Feed Placeholder */}
        <Card className="neu-raised h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Veille Sécuritaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
                <h4 className="font-bold text-sm text-orange-800">Alerte Voyageur - Zone B</h4>
                <p className="text-xs text-orange-600 mt-1">Manifestations prévues ce week-end. Message de vigilance envoyé aux ressortissants.</p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <h4 className="font-bold text-sm text-blue-800">Note Diplomatique</h4>
                <p className="text-xs text-blue-600 mt-1">Réception de la note verbale NV-2023-45 concernant les visas officiels.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
