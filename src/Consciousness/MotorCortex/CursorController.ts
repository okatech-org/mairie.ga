/**
 * CONSCIOUSNESS - MotorCortex: CursorController
 * 
 * Composant React pour afficher et animer le curseur iAsted.
 * Ce hook reçoit les commandes de MotorSynapse et anime l'orbe.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { MotorSynapse, MotorCommand, MotorState } from './MotorSynapse';

// ============================================================
// TYPES
// ============================================================

export interface CursorPosition {
    x: number;
    y: number;
}

export interface CursorState {
    position: CursorPosition;
    isVisible: boolean;
    isHovering: boolean;
    hoverTarget: string | null;
    animation: 'idle' | 'moving' | 'clicking' | 'typing' | 'thinking' | 'speaking';
    pulseIntensity: 'none' | 'subtle' | 'medium' | 'strong';
    emotion: 'neutral' | 'happy' | 'concerned' | 'excited' | 'formal';
}

interface UseIAstedCursorOptions {
    initialPosition?: CursorPosition;
    animationDuration?: number;
    enabled?: boolean;
}

// ============================================================
// HOOK: useIAstedCursor
// ============================================================

export function useIAstedCursor(options: UseIAstedCursorOptions = {}) {
    const {
        initialPosition = { x: window.innerWidth - 100, y: window.innerHeight - 100 },
        animationDuration = 500,
        enabled = true
    } = options;

    const [cursorState, setCursorState] = useState<CursorState>({
        position: initialPosition,
        isVisible: false,
        isHovering: false,
        hoverTarget: null,
        animation: 'idle',
        pulseIntensity: 'none',
        emotion: 'neutral'
    });

    const animationRef = useRef<number | null>(null);
    const targetPositionRef = useRef<CursorPosition>(initialPosition);

    // ========== ANIMATION DE MOUVEMENT ==========

    const animateToPosition = useCallback((
        targetX: number,
        targetY: number,
        duration: number = animationDuration,
        easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' = 'easeInOut'
    ) => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        const startPosition = cursorState.position;
        const startTime = performance.now();
        targetPositionRef.current = { x: targetX, y: targetY };

        const easingFunctions = {
            linear: (t: number) => t,
            easeIn: (t: number) => t * t,
            easeOut: (t: number) => t * (2 - t),
            easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
        };

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easingFunctions[easing](progress);

            const newX = startPosition.x + (targetX - startPosition.x) * easedProgress;
            const newY = startPosition.y + (targetY - startPosition.y) * easedProgress;

            setCursorState(prev => ({
                ...prev,
                position: { x: newX, y: newY },
                animation: progress < 1 ? 'moving' : 'idle'
            }));

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                MotorSynapse.notifyMovementComplete();
            }
        };

        setCursorState(prev => ({ ...prev, animation: 'moving' }));
        animationRef.current = requestAnimationFrame(animate);
    }, [cursorState.position, animationDuration]);

    // ========== OBTENIR POSITION D'UN ÉLÉMENT ==========

    const getElementPosition = useCallback((elementId: string): CursorPosition | null => {
        const element = document.getElementById(elementId);
        if (!element) return null;

        const rect = element.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }, []);

    // ========== GESTIONNAIRE DE COMMANDES ==========

    const handleMotorCommand = useCallback((command: MotorCommand) => {
        if (!enabled) return;

        switch (command.type) {
            case 'MOVE_TO':
                let targetPos: CursorPosition | null = null;

                if ('elementId' in command.target) {
                    targetPos = getElementPosition(command.target.elementId);
                } else {
                    targetPos = { x: command.target.x, y: command.target.y };
                }

                if (targetPos) {
                    const speedDurations = { slow: 1000, normal: 500, fast: 250 };
                    animateToPosition(
                        targetPos.x,
                        targetPos.y,
                        speedDurations[command.speed],
                        command.easing
                    );
                }
                break;

            case 'GAZE_AT':
                const gazePos = getElementPosition(command.elementId);
                if (gazePos) {
                    setCursorState(prev => ({
                        ...prev,
                        isHovering: true,
                        hoverTarget: command.elementId
                    }));
                    animateToPosition(gazePos.x, gazePos.y, 300, 'easeOut');

                    // Surligner l'élément
                    if (command.highlight) {
                        const element = document.getElementById(command.elementId);
                        if (element) {
                            element.classList.add('iasted-highlight');
                            setTimeout(() => {
                                element.classList.remove('iasted-highlight');
                                setCursorState(prev => ({
                                    ...prev,
                                    isHovering: false,
                                    hoverTarget: null
                                }));
                            }, command.duration);
                        }
                    }
                }
                break;

            case 'INTERACT':
                setCursorState(prev => ({
                    ...prev,
                    animation: command.action === 'type' ? 'typing' : 'clicking'
                }));

                // Simuler l'interaction après le délai
                setTimeout(() => {
                    if (command.action === 'type' && command.payload?.text) {
                        // Simuler la frappe
                        console.log(`⌨️ [Cursor] Typing: ${command.payload.text}`);
                    }
                    setCursorState(prev => ({ ...prev, animation: 'idle' }));
                    MotorSynapse.notifyInteractionComplete();
                }, command.delay || 200);
                break;

            case 'VOCALIZE':
                setCursorState(prev => ({
                    ...prev,
                    animation: 'speaking',
                    emotion: command.emotion
                }));
                break;

            case 'PULSE':
                setCursorState(prev => ({
                    ...prev,
                    pulseIntensity: command.intensity
                }));
                setTimeout(() => {
                    setCursorState(prev => ({
                        ...prev,
                        pulseIntensity: 'none'
                    }));
                }, command.duration);
                break;

            case 'THINK':
                setCursorState(prev => ({
                    ...prev,
                    animation: 'thinking'
                }));
                setTimeout(() => {
                    setCursorState(prev => ({
                        ...prev,
                        animation: 'idle'
                    }));
                }, command.duration);
                break;

            case 'IDLE':
                setCursorState(prev => ({
                    ...prev,
                    animation: 'idle',
                    isHovering: false,
                    hoverTarget: null
                }));

                // Positionner selon la préférence
                if (command.position === 'corner') {
                    animateToPosition(window.innerWidth - 100, window.innerHeight - 100, 800, 'easeOut');
                } else if (command.position === 'center') {
                    animateToPosition(window.innerWidth / 2, window.innerHeight / 2, 800, 'easeOut');
                }
                break;
        }
    }, [enabled, animateToPosition, getElementPosition]);

    // ========== ABONNEMENT AUX COMMANDES ==========

    useEffect(() => {
        if (!enabled) return;

        const unsubscribe = MotorSynapse.onCommand(handleMotorCommand);

        // Afficher le curseur
        setCursorState(prev => ({ ...prev, isVisible: true }));

        return () => {
            unsubscribe();
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [enabled, handleMotorCommand]);

    // ========== API PUBLIQUE ==========

    const show = useCallback(() => {
        setCursorState(prev => ({ ...prev, isVisible: true }));
    }, []);

    const hide = useCallback(() => {
        setCursorState(prev => ({ ...prev, isVisible: false }));
    }, []);

    const setPosition = useCallback((x: number, y: number) => {
        setCursorState(prev => ({
            ...prev,
            position: { x, y }
        }));
    }, []);

    return {
        cursorState,
        show,
        hide,
        setPosition,
        animateToPosition,
        getElementPosition
    };
}

// ============================================================
// STYLES CSS À INJECTER
// ============================================================

export const IAstedCursorStyles = `
/* Style pour le surlignage des éléments */
.iasted-highlight {
    outline: 2px solid hsl(var(--primary)) !important;
    outline-offset: 2px;
    animation: iasted-pulse 0.5s ease-in-out;
}

@keyframes iasted-pulse {
    0% { outline-color: hsl(var(--primary) / 0.5); }
    50% { outline-color: hsl(var(--primary)); }
    100% { outline-color: hsl(var(--primary) / 0.5); }
}

/* Animations du curseur */
.iasted-cursor {
    position: fixed;
    pointer-events: none;
    z-index: 9999;
    transition: opacity 0.3s ease;
}

.iasted-cursor--thinking {
    animation: iasted-think 1s ease-in-out infinite;
}

@keyframes iasted-think {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

.iasted-cursor--speaking {
    animation: iasted-speak 0.3s ease-in-out infinite alternate;
}

@keyframes iasted-speak {
    from { transform: scale(1); }
    to { transform: scale(1.05); }
}

.iasted-cursor--clicking {
    animation: iasted-click 0.2s ease-out;
}

@keyframes iasted-click {
    0% { transform: scale(1); }
    50% { transform: scale(0.9); }
    100% { transform: scale(1); }
}
`;

// ============================================================
// EXPORT
// ============================================================

export default useIAstedCursor;
