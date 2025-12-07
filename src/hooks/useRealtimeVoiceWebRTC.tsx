
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { IASTED_SYSTEM_PROMPT } from '@/config/iasted-config';
import { getRouteKnowledgePrompt, resolveRoute } from '@/utils/route-mapping';
import { useLocation, useNavigate } from 'react-router-dom';

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking';

export interface UseRealtimeVoiceWebRTC {
    voiceState: VoiceState;
    isMicrophoneAllowed: boolean;
    isConnected: boolean;
    connect: (voice?: 'echo' | 'ash' | 'shimmer', systemPrompt?: string) => Promise<void>;
    disconnect: () => void;
    sendMessage: (text: string) => void;
    messages: any[];
    audioLevel: number;
    currentVoice: 'echo' | 'ash' | 'shimmer';
    changeVoice: (voice: 'echo' | 'ash' | 'shimmer') => void;
    clearSession: () => void;
    toggleConversation: (voice?: 'echo' | 'ash' | 'shimmer') => void;
    setSpeechRate: (rate: number) => void;
}

export const useRealtimeVoiceWebRTC = (onToolCall?: (name: string, args: any) => void): UseRealtimeVoiceWebRTC => {
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const [isMicrophoneAllowed, setIsMicrophoneAllowed] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [audioLevel, setAudioLevel] = useState(0);
    const [currentVoice, setCurrentVoice] = useState<'echo' | 'ash' | 'shimmer'>('echo');
    const [currentSystemPrompt, setCurrentSystemPrompt] = useState<string>(IASTED_SYSTEM_PROMPT);

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const dataChannel = useRef<RTCDataChannel | null>(null);
    const audioContext = useRef<AudioContext | null>(null);
    const analyser = useRef<AnalyserNode | null>(null);
    const animationFrame = useRef<number | null>(null);
    const { toast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
            if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
            if (audioContext.current) audioContext.current.close();
        };
    }, []);

    // Audio Level Analysis
    const analyzeAudio = () => {
        if (!analyser.current) return;
        const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
        analyser.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        setAudioLevel(average / 255); // Normalize 0-1

        animationFrame.current = requestAnimationFrame(analyzeAudio);
    };

    const connect = async (voice: 'echo' | 'ash' | 'shimmer' = 'echo', systemPrompt: string = IASTED_SYSTEM_PROMPT) => {
        try {
            if (voice) setCurrentVoice(voice);
            if (systemPrompt) setCurrentSystemPrompt(systemPrompt);

            setVoiceState('connecting');

            // 1. Get Ephemeral Token from edge function (direct HTTP call to avoid mocked client)
            console.log('🔑 Requesting ephemeral token...');
            const FUNCTION_URL =
                'https://csmegxwehniyfvbbjqbz.functions.supabase.co/functions/v1/get-realtime-token';

            const tokenResponse = await fetch(FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            });

            if (!tokenResponse.ok) {
                const errorText = await tokenResponse.text();
                console.error('❌ Token HTTP error:', tokenResponse.status, errorText);
                throw new Error('Erreur lors de la récupération du token: ' + tokenResponse.status);
            }

            const data = await tokenResponse.json();

            if (!data?.client_secret?.value) {
                console.error('❌ Invalid token response:', data);
                throw new Error('Token invalide reçu du serveur.');
            }

            const EPHEMERAL_KEY = data.client_secret.value;
            console.log('✅ Ephemeral token obtained');

            // 2. Setup WebRTC
            const pc = new RTCPeerConnection();
            peerConnection.current = pc;

            // Audio Element for output
            const audioEl = document.createElement('audio');
            audioEl.autoplay = true;
            pc.ontrack = (e) => {
                audioEl.srcObject = e.streams[0];
            };

            // Data Channel
            const dc = pc.createDataChannel('oai-events');
            dataChannel.current = dc;

            dc.onopen = () => {
                console.log('Data Channel Open');
                setVoiceState('listening');
                updateSession(voice, systemPrompt); // Send initial config

                // Trigger iAsted to speak first (auto-greeting)
                setTimeout(() => {
                    if (dc.readyState === 'open') {
                        console.log('🎙️ Triggering auto-greeting...');
                        dc.send(JSON.stringify({ type: 'response.create' }));
                    }
                }, 500);
            };

            dc.onmessage = (e) => {
                const event = JSON.parse(e.data);
                handleServerEvent(event);
            };

            // 3. Microphone Input
            const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
            setIsMicrophoneAllowed(true);
            pc.addTrack(ms.getTracks()[0]);

            // Audio Analysis Setup
            audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContext.current.createMediaStreamSource(ms);
            analyser.current = audioContext.current.createAnalyser();
            analyser.current.fftSize = 256;
            source.connect(analyser.current);
            analyzeAudio();

            // 4. Create and send WebRTC Offer
            console.log('📡 Creating WebRTC offer...');
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // 5. Exchange SDP with OpenAI
            const baseUrl = 'https://api.openai.com/v1/realtime';
            const model = 'gpt-4o-realtime-preview-2024-12-17';
            console.log(`📡 Connecting to OpenAI Realtime API: ${baseUrl}?model=${model}`);

            const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
                method: 'POST',
                body: offer.sdp,
                headers: {
                    Authorization: `Bearer ${EPHEMERAL_KEY}`,
                    'Content-Type': 'application/sdp',
                },
            });

            if (!sdpResponse.ok) {
                const errorText = await sdpResponse.text();
                console.error('❌ SDP Exchange failed:', sdpResponse.status, errorText);
                throw new Error(`Erreur de connexion WebRTC: ${sdpResponse.status}`);
            }

            const answerSdp = await sdpResponse.text();
            console.log('✅ Received SDP answer from OpenAI');

            const answer = {
                type: 'answer' as RTCSdpType,
                sdp: answerSdp,
            };
            await pc.setRemoteDescription(answer);
            console.log('✅ WebRTC connection established');

        } catch (err: any) {
            console.error('Connection failed:', err);
            toast({
                title: "Erreur de connexion",
                description: err.message,
                variant: "destructive"
            });
            setVoiceState('idle');
        }
    };

    const updateSession = (voice: 'echo' | 'ash' | 'shimmer' = currentVoice, systemPrompt: string = currentSystemPrompt) => {
        if (!dataChannel.current || dataChannel.current.readyState !== 'open') return;

        const routeKnowledge = getRouteKnowledgePrompt();
        const fullSystemPrompt = `${systemPrompt}\n\n${routeKnowledge}`;

        const event = {
            type: 'session.update',
            session: {
                modalities: ['text', 'audio'],
                voice: voice,
                instructions: fullSystemPrompt,
                input_audio_transcription: {
                    model: 'whisper-1',
                },
                tools: [
                    {
                        type: 'function',
                        name: 'change_voice',
                        description: 'Changer la voix de l\'assistant (homme/femme)',
                        parameters: { type: 'object', properties: {} }
                    },
                    {
                        type: 'function',
                        name: 'navigate_app',
                        description: 'Naviguer vers une page de l\'application',
                        parameters: {
                            type: 'object',
                            properties: {
                                path: { type: 'string', description: 'Le chemin de la route (ex: /register, /register/gabonais, /login)' }
                            },
                            required: ['path']
                        }
                    },
                    {
                        type: 'function',
                        name: 'control_ui',
                        description: 'Contrôler l\'interface utilisateur (thème, sidebar)',
                        parameters: {
                            type: 'object',
                            properties: {
                                action: {
                                    type: 'string',
                                    enum: ['set_theme_dark', 'set_theme_light', 'toggle_theme', 'toggle_sidebar', 'set_speech_rate']
                                },
                                value: { type: 'string', description: 'Valeur optionnelle (ex: vitesse)' }
                            },
                            required: ['action']
                        }
                    },
                    {
                        type: 'function',
                        name: 'fill_form_field',
                        description: 'Remplir un champ du formulaire d\'inscription. Utilise cette fonction quand l\'utilisateur te donne une information pour son inscription.',
                        parameters: {
                            type: 'object',
                            properties: {
                                field: {
                                    type: 'string',
                                    enum: [
                                        'firstName', 'lastName', 'dateOfBirth', 'placeOfBirth',
                                        'maritalStatus', 'fatherName', 'motherName',
                                        'address', 'city', 'postalCode',
                                        'emergencyContactName', 'emergencyContactPhone',
                                        'professionalStatus', 'employer', 'profession',
                                        'email', 'phone'
                                    ],
                                    description: 'Le nom du champ à remplir'
                                },
                                value: { type: 'string', description: 'La valeur à mettre dans le champ' }
                            },
                            required: ['field', 'value']
                        }
                    },
                    {
                        type: 'function',
                        name: 'select_citizen_type',
                        description: 'Sélectionner le type de citoyen pour l\'inscription (gabonais ou étranger)',
                        parameters: {
                            type: 'object',
                            properties: {
                                type: {
                                    type: 'string',
                                    enum: ['gabonais', 'etranger'],
                                    description: 'Type de citoyen: gabonais ou étranger'
                                }
                            },
                            required: ['type']
                        }
                    },
                    {
                        type: 'function',
                        name: 'navigate_form_step',
                        description: 'Naviguer vers une étape spécifique du formulaire d\'inscription',
                        parameters: {
                            type: 'object',
                            properties: {
                                step: {
                                    type: 'number',
                                    description: 'Numéro de l\'étape (1-6 pour gabonais: Documents, Infos Base, Famille, Contacts, Profession, Révision)'
                                },
                                direction: {
                                    type: 'string',
                                    enum: ['next', 'previous', 'goto'],
                                    description: 'Direction de navigation'
                                }
                            },
                            required: ['direction']
                        }
                    },
                    {
                        type: 'function',
                        name: 'get_form_status',
                        description: 'Obtenir le statut actuel du formulaire (étape courante, champs remplis)',
                        parameters: { type: 'object', properties: {} }
                    },
                    {
                        type: 'function',
                        name: 'submit_form',
                        description: 'Soumettre le formulaire d\'inscription une fois complété',
                        parameters: { type: 'object', properties: {} }
                    },
                    {
                        type: 'function',
                        name: 'generate_document',
                        description: 'Générer un document officiel',
                        parameters: {
                            type: 'object',
                            properties: {
                                type: { type: 'string' },
                                recipient: { type: 'string' },
                                subject: { type: 'string' },
                                format: { type: 'string', enum: ['pdf', 'docx'] }
                            },
                            required: ['type', 'subject']
                        }
                    },
                    {
                        type: 'function',
                        name: 'stop_conversation',
                        description: 'Arrêter la conversation vocale',
                        parameters: { type: 'object', properties: {} }
                    },
                    {
                        type: 'function',
                        name: 'request_consular_service',
                        description: 'Initier une demande de service municipal',
                        parameters: {
                            type: 'object',
                            properties: {
                                service_type: {
                                    type: 'string',
                                    description: 'Type de service demandé'
                                },
                                urgency: {
                                    type: 'string',
                                    enum: ['normal', 'urgent'],
                                    description: 'Niveau d\'urgence'
                                }
                            },
                            required: ['service_type']
                        }
                    },
                    {
                        type: 'function',
                        name: 'schedule_appointment',
                        description: 'Prendre un rendez-vous à la mairie',
                        parameters: {
                            type: 'object',
                            properties: {
                                service_type: { type: 'string' },
                                preferred_date: { type: 'string' }
                            }
                        }
                    },
                    {
                        type: 'function',
                        name: 'get_service_info',
                        description: 'Obtenir des informations sur un service municipal',
                        parameters: {
                            type: 'object',
                            properties: {
                                service_type: { type: 'string' }
                            },
                            required: ['service_type']
                        }
                    },
                    // ============= CORRESPONDANCE TOOLS (Maire, Adjoint, SG) =============
                    {
                        type: 'function',
                        name: 'read_correspondence',
                        description: 'Lire à haute voix le contenu d\'un dossier de correspondance officielle. Réservé au Maire, Adjoint, et Secrétaire Général.',
                        parameters: {
                            type: 'object',
                            properties: {
                                folder_id: { type: 'string', description: 'ID du dossier de correspondance à lire' }
                            },
                            required: ['folder_id']
                        }
                    },
                    {
                        type: 'function',
                        name: 'file_correspondence',
                        description: 'Classer un dossier de correspondance dans "Mes Documents". Réservé au Maire, Adjoint, et Secrétaire Général.',
                        parameters: {
                            type: 'object',
                            properties: {
                                folder_id: { type: 'string', description: 'ID du dossier à classer' }
                            },
                            required: ['folder_id']
                        }
                    },
                    {
                        type: 'function',
                        name: 'create_correspondence',
                        description: 'Créer un courrier officiel en PDF. Réservé au Maire, Adjoint, et Secrétaire Général.',
                        parameters: {
                            type: 'object',
                            properties: {
                                recipient: { type: 'string', description: 'Nom du destinataire' },
                                recipient_org: { type: 'string', description: 'Organisation du destinataire' },
                                recipient_email: { type: 'string', description: 'Email du destinataire (optionnel)' },
                                subject: { type: 'string', description: 'Objet du courrier' },
                                content_points: { type: 'array', items: { type: 'string' }, description: 'Points clés du contenu' },
                                template: { type: 'string', description: 'Template à utiliser (défaut: courrier)' }
                            },
                            required: ['recipient', 'recipient_org', 'subject', 'content_points']
                        }
                    },
                    {
                        type: 'function',
                        name: 'send_correspondence',
                        description: 'Envoyer une correspondance par email. Réservé au Maire, Adjoint, et Secrétaire Général.',
                        parameters: {
                            type: 'object',
                            properties: {
                                recipient_email: { type: 'string', description: 'Email du destinataire' },
                                subject: { type: 'string', description: 'Objet de l\'email' },
                                body: { type: 'string', description: 'Corps du message' },
                                document_id: { type: 'string', description: 'ID du document à joindre' }
                            },
                            required: ['recipient_email']
                        }
                    }
                ]
            }
        };
        dataChannel.current.send(JSON.stringify(event));
    };

    const handleServerEvent = (event: any) => {
        switch (event.type) {
            case 'response.audio.delta':
                setVoiceState('speaking');
                break;
            case 'input_audio_buffer.speech_started':
                setVoiceState('listening'); // Actually user speaking
                break;
            case 'response.done':
                setVoiceState('listening'); // Back to listening after response
                if (event.response?.output) {
                    event.response.output.forEach((item: any) => {
                        if (item.type === 'function_call') {
                            handleToolCall(item);
                        }
                    });
                }
                break;
            case 'conversation.item.created':
                if (event.item?.role === 'assistant' && event.item?.content?.[0]?.text) {
                    setMessages(prev => [...prev, { role: 'assistant', content: event.item.content[0].text }]);
                }
                break;
            default:
                break;
        }
    };

    const handleToolCall = async (item: any) => {
        const { name, arguments: argsString } = item;
        const args = JSON.parse(argsString);

        console.log(`🔧 Tool Call: ${name}`, args);

        if (name === 'stop_conversation') {
            disconnect();
            return;
        }

        if (name === 'change_voice') {
            const nextVoice = currentVoice === 'shimmer' ? 'ash' : 'shimmer';
            changeVoice(nextVoice);
            // Send output to acknowledge?
        }

        if (onToolCall) {
            onToolCall(name, args);
        }

        // We should send tool output back to OpenAI if needed, 
        // but for now we just execute the side effect.
        // Ideally: send 'conversation.item.create' with type 'function_call_output'
    };

    const sendMessage = (text: string) => {
        if (!dataChannel.current) return;
        const event = {
            type: 'conversation.item.create',
            item: {
                type: 'message',
                role: 'user',
                content: [{ type: 'input_text', text }]
            }
        };
        dataChannel.current.send(JSON.stringify(event));
        dataChannel.current.send(JSON.stringify({ type: 'response.create' }));
        setMessages(prev => [...prev, { role: 'user', content: text }]);
    };

    const disconnect = () => {
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (dataChannel.current) {
            dataChannel.current.close();
            dataChannel.current = null;
        }
        setVoiceState('idle');
    };

    const changeVoice = (voice: 'echo' | 'ash' | 'shimmer') => {
        setCurrentVoice(voice);
        // If connected, update session
        if (voiceState !== 'idle') {
            // We need to trigger session update, but state update is async.
            // For now, we rely on next render or manual trigger if needed.
            // Actually, let's force update in a timeout to ensure state is set
            setTimeout(() => updateSession(voice), 100);
        }
    };

    const clearSession = () => {
        setMessages([]);
        // Potentially clear server context if API allows
    };

    const toggleConversation = (voice: 'echo' | 'ash' | 'shimmer' = 'echo') => {
        if (voiceState === 'idle') {
            connect(voice);
        } else {
            disconnect();
        }
    };

    const setSpeechRate = (rate: number) => {
        // Not directly supported by Realtime API session update yet in this simple implementation
        // But we could store it or send it as instruction update
        console.log('Setting speech rate to', rate);
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
        toggleConversation,
        setSpeechRate
    };
};
