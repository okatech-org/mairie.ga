import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import IAstedButtonFull from './IAstedButtonFull';
import PresentationMode from './PresentationMode';

interface TrailPoint {
  id: number;
  x: number;
  y: number;
  opacity: number;
  scale: number;
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
  const isMovingRef = useRef(false);

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
    isMovingRef.current = true;

    // Show target indicator immediately
    setTargetX(x);
    setTargetY(y);

    // Add trail points with more density for smoother look
    const dx = Math.abs(x - lastPosRef.current.x);
    const dy = Math.abs(y - lastPosRef.current.y);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 2) {
      const steps = Math.max(5, Math.floor(distance / 2)); // More particles

      for (let i = 0; i < steps; i++) {
        const progress = i / steps;
        const interpX = lastPosRef.current.x + (x - lastPosRef.current.x) * progress;
        const interpY = lastPosRef.current.y + (y - lastPosRef.current.y) * progress;

        // Stagger particle creation
        setTimeout(() => {
          trailIdRef.current += 1;
          setTrail(prev => {
            // Keep trail length managable but long enough for effect
            const newTrail = [...prev.slice(-25), {
              id: trailIdRef.current,
              x: interpX,
              y: interpY,
              opacity: 0.8 + Math.random() * 0.2,
              scale: 0.5 + Math.random() * 0.5
            }];
            return newTrail;
          });
        }, i * 30); // 30ms delay between particles
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
      isMovingRef.current = false;
    }, 1200);
  }, []);

  // Clean up old trail points faster
  useEffect(() => {
    if (trail.length > 0) {
      const timer = setTimeout(() => {
        setTrail(prev => prev.slice(1));
      }, 50); // Decay speed
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
      {/* Target position indicator - Enhanced Ripple Effect */}
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
            {/* Multiple expanding rings */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 2.5],
                  opacity: [0.6, 0],
                  borderWidth: ["4px", "0px"]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: "easeOut"
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-primary"
                style={{
                  width: '40px',
                  height: '40px',
                  borderColor: 'hsl(var(--primary))',
                  boxShadow: '0 0 15px hsl(var(--primary) / 0.4)'
                }}
              />
            ))}

            {/* Center target dot */}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              style={{ boxShadow: '0 0 20px hsl(var(--primary))' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trail effect - Particles */}
      <AnimatePresence>
        {isActive && trail.map((point) => (
          <motion.div
            key={point.id}
            initial={{ opacity: point.opacity, scale: point.scale }}
            animate={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed pointer-events-none z-[9998]"
            style={{
              ...getPixelPosition(point.x, point.y),
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div
              className="rounded-full bg-primary/40 backdrop-blur-[1px]"
              style={{
                width: `${16 * point.scale}px`,
                height: `${16 * point.scale}px`,
                boxShadow: `0 0 10px hsl(var(--primary) / 0.3)`
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>

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
          stiffness: 70, // Softer spring
          damping: 14,   // Less friction for floaty feel
          mass: 1.2
        }}
      >
        <div className="relative">
          {/* Speaking/Presentation Aura - Only when active */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-full z-[-1]"
                animate={{
                  boxShadow: [
                    "0 0 0 0px hsl(var(--primary) / 0.2)",
                    "0 0 0 15px hsl(var(--primary) / 0)",
                    "0 0 0 0px hsl(var(--primary) / 0)"
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </AnimatePresence>

          {/* Speaking indicator text during presentation */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0, y: 10 }}
                className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap"
              >
                <div className="bg-background/80 backdrop-blur-md border border-primary/20 rounded-full px-4 py-2 shadow-xl">
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-primary"
                    />
                    <span className="text-xs font-semibold bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                      iAsted présente...
                    </span>
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
            voiceSpeaking={isActive || voiceSpeaking} // Force speaking state visual in presentation
            voiceProcessing={voiceProcessing}
            audioLevel={audioLevel}
            onDoubleClick={onDoubleClick}
            currentEmotion={currentEmotion}
            emotionIntensity={emotionIntensity}
          />
        </div>
      </motion.div>

      {/* Presentation Mode Logic */}
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
