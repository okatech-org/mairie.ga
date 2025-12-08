import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type EmotionType = 
  | 'joy' 
  | 'sadness' 
  | 'anger' 
  | 'fear' 
  | 'surprise' 
  | 'disgust' 
  | 'trust' 
  | 'neutral';

export interface EmotionState {
  emotion: EmotionType;
  intensity: number;
  timestamp: number;
}

// Couleurs pour chaque émotion (format HSL)
export const EMOTION_COLORS: Record<EmotionType, { primary: string; secondary: string; glow: string }> = {
  joy: {
    primary: 'hsl(48, 95%, 55%)', // Or/jaune doré
    secondary: 'hsl(38, 90%, 60%)',
    glow: 'rgba(255, 200, 50, 0.6)'
  },
  sadness: {
    primary: 'hsl(220, 70%, 50%)', // Bleu profond
    secondary: 'hsl(230, 60%, 45%)',
    glow: 'rgba(80, 120, 200, 0.6)'
  },
  anger: {
    primary: 'hsl(0, 80%, 55%)', // Rouge vif
    secondary: 'hsl(15, 85%, 50%)',
    glow: 'rgba(220, 60, 50, 0.6)'
  },
  fear: {
    primary: 'hsl(280, 60%, 55%)', // Violet
    secondary: 'hsl(290, 50%, 45%)',
    glow: 'rgba(150, 80, 180, 0.6)'
  },
  surprise: {
    primary: 'hsl(180, 70%, 50%)', // Cyan/turquoise
    secondary: 'hsl(170, 65%, 55%)',
    glow: 'rgba(50, 200, 200, 0.6)'
  },
  disgust: {
    primary: 'hsl(90, 50%, 40%)', // Vert olive
    secondary: 'hsl(100, 45%, 35%)',
    glow: 'rgba(100, 140, 60, 0.6)'
  },
  trust: {
    primary: 'hsl(200, 75%, 55%)', // Bleu ciel
    secondary: 'hsl(190, 70%, 50%)',
    glow: 'rgba(70, 170, 230, 0.6)'
  },
  neutral: {
    primary: 'hsl(210, 80%, 55%)', // Bleu iAsted par défaut
    secondary: 'hsl(200, 85%, 60%)',
    glow: 'rgba(0, 170, 255, 0.6)'
  }
};

export function useEmotionDetection() {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionState>({
    emotion: 'neutral',
    intensity: 0.5,
    timestamp: Date.now()
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const conversationContext = useRef<string[]>([]);
  const lastAnalyzedMessage = useRef<string>('');

  const analyzeEmotion = useCallback(async (message: string) => {
    // Éviter d'analyser le même message deux fois
    if (message === lastAnalyzedMessage.current || message.trim().length < 3) {
      return currentEmotion;
    }

    lastAnalyzedMessage.current = message;
    setIsAnalyzing(true);

    try {
      // Ajouter au contexte de conversation (garder les 5 derniers messages)
      conversationContext.current = [
        ...conversationContext.current.slice(-4),
        message
      ];

      const { data, error } = await supabase.functions.invoke('analyze-emotion', {
        body: {
          message,
          context: conversationContext.current.slice(0, -1).join(' | ')
        }
      });

      if (error) {
        console.error('Emotion analysis error:', error);
        return currentEmotion;
      }

      const newEmotion: EmotionState = {
        emotion: (data?.emotion as EmotionType) || 'neutral',
        intensity: data?.intensity || 0.5,
        timestamp: Date.now()
      };

      setCurrentEmotion(newEmotion);
      return newEmotion;

    } catch (error) {
      console.error('Emotion detection error:', error);
      return currentEmotion;
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentEmotion]);

  const resetEmotion = useCallback(() => {
    setCurrentEmotion({
      emotion: 'neutral',
      intensity: 0.5,
      timestamp: Date.now()
    });
    conversationContext.current = [];
    lastAnalyzedMessage.current = '';
  }, []);

  const getEmotionColors = useCallback((emotion: EmotionType = currentEmotion.emotion) => {
    return EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral;
  }, [currentEmotion.emotion]);

  return {
    currentEmotion,
    isAnalyzing,
    analyzeEmotion,
    resetEmotion,
    getEmotionColors
  };
}
