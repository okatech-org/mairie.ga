import { FileText, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function CGU() {
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
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Conditions Générales d'Utilisation</h1>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3">Article 1 - Objet</h2>
            <p className="text-muted-foreground">
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et 
              l'utilisation du site Mairies.ga, plateforme officielle des services municipaux 
              digitalisés de la République Gabonaise.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Article 2 - Accès au service</h2>
            <p className="text-muted-foreground">
              L'accès au site est gratuit pour tous les citoyens. Certains services nécessitent 
              la création d'un compte utilisateur avec vérification d'identité.
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>L'utilisateur doit fournir des informations exactes</li>
              <li>L'utilisateur est responsable de la confidentialité de son compte</li>
              <li>Toute utilisation frauduleuse sera signalée aux autorités</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Article 3 - Services proposés</h2>
            <p className="text-muted-foreground">
              Le site permet d'effectuer des démarches administratives municipales en ligne :
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>Demandes d'actes d'état civil</li>
              <li>Demandes de permis et autorisations</li>
              <li>Paiement de taxes et redevances locales</li>
              <li>Suivi des demandes en cours</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Article 4 - Obligations de l'utilisateur</h2>
            <p className="text-muted-foreground">
              L'utilisateur s'engage à utiliser le site conformément aux lois en vigueur 
              et à ne pas porter atteinte au bon fonctionnement du service. Il est interdit de :
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>Fournir de fausses informations</li>
              <li>Usurper l'identité d'un tiers</li>
              <li>Tenter d'accéder à des données non autorisées</li>
              <li>Perturber le fonctionnement du site</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Article 5 - Responsabilité</h2>
            <p className="text-muted-foreground">
              Le Réseau National des Mairies du Gabon s'efforce d'assurer la disponibilité 
              du service mais ne peut garantir une accessibilité permanente. 
              L'utilisateur reste seul responsable de l'utilisation qu'il fait du site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Article 6 - Modification des CGU</h2>
            <p className="text-muted-foreground">
              Les présentes CGU peuvent être modifiées à tout moment. Les utilisateurs 
              seront informés de toute modification substantielle. La poursuite de l'utilisation 
              du site vaut acceptation des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Article 7 - Droit applicable</h2>
            <p className="text-muted-foreground">
              Les présentes CGU sont soumises au droit gabonais. Tout litige relatif à 
              l'utilisation du site sera soumis aux tribunaux compétents de Libreville.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}