import React from 'react';
import { Phone, PhoneOff, Video, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SignalingMessage } from '@/types/webrtc-types';
import { cn } from '@/lib/utils';

interface IncomingCallModalProps {
    call: SignalingMessage;
    onAccept: () => void;
    onReject: () => void;
}

export function IncomingCallModal({ call, onAccept, onReject }: IncomingCallModalProps) {
    const isVideoCall = call.payload.callType === 'video';
    const callerName = call.payload.callerName || 'Inconnu';
    const callerInitial = callerName.charAt(0).toUpperCase();

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-background rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center animate-in zoom-in-95 duration-300">
                {/* Caller Avatar */}
                <div className="relative mx-auto mb-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 mx-auto flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                        {call.payload.callerAvatar ? (
                            <img
                                src={call.payload.callerAvatar}
                                alt={callerName}
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            callerInitial
                        )}
                    </div>
                    {/* Pulsing ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
                </div>

                {/* Call Info */}
                <h2 className="text-xl font-bold mb-1">{callerName}</h2>
                <p className="text-muted-foreground mb-8 flex items-center justify-center gap-2">
                    {isVideoCall ? (
                        <>
                            <Video className="w-4 h-4" />
                            Appel vidéo entrant...
                        </>
                    ) : (
                        <>
                            <Phone className="w-4 h-4" />
                            Appel audio entrant...
                        </>
                    )}
                </p>

                {/* Action Buttons */}
                <div className="flex justify-center gap-6">
                    <Button
                        size="lg"
                        variant="destructive"
                        className="rounded-full w-16 h-16 shadow-lg hover:scale-110 transition-transform"
                        onClick={onReject}
                    >
                        <PhoneOff className="w-7 h-7" />
                    </Button>

                    <Button
                        size="lg"
                        className="rounded-full w-16 h-16 bg-green-600 hover:bg-green-700 shadow-lg hover:scale-110 transition-transform"
                        onClick={onAccept}
                    >
                        {isVideoCall ? (
                            <Video className="w-7 h-7" />
                        ) : (
                            <Phone className="w-7 h-7" />
                        )}
                    </Button>
                </div>

                {/* Labels */}
                <div className="flex justify-center gap-6 mt-3">
                    <span className="text-xs text-muted-foreground w-16 text-center">Refuser</span>
                    <span className="text-xs text-muted-foreground w-16 text-center">Accepter</span>
                </div>
            </div>
        </div>
    );
}
