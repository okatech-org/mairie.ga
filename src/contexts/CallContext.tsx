import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useWebRTCCall } from '@/hooks/useWebRTCCall';
import { CallOverlay } from '@/components/call/CallOverlay';
import { IncomingCallModal } from '@/components/call/IncomingCallModal';
import { CallParticipant, CallType } from '@/types/webrtc-types';
import { useDemo } from '@/contexts/DemoContext';

interface CallContextValue {
    initiateCall: (recipient: CallParticipant, type: CallType) => Promise<void>;
    createConference: (participants: CallParticipant[], type: CallType) => Promise<string>;
    joinConference: (conferenceId: string) => Promise<void>;
    endCall: () => void;
    isInCall: boolean;
}

const CallContext = createContext<CallContextValue | null>(null);

export function useCall() {
    const context = useContext(CallContext);
    if (!context) {
        throw new Error('useCall must be used within a CallProvider');
    }
    return context;
}

interface CallProviderProps {
    children: ReactNode;
}

export function CallProvider({ children }: CallProviderProps) {
    const { currentUser } = useDemo();

    // Default user if not logged in (for demo purposes)
    const userId = currentUser?.id || `anonymous_${Date.now()}`;
    const userName = currentUser?.name || 'Utilisateur Anonyme';
    const userAvatar = undefined; // DemoUser doesn't have avatar

    const webrtc = useWebRTCCall({
        userId,
        userName,
        userAvatar,
    });

    // Listen for iAsted events
    useEffect(() => {
        const handleStartCall = async (event: CustomEvent<{ recipient: string; video: boolean }>) => {
            console.log('📞 [CallProvider] iAsted start_call event:', event.detail);

            // Create a mock participant from the recipient name
            // In a real app, you'd look up the user by name/ID
            const recipient: CallParticipant = {
                id: `user_${event.detail.recipient.toLowerCase().replace(/\s+/g, '_')}`,
                name: event.detail.recipient,
                isMuted: false,
                isVideoOff: false,
            };

            await webrtc.initiateCall(recipient, event.detail.video ? 'video' : 'audio');
        };

        const handleEndCall = () => {
            console.log('📞 [CallProvider] iAsted end_call event');
            webrtc.endCall();
        };

        const handleScheduleMeeting = (event: CustomEvent<{ subject: string; time: string; participants: string[] }>) => {
            console.log('📅 [CallProvider] iAsted schedule_meeting event:', event.detail);
            // For now, we'll create a conference immediately
            // In a real app, you'd schedule it for later
            const participants: CallParticipant[] = (event.detail.participants || []).map((name, idx) => ({
                id: `participant_${idx}_${Date.now()}`,
                name,
                isMuted: false,
                isVideoOff: false,
            }));

            if (participants.length > 0) {
                webrtc.createConference(participants, 'video');
            }
        };

        const handleJoinMeeting = (event: CustomEvent<{ subject: string }>) => {
            console.log('📅 [CallProvider] iAsted join_meeting event:', event.detail);
            // In a real app, you'd look up the meeting by subject
            // For demo, we'll just log it
        };

        window.addEventListener('iasted-start-call', handleStartCall as EventListener);
        window.addEventListener('iasted-end-call', handleEndCall);
        window.addEventListener('iasted-schedule-meeting', handleScheduleMeeting as EventListener);
        window.addEventListener('iasted-join-meeting', handleJoinMeeting as EventListener);

        return () => {
            window.removeEventListener('iasted-start-call', handleStartCall as EventListener);
            window.removeEventListener('iasted-end-call', handleEndCall);
            window.removeEventListener('iasted-schedule-meeting', handleScheduleMeeting as EventListener);
            window.removeEventListener('iasted-join-meeting', handleJoinMeeting as EventListener);
        };
    }, [webrtc]);

    const contextValue: CallContextValue = {
        initiateCall: webrtc.initiateCall,
        createConference: webrtc.createConference,
        joinConference: webrtc.joinConference,
        endCall: webrtc.endCall,
        isInCall: !!webrtc.callSession && webrtc.callSession.state !== 'ended',
    };

    return (
        <CallContext.Provider value={contextValue}>
            {children}

            {/* Incoming Call Modal */}
            {webrtc.incomingCall && (
                <IncomingCallModal
                    call={webrtc.incomingCall}
                    onAccept={webrtc.acceptCall}
                    onReject={webrtc.rejectCall}
                />
            )}

            {/* Active Call Overlay */}
            {webrtc.callSession && webrtc.callSession.state !== 'ended' && (
                <CallOverlay
                    session={webrtc.callSession}
                    localStream={webrtc.localStream}
                    remoteStreams={webrtc.remoteStreams}
                    controls={webrtc.controls}
                    onToggleMute={webrtc.toggleMute}
                    onToggleVideo={webrtc.toggleVideo}
                    onToggleSpeaker={webrtc.toggleSpeaker}
                    onEndCall={webrtc.callSession.isConference ? webrtc.leaveConference : webrtc.endCall}
                />
            )}
        </CallContext.Provider>
    );
}
