import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
  Home as HomeIcon,
  Landmark
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GabonMairiesSection } from "@/components/home/GabonMairiesSection";
import heroImage from "@/assets/mairie-accueil.jpg";
import serviceImage from "@/assets/service-municipal.jpg";
import familleImage from "@/assets/famille-acte-naissance.jpg";
import entrepreneurImage from "@/assets/entrepreneur-patente.jpg";

export default function Home() {
  const { t } = useTranslation();
  
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
      title: "Urbanisme",
      description: "Permis de construire, certificats et autorisations pour vos projets immobiliers.",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      link: "/services",
      image: entrepreneurImage
    },
    {
      icon: Store,
      title: "Entreprises",
      description: "Patentes commerciales, autorisations et accompagnement des entrepreneurs locaux.",
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
      description: "Données protégées selon les normes officielles"
    },
    {
      icon: Clock,
      title: "Rapide",
      description: "Suivi en temps réel de vos démarches"
    },
    {
      icon: MapPin,
      title: "Proximité",
      description: "52 mairies à votre service dans tout le Gabon"
    },
    {
      icon: Sparkles,
      title: "Simplifié",
      description: "Procédures administratives dématérialisées"
    },
  ];

  const quickLinks = [
    { 
      icon: Newspaper, 
      label: "Actualités", 
      description: "Infos de votre commune",
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
      description: "Vie associative",
      href: "/associations",
      color: "bg-warning/10 text-warning"
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Mairie du Gabon - Citoyens" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/70 dark:from-background/98 dark:via-background/90 dark:to-background/75" />
        </div>

        <div className="relative z-10 py-20 md:py-28">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="max-w-2xl animate-fade-in">
                <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">
                  🇬🇦 Réseau des Mairies du Gabon
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Vos Services Municipaux en Ligne
                </h1>
                <p className="text-lg md:text-xl mb-8 text-muted-foreground leading-relaxed">
                  Effectuez vos démarches administratives depuis chez vous. État civil, urbanisme, 
                  fiscalité locale - toutes vos formalités municipales simplifiées.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to="/login">
                    <Button size="lg" className="w-full sm:w-auto min-w-[180px] gap-2">
                      Accéder aux services
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto min-w-[180px]">
                      Créer un compte
                    </Button>
                  </Link>
                </div>

                {/* Features Mini Grid */}
                <div className="grid grid-cols-2 gap-4 mt-10">
                  {features.map((feature, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-background/60 backdrop-blur-sm border border-border/50"
                    >
                      <feature.icon className="h-5 w-5 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{feature.title}</p>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
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
                      className="group p-6 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 hover:shadow-lg transition-all hover:-translate-y-1"
                    >
                      <div className={`w-12 h-12 rounded-lg ${link.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                        <link.icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{link.label}</h3>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section with Images */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Services Municipaux</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">Nos Services Phares</h2>
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
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={service.image} 
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
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
                      <span>Découvrir</span>
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
                Voir tous les services
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Gabon Mairies Section */}
      <GabonMairiesSection />

      {/* Stats Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "52", label: "Mairies connectées" },
              { value: "1.8M", label: "Citoyens servis" },
              { value: "24/7", label: "Services en ligne" },
              { value: "98%", label: "Satisfaction" },
            ].map((stat, index) => (
              <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-primary-foreground/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden border-2">
              <div className="grid md:grid-cols-2">
                <div className="p-8 md:p-12">
                  <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">Nouveau</Badge>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">
                    Simplifiez vos démarches municipales
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Créez votre compte citoyen et accédez à tous les services de votre mairie en ligne. 
                    Suivez vos demandes en temps réel.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      "Demandes de documents officiels",
                      "Suivi des dossiers en temps réel",
                      "Prise de rendez-vous en ligne",
                      "Notifications automatiques"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link to="/register">
                    <Button size="lg" className="w-full sm:w-auto gap-2">
                      Créer mon compte citoyen
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <div className="hidden md:flex bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 p-12 items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Landmark className="h-12 w-12 text-primary" />
                    </div>
                    <p className="text-xl font-semibold">52 mairies</p>
                    <p className="text-muted-foreground">à votre service</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
