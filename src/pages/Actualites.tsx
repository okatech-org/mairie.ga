import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Tag, Search, ArrowRight, Clock, Eye, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const articles = [
  {
    id: 1,
    category: "Annonces Consulaires",
    title: "Nouvelles procédures de demande de visa",
    description: "À partir du 1er janvier 2025, de nouvelles procédures simplifiées seront mises en place pour les demandes de visa. Ces changements visent à réduire les délais de traitement et à améliorer l'expérience des demandeurs.",
    date: "15 Décembre 2024",
    badge: "Important",
    badgeVariant: "destructive" as const,
    readTime: "5 min",
    views: 1250,
    image: "https://images.unsplash.com/photo-1569974507005-6dc61f97fb5c?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 2,
    category: "Sensibilisation Diaspora",
    title: "Campagne d'inscription sur les listes électorales",
    description: "Les membres de la diaspora sont invités à s'inscrire sur les listes électorales avant la date limite. Cette inscription est essentielle pour participer aux prochaines élections.",
    date: "10 Décembre 2024",
    badge: "Urgent",
    badgeVariant: "default" as const,
    readTime: "3 min",
    views: 2340,
    image: "https://images.unsplash.com/photo-1494172961521-33799ddd43a5?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 3,
    category: "Événements",
    title: "Célébration de la fête nationale",
    description: "Le consulat organise une cérémonie pour célébrer la fête nationale du Gabon le 17 août prochain. Tous les ressortissants sont cordialement invités.",
    date: "5 Décembre 2024",
    badge: "Événement",
    badgeVariant: "secondary" as const,
    readTime: "2 min",
    views: 890,
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 4,
    category: "Annonces Consulaires",
    title: "Horaires d'ouverture pendant les fêtes",
    description: "Le consulat sera fermé du 24 décembre au 2 janvier. Les services en ligne restent accessibles pendant cette période.",
    date: "1 Décembre 2024",
    badge: "Info",
    badgeVariant: "outline" as const,
    readTime: "1 min",
    views: 560,
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 5,
    category: "Sensibilisation Diaspora",
    title: "Programme d'aide au retour volontaire",
    description: "Un nouveau programme d'assistance est disponible pour les membres de la diaspora souhaitant retourner au Gabon. Ce programme offre un accompagnement complet.",
    date: "25 Novembre 2024",
    badge: "Nouveau",
    badgeVariant: "default" as const,
    readTime: "4 min",
    views: 1780,
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: 6,
    category: "Événements",
    title: "Forum économique de la diaspora",
    description: "Participez au forum annuel dédié aux opportunités économiques et d'investissement au Gabon. Des intervenants de renom partageront leur expertise.",
    date: "20 Novembre 2024",
    badge: "Événement",
    badgeVariant: "secondary" as const,
    readTime: "3 min",
    views: 1120,
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&auto=format&fit=crop&q=60"
  },
];

const categories = ["Tous", "Annonces Consulaires", "Sensibilisation Diaspora", "Événements"];

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
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 via-background to-background py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm mb-6 text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Actualités</span>
          </div>
          
          <div className="max-w-4xl">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">Restez informé</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Actualités & Annonces</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Suivez les dernières nouvelles consulaires, les événements de la diaspora gabonaise 
              et les programmes de sensibilisation.
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
          
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList>
              {categories.map((category) => (
                <TabsTrigger key={category} value={category} className="text-sm">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
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
                      <Tag className="h-3 w-3" />
                      <span>{article.category}</span>
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

        {/* Load More */}
        {filteredArticles.length > 6 && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Charger plus d'articles
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
              Abonnez-vous à notre newsletter pour recevoir les dernières actualités directement dans votre boîte mail.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input placeholder="Votre adresse email" className="flex-1" />
              <Button>S'abonner</Button>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
