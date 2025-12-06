import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SimulationBanner } from "@/components/SimulationBanner";
import { EntityCard } from "@/components/EntityCard";
import { MOCK_ENTITIES } from "@/data/mock-entities";
import { MOCK_USERS } from "@/data/mock-users";
import { DemoUserCard } from "@/components/DemoUserCard";
import { TestTube2, Globe2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMemo } from "react";

export default function DemoPortal() {

  // Filter entities: If a country has a CONSULAT or CONSULAT_GENERAL, hide the AMBASSADE.
  const displayedEntities = useMemo(() => {
    // 1. Group by country
    const entitiesByCountry: Record<string, typeof MOCK_ENTITIES> = {};
    MOCK_ENTITIES.forEach(entity => {
      if (!entitiesByCountry[entity.countryCode]) {
        entitiesByCountry[entity.countryCode] = [];
      }
      entitiesByCountry[entity.countryCode].push(entity);
    });

    // 2. Filter for each country
    const filtered: typeof MOCK_ENTITIES = [];
    Object.values(entitiesByCountry).forEach(countryEntities => {
      const hasConsulate = countryEntities.some(e => e.type === 'CONSULAT' || e.type === 'CONSULAT_GENERAL');

      if (hasConsulate) {
        // If Consulates exist, only show Consulates (hide Embassies)
        filtered.push(...countryEntities.filter(e => e.type === 'CONSULAT' || e.type === 'CONSULAT_GENERAL'));
      } else {
        // If no Consulate, show everything (which is just the Embassy)
        filtered.push(...countryEntities);
      }
    });

    return filtered;
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SimulationBanner />
      <Header />

      <main className="flex-1 py-12 bg-gradient-official">
        <div className="container">
          <div className="mb-8 animate-fade-in">
            <Alert className="bg-accent/10 border-accent max-w-3xl mx-auto">
              <TestTube2 className="h-5 w-5" />
              <AlertTitle className="text-lg font-semibold">
                Portail de Démonstration Multi-Entités
              </AlertTitle>
              <AlertDescription>
                Sélectionnez une entité diplomatique pour accéder aux simulations.
                Chaque entité propose des comptes spécifiques (Agents, Résidents, Demandeurs de Visa) adaptés à sa juridiction.
              </AlertDescription>
            </Alert>
          </div>

          <div className="text-center mb-12 animate-slide-up">
            <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <Globe2 className="h-10 w-10 text-primary" />
              Réseau Diplomatique Gabonais
            </h1>
            <p className="text-muted-foreground text-lg">
              {displayedEntities.length} Représentations Diplomatiques disponibles pour la simulation
            </p>
          </div>

          <div className="mb-12 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Super Admin</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-center">
              {MOCK_USERS.filter(u => u.role === 'ADMIN').map(admin => (
                <div key={admin.id} className="transform hover:scale-105 transition-transform duration-300">
                  <DemoUserCard user={admin} />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto">
            {displayedEntities.map((entity, index) => (
              <div
                key={entity.id}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <EntityCard entity={entity} />
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
