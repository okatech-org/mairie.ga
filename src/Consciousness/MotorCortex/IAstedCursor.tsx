/**
 * CONSCIOUSNESS - MotorCortex: IAstedCursor Component
 * 
 * Composant React qui affiche le curseur/orbe d'iAsted.
 * Utilise le hook useIAstedCursor pour les animations.
 */

import React, { useEffect } from 'react';
import { useIAstedCursor, IAstedCursorStyles, CursorState } from './CursorController';

// ============================================================
// PROPS
// ============================================================

interface IAstedCursorProps {
    /** Taille de l'orbe en pixels */
    size?: number;
    /** Couleur primaire de l'orbe */
    primaryColor?: string;
    /** Couleur secondaire (glow) */
    glowColor?: string;
    /** Afficher ou non */
    visible?: boolean;
    /** Z-index */
    zIndex?: number;
}

// ============================================================
// COMPONENT
// ============================================================

export const IAstedCursor: React.FC<IAstedCursorProps> = ({
    size = 40,
    primaryColor = 'hsl(var(--primary))',
    glowColor = 'hsl(var(--primary) / 0.3)',
    visible = true,
    zIndex = 9999
}) => {
    const { cursorState } = useIAstedCursor({ enabled: visible });

    // Injecter les styles CSS
    useEffect(() => {
        const styleId = 'iasted-cursor-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = IAstedCursorStyles;
            document.head.appendChild(style);
        }
        return () => {
            const style = document.getElementById(styleId);
            if (style) {
                style.remove();
            }
        };
    }, []);

    if (!cursorState.isVisible || !visible) {
        return null;
    }

    const getAnimationClass = (): string => {
        switch (cursorState.animation) {
            case 'thinking': return 'iasted-cursor--thinking';
            case 'speaking': return 'iasted-cursor--speaking';
            case 'clicking': return 'iasted-cursor--clicking';
            case 'typing': return 'iasted-cursor--typing';
            default: return '';
        }
    };

    const getPulseStyle = (): React.CSSProperties => {
        if (cursorState.pulseIntensity === 'none') return {};

        const intensityMap = {
            subtle: '0 0 10px',
            medium: '0 0 20px',
            strong: '0 0 40px'
        };

        return {
            boxShadow: `${intensityMap[cursorState.pulseIntensity]} ${glowColor}`
        };
    };

    const getEmotionColor = (): string => {
        switch (cursorState.emotion) {
            case 'happy': return '#4ade80';      // green
            case 'excited': return '#facc15';    // yellow
            case 'concerned': return '#f97316';  // orange
            case 'formal': return '#3b82f6';     // blue
            default: return primaryColor;
        }
    };

    return (
        <div
            className={`iasted-cursor ${getAnimationClass()}`}
            style={{
                position: 'fixed',
                left: cursorState.position.x - size / 2,
                top: cursorState.position.y - size / 2,
                width: size,
                height: size,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${getEmotionColor()} 0%, ${primaryColor} 70%, transparent 100%)`,
                boxShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}`,
                pointerEvents: 'none',
                zIndex,
                transition: cursorState.animation === 'moving' ? 'none' : 'all 0.3s ease',
                opacity: cursorState.isHovering ? 1 : 0.8,
                ...getPulseStyle()
            }}
        >
            {/* Centre lumineux */}
            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: size * 0.4,
                    height: size * 0.4,
                    borderRadius: '50%',
                    background: 'white',
                    opacity: 0.9,
                    animation: cursorState.animation === 'speaking'
                        ? 'iasted-speak 0.3s ease-in-out infinite alternate'
                        : undefined
                }}
            />

            {/* Indicateur d'interaction */}
            {cursorState.animation === 'typing' && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: -20,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: 12,
                        color: primaryColor,
                        whiteSpace: 'nowrap'
                    }}
                >
                    ⌨️
                </div>
            )}
        </div>
    );
};

// ============================================================
// HOOK WRAPPER FOR EASIER USAGE
// ============================================================

/**
 * Hook simplifié pour contrôler le curseur depuis les composants
 */
export function useIAstedMotor() {
    const {
        cursorState,
        show,
        hide,
        animateToPosition,
        getElementPosition
    } = useIAstedCursor();

    return {
        // État
        position: cursorState.position,
        isMoving: cursorState.animation === 'moving',
        isSpeaking: cursorState.animation === 'speaking',
        isThinking: cursorState.animation === 'thinking',

        // Contrôles
        show,
        hide,
        moveTo: animateToPosition,

        // Utilitaires
        getElementPosition
    };
}

// ============================================================
// EXPORT
// ============================================================

export default IAstedCursor;
