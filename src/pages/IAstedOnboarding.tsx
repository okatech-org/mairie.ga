import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, 
  MessageSquare, 
  FileText, 
  Calendar, 
  Search, 
  Moon, 
  Sun,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Users,
  Building2,
  Shield,
  Volume2,
  Navigation,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const ONBOARDING_STEPS = [
  {
    id: "intro",
    title: "Bienvenue sur iAsted",
    subtitle: "Votre Assistant Municipal Intelligent",
    description: "iAsted est votre compagnon vocal pour toutes vos démarches administratives auprès des mairies du Gabon. Découvrez comment il peut vous simplifier la vie.",
    icon: Sparkles,
    color: "from-primary to-primary/60"
  },
  {
    id: "capabilities",
    title: "Que peut faire iAsted ?",
    subtitle: "Un assistant polyvalent",
    description: "iAsted vous accompagne dans toutes vos interactions avec les services municipaux.",
    icon: MessageSquare,
    color: "from-blue-500 to-cyan-500"
  },
  {
    id: "profiles",
    title: "Adapté à votre profil",
    subtitle: "Une aide personnalisée",
    description: "iAsted s'adapte à votre rôle pour vous offrir une assistance sur mesure.",
    icon: Users,
    color: "from-emerald-500 to-teal-500"
  },
  {
    id: "commands",
    title: "Commandes vocales",
    subtitle: "Parlez naturellement",
    description: "Découvrez les phrases que vous pouvez utiliser pour interagir avec iAsted.",
    icon: Mic,
    color: "from-violet-500 to-purple-500"
  },
  {
    id: "start",
    title: "Prêt à commencer ?",
    subtitle: "Lancez votre première conversation",
    description: "Cliquez sur le bouton iAsted en bas de votre écran pour démarrer.",
    icon: CheckCircle2,
    color: "from-amber-500 to-orange-500"
  }
];

const CAPABILITIES = [
  {
    icon: FileText,
    title: "Demandes administratives",
    description: "Initiez des demandes d'actes, certificats et autorisations",
    examples: ["Acte de naissance", "Permis de construire", "Certificat de résidence"]
  },
  {
    icon: Calendar,
    title: "Prise de rendez-vous",
    description: "Planifiez vos rendez-vous à la mairie",
    examples: ["RDV état civil", "RDV urbanisme", "RDV fiscalité"]
  },
  {
    icon: Search,
    title: "Suivi des dossiers",
    description: "Consultez l'état de vos demandes en cours",
    examples: ["Statut demande", "Documents manquants", "Délais"]
  },
  {
    icon: Navigation,
    title: "Navigation vocale",
    description: "Naviguez dans l'application par la voix",
    examples: ["Aller aux demandes", "Ouvrir mes documents", "Voir le tableau de bord"]
  },
  {
    icon: FileText,
    title: "Génération de documents",
    description: "Créez des attestations et certificats",
    examples: ["PDF", "Word", "Téléchargement direct"]
  },
  {
    icon: Moon,
    title: "Contrôle de l'interface",
    description: "Changez le thème et les paramètres",
    examples: ["Mode sombre", "Mode clair", "Changer de voix"]
  }
];

const PROFILES = [
  {
    icon: Users,
    role: "Citoyen",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    features: [
      "Demander des actes d'état civil",
      "Suivre vos dossiers en cours",
      "Prendre rendez-vous à la mairie",
      "Obtenir des informations sur les services"
    ]
  },
  {
    icon: Building2,
    role: "Agent Municipal",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    features: [
      "Consulter les demandes à traiter",
      "Gérer les rendez-vous du jour",
      "Générer des documents officiels",
      "Accéder aux statistiques du service"
    ]
  },
  {
    icon: Shield,
    role: "Élu / Administrateur",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    features: [
      "Superviser les services municipaux",
      "Consulter les indicateurs de performance",
      "Gérer les agents et les accès",
      "Piloter l'activité de la mairie"
    ]
  }
];

