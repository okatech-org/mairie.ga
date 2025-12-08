import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import IAstedButtonFull from './IAstedButtonFull';
import PresentationMode from './PresentationMode';

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
  audioLevel?: number;
  onDoubleClick?: () => void;
  currentEmotion?: 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'trust' | 'neutral';
  emotionIntensity?: number;
}

export default function IAstedPresentationWrapper({
  showPresentation,
  onClosePresentation,
  onOpenInterface,
  isInterfaceOpen,
  voiceListening = false,
  voiceSpeaking = false,
  voiceProcessing = false,
  audioLevel = 0,
  onDoubleClick,
  currentEmotion = 'neutral',
  emotionIntensity = 0.5
}: IAstedPresentationWrapperProps) {
  // Position in percentage of viewport
  const [buttonX, setButtonX] = useState(90);
  const [buttonY, setButtonY] = useState(85);
  const [targetX, setTargetX] = useState<number | null>(null);
  const [targetY, setTargetY] = useState<number | null>(null);
  const [isPresentationActive, setIsPresentationActive] = useState(false);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const trailIdRef = useRef(0);
  const lastPosRef = useRef({ x: 90, y: 85 });

  // Activate presentation mode
  useEffect(() => {
    if (showPresentation) {
      console.log('🎬 [Wrapper] Presentation activated');
      setIsPresentationActive(true);
      // Reset position at start
      setButtonX(90);
      setButtonY(85);
      lastPosRef.current = { x: 90, y: 85 };
    }
  }, [showPresentation]);

  // Handle position change from PresentationMode
  const handlePositionChange = useCallback((x: number, y: number) => {
    console.log('📍 [Wrapper] Position change:', { x, y });

    // Show target indicator immediately
    setTargetX(x);
    setTargetY(y);

    // Add trail points
    const dx = Math.abs(x - lastPosRef.current.x);
    const dy = Math.abs(y - lastPosRef.current.y);

    if (dx > 2 || dy > 2) {
      const steps = Math.max(3, Math.floor(Math.sqrt(dx * dx + dy * dy) / 5));

      for (let i = 0; i < steps; i++) {
        const progress = i / steps;
        const interpX = lastPosRef.current.x + (x - lastPosRef.current.x) * progress;
        const interpY = lastPosRef.current.y + (y - lastPosRef.current.y) * progress;

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

    // Update position - this is the key update!
    lastPosRef.current = { x, y };
    setButtonX(x);
    setButtonY(y);

    // Hide target after animation completes
    setTimeout(() => {
      setTargetX(null);
      setTargetY(null);
    }, 800);
  }, []);

  // Clean up old trail points
  useEffect(() => {
    if (trail.length > 0) {
      const timer = setTimeout(() => {
        setTrail(prev => prev.slice(1));
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [trail]);

  const handleClosePresentation = useCallback(() => {
    console.log('🛑 [Wrapper] Closing presentation');
    setIsPresentationActive(false);
    setButtonX(90);
    setButtonY(85);
    setTargetX(null);
    setTargetY(null);
    setTrail([]);
    lastPosRef.current = { x: 90, y: 85 };
    onClosePresentation();
  }, [onClosePresentation]);

  // Calculate pixel position for fixed elements
  const getPixelPosition = (xPercent: number, yPercent: number) => {
    return {
      left: `${xPercent}vw`,
      top: `${yPercent}vh`
    };
  };

  const isActive = isPresentationActive && showPresentation;

  return (
    <>
      {/* Target position indicator */}
      <AnimatePresence>
        {isActive && targetX !== null && targetY !== null && (
          <motion.div
            key="target-indicator"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed pointer-events-none z-[9997]"
            style={{
              ...getPixelPosition(targetX, targetY),
              transform: 'translate(-50%, -50%)'
            }}
          >
            {/* Pulsing target ring */}
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.8, 0.3, 0.8]
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-16 h-16 rounded-full border-2 border-dashed border-primary"
              style={{
                boxShadow: '0 0 20px hsl(var(--primary) / 0.5)'
              }}
            />
            {/* Center dot */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.3, repeat: Infinity }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trail effect */}
      <AnimatePresence>
        {isActive && trail.map((point, index) => (
          <motion.div
            key={point.id}
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="fixed pointer-events-none z-[9998]"
            style={{
              ...getPixelPosition(point.x, point.y),
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div
              className="rounded-full"
              style={{
                width: `${24 - index * 1.2}px`,
                height: `${24 - index * 1.2}px`,
                background: `radial-gradient(circle, 
                  hsl(var(--primary) / ${0.6 - index * 0.03}) 0%, 
                  hsl(var(--primary) / ${0.4 - index * 0.02}) 50%, 
                  transparent 100%)`,
                boxShadow: `0 0 ${20 - index}px hsl(var(--primary) / ${0.5 - index * 0.03})`,
                filter: `blur(${index * 0.5}px)`
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Glow ring around button during movement */}
      {isActive && (
        <motion.div
          className="fixed pointer-events-none z-[9998]"
          animate={{
            left: `${buttonX}vw`,
            top: `${buttonY}vh`
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
              background: 'radial-gradient(circle, transparent 40%, hsl(var(--primary) / 0.2) 60%, transparent 80%)',
              boxShadow: '0 0 40px hsl(var(--primary) / 0.3)'
            }}
          />
        </motion.div>
      )}

      {/* iAsted Button with animation */}
      <motion.div
        className="fixed z-[9999]"
        animate={isActive ? {
          left: `${buttonX}vw`,
          top: `${buttonY}vh`,
          right: 'auto',
          bottom: 'auto',
          x: '-50%',
          y: '-50%'
        } : {
          right: 24,
          bottom: 24,
          left: 'auto',
          top: 'auto',
          x: 0,
          y: 0
        }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 20,
          mass: 1
        }}
      >
        <div className="relative">
          {/* Speaking indicator during presentation */}
          <AnimatePresence>
            {isActive && (
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
            voiceSpeaking={isActive || voiceSpeaking}
            voiceProcessing={voiceProcessing}
            audioLevel={audioLevel}
            onDoubleClick={onDoubleClick}
            currentEmotion={currentEmotion}
            emotionIntensity={emotionIntensity}
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
