import { useState, useRef, useEffect } from 'react';
import { Mic, MessageCircle, Brain } from 'lucide-react';

interface IAstedButtonProps {
  voiceListening?: boolean;
  voiceSpeaking?: boolean;
  voiceProcessing?: boolean;
  pulsing?: boolean; // Visual feedback for sound events
  onClick?: () => void;
  onSingleClick?: () => void;
  onDoubleClick?: () => void;
  className?: string;
  audioLevel?: number; // 0 to 1
  size?: 'sm' | 'md' | 'lg'; // Button size variant
  isInterfaceOpen?: boolean;
}

interface Shockwave {
  id: number;
}

interface Position {
  x: number;
  y: number;
}

const styles = `
/* Styling de base avec perspective */
.perspective-container {
  perspective: 1500px;
  position: fixed;
  z-index: 9999;
}

.perspective-container.grabbing {
  cursor: grabbing !important;
}

.thick-matter-button.grabbing {
  cursor: grabbing !important;
}

.perspective {
  perspective: 1200px;
  position: relative;
  transform-style: preserve-3d;
}

/* ===========================================
   ANIMATIONS BATTEMENT DE COEUR DOUCES
   Fréquences:
   - 60 BPM = 1s par cycle (actif + chat ouvert)
   - 70 BPM = 0.857s par cycle (écoute)
   - 80 BPM = 0.75s par cycle (réflexion)
   - 90 BPM = 0.667s par cycle (parole)
   =========================================== */

/* État par défaut - 60 BPM (repos avec interface ouverte) */
.thick-matter-button {
  transform-style: preserve-3d;
  border-radius: 50%;
  will-change: transform;
  transition: all 0.4s ease-out;
  animation: heartbeat-60bpm 1s ease-in-out infinite;
}

/* Pulsation douce 60 BPM - Chat ouvert, repos */
@keyframes heartbeat-60bpm {
  0%, 100% { 
    transform: scale(1); 
  }
  15% { 
    transform: scale(1.04); 
  }
  30% { 
    transform: scale(1); 
  }
  45% { 
    transform: scale(1.02); 
  }
  60% { 
    transform: scale(1); 
  }
}

/* Pulsation 70 BPM - Écoute (micro) */
@keyframes heartbeat-70bpm {
  0%, 100% { 
    transform: scale(1); 
  }
  15% { 
    transform: scale(1.05); 
  }
  30% { 
    transform: scale(1); 
  }
  45% { 
    transform: scale(1.025); 
  }
  60% { 
    transform: scale(1); 
  }
}

/* Pulsation 80 BPM - Réflexion (cerveau) */
@keyframes heartbeat-80bpm {
  0%, 100% { 
    transform: scale(1); 
  }
  15% { 
    transform: scale(1.06); 
  }
  30% { 
    transform: scale(1); 
  }
  45% { 
    transform: scale(1.03); 
  }
  60% { 
    transform: scale(1); 
  }
}

/* Pulsation 90 BPM - Parole (texte iAsted) */
@keyframes heartbeat-90bpm {
  0%, 100% { 
    transform: scale(1); 
  }
  15% { 
    transform: scale(1.07); 
  }
  30% { 
    transform: scale(1); 
  }
  45% { 
    transform: scale(1.035); 
  }
  60% { 
    transform: scale(1); 
  }
}

/* État hover - légère intensification */
.thick-matter-button:hover {
  animation: heartbeat-hover 0.9s ease-in-out infinite;
}

@keyframes heartbeat-hover {
  0%, 100% { 
    transform: scale(1); 
  }
  15% { 
    transform: scale(1.06); 
  }
  30% { 
    transform: scale(1); 
  }
  45% { 
    transform: scale(1.03); 
  }
  60% { 
    transform: scale(1); 
  }
}

/* État actif - compression douce */
.thick-matter-button:active {
  animation: none;
  transform: scale(0.95);
  transition: transform 0.15s ease-out;
}

/* États vocaux avec fréquences spécifiques */

/* Écoute - 70 BPM (0.857s) */
.thick-matter-button.voice-listening {
  animation: heartbeat-70bpm 0.857s ease-in-out infinite;
}

/* Parole - 90 BPM (0.667s) */
.thick-matter-button.voice-speaking {
  animation: heartbeat-90bpm 0.667s ease-in-out infinite;
}

/* Réflexion/Processing - 80 BPM (0.75s) */
.thick-matter-button.voice-processing {
  animation: heartbeat-80bpm 0.75s ease-in-out infinite;
}

/* Chat ouvert (repos actif) - 60 BPM (1s) */
.thick-matter-button.interface-open {
  animation: heartbeat-60bpm 1s ease-in-out infinite;
}

/* Pulsation feedback sonore */
.thick-matter-button.pulsing {
  animation: gentle-pulse-feedback 0.8s ease-in-out 3;
}

@keyframes gentle-pulse-feedback {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

/* Couche de profondeur pour effet 3D */
.depth-layer {
  position: absolute;
  top: 5%; left: 5%;
  width: 90%; height: 90%;
  border-radius: 50%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, rgba(0, 102, 255, 0.1) 60%, rgba(0, 170, 255, 0.05) 80%);
  filter: blur(2px);
  opacity: 0.4;
  transform: translateZ(-10px);
}

/* Couche de brillance */
.highlight-layer {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, transparent 30%, rgba(255, 255, 255, 0.1) 45%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 55%, transparent 70%);
  transform: translateZ(15px) rotate(45deg);
  opacity: 0.3;
  filter: blur(2px);
  mix-blend-mode: overlay;
  pointer-events: none;
}


/* Membrane organique - effet subtil */
.organic-membrane {
  position: absolute; inset: -5%; border-radius: 50%;
  background: radial-gradient(circle at center, transparent 20%, rgba(0, 170, 255, 0.02) 40%, rgba(0, 170, 255, 0.04) 60%, rgba(0, 170, 255, 0.02) 80%, transparent 95%);
  opacity: 0.3;
  pointer-events: none;
}

.organic-membrane-secondary {
  position: absolute; inset: -8%; border-radius: 50%;
  background: radial-gradient(circle at center, transparent 10%, rgba(255, 204, 0, 0.01) 30%, rgba(0, 170, 255, 0.02) 50%, rgba(255, 0, 255, 0.01) 70%, transparent 90%);
  opacity: 0.2;
  pointer-events: none;
}

/* Émissions d'ondes désactivées par défaut */
.wave-emission {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  width: 100%; height: 100%; border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, rgba(0, 170, 255, 0.1) 30%, transparent 70%);
  transform: scale3d(0.9, 0.9, 1); 
  opacity: 0;
  transform-style: preserve-3d;
}

.wave-1, .wave-2, .wave-3 { 
  animation: none; 
  opacity: 0;
}

/* Background morphing simplifié */
.morphing-bg {
  background: 
    radial-gradient(circle at 20% 80%, rgba(0, 102, 255, 0.9) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 204, 0, 0.9) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(0, 170, 255, 0.9) 0%, transparent 50%),
    radial-gradient(circle at 20% 20%, rgba(255, 215, 0, 0.9) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(255, 0, 255, 0.7) 0%, transparent 50%),
    linear-gradient(135deg, #0066ff 0%, #00aaff 8%, #00ffff 16%, #4400ff 24%, #ff00ff 32%, #ff0066 40%, #ffcc00 48%, #ffc125 56%, #ff6600 64%, #ff0099 72%, #9400d3 80%, #4b0082 88%, #0066ff 100%);
  background-size: 200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%, 400% 400%;
  animation: fluid-mix-organic 25s ease-in-out infinite, fluid-wave 12s ease-in-out infinite;
  filter: saturate(1.8) brightness(1.1);
  mix-blend-mode: lighten;
  box-shadow: inset 0 0 30px rgba(255, 255, 255, 0.2), inset 0 0 60px rgba(0, 170, 255, 0.2);
  transform-style: preserve-3d;
}

@keyframes fluid-wave {
  0%, 100% { background-position: 0% 0%, 100% 100%, 100% 0%, 0% 100%, 50% 50%, 0% 0%; }
  25% { background-position: 50% 50%, 50% 50%, 0% 100%, 100% 0%, 25% 75%, 100% 30%; }
  50% { background-position: 100% 100%, 0% 0%, 0% 0%, 100% 100%, 75% 25%, 60% 100%; }
  75% { background-position: 50% 0%, 50% 100%, 100% 50%, 0% 50%, 50% 50%, 20% 50%; }
}

.thick-matter-button:hover .morphing-bg {
  animation-duration: 15s, 8s;
  filter: saturate(2) brightness(1.2);
}

.moving-highlights {
  position: absolute; inset: 0; border-radius: 50%;
  overflow: hidden; pointer-events: none;
}

.highlight-1, .highlight-2, .highlight-3 {
  position: absolute; width: 80%; height: 80%;
  border-radius: 50%; filter: blur(20px);
  mix-blend-mode: overlay;
}

.highlight-1 {
  background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, transparent 60%);
  animation: highlight-move-1 10s ease-in-out infinite;
}

.highlight-2 {
  background: radial-gradient(circle, rgba(0, 170, 255, 0.7) 0%, transparent 50%);
  animation: highlight-move-2 12s ease-in-out infinite;
}

.highlight-3 {
  background: radial-gradient(circle, rgba(255, 204, 0, 0.6) 0%, transparent 55%);
  animation: highlight-move-3 8s ease-in-out infinite;
}

@keyframes highlight-move-1 {
  0%, 100% { transform: translate(-40%, -40%) scale(0.7); opacity: 0.7; }
  25% { transform: translate(40%, -30%) scale(1.3); opacity: 0.9; }
  50% { transform: translate(30%, 40%) scale(1.1); opacity: 0.8; }
  75% { transform: translate(-30%, 30%) scale(0.9); opacity: 0.75; }
}

@keyframes highlight-move-2 {
  0%, 100% { transform: translate(50%, -50%) scale(1.1); opacity: 0.6; }
  33% { transform: translate(-30%, 50%) scale(1.5); opacity: 0.8; }
  66% { transform: translate(40%, 20%) scale(0.8); opacity: 0.7; }
}

@keyframes highlight-move-3 {
  0%, 100% { transform: translate(-30%, 50%) scale(1.2); opacity: 0.5; }
  20% { transform: translate(50%, 30%) scale(0.8); opacity: 0.7; }
  40% { transform: translate(30%, -50%) scale(1.4); opacity: 0.6; }
  60% { transform: translate(-50%, -30%) scale(0.7); opacity: 0.65; }
  80% { transform: translate(-20%, 20%) scale(1.1); opacity: 0.55; }
}

.fluid-waves {
  position: absolute; inset: -15%; border-radius: 50%;
  overflow: hidden; pointer-events: none;
}

.wave-layer {
  position: absolute; inset: 0;
  border-radius: inherit; opacity: 0.4;
}

.wave-layer-1 {
  background: conic-gradient(from 0deg, transparent, rgba(0, 102, 255, 0.4) 60deg, rgba(0, 170, 255, 0.3) 120deg, transparent 180deg, rgba(255, 204, 0, 0.4) 240deg, rgba(255, 215, 0, 0.3) 300deg, transparent);
  animation: wave-rotate-1 18s linear infinite;
}

.wave-layer-2 {
  background: conic-gradient(from 45deg, transparent, rgba(0, 170, 255, 0.4) 60deg, rgba(0, 102, 255, 0.3) 120deg, transparent 180deg, rgba(255, 215, 0, 0.4) 240deg, rgba(255, 204, 0, 0.3) 300deg, transparent);
  animation: wave-rotate-2 22s linear infinite reverse;
}

.wave-layer-3 {
  background: conic-gradient(from 90deg, transparent, rgba(255, 0, 255, 0.3) 60deg, rgba(138, 43, 226, 0.2) 120deg, transparent 180deg, rgba(0, 255, 255, 0.3) 240deg, rgba(30, 144, 255, 0.2) 300deg, transparent);
  animation: wave-rotate-3 26s linear infinite;
}

@keyframes wave-rotate-1 {
  from { transform: rotate(0deg) scale(1); }
  to { transform: rotate(360deg) scale(1); }
}

@keyframes wave-rotate-2 {
  from { transform: rotate(0deg) scale(1.15); opacity: 0.4; }
  50% { opacity: 0.6; }
  to { transform: rotate(-360deg) scale(1.15); opacity: 0.4; }
}

@keyframes wave-rotate-3 {
  from { transform: rotate(0deg) scale(0.85); }
  to { transform: rotate(360deg) scale(0.85); }
}

.thick-matter-button:hover .wave-layer-1 { animation-duration: 8s; opacity: 0.6; }
.thick-matter-button:hover .wave-layer-2 { animation-duration: 10s; opacity: 0.7; }
.thick-matter-button:hover .wave-layer-3 { animation-duration: 12s; opacity: 0.5; }

.substance-effect {
  position: absolute; inset: 0; border-radius: inherit;
  box-shadow: inset 0 -15px 30px rgba(0, 102, 255, 0.2);
  opacity: 0.4;
  background: radial-gradient(circle at 50% 120%, rgba(255, 255, 255, 0.3) 0%, rgba(0, 170, 255, 0.1) 50%, rgba(0, 102, 255, 0.05) 80%);
  transform-style: preserve-3d;
  animation: inner-fluid-movement 10s ease-in-out infinite alternate, substance-pulse 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
}

@keyframes substance-pulse {
  0%, 100% { opacity: 0.4; transform: translateZ(5px) scale(1); }
  6% { opacity: 0.55; transform: translateZ(10px) scale(1.08); }
  12% { opacity: 0.65; transform: translateZ(15px) scale(1.12); }
  18% { opacity: 0.45; transform: translateZ(2px) scale(0.92); }
}

@keyframes inner-fluid-movement {
  0% { border-radius: 40% 60% 70% 30% / 40% 40% 60% 60%; opacity: 0.4; transform: translateZ(5px) rotate(0deg); }
  25% { border-radius: 50% 50% 50% 50% / 60% 30% 70% 40%; opacity: 0.55; transform: translateZ(12px) rotate(90deg); }
  50% { border-radius: 60% 40% 30% 70% / 70% 50% 50% 30%; opacity: 0.6; transform: translateZ(18px) rotate(180deg); }
  75% { border-radius: 45% 55% 65% 35% / 40% 60% 40% 60%; opacity: 0.5; transform: translateZ(10px) rotate(270deg); }
  100% { border-radius: 50% 50% 40% 60% / 30% 60% 40% 70%; opacity: 0.4; transform: translateZ(5px) rotate(360deg); }
}

.living-matter {
  animation: living-matter-float 12s ease-in-out infinite alternate, living-matter-rotate 35s linear infinite, living-pulse 5s ease-in-out infinite;
}

@keyframes living-matter-float {
  0% { transform: translateY(0px) translateX(0px) rotate(0deg); }
  20% { transform: translateY(-4px) translateX(3px) rotate(0.8deg); }
  40% { transform: translateY(-7px) translateX(5px) rotate(-0.5deg); }
  60% { transform: translateY(-3px) translateX(2px) rotate(0.3deg); }
  80% { transform: translateY(-5px) translateX(4px) rotate(-0.2deg); }
  100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
}

@keyframes living-pulse {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.1); }
}

.inner-fluid-layer {
  position: absolute; inset: 0; border-radius: 50%;
  opacity: 0.4; transform-style: preserve-3d;
  pointer-events: none;
}

.layer-1 {
  background: radial-gradient(circle at 30% 40%, rgba(0, 102, 255, 0.3) 0%, rgba(255, 204, 0, 0.2) 50%, transparent 80%);
  animation: fluid-layer-1 10s ease-in-out infinite alternate;
  filter: blur(3px); transform: translateZ(10px);
}

.layer-2 {
  background: radial-gradient(circle at 70% 30%, rgba(255, 204, 0, 0.3) 0%, rgba(0, 170, 255, 0.2) 50%, transparent 80%);
  animation: fluid-layer-2 14s ease-in-out infinite alternate-reverse;
  filter: blur(4px); transform: translateZ(15px);
}

.layer-3 {
  background: radial-gradient(circle at 50% 60%, rgba(0, 170, 255, 0.3) 0%, rgba(255, 215, 0, 0.2) 50%, transparent 80%);
  animation: fluid-layer-3 12s ease-in-out infinite alternate;
  filter: blur(5px); transform: translateZ(20px);
}

@keyframes fluid-layer-1 {
  0% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; transform: translateZ(10px) rotate(0deg) scale(1); opacity: 0.4; }
  50% { border-radius: 50% 50% 50% 50% / 50% 50% 50% 50%; transform: translateZ(15px) rotate(135deg) scale(1.1); opacity: 0.45; }
  100% { border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%; transform: translateZ(18px) rotate(225deg) scale(1); opacity: 0.4; }
}

@keyframes fluid-layer-2 {
  0% { border-radius: 70% 30% 50% 50% / 30% 50% 50% 70%; transform: translateZ(15px) rotate(0deg) scale(1); opacity: 0.4; }
  50% { border-radius: 45% 55% 55% 45% / 45% 55% 55% 45%; transform: translateZ(25px) rotate(-180deg) scale(1.15); opacity: 0.45; }
  100% { border-radius: 50% 50% 70% 30% / 50% 70% 30% 50%; transform: translateZ(22px) rotate(-300deg) scale(1); opacity: 0.4; }
}

@keyframes fluid-layer-3 {
  0% { border-radius: 50% 50% 30% 70% / 60% 40% 60% 40%; transform: translateZ(20px) rotate(0deg) scale(1); opacity: 0.4; }
  50% { border-radius: 65% 35% 40% 60% / 55% 45% 60% 40%; transform: translateZ(24px) rotate(180deg) scale(0.88); opacity: 0.32; }
  100% { border-radius: 40% 60% 60% 40% / 30% 60% 40% 70%; transform: translateZ(28px) rotate(360deg) scale(1); opacity: 0.4; }
}

.vortex-container {
  position: absolute; width: 100%; height: 100%;
  pointer-events: none; transform-style: preserve-3d;
  opacity: 0.4;
}

.vortex {
  position: absolute; inset: 0; border-radius: 50%;
  transform-style: preserve-3d; opacity: 0.3;
  filter: blur(4px);
}


.vortex-1 {
  background: conic-gradient(from 0deg, rgba(0, 102, 255, 0) 0%, rgba(0, 102, 255, 0.3) 20%, rgba(255, 204, 0, 0.4) 40%, rgba(0, 170, 255, 0.3) 60%, rgba(255, 215, 0, 0.2) 80%, rgba(0, 102, 255, 0) 100%);
  animation: vortex-spin-1 12s linear infinite;
  transform: translateZ(8px);
}

.vortex-2 {
  background: conic-gradient(from 180deg, rgba(255, 204, 0, 0) 0%, rgba(255, 204, 0, 0.3) 20%, rgba(0, 102, 255, 0.4) 40%, rgba(255, 215, 0, 0.3) 60%, rgba(0, 170, 255, 0.2) 80%, rgba(255, 204, 0, 0) 100%);
  animation: vortex-spin-2 8s linear infinite;
  transform: translateZ(12px);
}

@keyframes vortex-spin-1 {
  0% { transform: translateZ(8px) rotate(0deg) scale(1); opacity: 0.3; }
  50% { transform: translateZ(10px) rotate(180deg) scale(1); opacity: 0.4; }
  100% { transform: translateZ(8px) rotate(360deg) scale(1); opacity: 0.3; }
}

@keyframes vortex-spin-2 {
  0% { transform: translateZ(12px) rotate(0deg) scale(1); opacity: 0.3; }
  50% { transform: translateZ(16px) rotate(-180deg) scale(1.15); opacity: 0.5; }
  100% { transform: translateZ(12px) rotate(-360deg) scale(1); opacity: 0.3; }
}

.organic-texture {
  position: absolute; inset: 0; border-radius: 50%;
  background: 
    radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.05) 0%, transparent 20%),
    radial-gradient(circle at 60% 20%, rgba(0, 170, 255, 0.06) 0%, transparent 25%),
    radial-gradient(circle at 80% 60%, rgba(255, 204, 0, 0.05) 0%, transparent 20%),
    radial-gradient(circle at 30% 70%, rgba(0, 102, 255, 0.06) 0%, transparent 30%),
    radial-gradient(circle at 70% 80%, rgba(255, 215, 0, 0.05) 0%, transparent 25%),
    radial-gradient(circle at 50% 50%, rgba(138, 43, 226, 0.04) 0%, transparent 35%);
  opacity: 0.6;
  mix-blend-mode: overlay;
  animation: texture-shift 18s ease-in-out infinite, texture-pulse 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
}

@keyframes texture-shift {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.08) rotate(90deg); }
  50% { transform: scale(0.92) rotate(180deg); }
  75% { transform: scale(1.05) rotate(270deg); }
}

@keyframes texture-pulse {
  0%, 100% { opacity: 0.6; }
  6% { opacity: 0.85; }
  12% { opacity: 0.95; }
  18% { opacity: 0.5; }
}

.organic-veins {
  position: absolute; inset: 5%; border-radius: 50%;
  background: conic-gradient(from 0deg, transparent 0deg, rgba(0, 102, 255, 0.15) 20deg, rgba(0, 170, 255, 0.1) 40deg, transparent 60deg, rgba(255, 204, 0, 0.12) 80deg, rgba(255, 215, 0, 0.08) 100deg, transparent 120deg, rgba(0, 170, 255, 0.18) 140deg, rgba(0, 102, 255, 0.1) 160deg, transparent 180deg, rgba(255, 215, 0, 0.15) 200deg, rgba(255, 204, 0, 0.1) 220deg, transparent 240deg, rgba(30, 144, 255, 0.13) 260deg, rgba(138, 43, 226, 0.08) 280deg, transparent 300deg, rgba(255, 193, 37, 0.16) 320deg, rgba(255, 127, 80, 0.1) 340deg, transparent 360deg);
  animation: organic-veins 4s ease-in-out infinite, vortex-spin-1 25s linear infinite reverse, vein-pulse 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
  filter: blur(2px);
  mix-blend-mode: screen;
  pointer-events: none;
}

@keyframes organic-veins {
  0%, 100% { opacity: 0.15; filter: blur(3px); }
  25% { opacity: 0.35; filter: blur(2px); }
  50% { opacity: 0.2; filter: blur(2.5px); }
  75% { opacity: 0.4; filter: blur(1.5px); }
}

@keyframes vein-pulse {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.15; }
  6% { transform: scale(1.15) rotate(2deg); opacity: 0.25; }
  12% { transform: scale(1.2) rotate(-2deg); opacity: 0.3; }
  18% { transform: scale(0.85) rotate(1deg); opacity: 0.1; }
}

.breathing-bubble {
  position: absolute;
  width: 10px; height: 10px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.5));
  box-shadow: 0 0 6px rgba(255, 255, 255, 0.4), 0 0 12px rgba(0, 170, 255, 0.2), inset -1px -1px 3px rgba(0, 0, 0, 0.2);
  opacity: 0;
}

@keyframes bubble-life-1 {
  0%, 100% { opacity: 0; transform: translate(-30px, 40px) scale(0); }
  10% { opacity: 0.7; transform: translate(-28px, 35px) scale(0.4); }
  30% { opacity: 1; transform: translate(-18px, 20px) scale(0.9); }
  50% { opacity: 0.6; transform: translate(0px, 0px) scale(1.2); }
  70% { opacity: 0; transform: translate(20px, -20px) scale(1.4); }
}

@keyframes bubble-life-2 {
  0%, 100% { opacity: 0; transform: translate(35px, -25px) scale(0); }
  15% { opacity: 0.6; transform: translate(32px, -22px) scale(0.3); }
  35% { opacity: 0.9; transform: translate(18px, -8px) scale(0.8); }
  55% { opacity: 0.5; transform: translate(-2px, 12px) scale(1.05); }
  75% { opacity: 0; transform: translate(-22px, 32px) scale(1.25); }
}

@keyframes bubble-life-3 {
  0%, 100% { opacity: 0; transform: translate(-15px, -35px) scale(0); }
  20% { opacity: 0.5; transform: translate(-13px, -30px) scale(0.25); }
  40% { opacity: 0.8; transform: translate(-2px, -12px) scale(0.7); }
  60% { opacity: 0.4; transform: translate(12px, 8px) scale(0.95); }
  80% { transform: translate(25px, 28px) scale(1.15); }
}

.bubble-1 { animation: bubble-life-1 5s ease-out infinite; }
.bubble-2 { animation: bubble-life-2 5.5s ease-out infinite; animation-delay: 1.8s; }
.bubble-3 { animation: bubble-life-3 5.2s ease-out infinite; animation-delay: 3.4s; }

.thick-matter-button:hover .inner-fluid-layer {
  animation-duration: 5s, 7s, 6s;
  opacity: 0.6;
  filter: blur(2px) saturate(2);
}

.thick-matter-button:hover .vortex {
  opacity: 0.5;
  animation-duration: 6s, 4s;
}

.thick-matter-button:hover .organic-veins {
  opacity: 0.3;
  animation-duration: 2s, 12s, 1.4s;
}

.thick-matter-button:hover .substance-effect {
  opacity: 0.6;
  animation-duration: 5s, 1.4s;
}

.thick-matter-button:hover .organic-membrane {
  animation: membrane-contraction-hover 1.4s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
}

.thick-matter-button:hover .organic-membrane-secondary {
  animation: membrane-contraction-secondary-hover 1.4s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
  animation-delay: 0.1s;
}

@keyframes membrane-contraction-hover {
  0%, 100% { opacity: 0.2; transform: scale(0.98) translateZ(0); filter: blur(1px); }
  10% { opacity: 0.9; transform: scale(0.85) translateZ(-20px); filter: blur(0px); }
  20% { opacity: 1; transform: scale(1.35) translateZ(30px); filter: blur(4px); }
  40% { opacity: 0.4; transform: scale(0.9) translateZ(-10px); filter: blur(2px); }
  60% { opacity: 0.7; transform: scale(1.15) translateZ(15px); filter: blur(2px); }
}

@keyframes membrane-contraction-secondary-hover {
  0%, 100% { opacity: 0.3; transform: scale(1.02) translateZ(5px) rotate(0deg); filter: blur(2px); }
  15% { opacity: 1; transform: scale(0.8) translateZ(-25px) rotate(-10deg); filter: blur(1px); }
  25% { opacity: 0.9; transform: scale(1.4) translateZ(35px) rotate(5deg); filter: blur(5px); }
  50% { opacity: 0.5; transform: scale(0.88) translateZ(-15px) rotate(3deg); filter: blur(2px); }
  70% { opacity: 0.8; transform: scale(1.18) translateZ(20px) rotate(-3deg); filter: blur(3px); }
}

.thick-matter-button:active .morphing-bg {
  filter: saturate(3) brightness(0.7) contrast(1.8);
}

.thick-matter-button:active .inner-fluid-layer {
  transform: scale(0.85);
  opacity: 0.8;
}

.thick-matter-button:active .organic-veins {
  transform: scale(1.2);
  opacity: 0.4;
}

.thick-matter-button::before {
  content: '';
  position: absolute; inset: 0; border-radius: 50%;
  animation: micro-movements 6s ease-in-out infinite;
  pointer-events: none;
}

@keyframes micro-movements {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  8% { transform: translate(0.8px, -0.5px) rotate(0.15deg); }
  16% { transform: translate(-0.5px, 0.7px) rotate(-0.08deg); }
  32% { transform: translate(-0.6px, -0.4px) rotate(-0.15deg); }
  64% { transform: translate(-0.4px, -0.5px) rotate(-0.08deg); }
  88% { transform: translate(0.6px, 0.4px) rotate(0.1deg); }
}

.cellular-layer {
  position: absolute; inset: -8%; border-radius: 50%;
  background: radial-gradient(circle at center, transparent 30%, rgba(0, 170, 255, 0.15) 50%, rgba(0, 102, 255, 0.1) 70%, transparent 85%);
  animation: cellular-breathing 5s ease-in-out infinite;
  pointer-events: none;
}

@keyframes cellular-breathing {
  0%, 100% { opacity: 0.08; transform: scale(0.96); }
  25% { opacity: 0.12; transform: scale(1.01); }
  50% { opacity: 0.2; transform: scale(1.04); }
  75% { opacity: 0.15; transform: scale(0.99); }
}

.shine-effect {
  position: absolute; inset: 0; border-radius: 50%;
  background: linear-gradient(105deg, transparent 35%, rgba(255, 255, 255, 0.4) 45%, rgba(255, 255, 255, 0.5) 50%, rgba(255, 255, 255, 0.4) 55%, transparent 65%);
  background-size: 200% 200%;
  animation: shine-movement 10s ease-in-out infinite;
  mix-blend-mode: overlay;
  pointer-events: none;
  opacity: 0.8;
}

@keyframes shine-movement {
  0%, 100% { background-position: -200% center; }
  50% { background-position: 200% center; }
}

.thick-matter-button:hover .shine-effect {
  animation-duration: 4s;
  opacity: 1;
}

@keyframes shadow-pulse {
  0%, 100% { box-shadow: 0 6px 12px rgba(0, 170, 255, 0.2), 0 3px 6px rgba(0, 170, 255, 0.15), 0 0 50px rgba(0, 170, 255, 0.15), 0 0 100px rgba(0, 170, 255, 0.08), inset 0 -4px 12px rgba(0, 102, 255, 0.15), inset 0 4px 12px rgba(255, 255, 255, 0.25); }
  6% { box-shadow: 0 8px 16px rgba(0, 170, 255, 0.25), 0 4px 8px rgba(0, 170, 255, 0.2), 0 0 80px rgba(0, 170, 255, 0.2), 0 0 140px rgba(0, 170, 255, 0.1), inset 0 -6px 16px rgba(0, 102, 255, 0.2), inset 0 6px 16px rgba(255, 255, 255, 0.3); }
  12% { box-shadow: 0 12px 28px rgba(0, 170, 255, 0.3), 0 6px 14px rgba(0, 170, 255, 0.25), 0 0 120px rgba(0, 170, 255, 0.3), 0 0 200px rgba(0, 170, 255, 0.15), inset 0 -8px 20px rgba(0, 102, 255, 0.25), inset 0 8px 20px rgba(255, 255, 255, 0.4); }
}

.particle-container {
  position: absolute; width: 100%; height: 100%;
  pointer-events: none;
}

.floating-particle {
  position: absolute;
  width: 4px; height: 4px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%);
  border-radius: 50%;
  opacity: 0;
}

@keyframes particle-float-1 {
  0%, 100% { opacity: 0; transform: translate(0, 0) scale(0); }
  20% { opacity: 0.6; transform: translate(-20px, -30px) scale(1); }
  40% { opacity: 0.8; transform: translate(-40px, -20px) scale(1.2); }
  60% { transform: translate(-30px, -40px) scale(0.8); }
  80% { opacity: 0.3; transform: translate(-10px, -50px) scale(0.5); }
}

@keyframes particle-float-2 {
  0%, 100% { opacity: 0; transform: translate(0, 0) scale(0); }
  25% { opacity: 0.5; transform: translate(30px, -25px) scale(0.8); }
  50% { opacity: 0.7; transform: translate(25px, -45px) scale(1.1); }
  75% { opacity: 0.4; transform: translate(35px, -35px) scale(0.6); }
}

.particle-float-1 { animation: particle-float-1 8s ease-out infinite; }
.particle-float-2 { animation: particle-float-2 10s ease-out infinite; animation-delay: 2s; }

.fixed-icons-container {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  display: flex; justify-content: center; align-items: center;
  pointer-events: none; z-index: 40;
  animation: icon-pulse 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
}

@keyframes icon-pulse {
  0%, 100% { transform: scale(1); }
  6% { transform: scale(0.92); }
  12% { transform: scale(0.88); }
  18% { transform: scale(1.08); }
  30% { transform: scale(0.96); }
  60% { transform: scale(0.91); }
  75% { transform: scale(1.04); }
}

.icon-container {
  position: relative; width: 100%; height: 100%;
  display: flex; justify-content: center; align-items: center;
}

.alternating-element {
  position: absolute; opacity: 0;
  transform: translateY(10px) scale(0.9);
  filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.8));
}

@keyframes fade-in-out {
  0%, 25%, 100% { opacity: 0; }
  5%, 20% { opacity: 1; }
}

.text-element { animation: fade-in-out 12s cubic-bezier(0.25, 0.1, 0.25, 1) infinite, text-float-animation 3.5s ease-in-out infinite; }
.mic-element { animation: fade-in-out 12s cubic-bezier(0.25, 0.1, 0.25, 1) infinite, mic-float-animation 3.5s ease-in-out infinite; animation-delay: 3s, 3s; }
.chat-element { animation: fade-in-out 12s cubic-bezier(0.25, 0.1, 0.25, 1) infinite, chat-float-animation 3.5s ease-in-out infinite; animation-delay: 6s, 6s; }
.brain-element { animation: fade-in-out 12s cubic-bezier(0.25, 0.1, 0.25, 1) infinite, brain-float-animation 3.5s ease-in-out infinite; animation-delay: 9s, 9s; }

@keyframes text-float-animation { 0%, 100% { transform: translateY(20px) scale(0.7); } 50% { transform: translateY(-8px) scale(1.1); }}
@keyframes mic-float-animation { 0%, 100% { transform: translateY(20px) scale(0.7) rotate(-5deg); } 50% { transform: translateY(-8px) scale(1.1) rotate(5deg); }}
@keyframes chat-float-animation { 0%, 100% { transform: translateY(20px) scale(0.7) rotate(5deg); } 50% { transform: translateY(-8px) scale(1.1) rotate(-5deg); }}
@keyframes brain-float-animation { 0%, 100% { transform: translateY(20px) scale(0.7) rotate(-3deg); } 50% { transform: translateY(-8px) scale(1.1) rotate(3deg); }}

.iasted-text {
  text-shadow: 0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(0,170,255,0.6);
  font-size: var(--iasted-text-size, 20px) !important;
  font-weight: bold; line-height: 1;
}

.icon-svg {
  width: var(--iasted-icon-size, 48px) !important;
  height: var(--iasted-icon-size, 48px) !important;
}

.shockwave-effect {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%) scale(0.5);
  width: 100%; height: 100%; border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(0, 102, 255, 0.7) 30%, rgba(0, 170, 255, 0.5) 50%, rgba(255, 204, 0, 0.3) 70%, transparent 90%);
  animation: shockwave 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  mix-blend-mode: screen; pointer-events: none;
}

@keyframes shockwave {
  0% { transform: translate(-50%, -50%) scale(0.1); opacity: 1; filter: blur(0px); }
  25% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.9; filter: blur(1px); }
  50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.7; filter: blur(2px); }
  75% { transform: translate(-50%, -50%) scale(2.2); opacity: 0.4; filter: blur(4px); }
  100% { transform: translate(-50%, -50%) scale(3); opacity: 0; filter: blur(8px); }
}

.color-shift {
  animation: color-shift-animation 1.5s ease-in-out;
}

@keyframes color-shift-animation {
  0% { filter: hue-rotate(0deg) saturate(2) brightness(1.2); }
  25% { filter: hue-rotate(90deg) saturate(3) brightness(1.4); }
  50% { filter: hue-rotate(180deg) saturate(3.5) brightness(1.6); }
  75% { filter: hue-rotate(270deg) saturate(2.5) brightness(1.3); }
  100% { filter: hue-rotate(360deg) saturate(2) brightness(1.2); }
}

.processing {
  animation: 
    processing-pulse 2s ease-in-out infinite,
    global-heartbeat-intense 1s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite !important;
}

@keyframes processing-pulse {
  0%, 100% { transform: scale(1) rotate(0deg); filter: hue-rotate(0deg) brightness(1); }
  25% { transform: scale(1.1) rotate(90deg); filter: hue-rotate(90deg) brightness(1.2); }
  50% { transform: scale(0.9) rotate(180deg); filter: hue-rotate(180deg) brightness(0.8); }
  75% { transform: scale(1.05) rotate(270deg); filter: hue-rotate(270deg) brightness(1.1); }
}

/* Badge de mode vocal avec animation pulse améliorée */
.voice-mode-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 4px 12px rgba(16, 185, 129, 0.4),
    0 0 20px rgba(16, 185, 129, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);
  z-index: 10;
  animation: badge-pulse 1.5s ease-in-out infinite;
  border: 2px solid rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
}

.voice-mode-badge svg {
  width: 16px;
  height: 16px;
  color: white;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  animation: icon-pulse 1.5s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 
      0 4px 12px rgba(16, 185, 129, 0.4),
      0 0 20px rgba(16, 185, 129, 0.3),
      inset 0 1px 2px rgba(255, 255, 255, 0.3);
  }
  50% { 
    transform: scale(1.15);
    box-shadow: 
      0 6px 18px rgba(16, 185, 129, 0.6),
      0 0 35px rgba(16, 185, 129, 0.5),
      0 0 50px rgba(16, 185, 129, 0.3),
      inset 0 1px 3px rgba(255, 255, 255, 0.5);
  }
}

@keyframes icon-pulse {
  0%, 100% { 
    transform: scale(1);
  }
  50% { 
    transform: scale(1.2);
  }
}

.thick-matter-button.sm { width: 80px; height: 80px; }
.thick-matter-button.md { width: 128px; height: 128px; }
.thick-matter-button.lg { width: 160px; height: 160px; }

/* Responsive mobile - adaptation des tailles et optimisations */
@media (max-width: 640px) {
  .perspective-container {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  /* Tailles réduites pour mobile */
  .thick-matter-button.sm { width: 64px; height: 64px; }
  .thick-matter-button.md { width: 96px; height: 96px; }
  .thick-matter-button.lg { width: 120px; height: 120px; }
  
  /* Optimisation des animations pour mobile */
  .thick-matter-button {
    animation-duration: 3s, 3s, 20s, 5s, 25s;
  }
  
  .thick-matter-button:hover {
    animation-duration: 1.6s, 1.6s, 20s, 1.6s, 2.5s;
  }
  
  /* Réduction de l'intensité des effets pour performance */
  .wave-layer-1, .wave-layer-2, .wave-layer-3 {
    opacity: 0.3;
  }
  
  .organic-membrane, .organic-membrane-secondary {
    opacity: 0.5;
  }
  
  .satellite-particle {
    width: 6px;
    height: 6px;
  }
  
  /* Simplification des gradients et ombres */
  .morphing-bg {
    filter: saturate(1.8) brightness(1.1);
  }
  
  .thick-matter-button:hover .morphing-bg {
    filter: saturate(2.5) brightness(1.3) contrast(1.2);
  }

  /* Badge plus petit sur mobile */
  .voice-mode-badge {
    width: 24px;
    height: 24px;
    top: -6px;
    right: -6px;
  }

  .voice-mode-badge svg {
    width: 12px;
    height: 12px;
  }
}

/* Adaptation pour tablette */
@media (min-width: 641px) and (max-width: 1024px) {
  .perspective-container {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  /* Tailles intermédiaires pour tablette */
  .thick-matter-button.sm { width: 72px; height: 72px; }
  .thick-matter-button.md { width: 112px; height: 112px; }
  .thick-matter-button.lg { width: 140px; height: 140px; }
}

/* Desktop */
@media (min-width: 1025px) {
  .perspective-container {
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

/* Adaptation pour très petits écrans */
@media (max-width: 380px) {
  .perspective-container {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .thick-matter-button.sm { width: 56px; height: 56px; }
  .thick-matter-button.md { width: 80px; height: 80px; }
  .thick-matter-button.lg { width: 100px; height: 100px; }
  
  .satellite-particle {
    display: none;
  }

  /* Badge encore plus petit sur très petits écrans */
  .voice-mode-badge {
    width: 20px;
    height: 20px;
    top: -5px;
    right: -5px;
  }

  .voice-mode-badge svg {
    width: 10px;
    height: 10px;
  }
}
`;

