import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Tag,
  Search,
  ArrowRight,
  Clock,
  Eye,
  ChevronRight,
  MapPin,
  Heart,
  Users,
  BookOpen,
  GraduationCap,
  Building2,
  Play,
  CheckCircle2,
  Star,
  Recycle,
  Baby,
  Sparkles,
  Newspaper,
  Megaphone
} from "lucide-react";
import { Link } from "react-router-dom";
import { useMunicipality } from "@/contexts/MunicipalityContext";
import { MunicipalityIndicator } from "@/components/municipality/MunicipalityIndicator";
import reunionImage from "@/assets/reunion-citoyenne.jpg";
import serviceImage from "@/assets/service-municipal.jpg";
import villeImage from "@/assets/ville-gabon.jpg";
import familleImage from "@/assets/famille-acte-naissance.jpg";
import entrepreneurImage from "@/assets/entrepreneur-patente.jpg";
import aideImage from "@/assets/aide-seniors.jpg";

// ========== ACTUALITÉS DATA ==========
const articles = [
  {
    id: 1,
    category: "Services Municipaux",
    title: "Nouveau guichet unique pour les actes civils",
    description: "La mairie de Libreville inaugure un guichet unique permettant aux citoyens d'obtenir leurs actes de naissance, mariage et décès en un seul lieu.",
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
    description: "Les citoyens sont invités à participer à la réunion publique pour définir les priorités du budget participatif.",
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
    description: "Découvrez les coulisses de votre mairie lors de cette journée exceptionnelle. Rencontrez les agents et visitez les services.",
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
    description: "Les mairies adapteront leurs horaires pendant les fêtes de fin d'année. Consultez les horaires de votre commune.",
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
    description: "La commune lance un nouveau programme d'accompagnement administratif pour les personnes âgées.",
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
    description: "Bonne nouvelle pour les entrepreneurs ! Les procédures de demande de patente sont désormais simplifiées.",
    date: "20 Novembre 2024",
    badge: "Entreprises",
    badgeVariant: "secondary" as const,
    readTime: "3 min",
    views: 2340,
    image: entrepreneurImage,
    location: "National"
  },
];

// ========== SENSIBILISATION DATA ==========
const programs = [
  {
    id: 1,
    title: "Accompagnement des Seniors",
    description: "Programme d'aide aux personnes âgées pour leurs démarches administratives. Des agents municipaux se déplacent à domicile.",
    icon: Heart,
    category: "Social",
    color: "bg-primary/10 text-primary",
    participants: 3250,
    successRate: 98,
    features: ["Visites à domicile", "Aide aux formulaires", "Accompagnement santé"],
    image: aideImage
  },
  {
    id: 2,
    title: "Éducation Citoyenne",
    description: "Ateliers de sensibilisation sur les droits et devoirs des citoyens. Sessions sur l'état civil et le vote.",
    icon: GraduationCap,
    category: "Éducation",
    color: "bg-secondary/10 text-secondary",
    participants: 5680,
    successRate: 92,
    features: ["Ateliers pratiques", "Documents pédagogiques", "Certificats"],
    image: reunionImage
  },
  {
    id: 3,
    title: "Gabon Propre",
    description: "Initiative de sensibilisation à la propreté urbaine et au tri des déchets. Mobilisation citoyenne.",
    icon: Recycle,
    category: "Environnement",
    color: "bg-accent/10 text-accent",
    participants: 12400,
    successRate: 85,
    features: ["Journées nettoyage", "Formation tri", "Points de collecte"],
    image: reunionImage
  },
  {
    id: 4,
    title: "Ma Famille, Mes Droits",
    description: "Campagne pour l'enregistrement des naissances et la délivrance des actes d'état civil.",
    icon: Baby,
    category: "État Civil",
    color: "bg-warning/10 text-warning",
    participants: 8900,
    successRate: 95,
    features: ["Enregistrement gratuit", "Caravanes mobiles", "Suivi familles"],
    image: familleImage
  },
];

