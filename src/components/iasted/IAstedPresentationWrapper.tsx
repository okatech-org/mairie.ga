import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import IAstedButtonFull from './IAstedButtonFull';
import PresentationMode, { presentationState } from './PresentationMode';

interface TrailPoint {
  id: number;
  x: number;
  y: number;
}

interface IAstedPresentationWrapperProps {
  showPresentation: boolean;
  onClosePresentation: () => void;
  onOpenInterface: () => void;
  isInterfaceOpen: boolean;
  voiceListening?: boolean;
  voiceSpeaking?: boolean;
  voiceProcessing?: boolean;
}

export default function IAstedPresentationWrapper({
  showPresentation,
  onClosePresentation,
  onOpenInterface,
  isInterfaceOpen,
  voiceListening = false,
  voiceSpeaking = false,
  voiceProcessing = false
}: IAstedPresentationWrapperProps) {
  const [buttonPosition, setButtonPosition] = useState({ x: 90, y: 85 });
  const [isPresentationActive, setIsPresentationActive] = useState(false);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const trailIdRef = useRef(0);
  const lastPositionRef = useRef({ x: 90, y: 85 });

  useEffect(() => {
    if (showPresentation) {
      setIsPresentationActive(true);
    }
  }, [showPresentation]);

  const handlePositionChange = (x: number, y: number) => {
    // Only add trail points when position actually changes significantly
    const dx = Math.abs(x - lastPositionRef.current.x);
    const dy = Math.abs(y - lastPositionRef.current.y);
    
    if (isPresentationActive && showPresentation && (dx > 2 || dy > 2)) {
      // Add multiple trail points for smoother trail
      const steps = Math.max(3, Math.floor(Math.sqrt(dx * dx + dy * dy) / 5));
      
      for (let i = 0; i < steps; i++) {
        const progress = i / steps;
        const interpX = lastPositionRef.current.x + (x - lastPositionRef.current.x) * progress;
        const interpY = lastPositionRef.current.y + (y - lastPositionRef.current.y) * progress;
        
        setTimeout(() => {
          trailIdRef.current += 1;
          setTrail(prev => [...prev.slice(-15), { 
            id: trailIdRef.current, 
            x: interpX, 
            y: interpY 
          }]);
        }, i * 50);
      }
    }
    
    lastPositionRef.current = { x, y };
    setButtonPosition({ x, y });
  };

  // Clean up old trail points
  useEffect(() => {
    if (trail.length > 0) {
      const timer = setTimeout(() => {
        setTrail(prev => prev.slice(1));
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [trail]);

  const handleClosePresentation = () => {
    setIsPresentationActive(false);
    setButtonPosition({ x: 90, y: 85 });
    setTrail([]);
    onClosePresentation();
  };

  // Convert percentage to pixel position
  const getButtonStyle = () => {
    if (isPresentationActive && showPresentation) {
      return {
        position: 'fixed' as const,
        left: `${buttonPosition.x}%`,
        top: `${buttonPosition.y}%`,
        transform: 'translate(-50%, -50%)',
        transition: 'left 0.8s cubic-bezier(0.4, 0, 0.2, 1), top 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 9999
      };
    }
    return {
      position: 'fixed' as const,
      right: '24px',
      bottom: '24px',
      zIndex: 9999
    };
  };

  return (
    <>
      {/* Trail effect */}
      <AnimatePresence>
        {isPresentationActive && showPresentation && trail.map((point, index) => (
          <motion.div
            key={point.id}
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="fixed pointer-events-none z-[9998]"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div 
              className="rounded-full"
              style={{
                width: `${24 - index * 1.2}px`,
                height: `${24 - index * 1.2}px`,
                background: `radial-gradient(circle, 
                  rgba(139, 92, 246, ${0.6 - index * 0.03}) 0%, 
                  rgba(99, 102, 241, ${0.4 - index * 0.02}) 50%, 
                  transparent 100%)`,
                boxShadow: `0 0 ${20 - index}px rgba(139, 92, 246, ${0.5 - index * 0.03}), 
                           0 0 ${40 - index * 2}px rgba(99, 102, 241, ${0.3 - index * 0.02})`,
                filter: `blur(${index * 0.5}px)`
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Glow ring around button during movement */}
      {isPresentationActive && showPresentation && (
        <motion.div
          className="fixed pointer-events-none z-[9998]"
          animate={{
            left: `${buttonPosition.x}%`,
            top: `${buttonPosition.y}%`
          }}
          transition={{
            type: "spring",
            stiffness: 80,
            damping: 15
          }}
          style={{ transform: 'translate(-50%, -50%)' }}
        >
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-20 h-20 rounded-full"
            style={{
              background: 'radial-gradient(circle, transparent 40%, rgba(139, 92, 246, 0.2) 60%, transparent 80%)',
              boxShadow: '0 0 40px rgba(139, 92, 246, 0.3), 0 0 80px rgba(99, 102, 241, 0.2)'
            }}
          />
        </motion.div>
      )}

      {/* Animated iAsted Button */}
      <motion.div
        layout
        style={getButtonStyle()}
        animate={isPresentationActive && showPresentation ? {
          left: `${buttonPosition.x}%`,
          top: `${buttonPosition.y}%`
        } : undefined}
        transition={{
          type: "spring",
          stiffness: 120,
          damping: 20
        }}
      >
        <div className="relative">
          {/* Speaking indicator during presentation */}
          <AnimatePresence>
            {isPresentationActive && showPresentation && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap"
              >
                <div className="bg-background/95 backdrop-blur-xl border border-primary/30 rounded-full px-4 py-2 shadow-lg">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-primary"
                    />
                    <span className="text-xs font-medium">iAsted présente...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <IAstedButtonFull
            onClick={onOpenInterface}
            onSingleClick={onOpenInterface}
            isInterfaceOpen={isInterfaceOpen}
            voiceListening={voiceListening}
            voiceSpeaking={isPresentationActive && showPresentation}
            voiceProcessing={voiceProcessing}
          />
        </div>
      </motion.div>

      {/* Presentation Mode */}
      <AnimatePresence>
        {showPresentation && (
          <PresentationMode
            onClose={handleClosePresentation}
            autoStart={true}
            onButtonPositionChange={handlePositionChange}
          />
        )}
      </AnimatePresence>
    </>
  );
}