export const IAstedButtonFull: React.FC<IAstedButtonProps> = ({
  onClick,
  onDoubleClick,
  className = '',
  voiceListening = false,
  voiceSpeaking = false,
  voiceProcessing = false,
  pulsing = false,
  audioLevel = 0,
  size = 'md', // Default size
  isInterfaceOpen = false
}) => {
  const [shockwaves, setShockwaves] = useState<Shockwave[]>([]);
  const [isClicked, setIsClicked] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });
  const buttonPosition = useRef<Position>({ x: 0, y: 0 });
  const clickTimer = useRef<NodeJS.Timeout | null>(null);
  const clickCount = useRef(0);

  useEffect(() => {
    // Restaurer la position sauvegardée ou utiliser la position par défaut
    const savedPosition = localStorage.getItem('iasted-button-position');
    if (savedPosition) {
      const pos = JSON.parse(savedPosition);
      setPosition(pos);
      buttonPosition.current = pos;
    } else {
      // Position par défaut (bas à droite) - on calcule dynamiquement selon la taille
      const getSize = () => {
        if (window.innerWidth <= 380) {
          return size === 'sm' ? 56 : size === 'lg' ? 100 : 80;
        } else if (window.innerWidth <= 640) {
          return size === 'sm' ? 64 : size === 'lg' ? 120 : 96;
        } else if (window.innerWidth <= 1024) {
          return size === 'sm' ? 72 : size === 'lg' ? 140 : 112;
        }
        return size === 'sm' ? 80 : size === 'lg' ? 160 : 128;
      };

      const btnSize = getSize();
      const defaultPos = {
        x: window.innerWidth - btnSize - 40,
        y: window.innerHeight - btnSize - 40
      };
      setPosition(defaultPos);
      buttonPosition.current = defaultPos;
    }
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.left = `${position.x}px`;
      containerRef.current.style.top = `${position.y}px`;
    }
  }, [position]);

  // Classes d'état selon les fréquences de battement de coeur
  // 90 BPM = parole (voiceSpeaking)
  // 70 BPM = écoute (voiceListening)
  // 80 BPM = réflexion (voiceProcessing)
  // 60 BPM = chat ouvert actif (isInterfaceOpen)
  const getHeartbeatClass = () => {
    if (voiceSpeaking) return 'voice-speaking'; // 90 BPM
    if (voiceListening) return 'voice-listening'; // 70 BPM
    if (voiceProcessing) return 'voice-processing'; // 80 BPM
    if (isInterfaceOpen) return 'interface-open'; // 60 BPM
    return ''; // Default animation
  };
  
  const heartbeatClass = getHeartbeatClass();

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) {
      return;
    }

    const shockwaveId = Date.now();
    setShockwaves([...shockwaves, { id: shockwaveId }]);
    setIsClicked(true);

    setIsProcessing(true);

    setTimeout(() => {
      setShockwaves(prev => prev.filter(r => r.id !== shockwaveId));
    }, 1000);

    setTimeout(() => {
      setIsClicked(false);
    }, 1500);

    setTimeout(() => {
      setIsProcessing(false);
    }, 3000);

    // Gestion des clics simples vs doubles avec délai de 300ms
    clickCount.current += 1;

    if (clickCount.current === 1) {
      // Premier clic - attendre pour voir s'il y a un double clic
      clickTimer.current = setTimeout(() => {
        // Simple clic confirmé
        onClick();
        clickCount.current = 0;
      }, 300); // Délai de 300ms pour détecter le double clic
    } else if (clickCount.current === 2) {
      // Double clic détecté - ouvrir le modal de chat texte
      if (clickTimer.current) {
        clearTimeout(clickTimer.current);
      }
      onDoubleClick();
      clickCount.current = 0;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsActive(true);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      dragStartPos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const handleMouseUp = () => {
    setIsActive(false);
    setIsDragging(false);

    if (containerRef.current) {
      const pos = buttonPosition.current;
      localStorage.setItem('iasted-button-position', JSON.stringify(pos));
    }
  };

  const handleMouseLeave = () => {
    setIsActive(false);
    setIsDragging(false);

    if (containerRef.current) {
      const pos = buttonPosition.current;
      localStorage.setItem('iasted-button-position', JSON.stringify(pos));
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isActive) return;

    const deltaX = e.movementX;
    const deltaY = e.movementY;

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      setIsDragging(true);
    }

    if (isDragging && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newX = e.clientX - dragStartPos.current.x;
      const newY = e.clientY - dragStartPos.current.y;

      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;

      const constrainedX = Math.max(0, Math.min(newX, maxX));
      const constrainedY = Math.max(0, Math.min(newY, maxY));

      setPosition({ x: constrainedX, y: constrainedY });
      buttonPosition.current = { x: constrainedX, y: constrainedY };
    }
  };

  return (
    <>
      <style>{styles}</style>

      <div
        ref={containerRef}
        className={`perspective-container ${isDragging ? 'grabbing' : ''}`}
        onMouseMove={handleMouseMove}
      >
        <div className="perspective">
          <button
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className={`thick-matter-button living-matter ${size} ${isClicked ? 'color-shift' : ''} ${isActive ? 'active' : ''} ${isProcessing ? 'processing' : ''} ${isDragging ? 'grabbing' : ''} ${pulsing ? 'pulsing' : ''} ${heartbeatClass} relative cursor-grab focus:outline-none overflow-hidden border-0 ${className}`}
            style={{
              '--iasted-icon-size': size === 'sm' ? 'clamp(24px, 5vw, 32px)' : size === 'lg' ? 'clamp(48px, 10vw, 64px)' : 'clamp(36px, 7vw, 48px)',
              '--iasted-text-size': size === 'sm' ? 'clamp(12px, 2.5vw, 14px)' : size === 'lg' ? 'clamp(20px, 4vw, 28px)' : 'clamp(16px, 3vw, 20px)',
            } as React.CSSProperties}
          >
            {/* Couche de profondeur */}
            <div className="depth-layer"></div>

            {/* Petite sphère satellite */}
            <div className="satellite-particle"></div>

            {/* Couche cellulaire respirante */}
            <div className="cellular-layer"></div>

            {/* Vagues de fluide organique */}
            <div className="fluid-waves">
              <div className="wave-layer wave-layer-1"></div>
              <div className="wave-layer wave-layer-2"></div>
              <div className="wave-layer wave-layer-3"></div>
            </div>

            {/* Membrane organique palpitante */}
            <div className="organic-membrane"></div>

            {/* Membrane secondaire pour plus de profondeur */}
            <div className="organic-membrane-secondary"></div>

            {/* Background morphing */}
            <div className="absolute inset-0 morphing-bg rounded-full"></div>

            {/* Reflets mobiles */}
            <div className="moving-highlights">
              <div className="highlight-1"></div>
              <div className="highlight-2"></div>
              <div className="highlight-3"></div>
            </div>

            {/* Effet de brillance mobile */}
            <div className="shine-effect"></div>

            {/* Effet de substance épaisse */}
            <div className="substance-effect"></div>

            {/* Couches de fluide interne */}
            <div className="inner-fluid-layer layer-1"></div>
            <div className="inner-fluid-layer layer-2"></div>
            <div className="inner-fluid-layer layer-3"></div>

            {/* Effet de tourbillons */}
            <div className="vortex-container">
              <div className="vortex vortex-1"></div>
              <div className="vortex vortex-2"></div>
            </div>

            {/* Particules additionnelles */}
            <div className="particle-container">
              <div className="floating-particle particle-float-1"></div>
              <div className="floating-particle particle-float-2"></div>
            </div>

            {/* Veins organiques */}
            <div className="organic-veins"></div>

            {/* Émissions d'ondes synchronisées avec le battement */}
            <div className="wave-emission wave-1"></div>
            <div className="wave-emission wave-2"></div>
            <div className="wave-emission wave-3"></div>

            {/* Texture organique de surface */}
            <div className="organic-texture"></div>

            {/* Couche de brillance */}
            <div className="highlight-layer"></div>

            {/* Bulles respiratoires */}
            <div className="breathing-bubble bubble-1"></div>
            <div className="breathing-bubble bubble-2"></div>
            <div className="breathing-bubble bubble-3"></div>

            {/* Effets d'onde de choc au clic */}
            {shockwaves.map(shockwave => (
              <div key={shockwave.id} className="shockwave-effect"></div>
            ))}

            {/* Conteneur des icônes au centre - État basé sur le mode actif */}
            <div className="fixed-icons-container">
              <div className="icon-container">
                {isInterfaceOpen && !voiceListening && !voiceSpeaking && !voiceProcessing ? (
                  <MessageCircle className="text-white icon-svg" style={{ opacity: 1, transform: 'scale(1.2)' }} />
                ) : voiceListening ? (
                  <Mic className="text-white icon-svg" style={{ opacity: 1, transform: 'scale(1.3)' }} />
                ) : voiceSpeaking ? (
                  <span className="text-white iasted-text" style={{ opacity: 1, transform: 'scale(1.2)', fontSize: 'var(--iasted-text-size)' }}>
                    iAsted
                  </span>
                ) : voiceProcessing ? (
                  <Brain className="text-white icon-svg" style={{ opacity: 1, transform: 'scale(1.2)' }} />
                ) : (
                  <>
                    <span className="alternating-element text-element text-white iasted-text">
                      iAsted
                    </span>
                    <Mic className="alternating-element mic-element text-white icon-svg" />
                    <MessageCircle className="alternating-element chat-element text-white icon-svg" />
                    <Brain className="alternating-element brain-element text-white icon-svg" />
                  </>
                )}
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
};

export default IAstedButtonFull;
