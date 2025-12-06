import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  Users, 
  BookOpen, 
  GraduationCap,
  Building2,
  ChevronRight,
  ArrowRight,
  Play,
  Calendar,
  MapPin,
  CheckCircle2,
  Star,
  Recycle,
  Shield,
  Baby,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import reunionImage from "@/assets/reunion-citoyenne.jpg";
import familleImage from "@/assets/famille-acte-naissance.jpg";
import aideImage from "@/assets/aide-seniors.jpg";

const programs = [
  {
    id: 1,
    title: "Accompagnement des Seniors",
    description: "Programme d'aide aux personnes âgées pour leurs démarches administratives. Des agents municipaux se déplacent à domicile pour faciliter l'accès aux services.",
    icon: Heart,
    category: "Social",
    color: "bg-primary/10 text-primary",
    participants: 3250,
    successRate: 98,
    features: ["Visites à domicile", "Aide aux formulaires", "Accompagnement santé", "Lien social"],
    image: aideImage
  },
  {
    id: 2,
    title: "Éducation Citoyenne",
    description: "Ateliers de sensibilisation sur les droits et devoirs des citoyens. Sessions sur l'état civil, le vote, et la participation à la vie locale.",
    icon: GraduationCap,
    category: "Éducation",
    color: "bg-secondary/10 text-secondary",
    participants: 5680,
    successRate: 92,
    features: ["Ateliers pratiques", "Documents pédagogiques", "Visites mairie", "Certificats"],
    image: reunionImage
  },
  {
    id: 3,
    title: "Gabon Propre",
    description: "Initiative de sensibilisation à la propreté urbaine et au tri des déchets. Mobilisation citoyenne pour un environnement plus sain.",
    icon: Recycle,
    category: "Environnement",
    color: "bg-accent/10 text-accent",
    participants: 12400,
    successRate: 85,
    features: ["Journées nettoyage", "Formation tri", "Points de collecte", "Récompenses"],
    image: reunionImage
  },
  {
    id: 4,
    title: "Ma Famille, Mes Droits",
    description: "Programme de sensibilisation sur l'importance de l'état civil. Campagne pour l'enregistrement des naissances et la délivrance des actes.",
    icon: Baby,
    category: "État Civil",
    color: "bg-warning/10 text-warning",
    participants: 8900,
    successRate: 95,
    features: ["Enregistrement gratuit", "Caravanes mobiles", "Formation parents", "Suivi familles"],
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
    quote: "Grâce au programme, j'ai pu obtenir mon acte de naissance sans me déplacer. L'agent était très patient et gentil.",
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
    quote: "Nous avons enfin pu enregistrer nos trois enfants lors de la caravane mobile. Un grand merci à la mairie !",
    avatar: "FN"
  },
];

