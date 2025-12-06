import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  Users, 
  Leaf, 
  BookOpen, 
  Droplets,
  Home as HomeIcon,
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
  Baby
} from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={reunionImage} 
            alt="Réunion citoyenne" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/70" />
        </div>

        <div className="container mx-auto px-4 relative z-10 py-20">
          <div className="flex items-center gap-2 text-sm mb-6 text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Sensibilisation</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">
                <Heart className="h-3 w-3 mr-1" />
                Citoyenneté Active
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Programmes Citoyens & Sensibilisation
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Découvrez nos programmes dédiés à l'accompagnement des citoyens. Seniors, familles, 
                jeunes - des initiatives pour tous au service de notre communauté.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="gap-2">
                  Découvrir les programmes
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="gap-2">
                  <Play className="h-4 w-4" />
                  Voir les témoignages
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Users, value: "25K+", label: "Citoyens touchés" },
                { icon: MapPin, value: "52", label: "Communes actives" },
                { icon: Shield, value: "95%", label: "Satisfaction" },
                { icon: Building2, value: "120+", label: "Événements/an" },
              ].map((stat, index) => (
                <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow bg-card/80 backdrop-blur-sm">
                  <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              {[
                { value: "programmes", label: "Programmes", icon: BookOpen },
                { value: "events", label: "Événements", icon: Calendar },
                { value: "temoignages", label: "Témoignages", icon: Star },
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-4 gap-2"
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Programmes Tab */}
            <TabsContent value="programmes" className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                {programs.map((program, index) => (
                  <Card 
                    key={program.id}
                    className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-scale-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={program.image} 
                        alt={program.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-xl ${program.color} -mt-12 relative z-10 border-4 border-background`}>
                          <program.icon className="h-6 w-6" />
                        </div>
                        <Badge variant="outline">{program.category}</Badge>
                      </div>
                      <CardTitle className="text-xl mt-2 group-hover:text-primary transition-colors">
                        {program.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {program.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Bénéficiaires</p>
                          <p className="text-2xl font-bold">{program.participants.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Satisfaction</p>
                          <div className="flex items-center gap-2">
                            <Progress value={program.successRate} className="flex-1" />
                            <span className="text-sm font-medium">{program.successRate}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {program.features.map((feature, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {feature}
                          </Badge>
                        ))}
                      </div>

                      <Button className="w-full gap-2 mt-4">
                        En savoir plus
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Events Tab */}
            <TabsContent value="events" className="space-y-6">
              <div className="grid gap-4">
                {upcomingEvents.map((event, index) => (
                  <Card 
                    key={event.id}
                    className="hover:shadow-lg transition-all animate-scale-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex gap-4">
                          <div className="p-4 rounded-xl bg-primary/10 text-primary text-center min-w-[80px]">
                            <div className="text-2xl font-bold">{event.date.split(' ')[0]}</div>
                            <div className="text-xs">{event.date.split(' ')[1]}</div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {event.time}
                              </span>
                              <Badge variant={event.type === "Présentiel" ? "default" : "secondary"}>
                                {event.type}
                              </Badge>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {event.location}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Inscrits</p>
                            <p className="font-semibold">{event.registrations}</p>
                          </div>
                          <Button>Participer</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center">
                <Button variant="outline" size="lg" className="gap-2">
                  Voir tous les événements
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Testimonials Tab */}
            <TabsContent value="temoignages" className="space-y-8">
              <div className="grid md:grid-cols-3 gap-6">
                {testimonials.map((testimonial, index) => (
                  <Card 
                    key={index}
                    className="hover:shadow-lg transition-all animate-scale-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-6 italic">
                        "{testimonial.quote}"
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                          {testimonial.avatar}
                        </div>
                        <div>
                          <p className="font-semibold">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
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
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Participez à la vie de votre commune !
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Rejoignez les milliers de citoyens gabonais qui s'engagent pour leur communauté.
            Ensemble, construisons un Gabon plus solidaire.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                Créer mon compte citoyen
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/actualites">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 gap-2">
                Voir les actualités
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
