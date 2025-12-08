import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Pause, 
  SkipForward, 
  SkipBack, 
  X, 
  Volume2, 
  VolumeX,
  Play,
  Home,
  FileText,
  Heart,
  Newspaper,
  MapPin,
  UserPlus,
  LogIn,
  Sparkles,
  Bot,
  MousePointer2
} from 'lucide-react';

interface PresentationAction {
  type: 'scroll' | 'click' | 'highlight' | 'point' | 'move';
  selector?: string;
  position?: { x: number; y: number };
  delay?: number;
}

interface PresentationStep {
  id: string;
  route: string;
  title: string;
  icon: React.ElementType;
  narration: string;
  duration: number;
  actions: PresentationAction[];
}

const PRESENTATION_SCRIPT: PresentationStep[] = [
  {
    id: 'intro',
    route: '/',
    title: 'Bienvenue',
    icon: Home,
    narration: `Bienvenue sur MAIRIE.GA ! Je suis iAsted, votre assistant intelligent. Laissez-moi vous présenter cette plateforme révolutionnaire qui modernise les services publics des 52 communes du Gabon.`,
    duration: 10,
    actions: [
      { type: 'scroll', selector: 'top' },
      { type: 'move', position: { x: 50, y: 30 }, delay: 500 },
      { type: 'point', selector: 'header', delay: 2000 }
    ]
  },
  {
    id: 'navigation',
    route: '/',
    title: 'Menu Principal',
    icon: Sparkles,
    narration: `Regardez ce menu de navigation. Vous pouvez accéder aux Services, à la Sensibilisation, aux Actualités. Tout est organisé pour simplifier vos démarches !`,
    duration: 9,
    actions: [
      { type: 'move', position: { x: 50, y: 8 }, delay: 500 },
      { type: 'highlight', selector: 'nav', delay: 1000 },
      { type: 'point', selector: '[href="/services"]', delay: 2500 },
      { type: 'point', selector: '[href="/sensibilisation"]', delay: 4000 },
      { type: 'point', selector: '[href="/actualites"]', delay: 5500 }
    ]
  },
  {
    id: 'hero',
    route: '/',
    title: 'Notre Vision',
    icon: Sparkles,
    narration: `Fini les files d'attente interminables ! Avec MAIRIE.GA, toutes vos démarches municipales sont accessibles 24 heures sur 24, 7 jours sur 7, depuis votre téléphone ou ordinateur.`,
    duration: 9,
    actions: [
      { type: 'scroll', selector: '.hero-section, section:first-of-type', delay: 300 },
      { type: 'move', position: { x: 30, y: 40 }, delay: 500 },
      { type: 'highlight', selector: 'h1', delay: 1500 }
    ]
  },
  {
    id: 'map',
    route: '/',
    title: 'Carte Interactive',
    icon: MapPin,
    narration: `Voici notre carte interactive ! 9 provinces, 52 communes connectées. De Libreville à Franceville, chaque mairie du Gabon est à portée de clic. Je vous montre...`,
    duration: 11,
    actions: [
      { type: 'scroll', selector: '[class*="GabonMairies"], .map-section, [data-map]', delay: 300 },
      { type: 'move', position: { x: 50, y: 50 }, delay: 1000 },
      { type: 'highlight', selector: '[class*="GabonMairies"], .map-container, svg', delay: 2000 },
      { type: 'point', selector: '[class*="province"], .province-marker', delay: 4000 }
    ]
  },
  {
    id: 'services',
    route: '/services',
    title: 'Catalogue des Services',
    icon: FileText,
    narration: `Bienvenue dans notre catalogue complet ! État civil pour vos actes de naissance, mariage et décès. Urbanisme pour vos permis. Fiscalité pour vos patentes. Chaque service détaille les pièces requises et les délais.`,
    duration: 12,
    actions: [
      { type: 'scroll', selector: 'top' },
      { type: 'move', position: { x: 30, y: 35 }, delay: 1000 },
      { type: 'highlight', selector: '.service-card, [class*="ServiceCard"], article', delay: 2500 },
      { type: 'point', selector: '.service-card:first-child, article:first-child', delay: 4000 }
    ]
  },
  {
    id: 'citizen-benefits',
    route: '/services',
    title: 'Vos Avantages',
    icon: UserPlus,
    narration: `Pour vous citoyens gabonais, les avantages sont nombreux : suivi en temps réel de vos demandes, notifications automatiques, coffre-fort numérique pour vos documents, et moi, iAsted, toujours disponible !`,
    duration: 10,
    actions: [
      { type: 'move', position: { x: 70, y: 40 }, delay: 500 },
      { type: 'scroll', selector: '.benefits, .features-section', delay: 1500 }
    ]
  },
  {
    id: 'sensibilisation',
    route: '/sensibilisation',
    title: 'Sensibilisation',
    icon: Heart,
    narration: `L'espace Sensibilisation propose des programmes citoyens sur la santé, l'éducation civique, l'environnement. Restez informés des campagnes de votre commune !`,
    duration: 9,
    actions: [
      { type: 'scroll', selector: 'top' },
      { type: 'move', position: { x: 40, y: 35 }, delay: 1000 },
      { type: 'highlight', selector: 'main section', delay: 2500 }
    ]
  },
  {
    id: 'actualites',
    route: '/actualites',
    title: 'Actualités',
    icon: Newspaper,
    narration: `Les Actualités vous tiennent informés de la vie de votre commune : décisions du conseil municipal, événements locaux, travaux en cours.`,
    duration: 8,
    actions: [
      { type: 'scroll', selector: 'top' },
      { type: 'move', position: { x: 50, y: 40 }, delay: 500 },
      { type: 'highlight', selector: 'article, .news-card', delay: 2000 }
    ]
  },
  {
    id: 'foreigners',
    route: '/',
    title: 'Résidents Étrangers',
    icon: UserPlus,
    narration: `Résidents étrangers, vous n'êtes pas oubliés ! Un parcours d'inscription dédié vous permet d'accéder aux services qui vous concernent. Attestations de résidence, autorisations, tout est simplifié.`,
    duration: 10,
    actions: [
      { type: 'scroll', selector: 'top' },
      { type: 'move', position: { x: 80, y: 15 }, delay: 500 },
      { type: 'point', selector: '[href*="register"], .auth-buttons, header button', delay: 2500 }
    ]
  },
  {
    id: 'cta',
    route: '/',
    title: 'Rejoignez-nous !',
    icon: LogIn,
    narration: `Prêt à découvrir cette nouvelle ère de services publics ? Créez votre compte gratuitement, ou connectez-vous si vous êtes déjà inscrit. Je reste à votre disposition pour toutes vos questions !`,
    duration: 10,
    actions: [
      { type: 'scroll', selector: 'top' },
      { type: 'move', position: { x: 85, y: 8 }, delay: 500 },
      { type: 'highlight', selector: '[href="/login"], .login-button', delay: 2000 },
      { type: 'click', selector: 'header', delay: 3500 },
      { type: 'move', position: { x: 50, y: 50 }, delay: 5000 }
    ]
  }
];

