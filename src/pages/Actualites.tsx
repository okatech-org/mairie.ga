import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Tag } from "lucide-react";

export default function Actualites() {
  const articles = [
    {
      id: 1,
      category: "Annonces Consulaires",
      title: "Nouvelles procédures de demande de visa",
      description: "À partir du 1er janvier 2025, de nouvelles procédures simplifiées seront mises en place pour les demandes de visa.",
      date: "15 Décembre 2024",
      badge: "Important",
      badgeVariant: "destructive" as const,
    },
    {
      id: 2,
      category: "Sensibilisation Diaspora",
      title: "Campagne d'inscription sur les listes électorales",
      description: "Les membres de la diaspora sont invités à s'inscrire sur les listes électorales avant la date limite.",
      date: "10 Décembre 2024",
      badge: "Urgent",
      badgeVariant: "default" as const,
    },
    {
      id: 3,
      category: "Événements",
      title: "Célébration de la fête nationale",
      description: "Le consulat organise une cérémonie pour célébrer la fête nationale du Gabon le 17 août prochain.",
      date: "5 Décembre 2024",
      badge: "Événement",
      badgeVariant: "secondary" as const,
    },
    {
      id: 4,
      category: "Annonces Consulaires",
      title: "Horaires d'ouverture pendant les fêtes",
      description: "Le consulat sera fermé du 24 décembre au 2 janvier. Les services en ligne restent accessibles.",
      date: "1 Décembre 2024",
      badge: "Info",
      badgeVariant: "outline" as const,
    },
    {
      id: 5,
      category: "Sensibilisation Diaspora",
      title: "Programme d'aide au retour volontaire",
      description: "Un nouveau programme d'assistance est disponible pour les membres de la diaspora souhaitant retourner au Gabon.",
      date: "25 Novembre 2024",
      badge: "Nouveau",
      badgeVariant: "default" as const,
    },
    {
      id: 6,
      category: "Événements",
      title: "Forum économique de la diaspora",
      description: "Participez au forum annuel dédié aux opportunités économiques et d'investissement au Gabon.",
      date: "20 Novembre 2024",
      badge: "Événement",
      badgeVariant: "secondary" as const,
    },
  ];

  return (
    <div className="flex-1 py-16 md:py-20 bg-gradient-official">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto text-center mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Actualités & Sensibilisation</h1>
          <p className="text-muted-foreground text-lg md:text-xl">
            Restez informé des dernières nouvelles et annonces consulaires
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {articles.map((article, index) => (
            <Card
              key={article.id}
              className="group hover:shadow-elevation transition-all duration-300 hover:-translate-y-1 animate-scale-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={article.badgeVariant}>{article.badge}</Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    <span>{article.category}</span>
                  </div>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {article.title}
                </CardTitle>
                <CardDescription>{article.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{article.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
