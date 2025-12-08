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

    useEffect(() => {
        console.log('🎬 [PresentationMode] Component MOUNTED, autoStart:', autoStart);
        isMountedRef.current = true;
        return () => {
            console.log('🎬 [PresentationMode] Component UNMOUNTING');
            isMountedRef.current = false;
        };
    }, [autoStart]);

    useEffect(() => {
        onButtonPositionChangeRef.current = onButtonPositionChange;
    }, [onButtonPositionChange]);

    const currentStep = PRESENTATION_SCRIPT[currentStepIndex];
    const totalSteps = PRESENTATION_SCRIPT.length;
    const totalDuration = PRESENTATION_SCRIPT.reduce((acc, step) => acc + step.duration, 0);

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

    const clearActionTimeouts = useCallback(() => {
        actionTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        actionTimeoutsRef.current = [];
    }, []);

    const executeAction = (action: PresentationAction) => {
        if (!isMountedRef.current) return;

        switch (action.type) {
            case 'scroll':
                if (action.selector === 'top') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else if (action.selector) {
                    const scrollTarget = document.querySelector(action.selector);
                    if (scrollTarget) {
                        scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
                break;
            case 'move':
                if (action.position) {
                    const newX = action.position.x;
                    const newY = action.position.y;
                    setButtonPosition({ x: newX, y: newY });
                    if (onButtonPositionChangeRef.current) {
                        onButtonPositionChangeRef.current(newX, newY);
                    }
                }
                break;
            case 'point':
                if (action.selector) {
                    const pointTarget = document.querySelector(action.selector);
                    if (pointTarget) {
                        const rect = pointTarget.getBoundingClientRect();
                        setPointerPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
                        setShowPointer(true);
                        setTimeout(() => setShowPointer(false), 2000);
                    }
                }
                break;
            case 'highlight':
                if (action.selector) {
                    setHighlightedElement(null);
                    setTimeout(() => {
                        const highlightTarget = document.querySelector(action.selector!);
                        if (highlightTarget) {
                            setHighlightedElement(highlightTarget);
                        }
                    }, 100);
                }
                break;
            case 'click':
                setShowPointer(true);
                setTimeout(() => setShowPointer(false), 600);
                break;
        }
    };

    const executeStepActions = useCallback((actions: PresentationAction[]) => {
        clearActionTimeouts();
        setHighlightedElement(null);
        setShowPointer(false);

        const firstMoveAction = actions.find(a => a.type === 'move');
        if (firstMoveAction && firstMoveAction.position) {
            const newX = firstMoveAction.position.x;
            const newY = firstMoveAction.position.y;
            setButtonPosition({ x: newX, y: newY });
            if (onButtonPositionChangeRef.current) {
                onButtonPositionChangeRef.current(newX, newY);
            }
        }

        actions.forEach((action) => {
            const delay = action.delay || 0;
            const timeout = setTimeout(() => {
                if (isMountedRef.current) {
                    executeAction(action);
                }
            }, delay);
            actionTimeoutsRef.current.push(timeout);
        });
    }, [clearActionTimeouts]);

    useEffect(() => {
        if (!isPlaying) return;

        const step = PRESENTATION_SCRIPT[currentStepIndex];
        const needsNavigation = location.pathname !== step.route;
        if (needsNavigation) {
            navigate(step.route);
        }

        const navDelay = needsNavigation ? 800 : 200;
        const navTimeout = setTimeout(() => {
            executeStepActions(step.actions);
            speak(step.narration);
        }, navDelay);

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

    useEffect(() => {
        return () => {
            stopSpeech();
            clearActionTimeouts();
            setHighlightedElement(null);
        };
    }, [stopSpeech, clearActionTimeouts]);

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

    // Spotlight Highlight Overlay
    const renderHighlightOverlay = () => {
        if (!highlightedElement) return null;
        const rect = highlightedElement.getBoundingClientRect();
        const padding = 15;

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[55] pointer-events-none"
            >
                <motion.div
                    layoutId="spotlight"
                    className="absolute rounded-xl border-2 border-primary/50"
                    initial={{
                        left: rect.left - padding,
                        top: rect.top - padding,
                        width: rect.width + padding * 2,
                        height: rect.height + padding * 2,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0)'
                    }}
                    animate={{
                        left: rect.left - padding,
                        top: rect.top - padding,
                        width: rect.width + padding * 2,
                        height: rect.height + padding * 2,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)'
                    }}
                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                >
                    <motion.div
                        className="absolute inset-0 rounded-xl bg-primary/10"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary -mt-1 -ml-1" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary -mt-1 -mr-1" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary -mb-1 -ml-1" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary -mb-1 -mr-1" />
                </motion.div>
            </motion.div>
        );
    };

    // Enhanced Pointer
    const renderPointer = () => {
        if (!showPointer) return null;
        return (
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="fixed z-[58] pointer-events-none"
                style={{ left: pointerPosition.x, top: pointerPosition.y }}
            >
                <motion.div
                    animate={{ scale: [1, 0.8, 1], y: [0, -5, 0] }}
                    transition={{ duration: 0.5, repeat: 2 }}
                >
                    <MousePointer2
                        className="h-8 w-8 text-primary fill-primary/20 drop-shadow-xl"
                        style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.5))" }}
                    />
                </motion.div>
                <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute top-0 left-0 w-8 h-8 rounded-full border-2 border-primary"
                />
            </motion.div>
        );
    };

    return (
        <>
            <AnimatePresence>
                {highlightedElement && renderHighlightOverlay()}
            </AnimatePresence>
            <AnimatePresence>
                {renderPointer()}
            </AnimatePresence>

            {/* Control panel */}
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed bottom-4 left-4 right-4 z-[60] pointer-events-none"
            >
                <div className="max-w-2xl mx-auto bg-background/80 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-2xl pointer-events-auto overflow-hidden ring-1 ring-black/5">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                    <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-primary flex items-center justify-center shadow-lg">
                                <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">iAsted vous guide</span>
                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-primary/10 text-primary border-primary/20">
                                        {currentStepIndex + 1}/{totalSteps}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/10" onClick={handleMuteToggle}>
                                {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-white/10 hover:text-destructive" onClick={handleClose}>
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>

                    <div className="p-4 relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="flex items-start gap-4"
                            >
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                                    <currentStep.icon className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm mb-1">{currentStep.title}</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {currentStep.narration}
                                    </p>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="px-4 pb-4 pt-1">
                        <Progress value={progress} className="h-1 mb-3 bg-primary/10" />
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground font-medium">
                                ~{Math.ceil(totalDuration / 60)} min
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-white/10"
                                    onClick={handlePrevious}
                                    disabled={currentStepIndex === 0}
                                >
                                    <SkipBack className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handlePlayPause}
                                    className="h-8 px-5 rounded-full shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all font-medium"
                                >
                                    {isPlaying ? (
                                        <><Pause className="h-3.5 w-3.5 mr-1.5" /> Pause</>
                                    ) : (
                                        <><Play className="h-3.5 w-3.5 mr-1.5" /> Reprendre</>
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-white/10"
                                    onClick={handleNext}
                                    disabled={currentStepIndex === totalSteps - 1}
                                >
                                    <SkipForward className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="w-12"></div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
}
