import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Tag, Search, ArrowRight, Clock, Eye, ChevronRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import reunionImage from "@/assets/reunion-citoyenne.jpg";
import serviceImage from "@/assets/service-municipal.jpg";
import villeImage from "@/assets/ville-gabon.jpg";
import familleImage from "@/assets/famille-acte-naissance.jpg";
import entrepreneurImage from "@/assets/entrepreneur-patente.jpg";
import aideImage from "@/assets/aide-seniors.jpg";

const articles = [
  {
    id: 1,
    category: "Services Municipaux",
    title: "Nouveau guichet unique pour les actes civils",
    description: "La mairie de Libreville inaugure un guichet unique permettant aux citoyens d'obtenir leurs actes de naissance, mariage et décès en un seul lieu. Cette initiative vise à réduire les délais d'attente.",
    date: "15 Décembre 2024",
    badge: "Nouveau",
    badgeVariant: "default" as const,
    readTime: "5 min",
    views: 2450,
    image: serviceImage,
    location: "Libreville"
  },
  {
    id: 2,
    category: "Vie Citoyenne",
    title: "Réunion publique sur le budget participatif 2025",
    description: "Les citoyens sont invités à participer à la réunion publique pour définir les priorités du budget participatif. Voirie, espaces verts, équipements sportifs : donnez votre avis !",
    date: "10 Décembre 2024",
    badge: "Important",
    badgeVariant: "destructive" as const,
    readTime: "3 min",
    views: 1890,
    image: reunionImage,
    location: "Port-Gentil"
  },
  {
    id: 3,
    category: "Événements",
    title: "Journée portes ouvertes des mairies",
    description: "Découvrez les coulisses de votre mairie lors de cette journée exceptionnelle. Rencontrez les agents, visitez les services et participez aux ateliers citoyens.",
    date: "5 Décembre 2024",
    badge: "Événement",
    badgeVariant: "secondary" as const,
    readTime: "2 min",
    views: 1120,
    image: villeImage,
    location: "National"
  },
  {
    id: 4,
    category: "Services Municipaux",
    title: "Horaires spéciaux période des fêtes",
    description: "Les mairies adapteront leurs horaires pendant les fêtes de fin d'année. Consultez les horaires de votre commune et les services maintenus.",
    date: "1 Décembre 2024",
    badge: "Info",
    badgeVariant: "outline" as const,
    readTime: "1 min",
    views: 890,
    image: aideImage,
    location: "National"
  },
  {
    id: 5,
    category: "Vie Citoyenne",
    title: "Programme d'aide aux seniors",
    description: "La commune lance un nouveau programme d'accompagnement administratif pour les personnes âgées. Des agents se déplaceront à domicile pour faciliter leurs démarches.",
    date: "25 Novembre 2024",
    badge: "Social",
    badgeVariant: "default" as const,
    readTime: "4 min",
    views: 1560,
    image: aideImage,
    location: "Franceville"
  },
  {
    id: 6,
    category: "Entreprises",
    title: "Simplification des patentes commerciales",
    description: "Bonne nouvelle pour les entrepreneurs ! Les procédures de demande de patente sont désormais simplifiées. Découvrez les nouvelles modalités.",
    date: "20 Novembre 2024",
    badge: "Entreprises",
    badgeVariant: "secondary" as const,
    readTime: "3 min",
    views: 2340,
    image: entrepreneurImage,
    location: "National"
  },
  {
    id: 7,
    category: "Famille",
    title: "Célébration collective des naissances",
    description: "La mairie organise une cérémonie de remise des actes de naissance pour les nouveaux-nés du trimestre. Un moment de partage et de convivialité.",
    date: "18 Novembre 2024",
    badge: "Famille",
    badgeVariant: "default" as const,
    readTime: "2 min",
    views: 980,
    image: familleImage,
    location: "Oyem"
  },
];

const categories = ["Tous", "Services Municipaux", "Vie Citoyenne", "Événements", "Entreprises", "Famille"];

export default function Actualites() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Tous" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredArticle = articles[0];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 via-background to-background py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm mb-6 text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Actualités</span>
          </div>
          
          <div className="max-w-4xl">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">Votre commune</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Actualités Municipales</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Suivez la vie de votre commune, les projets en cours, les événements locaux 
              et toutes les informations pratiques de votre mairie.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Article */}
      <section className="container mx-auto px-4 -mt-4 mb-12">
        <Card className="overflow-hidden border-2 hover:border-primary/30 transition-colors">
          <div className="grid md:grid-cols-2">
            <div className="h-64 md:h-auto">
              <img 
                src={featuredArticle.image} 
                alt={featuredArticle.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-8 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant={featuredArticle.badgeVariant}>{featuredArticle.badge}</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {featuredArticle.category}
                </span>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {featuredArticle.location}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 hover:text-primary transition-colors cursor-pointer">
                {featuredArticle.title}
              </h2>
              <p className="text-muted-foreground mb-6">{featuredArticle.description}</p>
              <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{featuredArticle.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{featuredArticle.readTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{featuredArticle.views.toLocaleString()} vues</span>
                </div>
              </div>
              <Button className="w-fit gap-2">
                Lire l'article
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Search and Filter */}
      <section className="container mx-auto px-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une actualité..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="container mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-8">
          <p className="text-muted-foreground">
            {filteredArticles.length} article{filteredArticles.length > 1 ? 's' : ''} trouvé{filteredArticles.length > 1 ? 's' : ''}
          </p>
        </div>

        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.slice(1).map((article, index) => (
              <Card
                key={article.id}
                className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="h-48 overflow-hidden">
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={article.badgeVariant}>{article.badge}</Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{article.location}</span>
                    </div>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">{article.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{article.date}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.readTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {article.views.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Aucun article trouvé</h3>
            <p className="text-muted-foreground mb-4">
              Essayez de modifier vos critères de recherche
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery("");
              setSelectedCategory("Tous");
            }}>
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </section>

      {/* Newsletter CTA */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto text-center p-8">
            <h3 className="text-2xl font-bold mb-4">Restez informé</h3>
            <p className="text-muted-foreground mb-6">
              Abonnez-vous aux actualités de votre commune pour recevoir les dernières informations directement dans votre boîte mail.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input placeholder="Votre adresse email" className="flex-1" />
              <Button>S'abonner</Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}