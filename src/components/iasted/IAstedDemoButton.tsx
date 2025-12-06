import { Link } from 'react-router-dom';
import { Mic } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const styles = `
/* Perspective container for 3D effect */
.demo-perspective-container {
  perspective: 1500px;
  position: relative;
}

.demo-perspective {
  perspective: 1200px;
  position: relative;
  transform-style: preserve-3d;
}

/* Main spherical button with heartbeat animation */
.demo-thick-matter-button {
  transform-style: preserve-3d;
  border-radius: 50%;
  will-change: transform, box-shadow, border-radius, filter;
  transition: all 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
  animation: 
    demo-global-heartbeat 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite,
    demo-shadow-pulse 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite,
    demo-micro-breathing 4s ease-in-out infinite;
}

@keyframes demo-micro-breathing {
  0%, 100% { transform: scale(1) translateZ(0); }
  25% { transform: scale(1.02) translateZ(2px); }
  50% { transform: scale(0.98) translateZ(-2px); }
  75% { transform: scale(1.01) translateZ(1px); }
}

/* Hover state - intense heartbeat */
.demo-thick-matter-button:hover {
  animation: 
    demo-global-heartbeat-intense 1.4s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite,
    demo-shadow-pulse-intense 1.4s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite,
    demo-hover-glow 1.4s ease-in-out infinite,
    demo-hover-expansion 2s ease-in-out infinite;
}

@keyframes demo-hover-expansion {
  0%, 100% { transform: scale(1) translateZ(0); }
  50% { transform: scale(1.05) translateZ(10px); }
}

@keyframes demo-hover-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(0, 170, 255, 0.5), 0 0 80px rgba(0, 170, 255, 0.3), 0 0 120px rgba(0, 170, 255, 0.2), 0 8px 16px rgba(0, 102, 255, 0.2), inset 0 -5px 15px rgba(0, 102, 255, 0.2), inset 0 5px 15px rgba(255, 255, 255, 0.3); }
  50% { box-shadow: 0 0 60px rgba(0, 170, 255, 0.7), 0 0 120px rgba(0, 170, 255, 0.5), 0 0 180px rgba(0, 170, 255, 0.3), 0 12px 24px rgba(0, 102, 255, 0.3), inset 0 -8px 20px rgba(0, 102, 255, 0.25), inset 0 8px 20px rgba(255, 255, 255, 0.4); }
}

@keyframes demo-global-heartbeat-intense {
  0% { transform: scale3d(1, 1, 1) rotate(0deg); border-radius: 50%; filter: brightness(1) saturate(1.7) hue-rotate(0deg); }
  3% { transform: scale3d(1.08, 1.1, 1.06) rotate(2deg); border-radius: 40% 60% 57% 43% / 44% 56% 44% 56%; filter: brightness(1.2) saturate(2.1) hue-rotate(5deg); }
  6% { transform: scale3d(1.22, 1.18, 1.26) rotate(-3deg); border-radius: 35% 65% 62% 38% / 58% 42% 60% 40%; filter: brightness(1.4) saturate(2.5) hue-rotate(10deg); }
  9% { transform: scale3d(1.3, 1.25, 1.35) rotate(1deg); border-radius: 32% 68% 65% 35% / 62% 38% 64% 36%; filter: brightness(1.5) saturate(2.8) hue-rotate(15deg); }
  12% { transform: scale3d(1.15, 1.12, 1.18) rotate(-1deg); border-radius: 38% 62% 58% 42% / 54% 46% 56% 44%; filter: brightness(1.3) saturate(2.3) hue-rotate(5deg); }
  15% { transform: scale3d(0.88, 0.91, 0.85) rotate(0deg); border-radius: 58% 42% 45% 55% / 42% 58% 44% 56%; filter: brightness(0.85) saturate(1.4) hue-rotate(-5deg); }
  18% { transform: scale3d(0.8, 0.84, 0.76) rotate(0.5deg); border-radius: 62% 38% 42% 58% / 38% 62% 40% 60%; filter: brightness(0.8) saturate(1.3) hue-rotate(-10deg); }
  25% { transform: scale3d(1.12, 1.08, 1.16) rotate(-0.5deg); border-radius: 41% 59% 56% 44% / 58% 42% 57% 43%; filter: brightness(1.2) saturate(2.2) hue-rotate(3deg); }
  100% { transform: scale3d(1, 1, 1) rotate(0deg); border-radius: 50%; filter: brightness(1) saturate(1.7) hue-rotate(0deg); }
}

@keyframes demo-shadow-pulse-intense {
  0%, 100% { box-shadow: 0 0 40px rgba(0, 170, 255, 0.4), 0 0 80px rgba(0, 170, 255, 0.3), 0 8px 16px rgba(0, 102, 255, 0.2), inset 0 -5px 15px rgba(0, 102, 255, 0.2), inset 0 5px 15px rgba(255, 255, 255, 0.3); }
  6% { box-shadow: 0 0 60px rgba(0, 170, 255, 0.6), 0 0 120px rgba(0, 170, 255, 0.4), 0 16px 32px rgba(0, 102, 255, 0.3), inset 0 -8px 20px rgba(0, 102, 255, 0.25), inset 0 8px 20px rgba(255, 255, 255, 0.4); }
  12% { box-shadow: 0 0 80px rgba(0, 170, 255, 0.8), 0 0 160px rgba(0, 170, 255, 0.6), 0 20px 40px rgba(0, 102, 255, 0.4), inset 0 -10px 25px rgba(0, 102, 255, 0.3), inset 0 10px 25px rgba(255, 255, 255, 0.5); }
}

@keyframes demo-global-heartbeat {
  0% { transform: scale3d(1, 1, 1) rotate(0deg); border-radius: 50%; filter: brightness(1); }
  3% { transform: scale3d(1.05, 1.07, 1.03) rotate(1.5deg); border-radius: 42% 58% 55% 45% / 46% 54% 46% 54%; filter: brightness(1.08); }
  6% { transform: scale3d(1.14, 1.1, 1.18) rotate(-1.5deg); border-radius: 38% 62% 58% 42% / 55% 45% 58% 42%; filter: brightness(1.15); }
  9% { transform: scale3d(1.2, 1.16, 1.24) rotate(0.8deg); border-radius: 35% 65% 62% 38% / 58% 42% 60% 40%; filter: brightness(1.2); }
  12% { transform: scale3d(1.1, 1.07, 1.13) rotate(-0.8deg); border-radius: 40% 60% 55% 45% / 52% 48% 54% 46%; filter: brightness(1.1); }
  15% { transform: scale3d(0.93, 0.96, 0.9) rotate(0deg); border-radius: 55% 45% 48% 52% / 45% 55% 47% 53%; filter: brightness(0.92); }
  18% { transform: scale3d(0.86, 0.9, 0.82) rotate(0.4deg); border-radius: 58% 42% 45% 55% / 42% 58% 44% 56%; filter: brightness(0.86); }
  25% { transform: scale3d(1.07, 1.04, 1.1) rotate(-0.3deg); border-radius: 43% 57% 54% 46% / 56% 44% 55% 45%; filter: brightness(1.07); }
  30% { transform: scale3d(1.12, 1.09, 1.15) rotate(0.6deg); border-radius: 40% 60% 58% 42% / 59% 41% 57% 43%; filter: brightness(1.11); }
  100% { transform: scale3d(1, 1, 1) rotate(0deg); border-radius: 50%; filter: brightness(1); }
}

@keyframes demo-shadow-pulse {
  0%, 100% { box-shadow: 0 0 30px rgba(0, 170, 255, 0.3), 0 0 60px rgba(0, 170, 255, 0.2), 0 8px 16px rgba(0, 102, 255, 0.2), inset 0 -5px 15px rgba(0, 102, 255, 0.2), inset 0 5px 15px rgba(255, 255, 255, 0.3); }
  9% { box-shadow: 0 0 50px rgba(0, 170, 255, 0.5), 0 0 100px rgba(0, 170, 255, 0.4), 0 12px 24px rgba(0, 102, 255, 0.3), inset 0 -8px 20px rgba(0, 102, 255, 0.25), inset 0 8px 20px rgba(255, 255, 255, 0.4); }
}

/* Depth layer for 3D thick effect */
.demo-depth-layer {
  position: absolute;
  top: 5%; left: 5%;
  width: 90%; height: 90%;
  border-radius: 50%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1) 0%, rgba(0, 102, 255, 0.1) 60%, rgba(0, 170, 255, 0.05) 80%);
  filter: blur(2px);
  opacity: 0.4;
  transform: translateZ(-10px);
  pointer-events: none;
}

/* Highlight layer for 3D shine */
.demo-highlight-layer {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, transparent 30%, rgba(255, 255, 255, 0.1) 45%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.1) 55%, transparent 70%);
  transform: translateZ(15px) rotate(45deg);
  opacity: 0.4;
  filter: blur(2px);
  mix-blend-mode: overlay;
  pointer-events: none;
  animation: demo-highlight-pulse 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
}

@keyframes demo-highlight-pulse {
  0%, 100% { opacity: 0.4; transform: translateZ(15px) rotate(45deg) scale(1); }
  6% { opacity: 0.7; transform: translateZ(20px) rotate(45deg) scale(1.08); }
  12% { opacity: 0.85; transform: translateZ(25px) rotate(45deg) scale(1.12); }
  18% { opacity: 0.25; transform: translateZ(10px) rotate(45deg) scale(0.92); }
}

/* Organic membrane effect */
.demo-organic-membrane {
  position: absolute; inset: -5%; border-radius: 50%;
  background: radial-gradient(circle at center, transparent 20%, rgba(0, 170, 255, 0.03) 40%, rgba(0, 170, 255, 0.08) 60%, rgba(0, 170, 255, 0.04) 80%, transparent 95%);
  opacity: 0;
  animation: demo-membrane-palpitation 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
  pointer-events: none;
}

@keyframes demo-membrane-palpitation {
  0%, 100% { opacity: 0; transform: scale(1) translateZ(0); filter: blur(0px); }
  3% { opacity: 0.3; transform: scale(0.95) translateZ(-5px); filter: blur(1px); }
  6% { opacity: 0.7; transform: scale(0.9) translateZ(-10px); filter: blur(0px); }
  9% { opacity: 0.9; transform: scale(1.15) translateZ(15px); filter: blur(2px); }
  12% { opacity: 0.95; transform: scale(1.25) translateZ(20px); filter: blur(3px); }
  18% { opacity: 0.4; transform: scale(1.12) translateZ(10px); filter: blur(1px); }
}

/* Wave emission effect */
.demo-wave-emission {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  width: 100%; height: 100%; border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, rgba(0, 170, 255, 0.3) 30%, transparent 70%);
  transform: scale3d(0.9, 0.9, 1); opacity: 0;
  transform-style: preserve-3d;
  pointer-events: none;
}

.demo-wave-1 { animation: demo-wave-emission-heartbeat 2.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
.demo-wave-2 { animation: demo-wave-emission-heartbeat 2.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; animation-delay: 0.3s; }
.demo-wave-3 { animation: demo-wave-emission-heartbeat 2.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; animation-delay: 0.6s; }

@keyframes demo-wave-emission-heartbeat {
  0%, 20%, 100% { transform: scale3d(0.9, 0.9, 1) translateZ(0px); opacity: 0; filter: blur(0px); }
  6% { transform: scale3d(1, 1, 1) translateZ(2px); opacity: 0.7; filter: blur(0px); }
  12% { transform: scale3d(1.8, 1.8, 1.2) translateZ(10px); opacity: 0; filter: blur(10px); }
}

/* Morphing background - fluid rainbow effect */
.demo-morphing-bg {
  background: 
    radial-gradient(circle at 20% 80%, rgba(0, 102, 255, 0.9) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 204, 0, 0.9) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(0, 170, 255, 0.9) 0%, transparent 50%),
    radial-gradient(circle at 20% 20%, rgba(255, 215, 0, 0.9) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(255, 0, 255, 0.7) 0%, transparent 50%),
    linear-gradient(135deg, #0066ff 0%, #00aaff 8%, #00ffff 16%, #4400ff 24%, #ff00ff 32%, #ff0066 40%, #ffcc00 48%, #ffc125 56%, #ff6600 64%, #ff0099 72%, #9400d3 80%, #4b0082 88%, #0066ff 100%);
  background-size: 200% 200%, 200% 200%, 200% 200%, 200% 200%, 200% 200%, 400% 400%;
  animation: demo-fluid-mix 25s ease-in-out infinite, demo-bg-pulse 2.8s cubic-bezier(0.68, -0.2, 0.265, 1.55) infinite;
  filter: saturate(2) brightness(1.2);
}

@keyframes demo-fluid-mix {
  0% { background-position: 0% 50%, 100% 50%, 50% 0%, 50% 100%, center, 0% 0%; }
  25% { background-position: 100% 0%, 0% 100%, 100% 50%, 0% 50%, center, 25% 25%; }
  50% { background-position: 50% 100%, 50% 0%, 0% 50%, 100% 50%, center, 50% 50%; }
  75% { background-position: 0% 50%, 100% 50%, 50% 100%, 50% 0%, center, 75% 75%; }
  100% { background-position: 0% 50%, 100% 50%, 50% 0%, 50% 100%, center, 100% 100%; }
}

@keyframes demo-bg-pulse {
  0%, 100% { filter: saturate(1.7) brightness(1.15); }
  9% { filter: saturate(2.3) brightness(1.4); }
  15% { filter: saturate(1.4) brightness(0.95); }
}

/* Satellite particle */
.demo-satellite-particle {
  width: 6px; height: 6px;
  top: 12px; left: 50%; margin-left: -3px;
  border-radius: 50%;
  background: rgba(0, 170, 255, 0.8);
  box-shadow: 0 0 4px rgba(0, 170, 255, 0.6), 0 0 8px rgba(0, 170, 255, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.5);
  z-index: 20; position: absolute;
  animation: demo-orbit-close 4s linear infinite;
  transform-style: preserve-3d;
  transform: translateZ(20px);
}

@keyframes demo-orbit-close {
  0% { transform: translateZ(20px) rotate(0deg) translateX(25px) rotate(0deg); }
  100% { transform: translateZ(20px) rotate(360deg) translateX(25px) rotate(-360deg); }
}
`;

