import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bot, Play, X, Sparkles } from 'lucide-react';

interface WelcomePromptProps {
  onStartPresentation: () => void;
  userRole?: string;
}

const WELCOME_SHOWN_KEY = 'iasted-welcome-shown';

export default function WelcomePrompt({ onStartPresentation, userRole }: WelcomePromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Ne montrer que pour les visiteurs non identifiés
    const isUnknownUser = !userRole || userRole === 'unknown' || userRole === 'user';
    
    // Vérifier si déjà montré dans cette session
    const alreadyShown = sessionStorage.getItem(WELCOME_SHOWN_KEY);
    
    if (isUnknownUser && !alreadyShown) {
      // Afficher après un court délai pour laisser la page charger
      const timer = setTimeout(() => {
        setIsVisible(true);
        sessionStorage.setItem(WELCOME_SHOWN_KEY, 'true');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [userRole]);

  const handleStartPresentation = () => {
    setIsVisible(false);
    setIsDismissed(true);
    onStartPresentation();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-24 right-6 z-50 max-w-sm"
        >
          <Card className="relative overflow-hidden bg-gradient-to-br from-violet-500/10 via-background to-primary/5 border-violet-500/30 shadow-xl">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/20 to-transparent rounded-full blur-2xl" />
            
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="p-4 relative">
              {/* Avatar + Message */}
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-600 to-primary flex items-center justify-center shadow-lg">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute bottom-12 left-4 w-3 h-3 bg-success rounded-full border-2 border-background animate-pulse" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">iAsted</span>
                    <Sparkles className="h-3 w-3 text-violet-500" />
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    Bienvenue sur <span className="font-medium text-foreground">MAIRIE.GA</span> ! 
                    Je suis iAsted, votre assistant. Voulez-vous une visite guidée de 2 minutes ?
                  </p>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleStartPresentation}
                      className="gap-1.5 bg-gradient-to-r from-violet-600 to-primary hover:from-violet-700 hover:to-primary/90"
                    >
                      <Play className="h-3.5 w-3.5" />
                      Oui, montrez-moi
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDismiss}
                      className="text-muted-foreground"
                    >
                      Plus tard
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Typing indicator animation */}
            <motion.div 
              className="absolute bottom-1 left-16 flex gap-1"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </motion.div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
