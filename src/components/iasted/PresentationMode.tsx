import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  X, 
  Volume2, 
  VolumeX,
  Maximize2,
  Minimize2,
  Home,
  FileText,
  Heart,
  Newspaper,
  MapPin,
  UserPlus,
  LogIn,
  Sparkles,
  Bot
} from 'lucide-react';

interface PresentationStep {
  id: string;
  route: string;
  title: string;
  icon: React.ElementType;
  narration: string;
  duration: number; // seconds
  highlight?: string; // CSS selector to highlight
  scrollTo?: string; // CSS selector to scroll to
  action?: 'scroll-map' | 'highlight-services' | 'show-stats';
}

const PRESENTATION_SCRIPT: PresentationStep[] = [
  {
    id: 'intro',
    route: '/',
    title: 'Bienvenue',
    icon: Home,
    narration: `Bienvenue sur MAIRIE.GA, le portail numérique unifié des 52 communes du Gabon. 
    Je suis iAsted, votre assistant intelligent, et je vais vous présenter cette plateforme révolutionnaire 
    qui modernise les services publics municipaux pour tous les citoyens gabonais et résidents étrangers.`,
    duration: 12,
    scrollTo: 'top'
  },
  {
    id: 'vision',
    route: '/',
    title: 'Notre Vision',
    icon: Sparkles,
    narration: `Notre vision est simple : rapprocher l'administration de ses administrés. 
    Fini les files d'attente interminables et les déplacements inutiles. 
    Désormais, toutes vos démarches municipales sont accessibles 24 heures sur 24, 
    7 jours sur 7, depuis votre téléphone ou ordinateur.`,
    duration: 10,
    action: 'highlight-services'
  },
  {
    id: 'map',
    route: '/',
    title: 'Couverture Nationale',
    icon: MapPin,
    narration: `Regardez cette carte interactive. 9 provinces, 52 communes connectées. 
    De Libreville à Franceville, de Port-Gentil à Oyem, chaque mairie du Gabon est désormais 
    à portée de clic. Cliquez sur une commune pour accéder directement à ses services.`,
    duration: 10,
    scrollTo: '.container:has([class*="GabonMairiesMap"])',
    action: 'scroll-map'
  },
  {
    id: 'services',
    route: '/services',
    title: 'Catalogue des Services',
    icon: FileText,
    narration: `Voici notre catalogue complet de services municipaux. État civil pour vos actes de naissance, 
    mariage et décès. Urbanisme pour vos permis de construire. Fiscalité locale pour vos patentes commerciales. 
    Chaque service est détaillé avec les pièces requises, les délais et les tarifs.`,
    duration: 12
  },
  {
    id: 'citizen-benefits',
    route: '/services',
    title: 'Avantages Citoyens',
    icon: UserPlus,
    narration: `Pour vous, citoyens gabonais, les avantages sont nombreux : 
    suivi en temps réel de vos demandes, notifications automatiques, 
    coffre-fort numérique pour stocker vos documents, 
    et moi, iAsted, disponible pour vous guider à chaque étape.`,
    duration: 10
  },
  {
    id: 'sensibilisation',
    route: '/sensibilisation',
    title: 'Sensibilisation',
    icon: Heart,
    narration: `L'espace Sensibilisation propose des programmes citoyens sur la santé, 
    l'éducation civique, l'environnement et le développement durable. 
    Restez informés des campagnes et initiatives de votre commune.`,
    duration: 8
  },
  {
    id: 'actualites',
    route: '/actualites',
    title: 'Actualités',
    icon: Newspaper,
    narration: `La section Actualités vous tient informés de la vie de votre commune : 
    décisions du conseil municipal, événements locaux, travaux en cours, 
    et toutes les informations importantes pour votre quotidien.`,
    duration: 8
  },
  {
    id: 'foreigner-benefits',
    route: '/',
    title: 'Résidents Étrangers',
    icon: UserPlus,
    narration: `Résidents étrangers, vous n'êtes pas oubliés ! Un parcours d'inscription dédié 
    vous permet d'accéder aux services municipaux qui vous concernent. 
    Attestations de résidence, autorisations diverses, tout est simplifié pour vous.`,
    duration: 10
  },
  {
    id: 'cta',
    route: '/',
    title: 'Rejoignez-nous',
    icon: LogIn,
    narration: `Prêt à découvrir cette nouvelle ère de services publics ? 
    Créez votre compte gratuitement en quelques minutes, ou connectez-vous si vous êtes déjà inscrit. 
    Je reste à votre disposition pour répondre à toutes vos questions. 
    Ensemble, construisons l'administration de demain !`,
    duration: 10,
    scrollTo: 'top'
  }
];