const VOICE_COMMANDS = [
  {
    category: "Demandes",
    icon: FileText,
    commands: [
      { phrase: "Je veux un acte de naissance", action: "Ouvre le formulaire de demande" },
      { phrase: "Faire une demande de permis de construire", action: "Lance la procédure urbanisme" },
      { phrase: "Demander un certificat de résidence", action: "Initie la demande" }
    ]
  },
  {
    category: "Rendez-vous",
    icon: Calendar,
    commands: [
      { phrase: "Prendre rendez-vous à la mairie", action: "Ouvre le calendrier" },
      { phrase: "Je veux un RDV pour un mariage", action: "Planifie un créneau état civil" },
      { phrase: "Annuler mon rendez-vous", action: "Gère les annulations" }
    ]
  },
  {
    category: "Navigation",
    icon: Navigation,
    commands: [
      { phrase: "Va à mes demandes", action: "Navigue vers la liste des demandes" },
      { phrase: "Montre mes documents", action: "Affiche les documents" },
      { phrase: "Ouvre le tableau de bord", action: "Accède au dashboard" }
    ]
  },
  {
    category: "Interface",
    icon: Sun,
    commands: [
      { phrase: "Passe en mode sombre", action: "Active le thème sombre" },
      { phrase: "Change de voix", action: "Alterne homme/femme" },
      { phrase: "Arrête-toi", action: "Met fin à la conversation" }
    ]
  }
];

export default function IAstedOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const step = ONBOARDING_STEPS[currentStep];

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    navigate("/");
  };

  const renderStepContent = () => {
    switch (step.id) {
      case "intro":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
          >
            <div className={`mx-auto w-32 h-32 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-2xl`}>
              <Volume2 className="w-16 h-16 text-white" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">{step.title}</h2>
              <p className="text-xl text-muted-foreground">{step.subtitle}</p>
              <p className="text-muted-foreground max-w-lg mx-auto">{step.description}</p>
            </div>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Badge variant="outline" className="text-sm py-1.5 px-3">
                <Mic className="w-4 h-4 mr-2" />
                Commande vocale
              </Badge>
              <Badge variant="outline" className="text-sm py-1.5 px-3">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat textuel
              </Badge>
            </div>
          </motion.div>
        );

      case "capabilities":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">{step.title}</h2>
              <p className="text-muted-foreground">{step.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CAPABILITIES.map((cap, index) => (
                <motion.div
                  key={cap.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <cap.icon className="w-5 h-5 text-primary" />
                        </div>
                        <CardTitle className="text-base">{cap.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{cap.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {cap.examples.map(ex => (
                          <Badge key={ex} variant="secondary" className="text-xs">
                            {ex}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case "profiles":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">{step.title}</h2>
              <p className="text-muted-foreground">{step.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PROFILES.map((profile, index) => (
                <motion.div
                  key={profile.role}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.15 }}
                >
                  <Card className={`h-full border-2 ${profile.color}`}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-background">
                          <profile.icon className="w-6 h-6" />
                        </div>
                        <CardTitle>{profile.role}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {profile.features.map(feature => (
                          <li key={feature} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case "commands":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">{step.title}</h2>
              <p className="text-muted-foreground">{step.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {VOICE_COMMANDS.map((cat, index) => (
                <motion.div
                  key={cat.category}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <cat.icon className="w-5 h-5 text-primary" />
                        <CardTitle className="text-base">{cat.category}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {cat.commands.map(cmd => (
                        <div key={cmd.phrase} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                          <Mic className="w-4 h-4 mt-1 text-primary shrink-0" />
                          <div>
                            <p className="text-sm font-medium">"{cmd.phrase}"</p>
                            <p className="text-xs text-muted-foreground">{cmd.action}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case "start":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
          >
            <div className={`mx-auto w-32 h-32 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-2xl`}>
              <CheckCircle2 className="w-16 h-16 text-white" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">{step.title}</h2>
              <p className="text-xl text-muted-foreground">{step.subtitle}</p>
              <p className="text-muted-foreground max-w-lg mx-auto">{step.description}</p>
            </div>
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center animate-pulse">
                  <Mic className="w-6 h-6 text-primary-foreground" />
                </div>
                <span>← Cherchez ce bouton en bas de l'écran</span>
              </div>
              <Button size="lg" onClick={handleFinish} className="mt-4">
                Commencer à utiliser iAsted
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {ONBOARDING_STEPS.map((s, index) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentStep 
                  ? "bg-primary w-8" 
                  : index < currentStep 
                    ? "bg-primary/60" 
                    : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="min-h-[500px] flex items-center justify-center"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Précédent
          </Button>

          <span className="text-sm text-muted-foreground">
            {currentStep + 1} / {ONBOARDING_STEPS.length}
          </span>

          {currentStep < ONBOARDING_STEPS.length - 1 ? (
            <Button onClick={nextStep} className="gap-2">
              Suivant
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} className="gap-2">
              Terminer
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
