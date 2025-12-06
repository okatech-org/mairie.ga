import { Landmark, ArrowLeft, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PolitiqueConfidentialite() {
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
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Politique de Confidentialité</h1>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3">Collecte des données</h2>
            <p className="text-muted-foreground">
              Le site Mairies.ga collecte uniquement les données personnelles nécessaires 
              au traitement de vos demandes administratives. Ces données incluent notamment : 
              nom, prénom, adresse, numéro de téléphone, email et documents d'identité.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Utilisation des données</h2>
            <p className="text-muted-foreground">
              Vos données personnelles sont utilisées exclusivement pour :
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>Le traitement de vos demandes administratives</li>
              <li>La communication relative à vos démarches</li>
              <li>L'amélioration de nos services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Protection des données</h2>
            <p className="text-muted-foreground">
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles 
              appropriées pour protéger vos données contre tout accès non autorisé, 
              modification, divulgation ou destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Vos droits</h2>
            <p className="text-muted-foreground">
              Conformément à la réglementation en vigueur, vous disposez d'un droit d'accès, 
              de rectification et de suppression de vos données personnelles. 
              Pour exercer ces droits, contactez-nous à : contact@mairies.ga
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Cookies</h2>
            <p className="text-muted-foreground">
              Le site utilise des cookies techniques nécessaires à son bon fonctionnement. 
              Ces cookies ne collectent aucune donnée personnelle à des fins publicitaires.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}