interface PresentationModeProps {
  onClose: () => void;
  autoStart?: boolean;
}

export default function PresentationMode({ onClose, autoStart = true }: PresentationModeProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoStart);
  const [isMuted, setIsMuted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesisUtterance | null>(null);

  const currentStep = PRESENTATION_SCRIPT[currentStepIndex];
  const totalSteps = PRESENTATION_SCRIPT.length;
  const totalDuration = PRESENTATION_SCRIPT.reduce((acc, step) => acc + step.duration, 0);

  // Text-to-speech
  const speak = useCallback((text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    
    // Try to find a French voice
    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find(v => v.lang.startsWith('fr'));
    if (frenchVoice) utterance.voice = frenchVoice;

    setSpeechSynthesis(utterance);
    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  // Stop speech
  const stopSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Navigate and execute step actions
  useEffect(() => {
    if (!isPlaying) return;

    const step = PRESENTATION_SCRIPT[currentStepIndex];
    
    // Navigate if needed
    if (location.pathname !== step.route) {
      navigate(step.route);
    }

    // Scroll to element if specified
    setTimeout(() => {
      if (step.scrollTo === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (step.scrollTo) {
        const element = document.querySelector(step.scrollTo);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 500);

    // Speak narration
    speak(step.narration);

    // Progress timer
    const stepDuration = step.duration * 1000;
    const interval = 100;
    let elapsed = 0;

    const progressTimer = setInterval(() => {
      elapsed += interval;
      setProgress((elapsed / stepDuration) * 100);

      if (elapsed >= stepDuration) {
        clearInterval(progressTimer);
        if (currentStepIndex < totalSteps - 1) {
          setCurrentStepIndex(prev => prev + 1);
          setProgress(0);
        } else {
          setIsPlaying(false);
        }
      }
    }, interval);

    return () => {
      clearInterval(progressTimer);
    };
  }, [currentStepIndex, isPlaying, navigate, location.pathname, speak, totalSteps]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [stopSpeech]);

  // Load voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const handlePlayPause = () => {
    if (isPlaying) {
      stopSpeech();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    stopSpeech();
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setProgress(0);
    }
  };

  const handlePrevious = () => {
    stopSpeech();
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handleClose = () => {
    stopSpeech();
    onClose();
  };

  const handleMuteToggle = () => {
    if (!isMuted) {
      stopSpeech();
    }
    setIsMuted(!isMuted);
  };

  const goToStep = (index: number) => {
    stopSpeech();
    setCurrentStepIndex(index);
    setProgress(0);
    setIsPlaying(true);
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-24 right-6 z-[60]"
      >
        <Button
          size="lg"
          className="rounded-full h-16 w-16 p-0 bg-gradient-to-r from-violet-600 to-primary shadow-lg"
          onClick={() => setIsMinimized(false)}
        >
          <Bot className="h-8 w-8 text-white" />
        </Button>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full animate-pulse" />
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-[60] p-4 pointer-events-none"
      >
        <Card className="max-w-4xl mx-auto bg-background/95 backdrop-blur-xl border-primary/30 shadow-2xl pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-600 to-primary flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">Mode Présentation</h3>
                  <Badge variant="secondary" className="text-xs">
                    {currentStepIndex + 1}/{totalSteps}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">iAsted vous présente MAIRIE.GA</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleMuteToggle}>
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMinimized(true)}>
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Step indicator */}
          <div className="px-4 pt-3 flex gap-1 overflow-x-auto scrollbar-hide">
            {PRESENTATION_SCRIPT.map((step, index) => (
              <button
                key={step.id}
                onClick={() => goToStep(index)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  index === currentStepIndex
                    ? 'bg-primary text-primary-foreground'
                    : index < currentStepIndex
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <step.icon className="h-3 w-3" />
                {step.title}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <currentStep.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-lg mb-1">{currentStep.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {currentStep.narration}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress & Controls */}
          <div className="px-4 pb-4">
            <Progress value={progress} className="h-1 mb-3" />
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Durée totale: ~{Math.ceil(totalDuration / 60)} min
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentStepIndex === 0}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button
                  size="sm"
                  onClick={handlePlayPause}
                  className="min-w-[100px]"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4 mr-1" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" /> Reprendre
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentStepIndex === totalSteps - 1}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleClose}>
                  Terminer
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
