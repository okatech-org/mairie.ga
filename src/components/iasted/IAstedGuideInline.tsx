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
  CheckCircle2,
  Headphones
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const GUIDE_STEPS = [
  {
    id: "intro",
    title: "Bienvenue",
    description: "iAsted est votre compagnon vocal pour toutes vos démarches administratives.",
    icon: Sparkles,
  },
  {
    id: "capabilities",
    title: "Fonctionnalités",
    description: "Demandes, rendez-vous, suivi de dossiers, navigation vocale...",
    icon: MessageSquare,
  },
  {
    id: "commands",
    title: "Commandes",
    description: "Parlez naturellement: \"Je veux un acte de naissance\"",
    icon: Mic,
  },
  {
    id: "start",
    title: "C'est parti !",
    description: "Cliquez sur le bouton iAsted en bas de l'écran.",
    icon: CheckCircle2,
  }
];

const CAPABILITIES = [
  { icon: FileText, title: "Demandes", desc: "Actes, certificats, autorisations" },
  { icon: Calendar, title: "Rendez-vous", desc: "Planifiez à la mairie" },
  { icon: Search, title: "Suivi", desc: "État de vos dossiers" },
  { icon: Navigation, title: "Navigation", desc: "Pilotez l'app par la voix" },
  { icon: Moon, title: "Interface", desc: "Mode sombre, paramètres" },
  { icon: Volume2, title: "Voix", desc: "Choisissez la voix" },
];

const VOICE_EXAMPLES = [
  { phrase: "Je veux un acte de naissance", action: "Ouvre le formulaire" },
  { phrase: "Prendre rendez-vous à la mairie", action: "Planifie un créneau" },
  { phrase: "Montre mes demandes", action: "Navigue vers la liste" },
  { phrase: "Passe en mode sombre", action: "Change le thème" },
];

interface IAstedGuideInlineProps {
  onClose?: () => void;
}

export const IAstedGuideInline = ({ onClose }: IAstedGuideInlineProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = GUIDE_STEPS[currentStep];

  const nextStep = () => {
    if (currentStep < GUIDE_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderStepContent = () => {
    switch (step.id) {
      case "intro":
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs py-1 px-2">
                <Mic className="w-3 h-3 mr-1" />
                Vocal
              </Badge>
              <Badge variant="outline" className="text-xs py-1 px-2">
                <MessageSquare className="w-3 h-3 mr-1" />
                Chat
              </Badge>
            </div>
          </motion.div>
        );

      case "capabilities":
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h3 className="font-bold text-lg mb-3">{step.title}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CAPABILITIES.map((cap, index) => (
                <motion.div
                  key={cap.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <cap.icon className="w-4 h-4 text-violet-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{cap.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{cap.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case "commands":
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h3 className="font-bold text-lg mb-3">{step.title}</h3>
            <div className="space-y-2">
              {VOICE_EXAMPLES.map((cmd, index) => (
                <motion.div
                  key={cmd.phrase}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2 p-2 rounded-lg bg-muted/50"
                >
                  <Mic className="w-3 h-3 mt-1 text-violet-500 shrink-0" />
                  <div>
                    <p className="text-xs font-medium">"{cmd.phrase}"</p>
                    <p className="text-[10px] text-muted-foreground">{cmd.action}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case "start":
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center animate-pulse shrink-0">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs">← Cherchez ce bouton en bas de l'écran</span>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 mb-2">
        {GUIDE_STEPS.map((s, index) => (
          <button
            key={s.id}
            onClick={() => setCurrentStep(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === currentStep 
                ? "bg-violet-500 w-6" 
                : index < currentStep 
                  ? "bg-violet-500/60 w-1.5" 
                  : "bg-muted-foreground/30 w-1.5"
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="min-h-[180px]"
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevStep}
          disabled={currentStep === 0}
          className="gap-1 h-8 px-2 text-xs"
        >
          <ChevronLeft className="w-3 h-3" />
          Préc.
        </Button>

        <span className="text-xs text-muted-foreground">
          {currentStep + 1} / {GUIDE_STEPS.length}
        </span>

        {currentStep < GUIDE_STEPS.length - 1 ? (
          <Button 
            size="sm" 
            onClick={nextStep} 
            className="gap-1 h-8 px-2 text-xs bg-violet-500 hover:bg-violet-600"
          >
            Suiv.
            <ChevronRight className="w-3 h-3" />
          </Button>
        ) : (
          <Button 
            size="sm" 
            onClick={onClose} 
            className="gap-1 h-8 px-2 text-xs bg-emerald-500 hover:bg-emerald-600"
          >
            Terminer
            <CheckCircle2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default IAstedGuideInline;
