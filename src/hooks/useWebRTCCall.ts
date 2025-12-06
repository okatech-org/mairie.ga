import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
    CallType,
    CallState,
    CallSession,
    CallParticipant,
    SignalingMessage,
    CallControls,
    ICE_SERVERS,
    getSignalingChannelName
} from '@/types/webrtc-types';
import { toast } from 'sonner';

interface UseWebRTCCallOptions {
    userId: string;
    userName: string;
    userAvatar?: string;
}

interface UseWebRTCCallReturn {
    // State
    callSession: CallSession | null;
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
    controls: CallControls;
    incomingCall: SignalingMessage | null;

    // Actions
    initiateCall: (recipient: CallParticipant, type: CallType) => Promise<void>;
    acceptCall: () => Promise<void>;
    rejectCall: () => void;
    endCall: () => void;
    toggleMute: () => void;
    toggleVideo: () => void;
    toggleSpeaker: () => void;

    // Conference specific
    createConference: (participants: CallParticipant[], type: CallType) => Promise<string>;
    joinConference: (conferenceId: string) => Promise<void>;
    leaveConference: () => void;
}

export function useWebRTCCall({ userId, userName, userAvatar }: UseWebRTCCallOptions): UseWebRTCCallReturn {
    // State
    const [callSession, setCallSession] = useState<CallSession | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const [incomingCall, setIncomingCall] = useState<SignalingMessage | null>(null);
    const [controls, setControls] = useState<CallControls>({
        isMuted: false,
        isVideoOff: false,
        isSpeakerOn: true,
        isScreenSharing: false,
    });

    // Refs
    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    const signalingChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

    // Generate unique call ID
    const generateCallId = () => `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get local media stream
    const getLocalStream = useCallback(async (type: CallType): Promise<MediaStream> => {
        try {
            const constraints: MediaStreamConstraints = {
                audio: true,
                video: type === 'video' ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                } : false,
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setLocalStream(stream);
            return stream;
        } catch (error) {
            console.error('❌ [WebRTC] Failed to get local stream:', error);
            toast.error('Impossible d\'accéder à la caméra/microphone');
            throw error;
        }
    }, []);

    // Create peer connection for a participant
    const createPeerConnection = useCallback((participantId: string): RTCPeerConnection => {
        console.log(`🔗 [WebRTC] Creating peer connection for ${participantId}`);

        const pc = new RTCPeerConnection(ICE_SERVERS);

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && signalingChannel.current) {
                console.log('🧊 [WebRTC] Sending ICE candidate');
                signalingChannel.current.send({
                    type: 'broadcast',
                    event: 'signaling',
                    payload: {
                        type: 'ice-candidate',
                        callId: callSession?.id,
                        from: userId,
                        to: participantId,
                        payload: event.candidate.toJSON(),
                        timestamp: Date.now(),
                    } as SignalingMessage,
                });
            }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log(`📡 [WebRTC] Connection state: ${pc.connectionState}`);
            if (pc.connectionState === 'connected') {
                setCallSession(prev => prev ? { ...prev, state: 'connected' } : null);
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                toast.error('Connexion perdue');
            }
        };

        // Handle incoming tracks
        pc.ontrack = (event) => {
            console.log(`🎥 [WebRTC] Received remote track from ${participantId}`);
            const [remoteStream] = event.streams;
            setRemoteStreams(prev => new Map(prev).set(participantId, remoteStream));
        };

        peerConnections.current.set(participantId, pc);
        return pc;
    }, [callSession, userId]);

    // Add local stream tracks to peer connection
    const addLocalTracks = useCallback((pc: RTCPeerConnection, stream: MediaStream) => {
        stream.getTracks().forEach(track => {
            console.log(`➕ [WebRTC] Adding local track: ${track.kind}`);
            pc.addTrack(track, stream);
        });
    }, []);

    // Setup signaling channel
    const setupSignaling = useCallback((callId: string) => {
        const channelName = getSignalingChannelName(callId);
        console.log(`📡 [WebRTC] Setting up signaling channel: ${channelName}`);

        signalingChannel.current = supabase.channel(channelName, {
            config: { broadcast: { self: false } }
        });

        signalingChannel.current
            .on('broadcast', { event: 'signaling' }, async ({ payload }: { payload: SignalingMessage }) => {
                console.log(`📨 [WebRTC] Received signaling:`, payload.type);

                // Ignore messages from self or not for us
                if (payload.from === userId) return;
                if (payload.to && payload.to !== userId) return;

                switch (payload.type) {
                    case 'call-request':
                        console.log('📞 [WebRTC] Incoming call request');
                        setIncomingCall(payload);
                        break;

                    case 'call-accept':
                        console.log('✅ [WebRTC] Call accepted');
                        setCallSession(prev => prev ? { ...prev, state: 'connected' } : null);
                        break;

                    case 'call-reject':
                        console.log('❌ [WebRTC] Call rejected');
                        toast.info('Appel refusé');
                        endCall();
                        break;

                    case 'call-end':
                        console.log('📴 [WebRTC] Call ended by remote');
                        toast.info('Appel terminé');
                        endCall();
                        break;

                    case 'offer':
                        await handleOffer(payload);
                        break;

                    case 'answer':
                        await handleAnswer(payload);
                        break;

                    case 'ice-candidate':
                        await handleIceCandidate(payload);
                        break;

                    case 'participant-join':
                        console.log('👤 [WebRTC] Participant joined:', payload.from);
                        toast.info(`${payload.payload.name} a rejoint l'appel`);
                        break;

                    case 'participant-leave':
                        console.log('👋 [WebRTC] Participant left:', payload.from);
                        toast.info(`${payload.payload.name} a quitté l'appel`);
                        handleParticipantLeave(payload.from);
                        break;
                }
            })
            .subscribe();
    }, [userId]);

    // Handle incoming offer
    const handleOffer = async (message: SignalingMessage) => {
        console.log('📥 [WebRTC] Handling offer from:', message.from);

        let pc = peerConnections.current.get(message.from);
        if (!pc) {
            pc = createPeerConnection(message.from);
        }

        // Add local stream if available
        if (localStream) {
            addLocalTracks(pc, localStream);
        }

        await pc.setRemoteDescription(new RTCSessionDescription(message.payload));

        // Apply pending ICE candidates
        const pending = pendingCandidates.current.get(message.from) || [];
        for (const candidate of pending) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidates.current.delete(message.from);

        // Create and send answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        signalingChannel.current?.send({
            type: 'broadcast',
            event: 'signaling',
            payload: {
                type: 'answer',
                callId: callSession?.id,
                from: userId,
                to: message.from,
                payload: answer,
                timestamp: Date.now(),
            } as SignalingMessage,
        });
    };

    // Handle incoming answer
    const handleAnswer = async (message: SignalingMessage) => {
        console.log('📥 [WebRTC] Handling answer from:', message.from);

        const pc = peerConnections.current.get(message.from);
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
        }
    };

    // Handle incoming ICE candidate
    const handleIceCandidate = async (message: SignalingMessage) => {
        console.log('🧊 [WebRTC] Handling ICE candidate from:', message.from);

        const pc = peerConnections.current.get(message.from);
        if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(message.payload));
        } else {
            // Queue candidate if peer connection not ready
            const pending = pendingCandidates.current.get(message.from) || [];
            pending.push(message.payload);
            pendingCandidates.current.set(message.from, pending);
        }
    };

    // Handle participant leaving
    const handleParticipantLeave = (participantId: string) => {
        const pc = peerConnections.current.get(participantId);
        if (pc) {
            pc.close();
            peerConnections.current.delete(participantId);
        }
        setRemoteStreams(prev => {
            const updated = new Map(prev);
            updated.delete(participantId);
            return updated;
        });
        setCallSession(prev => {
            if (!prev) return null;
            return {
                ...prev,
                participants: prev.participants.filter(p => p.id !== participantId),
            };
        });
    };

    // Initiate a call
    const initiateCall = useCallback(async (recipient: CallParticipant, type: CallType) => {
        console.log(`📞 [WebRTC] Initiating ${type} call to:`, recipient.name);

        const callId = generateCallId();
        const stream = await getLocalStream(type);

        setCallSession({
            id: callId,
            type,
            state: 'calling',
            initiator: userId,
            participants: [
                { id: userId, name: userName, avatar: userAvatar, isMuted: false, isVideoOff: false, stream },
                recipient,
            ],
            startedAt: new Date(),
            isConference: false,
        });

        setupSignaling(callId);

        // Wait for channel to be ready
        await new Promise(resolve => setTimeout(resolve, 500));

        // Send call request
        signalingChannel.current?.send({
            type: 'broadcast',
            event: 'signaling',
            payload: {
                type: 'call-request',
                callId,
                from: userId,
                to: recipient.id,
                payload: { callerName: userName, callerAvatar: userAvatar, callType: type },
                timestamp: Date.now(),
            } as SignalingMessage,
        });

        // Create peer connection and offer
        const pc = createPeerConnection(recipient.id);
        addLocalTracks(pc, stream);

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        signalingChannel.current?.send({
            type: 'broadcast',
            event: 'signaling',
            payload: {
                type: 'offer',
                callId,
                from: userId,
                to: recipient.id,
                payload: offer,
                timestamp: Date.now(),
            } as SignalingMessage,
        });

        toast.info(`Appel ${type} en cours vers ${recipient.name}...`);
    }, [userId, userName, userAvatar, getLocalStream, setupSignaling, createPeerConnection, addLocalTracks]);

    // Accept incoming call
    const acceptCall = useCallback(async () => {
        if (!incomingCall) return;

        console.log('✅ [WebRTC] Accepting call');

        const type = incomingCall.payload.callType as CallType;
        const stream = await getLocalStream(type);

        setCallSession({
            id: incomingCall.callId,
            type,
            state: 'connected',
            initiator: incomingCall.from,
            participants: [
                { id: userId, name: userName, avatar: userAvatar, isMuted: false, isVideoOff: false, stream },
                { id: incomingCall.from, name: incomingCall.payload.callerName, avatar: incomingCall.payload.callerAvatar, isMuted: false, isVideoOff: false },
            ],
            startedAt: new Date(),
            isConference: false,
        });

        setupSignaling(incomingCall.callId);

        // Wait for channel
        await new Promise(resolve => setTimeout(resolve, 500));

        signalingChannel.current?.send({
            type: 'broadcast',
            event: 'signaling',
            payload: {
                type: 'call-accept',
                callId: incomingCall.callId,
                from: userId,
                to: incomingCall.from,
                payload: {},
                timestamp: Date.now(),
            } as SignalingMessage,
        });

        setIncomingCall(null);
        toast.success('Appel connecté');
    }, [incomingCall, userId, userName, userAvatar, getLocalStream, setupSignaling]);

    // Reject incoming call
    const rejectCall = useCallback(() => {
        if (!incomingCall) return;

        console.log('❌ [WebRTC] Rejecting call');

        setupSignaling(incomingCall.callId);

        setTimeout(() => {
            signalingChannel.current?.send({
                type: 'broadcast',
                event: 'signaling',
                payload: {
                    type: 'call-reject',
                    callId: incomingCall.callId,
                    from: userId,
                    to: incomingCall.from,
                    payload: { reason: 'declined' },
                    timestamp: Date.now(),
                } as SignalingMessage,
            });

            signalingChannel.current?.unsubscribe();
            signalingChannel.current = null;
        }, 300);

        setIncomingCall(null);
    }, [incomingCall, userId, setupSignaling]);

    // End call
    const endCall = useCallback(() => {
        console.log('📴 [WebRTC] Ending call');

        // Notify other participants
        if (signalingChannel.current && callSession) {
            signalingChannel.current.send({
                type: 'broadcast',
                event: 'signaling',
                payload: {
                    type: 'call-end',
                    callId: callSession.id,
                    from: userId,
                    payload: {},
                    timestamp: Date.now(),
                } as SignalingMessage,
            });
        }

        // Stop local stream
        localStream?.getTracks().forEach(track => track.stop());
        setLocalStream(null);

        // Close all peer connections
        peerConnections.current.forEach(pc => pc.close());
        peerConnections.current.clear();

        // Clear remote streams
        setRemoteStreams(new Map());

        // Unsubscribe from signaling
        signalingChannel.current?.unsubscribe();
        signalingChannel.current = null;

        // Reset state
        setCallSession(prev => prev ? { ...prev, state: 'ended', endedAt: new Date() } : null);
        setTimeout(() => setCallSession(null), 1000);
    }, [callSession, localStream, userId]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setControls(prev => ({ ...prev, isMuted: !audioTrack.enabled }));
            }
        }
    }, [localStream]);

    // Toggle video
    const toggleVideo = useCallback(() => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setControls(prev => ({ ...prev, isVideoOff: !videoTrack.enabled }));
            }
        }
    }, [localStream]);

    // Toggle speaker
    const toggleSpeaker = useCallback(() => {
        setControls(prev => ({ ...prev, isSpeakerOn: !prev.isSpeakerOn }));
        // Note: Speaker control requires setSinkId which has limited support
    }, []);

    // Conference: Create
    const createConference = useCallback(async (participants: CallParticipant[], type: CallType): Promise<string> => {
        console.log('🎥 [WebRTC] Creating conference with participants:', participants.map(p => p.name));

        const callId = generateCallId();
        const stream = await getLocalStream(type);

        setCallSession({
            id: callId,
            type,
            state: 'connected',
            initiator: userId,
            participants: [
                { id: userId, name: userName, avatar: userAvatar, isMuted: false, isVideoOff: false, stream },
                ...participants,
            ],
            startedAt: new Date(),
            isConference: true,
        });

        setupSignaling(callId);

        // Wait for channel
        await new Promise(resolve => setTimeout(resolve, 500));

        // Send call request to each participant
        for (const participant of participants) {
            signalingChannel.current?.send({
                type: 'broadcast',
                event: 'signaling',
                payload: {
                    type: 'call-request',
                    callId,
                    from: userId,
                    to: participant.id,
                    payload: { callerName: userName, callerAvatar: userAvatar, callType: type, isConference: true },
                    timestamp: Date.now(),
                } as SignalingMessage,
            });

            // Create peer connection for each
            const pc = createPeerConnection(participant.id);
            addLocalTracks(pc, stream);

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            signalingChannel.current?.send({
                type: 'broadcast',
                event: 'signaling',
                payload: {
                    type: 'offer',
                    callId,
                    from: userId,
                    to: participant.id,
                    payload: offer,
                    timestamp: Date.now(),
                } as SignalingMessage,
            });
        }

        toast.success(`Conférence créée avec ${participants.length} participants`);
        return callId;
    }, [userId, userName, userAvatar, getLocalStream, setupSignaling, createPeerConnection, addLocalTracks]);

    // Conference: Join
    const joinConference = useCallback(async (conferenceId: string) => {
        console.log('🎥 [WebRTC] Joining conference:', conferenceId);
        // Similar to acceptCall but for conferences
        // The offer will be sent by existing participants
        setupSignaling(conferenceId);

        toast.info('Connexion à la conférence...');
    }, [setupSignaling]);

    // Conference: Leave
    const leaveConference = useCallback(() => {
        if (!callSession?.isConference) return;

        console.log('👋 [WebRTC] Leaving conference');

        signalingChannel.current?.send({
            type: 'broadcast',
            event: 'signaling',
            payload: {
                type: 'participant-leave',
                callId: callSession.id,
                from: userId,
                payload: { name: userName },
                timestamp: Date.now(),
            } as SignalingMessage,
        });

        endCall();
    }, [callSession, userId, userName, endCall]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            endCall();
        };
    }, []);

    return {
        callSession,
        localStream,
        remoteStreams,
        controls,
        incomingCall,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleSpeaker,
        createConference,
        joinConference,
        leaveConference,
    };
}