interface PresentationModeProps {
  onClose: () => void;
  autoStart?: boolean;
  onButtonPositionChange?: (x: number, y: number) => void;
}

// Export the button position for external use
export const presentationState = {
  isActive: false,
  buttonX: 90,
  buttonY: 85
};

export default function PresentationMode({ onClose, autoStart = true, onButtonPositionChange }: PresentationModeProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoStart);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);
  const [buttonPosition, setButtonPosition] = useState({ x: 90, y: 85 });
  const [showPointer, setShowPointer] = useState(false);
  const [pointerPosition, setPointerPosition] = useState({ x: 0, y: 0 });
  const actionTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const onButtonPositionChangeRef = useRef(onButtonPositionChange);
  const isMountedRef = useRef(true);

  // Log mount
  useEffect(() => {
    console.log('🎬 [PresentationMode] Component MOUNTED, autoStart:', autoStart);
    isMountedRef.current = true;
    
    return () => {
      console.log('🎬 [PresentationMode] Component UNMOUNTING');
      isMountedRef.current = false;
    };
  }, [autoStart]);

  // Keep callback ref up to date
  useEffect(() => {
    onButtonPositionChangeRef.current = onButtonPositionChange;
  }, [onButtonPositionChange]);

  const currentStep = PRESENTATION_SCRIPT[currentStepIndex];
  const totalSteps = PRESENTATION_SCRIPT.length;
  const totalDuration = PRESENTATION_SCRIPT.reduce((acc, step) => acc + step.duration, 0);

  // Update external state
  useEffect(() => {
    presentationState.isActive = true;
    presentationState.buttonX = buttonPosition.x;
    presentationState.buttonY = buttonPosition.y;
    
    return () => {
      presentationState.isActive = false;
    };
  }, [buttonPosition]);

  // Text-to-speech
  const speak = useCallback((text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.0;
    utterance.pitch = 1;
    
    const voices = window.speechSynthesis.getVoices();
    const frenchVoice = voices.find(v => v.lang.startsWith('fr'));
    if (frenchVoice) utterance.voice = frenchVoice;

    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  const stopSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Clear all action timeouts
  const clearActionTimeouts = useCallback(() => {
    actionTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    actionTimeoutsRef.current = [];
  }, []);

  // Execute a single action - DIRECT function, no useCallback to avoid stale closures
  const executeAction = (action: PresentationAction) => {
    console.log('▶️ [PresentationMode] executeAction called:', action.type, action);
    
    if (!isMountedRef.current) {
      console.log('⚠️ [PresentationMode] Component unmounted, skipping action');
      return;
    }

    switch (action.type) {
      case 'scroll':
        console.log('📜 [PresentationMode] Executing scroll:', action.selector);
        if (action.selector === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (action.selector) {
          const scrollTarget = document.querySelector(action.selector);
          console.log('📜 [PresentationMode] Scroll target found:', !!scrollTarget);
          if (scrollTarget) {
            scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        break;

      case 'move':
        if (action.position) {
          console.log('🚀 [PresentationMode] Moving button to:', action.position);
          const newX = action.position.x;
          const newY = action.position.y;
          setButtonPosition({ x: newX, y: newY });
          // Call callback immediately
          if (onButtonPositionChangeRef.current) {
            console.log('📡 [PresentationMode] Calling onButtonPositionChange');
            onButtonPositionChangeRef.current(newX, newY);
          } else {
            console.log('⚠️ [PresentationMode] No onButtonPositionChange callback!');
          }
        }
        break;

      case 'point':
        console.log('👆 [PresentationMode] Executing point:', action.selector);
        if (action.selector) {
          const pointTarget = document.querySelector(action.selector);
          if (pointTarget) {
            const rect = pointTarget.getBoundingClientRect();
            setPointerPosition({
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2
            });
            setShowPointer(true);
            setTimeout(() => setShowPointer(false), 1500);
          }
        }
        break;

      case 'highlight':
        console.log('✨ [PresentationMode] Executing highlight:', action.selector);
        if (action.selector) {
          setHighlightedElement(null);
          
          setTimeout(() => {
            const highlightTarget = document.querySelector(action.selector!);
            console.log('✨ [PresentationMode] Highlight target found:', !!highlightTarget);
            if (highlightTarget) {
              setHighlightedElement(highlightTarget);
            }
          }, 100);
        }
        break;

      case 'click':
        console.log('🖱️ [PresentationMode] Executing click visual');
        setShowPointer(true);
        setTimeout(() => setShowPointer(false), 500);
        break;
    }
  };

  // Execute all actions for a step
  const executeStepActions = useCallback((actions: PresentationAction[]) => {
    console.log('🎬 [PresentationMode] executeStepActions called with', actions.length, 'actions');
    clearActionTimeouts();
    setHighlightedElement(null);
    setShowPointer(false);

    actions.forEach((action, index) => {
      const delay = action.delay || 0;
      console.log(`⏱️ [PresentationMode] Scheduling action ${index + 1}/${actions.length}: ${action.type} delay=${delay}ms`);
      
      const timeout = setTimeout(() => {
        if (isMountedRef.current) {
          executeAction(action);
        }
      }, delay);
      actionTimeoutsRef.current.push(timeout);
    });
  }, [clearActionTimeouts]);

  // Main presentation effect - Navigate and execute step
  useEffect(() => {
    console.log('🎥 [PresentationMode] Main effect triggered - isPlaying:', isPlaying, 'stepIndex:', currentStepIndex);
    
    if (!isPlaying) {
      console.log('⏸️ [PresentationMode] Not playing, skipping');
      return;
    }

    const step = PRESENTATION_SCRIPT[currentStepIndex];
    console.log('📋 [PresentationMode] Current step:', step.id, '-', step.title, 'route:', step.route);
    
    // Navigate if needed
    const needsNavigation = location.pathname !== step.route;
    if (needsNavigation) {
      console.log('🧭 [PresentationMode] Navigating from', location.pathname, 'to', step.route);
      navigate(step.route);
    }

    // Wait for navigation then execute actions
    const navDelay = needsNavigation ? 800 : 200;
    console.log('⏳ [PresentationMode] Waiting', navDelay, 'ms before executing actions');
    
    const navTimeout = setTimeout(() => {
      console.log('✅ [PresentationMode] Now executing actions for step:', step.id);
      executeStepActions(step.actions);
      speak(step.narration);
    }, navDelay);

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
          console.log('➡️ [PresentationMode] Moving to next step');
          setCurrentStepIndex(prev => prev + 1);
          setProgress(0);
        } else {
          console.log('🏁 [PresentationMode] Presentation complete');
          setIsPlaying(false);
          setButtonPosition({ x: 90, y: 85 });
          if (onButtonPositionChangeRef.current) {
            onButtonPositionChangeRef.current(90, 85);
          }
        }
      }
    }, interval);

    return () => {
      clearTimeout(navTimeout);
      clearInterval(progressTimer);
    };
  }, [currentStepIndex, isPlaying, navigate, location.pathname, speak, totalSteps, executeStepActions]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopSpeech();
      clearActionTimeouts();
      setHighlightedElement(null);
    };
  }, [stopSpeech, clearActionTimeouts]);

  // Load voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const handlePlayPause = () => {
    if (isPlaying) {
      stopSpeech();
      clearActionTimeouts();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    stopSpeech();
    clearActionTimeouts();
    setHighlightedElement(null);
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setProgress(0);
    }
  };

  const handlePrevious = () => {
    stopSpeech();
    clearActionTimeouts();
    setHighlightedElement(null);
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handleClose = () => {
    stopSpeech();
    clearActionTimeouts();
    setHighlightedElement(null);
    setButtonPosition({ x: 90, y: 85 });
    onClose();
  };

  const handleMuteToggle = () => {
    if (!isMuted) {
      stopSpeech();
    }
    setIsMuted(!isMuted);
  };

  // Highlight overlay
  const renderHighlightOverlay = () => {
    if (!highlightedElement) return null;

    const rect = highlightedElement.getBoundingClientRect();
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[55] pointer-events-none"
      >
        {/* Dark overlay with hole */}
        <div 
          className="absolute inset-0 bg-black/50"
          style={{
            clipPath: `polygon(
              0% 0%, 
              0% 100%, 
              ${rect.left - 10}px 100%, 
              ${rect.left - 10}px ${rect.top - 10}px, 
              ${rect.right + 10}px ${rect.top - 10}px, 
              ${rect.right + 10}px ${rect.bottom + 10}px, 
              ${rect.left - 10}px ${rect.bottom + 10}px, 
              ${rect.left - 10}px 100%, 
              100% 100%, 
              100% 0%
            )`
          }}
        />
        {/* Glowing border */}
        <motion.div
          animate={{
            boxShadow: [
              '0 0 20px rgba(99, 102, 241, 0.6), 0 0 40px rgba(99, 102, 241, 0.4)',
              '0 0 30px rgba(99, 102, 241, 0.8), 0 0 60px rgba(99, 102, 241, 0.6)',
              '0 0 20px rgba(99, 102, 241, 0.6), 0 0 40px rgba(99, 102, 241, 0.4)'
            ]
          }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute rounded-lg border-2 border-primary"
          style={{
            left: rect.left - 10,
            top: rect.top - 10,
            width: rect.width + 20,
            height: rect.height + 20
          }}
        />
      </motion.div>
    );
  };

  // Pointer indicator
  const renderPointer = () => {
    if (!showPointer) return null;

    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed z-[58] pointer-events-none"
        style={{
          left: pointerPosition.x - 20,
          top: pointerPosition.y - 20
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 0.5, repeat: 2 }}
          className="w-10 h-10 rounded-full bg-primary/30 border-2 border-primary flex items-center justify-center"
        >
          <MousePointer2 className="h-5 w-5 text-primary" />
        </motion.div>
      </motion.div>
    );
  };

  return (
    <>
      {/* Highlight overlay */}
      <AnimatePresence>
        {highlightedElement && renderHighlightOverlay()}
      </AnimatePresence>

      {/* Pointer indicator */}
      <AnimatePresence>
        {renderPointer()}
      </AnimatePresence>

      {/* Animated button position indicator (invisible, updates parent) */}
      <motion.div
        className="fixed z-[9999] pointer-events-none"
        animate={{
          left: `${buttonPosition.x}%`,
          top: `${buttonPosition.y}%`
        }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 20,
          duration: 0.8
        }}
        style={{ transform: 'translate(-50%, -50%)' }}
      />

      {/* Control panel */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-[60] pointer-events-none"
      >
        <div className="max-w-2xl mx-auto bg-background/95 backdrop-blur-xl border border-primary/30 shadow-2xl rounded-2xl pointer-events-auto overflow-hidden">
          {/* Compact header */}
          <div className="flex items-center justify-between p-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-600 to-primary flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">iAsted vous guide</span>
                  <Badge variant="secondary" className="text-xs">
                    {currentStepIndex + 1}/{totalSteps}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleMuteToggle}>
                {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClose}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Current step content */}
          <div className="p-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <currentStep.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{currentStep.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {currentStep.narration}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress and controls */}
          <div className="px-3 pb-3">
            <Progress value={progress} className="h-1 mb-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                ~{Math.ceil(totalDuration / 60)} min
              </span>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handlePrevious}
                  disabled={currentStepIndex === 0}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button
                  size="sm"
                  onClick={handlePlayPause}
                  className="h-8 px-4"
                >
                  {isPlaying ? (
                    <><Pause className="h-3.5 w-3.5 mr-1" /> Pause</>
                  ) : (
                    <><Play className="h-3.5 w-3.5 mr-1" /> Play</>
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleNext}
                  disabled={currentStepIndex === totalSteps - 1}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleClose}>
                Terminer
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
