import React, { useRef, useEffect } from 'react';
import { X, Mic, MicOff, Video, VideoOff, PhoneOff, Users, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CallSession, CallControls } from '@/types/webrtc-types';
import { cn } from '@/lib/utils';

interface CallOverlayProps {
    session: CallSession;
    localStream: MediaStream | null;
    remoteStreams: Map<string, MediaStream>;
    controls: CallControls;
    onToggleMute: () => void;
    onToggleVideo: () => void;
    onToggleSpeaker: () => void;
    onEndCall: () => void;
}

export function CallOverlay({
    session,
    localStream,
    remoteStreams,
    controls,
    onToggleMute,
    onToggleVideo,
    onToggleSpeaker,
    onEndCall,
}: CallOverlayProps) {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

    // Set local video stream
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Set remote video streams
    useEffect(() => {
        remoteStreams.forEach((stream, participantId) => {
            const videoEl = remoteVideoRefs.current.get(participantId);
            if (videoEl && videoEl.srcObject !== stream) {
                videoEl.srcObject = stream;
            }
        });
    }, [remoteStreams]);

    const formatDuration = (start?: Date) => {
        if (!start) return '00:00';
        const seconds = Math.floor((Date.now() - start.getTime()) / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const participantCount = session.participants.length;
    const isVideoCall = session.type === 'video';

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 text-white">
                <div className="flex items-center gap-3">
                    {session.isConference && (
                        <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">{participantCount}</span>
                        </div>
                    )}
                    <div>
                        <h2 className="font-semibold">
                            {session.isConference
                                ? 'Conférence'
                                : session.participants.find(p => p.id !== session.initiator)?.name || 'Appel'}
                        </h2>
                        <p className="text-xs text-white/60">
                            {session.state === 'calling' ? 'Appel en cours...' :
                                session.state === 'ringing' ? 'Sonnerie...' :
                                    session.state === 'connected' ? formatDuration(session.startedAt) :
                                        'Déconnecté'}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10"
                    onClick={onEndCall}
                >
                    <X className="w-5 h-5" />
                </Button>
            </div>

            {/* Video Grid */}
            <div className="flex-1 relative overflow-hidden">
                {isVideoCall ? (
                    <>
                        {/* Remote Videos */}
                        <div className={cn(
                            "h-full w-full grid gap-2 p-4",
                            remoteStreams.size === 1 ? "grid-cols-1" :
                                remoteStreams.size === 2 ? "grid-cols-2" :
                                    remoteStreams.size <= 4 ? "grid-cols-2 grid-rows-2" :
                                        "grid-cols-3 grid-rows-2"
                        )}>
                            {Array.from(remoteStreams.entries()).map(([participantId]) => {
                                const participant = session.participants.find(p => p.id === participantId);
                                return (
                                    <div key={participantId} className="relative rounded-2xl overflow-hidden bg-gray-900">
                                        <video
                                            ref={(el) => {
                                                if (el) remoteVideoRefs.current.set(participantId, el);
                                            }}
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs">
                                            {participant?.name || 'Participant'}
                                        </div>
                                    </div>
                                );
                            })}
                            {remoteStreams.size === 0 && (
                                <div className="flex items-center justify-center text-white/40">
                                    <div className="text-center">
                                        <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                        <p>En attente des participants...</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Local Video (Picture-in-Picture) */}
                        <div className="absolute bottom-24 right-4 w-32 h-48 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className={cn(
                                    "w-full h-full object-cover",
                                    controls.isVideoOff && "opacity-0"
                                )}
                            />
                            {controls.isVideoOff && (
                                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                                    <VideoOff className="w-8 h-8 text-white/50" />
                                </div>
                            )}
                            <div className="absolute bottom-1 left-1 bg-black/50 px-1.5 py-0.5 rounded text-white text-[10px]">
                                Vous
                            </div>
                        </div>
                    </>
                ) : (
                    /* Audio Call UI */
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-white">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/60 mx-auto mb-6 flex items-center justify-center text-4xl font-bold shadow-2xl animate-pulse">
                                {session.participants.find(p => p.id !== session.initiator)?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <h2 className="text-2xl font-bold mb-2">
                                {session.participants.find(p => p.id !== session.initiator)?.name || 'Appel Audio'}
                            </h2>
                            <p className="text-white/60">
                                {session.state === 'calling' ? 'Appel en cours...' :
                                    session.state === 'ringing' ? 'Sonnerie...' :
                                        session.state === 'connected' ? formatDuration(session.startedAt) :
                                            'Déconnecté'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="p-6 flex justify-center gap-4">
                <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                        "rounded-full w-14 h-14 border-2",
                        controls.isMuted
                            ? "bg-red-500 border-red-500 text-white hover:bg-red-600"
                            : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                    )}
                    onClick={onToggleMute}
                >
                    {controls.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </Button>

                {isVideoCall && (
                    <Button
                        variant="outline"
                        size="lg"
                        className={cn(
                            "rounded-full w-14 h-14 border-2",
                            controls.isVideoOff
                                ? "bg-red-500 border-red-500 text-white hover:bg-red-600"
                                : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                        )}
                        onClick={onToggleVideo}
                    >
                        {controls.isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                    </Button>
                )}

                <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                        "rounded-full w-14 h-14 border-2",
                        !controls.isSpeakerOn
                            ? "bg-yellow-500 border-yellow-500 text-white hover:bg-yellow-600"
                            : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                    )}
                    onClick={onToggleSpeaker}
                >
                    {controls.isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                </Button>

                <Button
                    size="lg"
                    className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700 text-white"
                    onClick={onEndCall}
                >
                    <PhoneOff className="w-6 h-6" />
                </Button>
            </div>
        </div>
    );
}