const upcomingEvents = [
  {
    id: 1,
    title: "Journée portes ouvertes de la mairie",
    date: "18 Janvier 2025",
    time: "09h00 - 17h00",
    type: "Présentiel",
    location: "Libreville",
    registrations: 450
  },
  {
    id: 2,
    title: "Atelier : Comprendre ses droits citoyens",
    date: "25 Janvier 2025",
    time: "14h00 - 16h00",
    type: "Présentiel",
    location: "Port-Gentil",
    registrations: 120
  },
  {
    id: 3,
    title: "Campagne d'enregistrement des naissances",
    date: "1-15 Février 2025",
    time: "Toute la journée",
    type: "Caravane mobile",
    location: "Woleu-Ntem",
    registrations: 680
  },
  {
    id: 4,
    title: "Forum de la participation citoyenne",
    date: "22 Février 2025",
    time: "10h00 - 18h00",
    type: "Présentiel",
    location: "Franceville",
    registrations: 320
  },
];

const testimonials = [
  {
    name: "Mama Rose O.",
    location: "Libreville",
    program: "Accompagnement Seniors",
    quote: "Grâce au programme, j'ai pu obtenir mon acte de naissance sans me déplacer. L'agent était très patient.",
    avatar: "RO"
  },
  {
    name: "Jean-Pierre M.",
    location: "Franceville",
    program: "Éducation Citoyenne",
    quote: "Les ateliers m'ont permis de comprendre mes droits et de mieux participer à la vie de ma commune.",
    avatar: "JP"
  },
  {
    name: "Famille Ndong",
    location: "Oyem",
    program: "Ma Famille, Mes Droits",
    quote: "Nous avons enfin pu enregistrer nos trois enfants lors de la caravane mobile. Un grand merci !",
    avatar: "FN"
  },
];

const newsCategories = ["Tous", "Services Municipaux", "Vie Citoyenne", "Événements", "Entreprises"];

