/**
 * Compatibility layer - maps old OpenAI voice types to Gemini types
 * This allows gradual migration of components
 */

import { useGeminiLive, UseGeminiLive, GeminiVoice } from './useGeminiLive';

// Map old OpenAI voices to Gemini voices
export const voiceMapping: Record<string, GeminiVoice> = {
  'echo': 'Puck',
  'ash': 'Charon', 
  'shimmer': 'Kore'
};

export const reverseVoiceMapping: Record<GeminiVoice, string> = {
  'Puck': 'echo',
  'Charon': 'ash',
  'Kore': 'shimmer',
  'Fenrir': 'ash',
  'Aoede': 'shimmer'
};

// Re-export with compat types
export { useGeminiLive, type UseGeminiLive, type GeminiVoice };
