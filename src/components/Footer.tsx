import { Landmark } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="w-full border-t border-border bg-muted/30">
      <div className="container mx-auto py-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm">MAIRIE.GA</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">— Services municipaux digitalisés</span>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <span>contact@mairie.ga</span>
            <span>+241 XX XX XX XX</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-4 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Réseau des Mairies du Gabon</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4">
            <Link to="/iasted-guide" className="hover:text-primary transition-colors">
              Guide iAsted
            </Link>
            <Link to="/mentions-legales" className="hover:text-primary transition-colors">
              Mentions légales
            </Link>
            <Link to="/cgu" className="hover:text-primary transition-colors">
              CGU
            </Link>
            <Link to="/politique-confidentialite" className="hover:text-primary transition-colors">
              Confidentialité
            </Link>
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};