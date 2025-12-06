import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SimulationBanner } from "@/components/SimulationBanner";
import { MairieCard } from "@/components/MairieCard";
import { MAIRIES_GABON } from "@/data/mock-mairies-network";
import { MOCK_USERS } from "@/data/mock-users";
import { DemoUserCard } from "@/components/DemoUserCard";
import { TestTube2, Landmark, MapPin, Users, Building2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { OrganizationType } from "@/types/organization";

export default function DemoPortal() {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  // Grouper les mairies par province
  const mairiesByProvince = useMemo(() => {
    const grouped: Record<string, typeof MAIRIES_GABON> = {};
    MAIRIES_GABON.forEach(mairie => {
      const province = mairie.province || 'Autre';
      if (!grouped[province]) {
        grouped[province] = [];
      }
      grouped[province].push(mairie);
    });
    return grouped;
  }, []);

  const provinces = Object.keys(mairiesByProvince).sort();

  // Statistiques
  const stats = useMemo(() => ({
    totalMairies: MAIRIES_GABON.length,
    mairiesCentrales: MAIRIES_GABON.filter(m => m.type === OrganizationType.MAIRIE_CENTRALE).length,
    arrondissements: MAIRIES_GABON.filter(m => m.type === OrganizationType.MAIRIE_ARRONDISSEMENT).length,
    communes: MAIRIES_GABON.filter(m => m.type === OrganizationType.MAIRIE_COMMUNE).length,
    populationTotale: MAIRIES_GABON.reduce((sum, m) => sum + (m.population || 0), 0)
  }), []);

  const displayedMairies = selectedProvince 
    ? mairiesByProvince[selectedProvince] || []
    : MAIRIES_GABON;

  return (
    <div className="min-h-screen flex flex-col">
      <SimulationBanner />
      <Header />

      <main className="flex-1 py-12 bg-gradient-official">
        <div className="container">
          {/* Alert Info */}
          <div className="mb-8 animate-fade-in">
            <Alert className="bg-accent/10 border-accent max-w-3xl mx-auto">
              <TestTube2 className="h-5 w-5" />
              <AlertTitle className="text-lg font-semibold">
                Portail de Démonstration des Mairies
              </AlertTitle>
              <AlertDescription>
                Sélectionnez une mairie pour accéder aux simulations de rôles.
                Chaque mairie propose des comptes (Maire, Agents, Citoyens) adaptés à ses services.
              </AlertDescription>
            </Alert>
          </div>

          {/* Titre et Statistiques */}
          <div className="text-center mb-8 animate-slide-up">
            <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <Landmark className="h-10 w-10 text-primary" />
              Réseau des Mairies du Gabon
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              {stats.totalMairies} Mairies disponibles pour la simulation
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold text-primary">{provinces.length}</p>
                  <p className="text-xs text-muted-foreground">Provinces</p>
                </CardContent>
              </Card>
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{stats.mairiesCentrales}</p>
                  <p className="text-xs text-muted-foreground">Chefs-lieux</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-500/5 border-blue-500/20">
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{stats.arrondissements}</p>
                  <p className="text-xs text-muted-foreground">Arrondissements</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-500/5 border-amber-500/20">
                <CardContent className="pt-4 text-center">
                  <p className="text-3xl font-bold text-amber-600">{(stats.populationTotale / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-muted-foreground">Population</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Super Admin Section */}
          <div className="mb-12 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2">
              <span className="text-red-500">🔴</span> Super Admin National
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-center max-w-2xl mx-auto">
              {MOCK_USERS.filter(u => u.role === 'ADMIN').map(admin => (
                <div key={admin.id} className="transform hover:scale-105 transition-transform duration-300">
                  <DemoUserCard user={admin} />
                </div>
              ))}
            </div>
          </div>

          {/* Filtres par Province */}
          <div className="max-w-5xl mx-auto mb-8">
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge 
                variant={selectedProvince === null ? "default" : "outline"}
                className="cursor-pointer text-sm py-2 px-4"
                onClick={() => setSelectedProvince(null)}
              >
                <MapPin className="h-3 w-3 mr-1" />
                Toutes ({MAIRIES_GABON.length})
              </Badge>
              {provinces.map(province => (
                <Badge 
                  key={province}
                  variant={selectedProvince === province ? "default" : "outline"}
                  className="cursor-pointer text-sm py-2 px-4"
                  onClick={() => setSelectedProvince(province)}
                >
                  {province} ({mairiesByProvince[province].length})
                </Badge>
              ))}
            </div>
          </div>

          {/* Liste des Mairies */}
          <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto">
            {displayedMairies.map((mairie, index) => (
              <div
                key={mairie.id}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <MairieCard mairie={mairie} />
              </div>
            ))}
          </div>

          <div className="mt-12 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Les simulations n'affectent pas les données de production et sont réinitialisées à chaque session
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}