/**
 * IAppelPanel - Panneau iAppel style WhatsApp
 * 
 * Layout à 2 panneaux:
 * - Gauche: Historique des appels
 * - Droite: Interface d'appel ou clavier
 */

import React, { useState } from 'react';
import {
    Phone,
    PhoneCall,
    PhoneMissed,
    PhoneIncoming,
    PhoneOutgoing,
    Video,
    Search,
    Clock,
    User,
    Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { AudioVideoInterface } from '@/components/iasted/AudioVideoInterface';
import { IBoiteRecipientSearch, Recipient } from '@/components/iboite/IBoiteRecipientSearch';

interface CallHistoryItem {
    id: string;
    name: string;
    avatarUrl?: string;
    type: 'incoming' | 'outgoing' | 'missed';
    isVideo: boolean;
    timestamp: string;
    duration?: string;
}

interface IAppelPanelProps {
    onStartCall?: (type: 'audio' | 'video') => void;
}

export function IAppelPanel({ onStartCall }: IAppelPanelProps) {
    const [selectedCall, setSelectedCall] = useState<CallHistoryItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isInCall, setIsInCall] = useState(false);
    const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);

    // Données de démo
    const callHistory: CallHistoryItem[] = [
        { id: '1', name: 'Jean Dupont', type: 'outgoing', isVideo: false, timestamp: '14:30', duration: '5:23' },
        { id: '2', name: 'Marie Martin', type: 'incoming', isVideo: true, timestamp: 'Hier', duration: '12:45' },
        { id: '3', name: 'Service État Civil', type: 'missed', isVideo: false, timestamp: 'Hier' },
    ];

    const getCallIcon = (type: string, isVideo: boolean) => {
        if (isVideo) return <Video className="h-4 w-4" />;
        switch (type) {
            case 'incoming': return <PhoneIncoming className="h-4 w-4 text-green-500" />;
            case 'outgoing': return <PhoneOutgoing className="h-4 w-4 text-blue-500" />;
            case 'missed': return <PhoneMissed className="h-4 w-4 text-red-500" />;
            default: return <Phone className="h-4 w-4" />;
        }
    };

    const getInitials = (name: string) =>
        name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

    return (
        <div className="flex h-full">
            {/* Panneau gauche - Historique */}
            <div className={cn(
                "w-80 border-r flex flex-col bg-muted/30",
                isInCall && "hidden md:flex"
            )}>
                <div className="p-3 border-b space-y-3">
                    <h2 className="font-semibold">Appels</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    {callHistory.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <PhoneCall className="h-12 w-12 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Aucun appel récent</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {callHistory.map(call => (
                                <button
                                    key={call.id}
                                    onClick={() => setSelectedCall(call)}
                                    className={cn(
                                        "w-full p-3 flex gap-3 text-left hover:bg-muted/50 transition-colors",
                                        selectedCall?.id === call.id && "bg-primary/10"
                                    )}
                                >
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={call.avatarUrl} />
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {getInitials(call.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <span className="font-medium truncate block">{call.name}</span>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            {getCallIcon(call.type, call.isVideo)}
                                            <span>{call.timestamp}</span>
                                            {call.duration && <span>• {call.duration}</span>}
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="shrink-0">
                                        <Phone className="h-5 w-5 text-primary" />
                                    </Button>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Panneau droite - Interface d'appel */}
            <div className="flex-1 flex flex-col">
                {isInCall ? (
                    <AudioVideoInterface mode="both" />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6">
                        <div className="w-full max-w-md space-y-6">
                            <div className="text-center">
                                <PhoneCall className="h-12 w-12 mx-auto text-primary opacity-50 mb-3" />
                                <h3 className="font-semibold text-lg">iAppel</h3>
                                <p className="text-sm text-muted-foreground">Choisissez un destinataire pour appeler</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                    <Users className="h-3 w-3" />
                                    Destinataire(s)
                                </div>
                                <IBoiteRecipientSearch
                                    onSelect={(recipients) => {
                                        setSelectedRecipients(recipients);
                                    }}
                                    selectedRecipients={selectedRecipients}
                                    multiple={false}
                                    placeholder="Tapez un nom pour rechercher..."
                                    showOrganizations={true}
                                    showServices={true}
                                    showUsers={true}
                                    showExternalInput={false}
                                />
                            </div>

                            {selectedRecipients.length > 0 && (
                                <div className="flex gap-4 justify-center pt-4">
                                    <Button
                                        size="lg"
                                        className="gap-2"
                                        onClick={() => setIsInCall(true)}
                                    >
                                        <Phone className="h-5 w-5" />
                                        Appel Audio
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="gap-2"
                                        onClick={() => setIsInCall(true)}
                                    >
                                        <Video className="h-5 w-5" />
                                        Appel Vidéo
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default IAppelPanel;
