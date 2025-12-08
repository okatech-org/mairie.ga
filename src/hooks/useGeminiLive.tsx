/**
 * useGeminiLive - Hook for Gemini 2.0 Flash Live API
 * Migrated from OpenAI Realtime API to Google Gemini
 * Uses WebSockets for bidirectional audio streaming
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { IASTED_VOICE_PROMPT_LITE } from '@/config/iasted-prompt-lite';
import { getRouteKnowledgePrompt, resolveRoute } from '@/utils/route-mapping';
import { useLocation, useNavigate } from 'react-router-dom';
import { AudioRecorder, AudioPlayer } from '@/utils/audio-processor';
import { supabase } from '@/integrations/supabase/client';

// Voice state types
export type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking';

// Gemini supported voices
export type GeminiVoice = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede';

export interface UseGeminiLive {
  voiceState: VoiceState;
  isMicrophoneAllowed: boolean;
  isConnected: boolean;
  connect: (voice?: GeminiVoice, systemPrompt?: string) => Promise<void>;
  disconnect: () => void;
  sendMessage: (text: string) => void;
  messages: any[];
  audioLevel: number;
  currentVoice: GeminiVoice;
  changeVoice: (voice: GeminiVoice) => void;
  clearSession: () => void;
  toggleConversation: (voice?: GeminiVoice) => void;
}

// Gemini Live API endpoint
const GEMINI_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

export const useGeminiLive = (onToolCall?: (name: string, args: any) => void): UseGeminiLive => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isMicrophoneAllowed, setIsMicrophoneAllowed] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentVoice, setCurrentVoice] = useState<GeminiVoice>('Puck');
  const [currentSystemPrompt, setCurrentSystemPrompt] = useState<string>(IASTED_VOICE_PROMPT_LITE);

  const wsRef = useRef<WebSocket | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const audioLevelIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isSetupSent = useRef(false);

  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const getGeminiApiKey = async (): Promise<string | null> => {
    try {
      // Try to get API key from edge function
      const { data, error } = await supabase.functions.invoke('get-gemini-token');
      if (error) {
        console.error('Error fetching Gemini token:', error);
        return null;
      }
      return data?.apiKey || null;
    } catch (e) {
      console.error('Failed to get Gemini API key:', e);
      return null;
    }
  };

  const buildGeminiTools = () => {
    return [
      {
        name: 'navigate_app',
        description: 'Naviguer vers une page de l\'application',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Le chemin de la route' }
          },
          required: ['path']
        }
      },
      {
        name: 'start_presentation',
        description: 'Démarrer la visite guidée interactive de l\'application',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'stop_presentation',
        description: 'Arrêter la présentation',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'control_ui',
        description: 'Contrôler l\'interface utilisateur (thème)',
        parameters: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['set_theme_dark', 'set_theme_light', 'toggle_theme']
            }
          },
          required: ['action']
        }
      },
      {
        name: 'fill_form_field',
        description: 'Remplir un champ du formulaire d\'inscription',
        parameters: {
          type: 'object',
          properties: {
            field: { type: 'string' },
            value: { type: 'string' }
          },
          required: ['field', 'value']
        }
      },
      {
        name: 'select_citizen_type',
        description: 'Sélectionner le type de citoyen (gabonais ou étranger)',
        parameters: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['gabonais', 'etranger']
            }
          },
          required: ['type']
        }
      },
      {
        name: 'stop_conversation',
        description: 'Arrêter la conversation vocale',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'change_voice',
        description: 'Changer la voix de l\'assistant',
        parameters: {
          type: 'object',
          properties: {}
        }
      }
    ];
  };

  const connect = async (voice: GeminiVoice = 'Puck', systemPrompt: string = IASTED_VOICE_PROMPT_LITE) => {
    try {
      setCurrentVoice(voice);
      setCurrentSystemPrompt(systemPrompt);
      setVoiceState('connecting');
      isSetupSent.current = false;

      console.log('🔑 [GeminiLive] Fetching API key...');
      const apiKey = await getGeminiApiKey();

      if (!apiKey) {
        throw new Error('Clé API Gemini non configurée. Veuillez ajouter GEMINI_API_KEY.');
      }

      console.log('✅ [GeminiLive] API key obtained');

      // Request microphone access
      console.log('🎙️ [GeminiLive] Requesting microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsMicrophoneAllowed(true);
      console.log('✅ [GeminiLive] Microphone access granted');

      // Initialize audio player
      audioPlayerRef.current = new AudioPlayer(
        () => setVoiceState('speaking'),
        () => {
          if (voiceState !== 'idle') setVoiceState('listening');
        }
      );
      await audioPlayerRef.current.init();

      // Connect to Gemini WebSocket
      const wsUrl = `${GEMINI_WS_URL}?key=${apiKey}`;
      console.log('🔌 [GeminiLive] Connecting to WebSocket...');

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ [GeminiLive] WebSocket connected');
        sendSetupMessage(ws, voice, systemPrompt);
      };

      ws.onmessage = (event) => {
        handleServerMessage(event);
      };

      ws.onerror = (error) => {
        console.error('❌ [GeminiLive] WebSocket error:', error);
        toast({
          title: 'Erreur de connexion',
          description: 'Impossible de se connecter à l\'API vocale',
          variant: 'destructive'
        });
        setVoiceState('idle');
      };

      ws.onclose = (event) => {
        console.log('🔌 [GeminiLive] WebSocket closed:', event.code, event.reason);
        cleanup();
        setVoiceState('idle');
      };

    } catch (err: any) {
      console.error('❌ [GeminiLive] Connection failed:', err);
      toast({
        title: 'Erreur de connexion',
        description: err.message || 'Impossible de démarrer la conversation vocale',
        variant: 'destructive'
      });
      setVoiceState('idle');
    }
  };

  const sendSetupMessage = (ws: WebSocket, voice: GeminiVoice, systemPrompt: string) => {
    if (isSetupSent.current) return;
    isSetupSent.current = true;

    const routeKnowledge = getRouteKnowledgePrompt();
    const fullPrompt = `${systemPrompt}\n\n${routeKnowledge}`;

    // Gemini BidiGenerateContent setup message
    const setupMessage = {
      setup: {
        model: 'models/gemini-2.0-flash-exp',
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice
              }
            },
            languageCode: 'fr-FR' // French (France) language
          }
        },
        systemInstruction: {
          parts: [{
            text: fullPrompt + '\n\nIMPORTANT: Tu DOIS parler en français de France avec un accent français standard. Utilise une prononciation claire et naturelle.'
          }]
        },
        tools: [
          {
            functionDeclarations: buildGeminiTools()
          }
        ]
      }
    };

    console.log('📤 [GeminiLive] Sending setup message');
    ws.send(JSON.stringify(setupMessage));

    // Start audio recording after setup
    startAudioRecording();
  };

  const startAudioRecording = () => {
    audioRecorderRef.current = new AudioRecorder((base64Audio) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const realtimeInput = {
          realtimeInput: {
            mediaChunks: [{
              mimeType: 'audio/pcm;rate=16000',
              data: base64Audio
            }]
          }
        };
        wsRef.current.send(JSON.stringify(realtimeInput));
      }
    });

    audioRecorderRef.current.start().then(() => {
      setVoiceState('listening');
      console.log('🎙️ [GeminiLive] Audio recording started');

      // Send initial greeting trigger
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          console.log('👋 [GeminiLive] Triggering initial greeting...');
          const textMessage = {
            clientContent: {
              turns: [{
                role: 'user',
                parts: [{ text: 'Bonjour, je suis prêt à vous écouter.' }]
              }],
              turnComplete: true
            }
          };
          wsRef.current.send(JSON.stringify(textMessage));
        }
      }, 500);
    }).catch(err => {
      console.error('❌ [GeminiLive] Failed to start recording:', err);
      toast({
        title: 'Erreur microphone',
        description: 'Impossible d\'accéder au microphone',
        variant: 'destructive'
      });
    });

    // Audio level monitoring
    if (streamRef.current) {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(streamRef.current);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      audioLevelIntervalRef.current = window.setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        setAudioLevel((sum / dataArray.length) / 255);
      }, 100);
    }
  };

  const handleServerMessage = async (event: MessageEvent) => {
    try {
      let data: any;

      // Handle both Blob and string data
      if (event.data instanceof Blob) {
        const text = await event.data.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.warn('⚠️ [GeminiLive] Non-JSON blob data received');
          return;
        }
      } else if (typeof event.data === 'string') {
        try {
          data = JSON.parse(event.data);
        } catch (e) {
          console.warn('⚠️ [GeminiLive] Non-JSON string data received');
          return;
        }
      } else {
        console.warn('⚠️ [GeminiLive] Unknown data type:', typeof event.data);
        return;
      }

      // Skip empty messages
      if (!data || Object.keys(data).length === 0) {
        return;
      }

      console.log('📥 [GeminiLive] Server message:', JSON.stringify(data).substring(0, 200));

      // Handle setup complete
      if (data.setupComplete) {
        console.log('✅ [GeminiLive] Setup complete');
        setVoiceState('listening');
        return;
      }

      // Handle server content (audio response)
      if (data.serverContent) {
        const { modelTurn, turnComplete } = data.serverContent;

        if (modelTurn?.parts) {
          for (const part of modelTurn.parts) {
            // Audio response
            if (part.inlineData?.mimeType?.startsWith('audio/')) {
              console.log('🔊 [GeminiLive] Audio chunk received, mime:', part.inlineData.mimeType);
              setVoiceState('speaking');
              audioPlayerRef.current?.addToQueue(part.inlineData.data);
            }

            // Text response (for logging)
            if (part.text) {
              console.log('💬 [GeminiLive] Text:', part.text);
              setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: part.text,
                timestamp: new Date().toISOString()
              }]);
            }
          }
        }

        if (turnComplete) {
          console.log('✅ [GeminiLive] Turn complete');
          // Wait for audio to finish playing, then go back to listening
          setTimeout(() => {
            if (voiceState !== 'idle') {
              setVoiceState('listening');
            }
          }, 500);
        }
      }

      // Handle tool calls
      if (data.toolCall) {
        console.log('🔧 [GeminiLive] Tool call:', data.toolCall);
        const { functionCalls } = data.toolCall;

        if (functionCalls) {
          for (const fc of functionCalls) {
            const args = fc.args || {};

            if (fc.name === 'stop_conversation') {
              disconnect();
              return;
            }

            if (onToolCall) {
              onToolCall(fc.name, args);
            }

            // Send tool response
            const toolResponse = {
              toolResponse: {
                functionResponses: [{
                  id: fc.id,
                  name: fc.name,
                  response: { success: true }
                }]
              }
            };
            wsRef.current?.send(JSON.stringify(toolResponse));
          }
        }
      }

    } catch (error) {
      console.error('❌ [GeminiLive] Error handling message:', error);
    }
  };

  const sendMessage = (text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ [GeminiLive] WebSocket not connected');
      return;
    }

    const message = {
      clientContent: {
        turns: [{
          role: 'user',
          parts: [{ text }]
        }],
        turnComplete: true
      }
    };

    wsRef.current.send(JSON.stringify(message));
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setVoiceState('thinking');
  };

  const cleanup = () => {
    audioRecorderRef.current?.stop();
    audioRecorderRef.current = null;

    audioPlayerRef.current?.close();
    audioPlayerRef.current = null;

    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
      audioLevelIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setAudioLevel(0);
  };

  const disconnect = useCallback(() => {
    console.log('🔌 [GeminiLive] Disconnecting...');

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    cleanup();
    setVoiceState('idle');
    isSetupSent.current = false;
  }, []);

  const changeVoice = (voice: GeminiVoice) => {
    setCurrentVoice(voice);
    // Note: Gemini doesn't support dynamic voice change mid-session
    // Would need to reconnect
    if (voiceState !== 'idle') {
      toast({
        title: 'Changement de voix',
        description: 'Reconnexion avec la nouvelle voix...'
      });
      disconnect();
      setTimeout(() => connect(voice, currentSystemPrompt), 500);
    }
  };

  const clearSession = () => {
    setMessages([]);
  };

  const toggleConversation = (voice: GeminiVoice = 'Puck') => {
    if (voiceState === 'idle') {
      connect(voice);
    } else {
      disconnect();
    }
  };

  return {
    voiceState,
    isMicrophoneAllowed,
    isConnected: voiceState !== 'idle',
    connect,
    disconnect,
    sendMessage,
    messages,
    audioLevel,
    currentVoice,
    changeVoice,
    clearSession,
    toggleConversation
  };
};
