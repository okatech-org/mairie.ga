// WebRTC Types for Audio/Video Calls

export type CallType = 'audio' | 'video';
export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'failed';

export interface CallParticipant {
    id: string;
    name: string;
    avatar?: string;
    isMuted: boolean;
    isVideoOff: boolean;
    stream?: MediaStream;
}

export interface CallSession {
    id: string;
    type: CallType;
    state: CallState;
    initiator: string;
    participants: CallParticipant[];
    startedAt?: Date;
    endedAt?: Date;
    isConference: boolean;
}

export interface SignalingMessage {
    type: 'offer' | 'answer' | 'ice-candidate' | 'call-request' | 'call-accept' | 'call-reject' | 'call-end' | 'participant-join' | 'participant-leave';
    callId: string;
    from: string;
    to?: string; // Optional for broadcasts
    payload: any;
    timestamp: number;
}

export interface CallControls {
    isMuted: boolean;
    isVideoOff: boolean;
    isSpeakerOn: boolean;
    isScreenSharing: boolean;
}

// ICE Server configuration (STUN only)
export const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
    ],
    iceCandidatePoolSize: 10,
};

// Supabase Realtime channel names
export const SIGNALING_CHANNEL_PREFIX = 'webrtc-call-';

export const getSignalingChannelName = (callId: string) =>
    `${SIGNALING_CHANNEL_PREFIX}${callId}`;
