import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SimulationBanner } from "@/components/SimulationBanner";
import { MairieCard } from "@/components/MairieCard";
import { MAIRIES_GABON } from "@/data/mock-mairies-network";
import { MOCK_USERS, DEMO_CITIZEN_ACCOUNTS } from "@/data/mock-users";
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
    <div className="min-h-screen flex flex-col bg-background">
      <SimulationBanner />
      <Header />

      <main className="flex-1 py-8 md:py-12">
        <div className="container px-4 mx-auto">
          {/* Alert Info */}
          <div className="mb-6 md:mb-8 animate-fade-in">
            <Alert className="bg-accent/10 border-accent">
              <TestTube2 className="h-5 w-5 flex-shrink-0" />
              <div>
                <AlertTitle className="text-base md:text-lg font-semibold">
                  Portail de Démonstration
                </AlertTitle>
                <AlertDescription className="text-sm">
                  Sélectionnez une mairie pour tester les différents rôles utilisateurs.
                </AlertDescription>
              </div>
            </Alert>
          </div>

          {/* Titre */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 flex items-center justify-center gap-2 md:gap-3">
              <Landmark className="h-7 w-7 md:h-10 md:w-10 text-primary" />
              <span className="leading-tight">Réseau des Mairies</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              {stats.totalMairies} Mairies disponibles
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4 max-w-3xl mx-auto mb-6 md:mb-8">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3 md:pt-4 text-center">
                <p className="text-xl md:text-3xl font-bold text-primary">{provinces.length}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Provinces</p>
              </CardContent>
            </Card>
            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-3 md:pt-4 text-center">
                <p className="text-xl md:text-3xl font-bold text-emerald-600">{stats.mairiesCentrales}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Chefs-lieux</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="p-3 md:pt-4 text-center">
                <p className="text-xl md:text-3xl font-bold text-blue-600">{stats.arrondissements}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Arrondissements</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="p-3 md:pt-4 text-center">
                <p className="text-xl md:text-3xl font-bold text-amber-600">{(stats.populationTotale / 1000000).toFixed(1)}M</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Population</p>
              </CardContent>
            </Card>
          </div>

          {/* Super Admin Section */}
          <div className="mb-8 md:mb-12">
            <h2 className="text-lg md:text-xl font-bold mb-4 text-center flex items-center justify-center gap-2">
              <span className="text-red-500">🔴</span> Super Admin National
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 max-w-2xl mx-auto">
              {MOCK_USERS.filter(u => u.role === 'ADMIN').map(admin => (
                <div key={admin.id} className="hover:scale-[1.02] transition-transform duration-200">
                  <DemoUserCard user={admin} />
                </div>
              ))}
            </div>
          </div>

          {/* Comptes Usagers Section */}
          <div className="mb-8 md:mb-12">
            <h2 className="text-lg md:text-xl font-bold mb-4 text-center flex items-center justify-center gap-2">
              <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              Comptes Usagers
            </h2>
            <p className="text-muted-foreground text-sm text-center mb-4 max-w-md mx-auto">
              Testez les différents types de comptes citoyens et leurs permissions
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto">
              {DEMO_CITIZEN_ACCOUNTS.map(user => (
                <div key={user.id} className="hover:scale-[1.02] transition-transform duration-200">
                  <DemoUserCard user={user} />
                </div>
              ))}
            </div>
          </div>

          {/* Filtres par Province */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center">
              <Badge
                variant={selectedProvince === null ? "default" : "outline"}
                className="cursor-pointer text-xs md:text-sm py-1.5 px-2.5 md:py-2 md:px-4"
                onClick={() => setSelectedProvince(null)}
              >
                <MapPin className="h-3 w-3 mr-1" />
                Toutes ({MAIRIES_GABON.length})
              </Badge>
              {provinces.map(province => (
                <Badge
                  key={province}
                  variant={selectedProvince === province ? "default" : "outline"}
                  className="cursor-pointer text-xs md:text-sm py-1.5 px-2.5 md:py-2 md:px-4"
                  onClick={() => setSelectedProvince(province)}
                >
                  {province} ({mairiesByProvince[province].length})
                </Badge>
              ))}
            </div>
          </div>

          {/* Liste des Mairies */}
          <div className="space-y-3 md:space-y-4 max-w-5xl mx-auto">
            {displayedMairies.map((mairie, index) => (
              <div
                key={mairie.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.02}s` }}
              >
                <MairieCard mairie={mairie} />
              </div>
            ))}
          </div>

          <div className="mt-8 md:mt-12 text-center">
            <p className="text-xs md:text-sm text-muted-foreground">
              Données de simulation réinitialisées à chaque session
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}