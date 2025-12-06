import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  Users, 
  Globe, 
  BookOpen, 
  Briefcase, 
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
  TrendingUp,
  Target
} from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const programs = [
  {
    id: 1,
    title: "Programme de Retour Volontaire",
    description: "Accompagnement personnalisé pour les Gabonais de la diaspora souhaitant rentrer au pays. Aide à la réinstallation, orientation professionnelle et soutien administratif.",
    icon: HomeIcon,
    category: "Retour",
    color: "bg-primary/10 text-primary",
    participants: 1250,
    successRate: 92,
    features: ["Aide au déménagement", "Orientation emploi", "Logement temporaire", "Accompagnement familial"]
  },
  {
    id: 2,
    title: "Investir au Gabon",
    description: "Opportunités d'investissement et création d'entreprise pour la diaspora. Accompagnement juridique, fiscal et accès aux financements locaux.",
    icon: Briefcase,
    category: "Investissement",
    color: "bg-secondary/10 text-secondary",
    participants: 890,
    successRate: 78,
    features: ["Conseil juridique", "Accès financements", "Mise en réseau", "Suivi projet"]
  },
  {
    id: 3,
    title: "Bourse Excellence Diaspora",
    description: "Programme de bourses pour les étudiants gabonais à l'étranger. Financement des études, mentorat et opportunités de stage.",
    icon: GraduationCap,
    category: "Éducation",
    color: "bg-accent/10 text-accent",
    participants: 2100,
    successRate: 95,
    features: ["Bourses d'études", "Programme mentorat", "Stages entreprises", "Réseau alumni"]
  },
  {
    id: 4,
    title: "Transfert de Compétences",
    description: "Valorisez vos compétences acquises à l'étranger au service du développement du Gabon. Missions courtes ou longue durée.",
    icon: TrendingUp,
    category: "Expertise",
    color: "bg-warning/10 text-warning",
    participants: 560,
    successRate: 88,
    features: ["Missions expertise", "Formations", "Consulting", "Partenariats"]
  },
];

const upcomingEvents = [
  {
    id: 1,
    title: "Webinaire : Créer son entreprise au Gabon",
    date: "15 Janvier 2025",
    time: "18h00 CET",
    type: "En ligne",
    registrations: 245
  },
  {
    id: 2,
    title: "Forum Emploi Diaspora Paris",
    date: "22 Février 2025",
    time: "09h00 - 18h00",
    type: "Présentiel",
    location: "Paris",
    registrations: 180
  },
  {
    id: 3,
    title: "Session d'information : Bourses 2025",
    date: "5 Mars 2025",
    time: "14h00 CET",
    type: "En ligne",
    registrations: 320
  },
];

const testimonials = [
  {
    name: "Marie-Claire N.",
    location: "Paris → Libreville",
    program: "Retour Volontaire",
    quote: "Le programme m'a permis de rentrer sereinement après 15 ans en France. L'accompagnement a été exceptionnel.",
    avatar: "MC"
  },
  {
    name: "Jean-Paul M.",
    location: "Bruxelles",
    program: "Investir au Gabon",
    quote: "Grâce au programme, j'ai pu créer ma PME à Libreville tout en gardant mes activités en Belgique.",
    avatar: "JP"
  },
  {
    name: "Sylvie A.",
    location: "Lyon",
    program: "Bourse Excellence",
    quote: "La bourse m'a permis de financer mon Master. Aujourd'hui je contribue au développement de mon pays.",
    avatar: "SA"
  },
];

export default function Sensibilisation() {
  const [activeTab, setActiveTab] = useState("programmes");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-accent/20 via-primary/10 to-secondary/10 py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="flex items-center gap-2 text-sm mb-6 text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Sensibilisation</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">
                <Heart className="h-3 w-3 mr-1" />
                Diaspora Gabonaise
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Programmes de Sensibilisation & Accompagnement
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Découvrez nos programmes dédiés à la diaspora gabonaise. Que vous souhaitiez 
                investir, retourner au pays ou valoriser vos compétences, nous vous accompagnons.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="gap-2">
                  Découvrir les programmes
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="gap-2">
                  <Play className="h-4 w-4" />
                  Voir la vidéo
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Users, value: "50K+", label: "Diaspora connectée" },
                { icon: Globe, value: "45", label: "Pays représentés" },
                { icon: Target, value: "92%", label: "Taux de succès" },
                { icon: Building2, value: "350+", label: "Entreprises créées" },
              ].map((stat, index) => (
                <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
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
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-xl ${program.color}`}>
                          <program.icon className="h-6 w-6" />
                        </div>
                        <Badge variant="outline">{program.category}</Badge>
                      </div>
                      <CardTitle className="text-xl mt-4 group-hover:text-primary transition-colors">
                        {program.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {program.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Participants</p>
                          <p className="text-2xl font-bold">{program.participants.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Taux de succès</p>
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
                              <Badge variant={event.type === "En ligne" ? "default" : "secondary"}>
                                {event.type}
                              </Badge>
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {event.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Inscrits</p>
                            <p className="font-semibold">{event.registrations}</p>
                          </div>
                          <Button>S'inscrire</Button>
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
                          <p className="text-sm text-muted-foreground">{testimonial.location}</p>
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
            Prêt à vous engager ?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Rejoignez les milliers de Gabonais de la diaspora qui contribuent activement 
            au développement de notre pays.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                Créer mon compte
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/actualites">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 gap-2">
                En savoir plus
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