interface IAstedDemoButtonProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const IAstedDemoButton = ({ size = 'md', className = '' }: IAstedDemoButtonProps) => {
  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-20 h-20 md:w-24 md:h-24', icon: 'h-8 w-8 md:h-10 md:w-10' },
    md: { container: 'w-28 h-28 md:w-36 md:h-36', icon: 'h-10 w-10 md:h-14 md:w-14' },
    lg: { container: 'w-36 h-36 md:w-44 md:h-44', icon: 'h-14 w-14 md:h-16 md:w-16' },
  };

  const config = sizeConfig[size];

  return (
    <>
      <style>{styles}</style>
      <Link 
        to="/iasted-guide" 
        className={`relative z-10 group cursor-pointer block ${className}`}
      >
        <div className="demo-perspective-container">
          <div className={`demo-perspective ${config.container} flex items-center justify-center`}>
            {/* Organic membranes */}
            <div className="demo-organic-membrane" />
            
            {/* Wave emissions */}
            <div className="demo-wave-emission demo-wave-1" />
            <div className="demo-wave-emission demo-wave-2" />
            <div className="demo-wave-emission demo-wave-3" />
            
            {/* Main button */}
            <div 
              className={`demo-thick-matter-button demo-morphing-bg ${config.container} rounded-full flex items-center justify-center relative`}
            >
              {/* Depth layer */}
              <div className="demo-depth-layer" />
              
              {/* Highlight layer */}
              <div className="demo-highlight-layer" />
              
              {/* Satellite particle */}
              <div className="demo-satellite-particle" />
              
              {/* Inner glow overlay */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
              
              {/* Mic icon */}
              <Mic className={`${config.icon} text-white drop-shadow-lg relative z-10`} />
            </div>
            
            {/* Hover text */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              <Badge className="bg-card text-foreground border shadow-lg">
                Découvrir iAsted
              </Badge>
            </div>
          </div>
        </div>
      </Link>
    </>
  );
};

export default IAstedDemoButton;