export default function Sensibilisation() {
  const [activeTab, setActiveTab] = useState("programmes");

  return (
    <div className="flex flex-col">
      {/* Hero Section - Inspired by Home page */}
      <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-center overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={reunionImage} 
            alt="Réunion citoyenne" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-64 h-64 md:w-96 md:h-96 rounded-full bg-primary/5 blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-10 w-48 h-48 md:w-72 md:h-72 rounded-full bg-accent/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-6 md:mb-8 text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Sensibilisation</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="order-2 lg:order-1 text-center lg:text-left">
              <Badge className="mb-4 md:mb-6 bg-accent/20 text-accent border-accent/30 px-4 py-1.5">
                <Sparkles className="h-3 w-3 mr-2" />
                Citoyenneté Active
              </Badge>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
                <span className="block">Programmes</span>
                <span className="block text-primary">Citoyens</span>
                <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-muted-foreground font-medium mt-2">
                  & Sensibilisation
                </span>
              </h1>
              
              <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Découvrez nos programmes dédiés à l'accompagnement des citoyens. 
                Seniors, familles, jeunes — des initiatives pour tous au service 
                de notre communauté.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <Button size="lg" className="gap-2 text-base px-6 py-6 md:px-8">
                  Découvrir les programmes
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="gap-2 text-base px-6 py-6 md:px-8">
                  <Play className="h-4 w-4" />
                  Voir les témoignages
                </Button>
              </div>

              {/* Mobile Stats - Below buttons on mobile */}
              <div className="grid grid-cols-2 gap-3 mt-8 lg:hidden">
                {[
                  { icon: Users, value: "25K+", label: "Citoyens" },
                  { icon: MapPin, value: "52", label: "Communes" },
                  { icon: Shield, value: "95%", label: "Satisfaction" },
                  { icon: Building2, value: "120+", label: "Événements" },
                ].map((stat, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <stat.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-lg font-bold">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Stats Cards (Desktop) */}
            <div className="order-1 lg:order-2 hidden lg:grid grid-cols-2 gap-4">
              {[
                { icon: Users, value: "25K+", label: "Citoyens touchés", delay: "0.1s" },
                { icon: MapPin, value: "52", label: "Communes actives", delay: "0.2s" },
                { icon: Shield, value: "95%", label: "Satisfaction", delay: "0.3s" },
                { icon: Building2, value: "120+", label: "Événements/an", delay: "0.4s" },
              ].map((stat, index) => (
                <Card 
                  key={index} 
                  className="text-center p-6 hover:shadow-xl transition-all duration-300 bg-card/80 backdrop-blur-sm border-border/50 hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: stat.delay }}
                >
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mx-auto mb-4">
                    <stat.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-4xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator - Hidden on mobile */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-muted-foreground animate-bounce">
          <span className="text-xs">Défiler</span>
          <ChevronRight className="h-4 w-4 rotate-90" />
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 md:space-y-8">
            {/* Responsive Tabs */}
            <TabsList className="w-full flex-wrap justify-start border-b rounded-none h-auto p-0 bg-transparent gap-0">
              {[
                { value: "programmes", label: "Programmes", icon: BookOpen },
                { value: "events", label: "Événements", icon: Calendar },
                { value: "temoignages", label: "Témoignages", icon: Star },
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 sm:flex-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-6 py-3 sm:py-4 gap-2 text-xs sm:text-sm"
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden xs:inline sm:inline">{tab.label}</span>
                  <span className="xs:hidden sm:hidden">{tab.label.substring(0, 4)}.</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Programmes Tab */}
            <TabsContent value="programmes" className="space-y-6 md:space-y-8">
              <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
                {programs.map((program, index) => (
                  <Card 
                    key={program.id}
                    className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-scale-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="h-40 sm:h-48 overflow-hidden">
                      <img 
                        src={program.image} 
                        alt={program.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className={`p-2 sm:p-3 rounded-xl ${program.color} -mt-10 sm:-mt-12 relative z-10 border-4 border-background`}>
                          <program.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <Badge variant="outline" className="text-xs">{program.category}</Badge>
                      </div>
                      <CardTitle className="text-lg sm:text-xl mt-2 group-hover:text-primary transition-colors">
                        {program.title}
                      </CardTitle>
                      <CardDescription className="text-sm sm:text-base line-clamp-2 sm:line-clamp-none">
                        {program.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4 pt-0">
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <p className="text-xs sm:text-sm text-muted-foreground">Bénéficiaires</p>
                          <p className="text-xl sm:text-2xl font-bold">{program.participants.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-muted-foreground">Satisfaction</p>
                          <div className="flex items-center gap-2">
                            <Progress value={program.successRate} className="flex-1 h-2" />
                            <span className="text-xs sm:text-sm font-medium">{program.successRate}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {program.features.slice(0, 3).map((feature, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] sm:text-xs px-2 py-0.5">
                            <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                            {feature}
                          </Badge>
                        ))}
                        {program.features.length > 3 && (
                          <Badge variant="outline" className="text-[10px] sm:text-xs">
                            +{program.features.length - 3}
                          </Badge>
                        )}
                      </div>

                      <Button className="w-full gap-2 mt-2 sm:mt-4" size="sm">
                        En savoir plus
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-4 md:space-y-6">
              <div className="grid gap-3 md:gap-4">
                {upcomingEvents.map((event, index) => (
                  <Card 
                    key={event.id}
                    className="hover:shadow-lg transition-all animate-scale-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex gap-3 sm:gap-4">
                          <div className="p-3 sm:p-4 rounded-xl bg-primary/10 text-primary text-center min-w-[60px] sm:min-w-[80px]">
                            <div className="text-lg sm:text-2xl font-bold">{event.date.split(' ')[0]}</div>
                            <div className="text-[10px] sm:text-xs">{event.date.split(' ')[1]}</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base sm:text-lg mb-1 truncate">{event.title}</h3>
                            <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                {event.time}
                              </span>
                              <Badge variant={event.type === "Présentiel" ? "default" : "secondary"} className="text-[10px] sm:text-xs">
                                {event.type}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                                {event.location}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0">
                          <div className="text-left sm:text-right">
                            <p className="text-xs sm:text-sm text-muted-foreground">Inscrits</p>
                            <p className="font-semibold">{event.registrations}</p>
                          </div>
                          <Button size="sm" className="px-4 sm:px-6">Participer</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center pt-4">
                <Button variant="outline" size="lg" className="gap-2">
                  Voir tous les événements
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Testimonials Tab */}
            <TabsContent value="temoignages" className="space-y-6 md:space-y-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {testimonials.map((testimonial, index) => (
                  <Card 
                    key={index}
                    className="hover:shadow-lg transition-all animate-scale-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-5 md:p-6">
                      <div className="flex items-center gap-1 mb-3 md:mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-warning text-warning" />
                        ))}
                      </div>
                      <p className="text-sm sm:text-base text-muted-foreground mb-4 md:mb-6 italic leading-relaxed">
                        "{testimonial.quote}"
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm sm:text-base">
                          {testimonial.avatar}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm sm:text-base truncate">{testimonial.name}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            {testimonial.location}
                          </p>
                          <Badge variant="secondary" className="mt-1 text-[10px] sm:text-xs">
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
      <section className="py-16 md:py-20 bg-gradient-to-r from-primary to-secondary text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6">
            Participez à la vie de votre commune !
          </h2>
          <p className="text-base sm:text-lg text-white/90 mb-6 md:mb-8 max-w-2xl mx-auto">
            Rejoignez les milliers de citoyens gabonais qui s'engagent pour leur communauté.
            Ensemble, construisons un Gabon plus solidaire.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="gap-2 w-full sm:w-auto">
                Créer mon compte citoyen
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/actualites">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 gap-2 w-full sm:w-auto">
                Voir les actualités
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
