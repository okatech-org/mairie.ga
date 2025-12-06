import { Landmark } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="w-full border-t border-border bg-muted/30">
      <div className="container mx-auto py-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm">Mairies.ga</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">— Services municipaux digitalisés</span>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <span>contact@mairies.ga</span>
            <span>+241 XX XX XX XX</span>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-4 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Réseau des Mairies du Gabon</p>
          <p>v1.0.0</p>
        </div>
      </div>
    </footer>
  );
};