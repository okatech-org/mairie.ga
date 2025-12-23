/**
 * IReunionPanel - Panneau iRéunion style WhatsApp
 * 
 * Layout à 2 panneaux:
 * - Gauche: Liste des réunions
 * - Droite: Détails réunion ou création
 */

import React, { useState } from 'react';
import {
    Video,
    Calendar,
    Clock,
    Users,
    Plus,
    Link,
    Copy,
    ChevronLeft,
    PlayCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MeetingInterface } from '@/components/iasted/MeetingInterface';
import { IBoiteRecipientSearch, Recipient } from '@/components/iboite/IBoiteRecipientSearch';

interface Meeting {
    id: string;
    title: string;
    date: string;
    time: string;
    duration: string;
    participants: { name: string; avatarUrl?: string }[];
    status: 'scheduled' | 'ongoing' | 'completed';
}

export function IReunionPanel() {
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [isInMeeting, setIsInMeeting] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);

    // Données de démo
    const meetings: Meeting[] = [
        {
            id: '1',
            title: 'Réunion de service',
            date: 'Aujourd\'hui',
            time: '15:00',
            duration: '1h',
            participants: [
                { name: 'Jean Dupont' },
                { name: 'Marie Martin' },
            ],
            status: 'scheduled'
        },
        {
            id: '2',
            title: 'Point projet',
            date: 'Demain',
            time: '10:00',
            duration: '30min',
            participants: [{ name: 'Service Urbanisme' }],
            status: 'scheduled'
        },
    ];

    const getInitials = (name: string) =>
        name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

    return (
        <div className="flex h-full">
            {/* Panneau gauche - Liste */}
            <div className={cn(
                "w-80 border-r flex flex-col bg-muted/30",
                (selectedMeeting || isInMeeting) && "hidden md:flex"
            )}>
                <div className="p-3 border-b">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Réunions</h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowCreate(true)}
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    {meetings.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Aucune réunion</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {meetings.map(meeting => (
                                <button
                                    key={meeting.id}
                                    onClick={() => setSelectedMeeting(meeting)}
                                    className={cn(
                                        "w-full p-3 text-left hover:bg-muted/50 transition-colors",
                                        selectedMeeting?.id === meeting.id && "bg-primary/10"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <Video className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="font-medium block truncate">{meeting.title}</span>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>{meeting.date}</span>
                                                <Clock className="h-3 w-3 ml-1" />
                                                <span>{meeting.time}</span>
                                            </div>
                                            <div className="flex items-center gap-1 mt-2">
                                                <Users className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">
                                                    {meeting.participants.length} participant(s)
                                                </span>
                                            </div>
                                        </div>
                                        {meeting.status === 'ongoing' && (
                                            <Badge variant="destructive" className="shrink-0">En cours</Badge>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Panneau droite - Détails ou création */}
            <div className="flex-1 flex flex-col">
                {isInMeeting ? (
                    <MeetingInterface />
                ) : selectedMeeting ? (
                    <>
                        <div className="p-4 border-b flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden"
                                onClick={() => setSelectedMeeting(null)}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <h3 className="font-semibold">{selectedMeeting.title}</h3>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto">
                            <Card className="mb-6">
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="h-5 w-5 text-muted-foreground" />
                                        <span>{selectedMeeting.date} à {selectedMeeting.time}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-muted-foreground" />
                                        <span>Durée: {selectedMeeting.duration}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Users className="h-5 w-5 text-muted-foreground" />
                                        <div className="flex -space-x-2">
                                            {selectedMeeting.participants.slice(0, 3).map((p, i) => (
                                                <Avatar key={i} className="h-8 w-8 border-2 border-background">
                                                    <AvatarFallback className="text-xs">
                                                        {getInitials(p.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            ))}
                                        </div>
                                        <span className="text-sm">
                                            {selectedMeeting.participants.map(p => p.name).join(', ')}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex gap-3">
                                <Button
                                    size="lg"
                                    className="flex-1 gap-2"
                                    onClick={() => setIsInMeeting(true)}
                                >
                                    <PlayCircle className="h-5 w-5" />
                                    Rejoindre
                                </Button>
                                <Button size="lg" variant="outline" className="gap-2">
                                    <Copy className="h-5 w-5" />
                                    Copier le lien
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6">
                        <div className="w-full max-w-md space-y-6">
                            <div className="text-center">
                                <Video className="h-12 w-12 mx-auto text-primary opacity-50 mb-3" />
                                <h3 className="font-semibold text-lg">iRéunion</h3>
                                <p className="text-sm text-muted-foreground">Invitez des participants à votre réunion</p>
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
                                    multiple={true}
                                    placeholder="Tapez un nom pour rechercher..."
                                    showOrganizations={true}
                                    showServices={true}
                                    showUsers={true}
                                    showExternalInput={true}
                                />
                            </div>

                            <div className="flex gap-4 justify-center pt-4">
                                <Button size="lg" className="gap-2" onClick={() => setIsInMeeting(true)}>
                                    <Plus className="h-5 w-5" />
                                    Nouvelle réunion
                                </Button>
                                <Button size="lg" variant="outline" className="gap-2">
                                    <Link className="h-5 w-5" />
                                    Rejoindre
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default IReunionPanel;
