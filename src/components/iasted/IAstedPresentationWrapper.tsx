import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import IAstedButtonFull from './IAstedButtonFull';
import PresentationMode, { presentationState } from './PresentationMode';

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

  useEffect(() => {
    if (showPresentation) {
      setIsPresentationActive(true);
    }
  }, [showPresentation]);

  const handlePositionChange = (x: number, y: number) => {
    setButtonPosition({ x, y });
  };

  const handleClosePresentation = () => {
    setIsPresentationActive(false);
    setButtonPosition({ x: 90, y: 85 });
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
