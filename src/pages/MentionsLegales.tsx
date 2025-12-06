import { Landmark, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Landmark className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Mentions Légales</h1>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3">Éditeur du site</h2>
            <p className="text-muted-foreground">
              Le site Mairies.ga est édité par le Réseau National des Mairies du Gabon, 
              organisme public placé sous la tutelle du Ministère de l'Intérieur.
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>Adresse : Libreville, Gabon</li>
              <li>Email : contact@mairies.ga</li>
              <li>Téléphone : +241 XX XX XX XX</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Hébergement</h2>
            <p className="text-muted-foreground">
              Le site est hébergé sur une infrastructure sécurisée conforme aux normes 
              de protection des données en vigueur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Propriété intellectuelle</h2>
            <p className="text-muted-foreground">
              L'ensemble des contenus présents sur le site Mairies.ga (textes, images, logos) 
              sont la propriété exclusive du Réseau National des Mairies du Gabon, 
              sauf mention contraire. Toute reproduction est interdite sans autorisation préalable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Responsabilité</h2>
            <p className="text-muted-foreground">
              Les informations fournies sur ce site le sont à titre indicatif. 
              Le Réseau National des Mairies du Gabon s'efforce d'assurer l'exactitude 
              des informations mais ne peut garantir leur exhaustivité.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}