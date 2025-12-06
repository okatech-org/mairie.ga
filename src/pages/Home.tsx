import { useState, useEffect, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Building2, 
  Users, 
  ArrowRight, 
  Shield, 
  Clock, 
  MapPin, 
  Sparkles,
  CheckCircle2,
  Newspaper,
  Heart,
  Store,
  Baby,
  Landmark,
  TreePine,
  Briefcase,
  GraduationCap,
  Phone,
  Mic
} from "lucide-react";
import { Link } from "react-router-dom";
import { GabonMairiesSection } from "@/components/home/GabonMairiesSection";
import heroImage from "@/assets/mairie-accueil.jpg";
import serviceImage from "@/assets/service-municipal.jpg";
import familleImage from "@/assets/famille-acte-naissance.jpg";
import entrepreneurImage from "@/assets/entrepreneur-patente.jpg";

// Lazy load the map component
const GabonMairiesMap = lazy(() => import("@/components/home/GabonMairiesMap"));

export default function Home() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const services = [
    {
      icon: Baby,
      title: "État Civil",
      description: "Actes de naissance, mariage, décès et tous les documents officiels pour les événements de vie.",
      color: "text-primary",
      bgColor: "bg-primary/10",
      link: "/services",
      image: familleImage
    },
    {
      icon: Building2,
      title: "Urbanisme & Habitat",
      description: "Permis de construire, certificats d'urbanisme et autorisations pour vos projets immobiliers.",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      link: "/services",
      image: entrepreneurImage
    },
    {
      icon: Store,
      title: "Fiscalité Locale",
      description: "Patentes commerciales, taxes communales et accompagnement des entrepreneurs locaux.",
      color: "text-accent",
      bgColor: "bg-accent/10",
      link: "/services",
      image: serviceImage
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "Sécurisé",
      description: "Protection des données garantie"
    },
    {
      icon: Clock,
      title: "Disponible 24/7",
      description: "Services accessibles à tout moment"
    },
    {
      icon: MapPin,
      title: "Proximité",
      description: "52 mairies connectées au Gabon"
    },
    {
      icon: Sparkles,
      title: "Simplifié",
      description: "Procédures 100% dématérialisées"
    },
  ];

  const quickLinks = [
    { 
      icon: Newspaper, 
      label: "Actualités", 
      description: "Vie de votre commune",
      href: "/actualites",
      color: "bg-primary/10 text-primary"
    },
    { 
      icon: Heart, 
      label: "Sensibilisation", 
      description: "Programmes citoyens",
      href: "/sensibilisation",
      color: "bg-accent/10 text-accent"
    },
    { 
      icon: FileText, 
      label: "Services", 
      description: "Catalogue complet",
      href: "/services",
      color: "bg-secondary/10 text-secondary"
    },
    { 
      icon: Users, 
      label: "Associations", 
      description: "Vie associative locale",
      href: "/associations",
      color: "bg-warning/10 text-warning"
    },
  ];

  const provinces = [
    { name: "Estuaire", mairies: 12, capital: "Libreville" },
    { name: "Haut-Ogooué", mairies: 8, capital: "Franceville" },
    { name: "Moyen-Ogooué", mairies: 5, capital: "Lambaréné" },
    { name: "Ngounié", mairies: 6, capital: "Mouila" },
    { name: "Nyanga", mairies: 4, capital: "Tchibanga" },
    { name: "Ogooué-Maritime", mairies: 5, capital: "Port-Gentil" },
    { name: "Ogooué-Ivindo", mairies: 4, capital: "Makokou" },
    { name: "Ogooué-Lolo", mairies: 4, capital: "Koulamoutou" },
    { name: "Woleu-Ntem", mairies: 4, capital: "Oyem" },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center">
        {/* Background Image with Theme-Aware Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src={heroImage} 
            alt="Mairie du Gabon - Accueil citoyens" 
            className="w-full h-full object-cover transition-transform duration-100 will-change-transform"
            style={{ 
              transform: `translateY(${scrollY * 0.3}px) scale(${1 + scrollY * 0.0002})`,
            }}
          />
          {/* Light mode: softer overlay - Dark mode: stronger overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 via-slate-900/50 to-slate-900/30 dark:from-black/80 dark:via-black/60 dark:to-black/40" />
        </div>

        <div className="relative z-10 py-20 md:py-28 w-full">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="max-w-2xl animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-xl bg-white/20 dark:bg-primary/20 border border-white/30 dark:border-primary/30 flex items-center justify-center backdrop-blur-sm dark:backdrop-blur-none">
                    <Landmark className="h-8 w-8 text-white dark:text-primary" />
                  </div>
                  <div>
                    <Badge className="bg-emerald-500/20 text-emerald-100 dark:text-success border-emerald-500/30 dark:border-success/30 hover:bg-emerald-500/30 dark:hover:bg-success/30 backdrop-blur-sm dark:backdrop-blur-none">
                      🇬🇦 République Gabonaise
                    </Badge>
                  </div>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  <span className="text-white dark:text-primary drop-shadow-lg">Mairies.ga</span>
                  <br />
                  <span className="text-white/95 dark:text-white text-3xl md:text-4xl lg:text-5xl font-medium drop-shadow-lg">
                    Le Portail des Communes du Gabon
                  </span>
                </h1>
                
                <p className="text-lg md:text-xl mb-8 text-white/90 leading-relaxed drop-shadow-md">
                  Accédez aux services de votre mairie en ligne. État civil, urbanisme, 
                  fiscalité locale — toutes vos démarches administratives municipales simplifiées et sécurisées.
                </p>
                
                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                  <Link to="/login">
                    <Button size="lg" className="w-full sm:w-auto min-w-[180px] gap-2 h-12 text-base bg-primary hover:bg-primary/90 text-white dark:text-primary-foreground">
                      <Users className="h-5 w-5" />
                      Espace Citoyen
                    </Button>
                  </Link>
                  <Link to="/services">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto min-w-[180px] gap-2 h-12 text-base bg-white/10 dark:bg-white/5 border-white/30 dark:border-white/20 text-white hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm dark:backdrop-blur-none">
                      <FileText className="h-5 w-5" />
                      Nos Services
                    </Button>
                  </Link>
                  <Link to="/iasted-guide">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto min-w-[180px] gap-2 h-12 text-base bg-violet-500/20 border-violet-400/40 text-white hover:bg-violet-500/30 backdrop-blur-sm">
                      <Mic className="h-5 w-5" />
                      Découvrir iAsted
                    </Button>
                  </Link>
                </div>

                {/* Features Mini Grid */}
                <div className="grid grid-cols-2 gap-4 mt-10">
                  {features.map((feature, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/10 dark:bg-black/40 backdrop-blur-md dark:backdrop-blur-sm border border-white/20 dark:border-white/10 hover:border-white/40 dark:hover:border-primary/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/20 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="h-5 w-5 text-white dark:text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-white">{feature.title}</p>
                        <p className="text-xs text-white/70">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Content - Quick Links */}
              <div className="hidden lg:block animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="grid grid-cols-2 gap-4">
                  {quickLinks.map((link, index) => (
                    <Link 
                      key={index}
                      to={link.href}
                      className="group p-6 rounded-xl bg-white/95 dark:bg-card/90 backdrop-blur-sm dark:backdrop-blur-none border border-white/50 dark:border-border/50 shadow-lg dark:shadow-none hover:shadow-xl hover:border-primary/30 transition-all hover:-translate-y-1"
                    >
                      <div className={`w-14 h-14 rounded-xl ${link.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                        <link.icon className="h-7 w-7" />
                      </div>
                      <h3 className="font-semibold text-lg mb-1 text-foreground group-hover:text-primary transition-colors">{link.label}</h3>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Quick Links */}
      <section className="lg:hidden py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-2">
            {quickLinks.map((link, index) => (
              <Link 
                key={index}
                to={link.href}
                className="flex flex-col items-center text-center gap-2 p-3 rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg ${link.color} flex items-center justify-center`}>
                  <link.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-xs leading-tight">{link.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{link.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Services Municipaux</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Nos Services <span className="text-primary">Essentiels</span>
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
              Des services de proximité pour accompagner chaque moment de votre vie citoyenne
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Link to={service.link} key={index}>
                <Card
                  className="group h-full overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-scale-in border-2 hover:border-primary/30"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="h-48 overflow-hidden relative">
                    <img 
                      src={service.image} 
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  </div>
                  <CardHeader className="text-center pb-4">
                    <div className={`w-14 h-14 rounded-2xl ${service.bgColor} flex items-center justify-center mx-auto -mt-10 relative z-10 border-4 border-background ${service.color} transition-transform group-hover:scale-110`}>
                      <service.icon className="h-7 w-7" />
                    </div>
                    <CardTitle className="text-xl mt-2 group-hover:text-primary transition-colors">{service.title}</CardTitle>
                    <CardDescription className="text-base">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Accéder au service</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/services">
              <Button size="lg" variant="outline" className="gap-2">
                Voir tous les services municipaux
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-20 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <MapPin className="h-3 w-3 mr-1" />
              Couverture Nationale
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              9 Provinces, <span className="text-primary">52 Communes</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explorez le réseau municipal unifié couvrant l'ensemble du territoire gabonais
            </p>
          </div>

          <Suspense fallback={
            <div className="w-full h-[500px] bg-card rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-muted-foreground">Chargement de la carte...</p>
              </div>
            </div>
          }>
            <GabonMairiesMap />
          </Suspense>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "52", label: "Communes connectées", icon: Landmark },
              { value: "2.3M", label: "Citoyens gabonais", icon: Users },
              { value: "24/7", label: "Services en ligne", icon: Clock },
              { value: "100%", label: "Gratuit", icon: CheckCircle2 },
            ].map((stat, index) => (
              <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <stat.icon className="h-8 w-8 mx-auto mb-3 opacity-80" />
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-primary-foreground/80 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">Programmes Citoyens</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Votre Mairie Vous Accompagne
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Découvrez les programmes d'accompagnement mis en place par les mairies 
                du Gabon pour améliorer le quotidien des citoyens.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: GraduationCap, title: "Éducation", desc: "Bourses scolaires", color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
                  { icon: Briefcase, title: "Emploi", desc: "Insertion jeunes", color: "text-orange-500", bgColor: "bg-orange-500/10" },
                  { icon: Heart, title: "Solidarité", desc: "Aide familles", color: "text-pink-500", bgColor: "bg-pink-500/10" },
                  { icon: TreePine, title: "Écologie", desc: "Actions vertes", color: "text-blue-500", bgColor: "bg-blue-500/10" },
                ].map((item, index) => (
                  <div key={index} className="flex flex-col items-center text-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className={`w-10 h-10 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                      <item.icon className={`h-5 w-5 ${item.color}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-xs leading-tight">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link to="/sensibilisation" className="inline-block mt-8">
                <Button size="lg" variant="outline" className="gap-2">
                  Découvrir tous les programmes
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="relative">
              <img 
                src={serviceImage} 
                alt="Service municipal - Accompagnement citoyen"
                className="w-full rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-card p-6 rounded-xl shadow-xl border border-border max-w-xs">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold">+15 000 familles</p>
                    <p className="text-xs text-muted-foreground">accompagnées en 2024</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden border-2 border-primary/20">
              <div className="grid md:grid-cols-2">
                <div className="p-8 md:p-12">
                  <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">Nouveau</Badge>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    Créez votre Compte Citoyen
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Accédez à tous les services de votre mairie en ligne. 
                    Suivez vos demandes et recevez des notifications en temps réel.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      "Demandes de documents officiels",
                      "Suivi des dossiers en temps réel",
                      "Prise de rendez-vous en ligne",
                      "Notifications par SMS et email"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link to="/register">
                    <Button size="lg" className="w-full sm:w-auto gap-2">
                      Créer mon compte
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <div className="hidden md:flex bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 p-12 items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Landmark className="h-12 w-12 text-primary" />
                    </div>
                    <p className="text-2xl font-bold text-primary">Mairies.ga</p>
                    <p className="text-muted-foreground">Réseau des Communes du Gabon</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>+241 01 XX XX XX</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Libreville, Gabon</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>contact@mairies.ga</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}