export default function VieCitoyenne() {
  const [activeTab, setActiveTab] = useState("actualites");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const { currentMunicipality, detectionSource, isLoading: isMunicipalityLoading } = useMunicipality();

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "Tous" || article.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const featuredArticle = articles[0];

  const stats = [
    { icon: Users, value: "25K+", label: "Citoyens touchés" },
    { icon: MapPin, value: "52", label: "Communes actives" },
    { icon: Building2, value: "120+", label: "Événements/an" },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] md:min-h-[55vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={reunionImage}
            alt="Vie citoyenne"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center gap-2 text-sm mb-4 text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Vie Citoyenne</span>
          </div>

          <div className="max-w-3xl">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 px-4 py-1.5">
              <Sparkles className="h-3 w-3 mr-2" />
              Actualités & Sensibilisation
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
              <span className="block">Vie</span>
              <span className="text-primary">Citoyenne</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed max-w-2xl">
              Suivez les actualités de votre commune, découvrez les programmes citoyens
              et participez aux événements locaux.
            </p>

            {/* Stats Mini */}
            <div className="flex flex-wrap gap-4 mb-6">
              {stats.map((stat, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-sm border">
                  <stat.icon className="h-4 w-4 text-primary" />
                  <span className="font-bold">{stat.value}</span>
                  <span className="text-sm text-muted-foreground hidden sm:inline">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* Municipality Indicator */}
            <MunicipalityIndicator variant="full" className="max-w-md" />
          </div>
        </div>
      </section>

      {/* Main Content with Tabs */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Tab Navigation */}
            <TabsList className="w-full justify-start gap-2 bg-transparent p-0 flex-wrap">
              <TabsTrigger
                value="actualites"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-3 rounded-full gap-2"
              >
                <Newspaper className="h-4 w-4" />
                Actualités
                <Badge variant="secondary" className="ml-1">{articles.length}</Badge>
              </TabsTrigger>
              <TabsTrigger
                value="programmes"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-3 rounded-full gap-2"
              >
                <Megaphone className="h-4 w-4" />
                Programmes
                <Badge variant="secondary" className="ml-1">{programs.length}</Badge>
              </TabsTrigger>
              <TabsTrigger
                value="evenements"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-3 rounded-full gap-2"
              >
                <Calendar className="h-4 w-4" />
                Événements
                <Badge variant="secondary" className="ml-1">{upcomingEvents.length}</Badge>
              </TabsTrigger>
              <TabsTrigger
                value="temoignages"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-3 rounded-full gap-2"
              >
                <Star className="h-4 w-4" />
                Témoignages
              </TabsTrigger>
            </TabsList>

            {/* ========== ACTUALITÉS TAB ========== */}
            <TabsContent value="actualites" className="space-y-6">
              {/* Featured Article */}
              <Card className="overflow-hidden border-2 hover:border-primary/30 transition-colors">
                <div className="grid md:grid-cols-2">
                  <div className="h-56 md:h-auto">
                    <img
                      src={featuredArticle.image}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 md:p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant={featuredArticle.badgeVariant}>{featuredArticle.badge}</Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {featuredArticle.location}
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold mb-3 hover:text-primary transition-colors cursor-pointer">
                      {featuredArticle.title}
                    </h2>
                    <p className="text-muted-foreground mb-4 line-clamp-2">{featuredArticle.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {featuredArticle.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {featuredArticle.views.toLocaleString()}
                      </span>
                    </div>
                    <Button className="w-fit gap-2">
                      Lire l'article
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {newsCategories.map((category) => (
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

              {/* Articles Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredArticles.slice(1).map((article) => (
                  <Card key={article.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="h-40 overflow-hidden">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={article.badgeVariant}>{article.badge}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {article.location}
                        </span>
                      </div>
                      <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {article.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {article.views.toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* ========== PROGRAMMES TAB ========== */}
            <TabsContent value="programmes" className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
                {programs.map((program) => (
                  <Card key={program.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="h-40 overflow-hidden">
                      <img
                        src={program.image}
                        alt={program.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className={`p-2.5 rounded-xl ${program.color} -mt-10 relative z-10 border-4 border-background`}>
                          <program.icon className="h-5 w-5" />
                        </div>
                        <Badge variant="outline">{program.category}</Badge>
                      </div>
                      <CardTitle className="text-lg mt-2 group-hover:text-primary transition-colors">
                        {program.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {program.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Bénéficiaires</p>
                          <p className="text-xl font-bold">{program.participants.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Satisfaction</p>
                          <div className="flex items-center gap-2">
                            <Progress value={program.successRate} className="flex-1 h-2" />
                            <span className="text-xs font-medium">{program.successRate}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {program.features.map((feature, i) => (
                          <Badge key={i} variant="secondary" className="text-xs px-2 py-0.5">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                            {feature}
                          </Badge>
                        ))}
                      </div>

                      <Button className="w-full gap-2" size="sm">
                        En savoir plus
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* ========== ÉVÉNEMENTS TAB ========== */}
            <TabsContent value="evenements" className="space-y-4">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-all">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary text-center min-w-[70px]">
                          <div className="text-xl font-bold">{event.date.split(' ')[0]}</div>
                          <div className="text-xs">{event.date.split(' ')[1]}</div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {event.time}
                            </span>
                            <Badge variant={event.type === "Présentiel" ? "default" : "secondary"} className="text-xs">
                              {event.type}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0">
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-muted-foreground">Inscrits</p>
                          <p className="font-semibold">{event.registrations}</p>
                        </div>
                        <Button size="sm">Participer</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* ========== TÉMOIGNAGES TAB ========== */}
            <TabsContent value="temoignages" className="space-y-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {testimonials.map((testimonial, index) => (
                  <Card key={index} className="hover:shadow-lg transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-4 italic leading-relaxed">
                        "{testimonial.quote}"
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {testimonial.avatar}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{testimonial.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {testimonial.location}
                          </p>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {testimonial.program}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Participez à la vie de votre commune !
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Rejoignez les milliers de citoyens gabonais qui s'engagent pour leur communauté.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="gap-2 w-full sm:w-auto">
                Créer mon compte citoyen
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-muted/50 py-12">
        <div className="container mx-auto px-4">
          <Card className="max-w-xl mx-auto text-center p-6">
            <h3 className="text-xl font-bold mb-3">Restez informé</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Recevez les dernières actualités directement dans votre boîte mail.
            </p>
            <div className="flex gap-2">
              <Input placeholder="Votre adresse email" className="flex-1" />
              <Button>S'abonner</Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}