import { Landmark } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="w-full border-t border-border bg-muted/30">
      <div className="container mx-auto py-12 md:py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Landmark className="h-5 w-5 text-primary" />
              <span className="font-bold">Mairies.ga</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Services municipaux digitalisés de la République Gabonaise
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Liens Officiels</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Ministère de l'Intérieur</li>
              <li>Direction Générale des Collectivités Locales</li>
              <li>Services Municipaux</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Email: contact@mairies.ga</li>
              <li>Tel: +241 XX XX XX XX</li>
              <li className="text-xs pt-2 text-muted-foreground/70">
                Réseau National des Mairies
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Réseau des Mairies du Gabon. Tous droits réservés.</p>
          <p className="text-xs mt-2">Version 1.0.0 - Système Sécurisé</p>
        </div>
      </div>
    </footer>
  );
};