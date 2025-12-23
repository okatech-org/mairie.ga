import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, Users, Video, Plus, CalendarDays, Phone, Mic, MicOff, VideoOff, PhoneOff } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function MeetingInterface() {
    const [meetingStatus, setMeetingStatus] = useState<'idle' | 'starting' | 'active'>('idle');
    const [meetingType, setMeetingType] = useState<'audio' | 'video'>('audio');
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const upcomingMeetings = [
        {
            id: 1,
            title: "Audition Consulaire - Renouvellement",
            date: "Aujourd'hui",
            time: "14:30",
            host: "Consulat Paris",
            status: "upcoming"
        },
        {
            id: 2,
            title: "Assemblée Générale - Assoc. Gabonais",
            date: "15 Déc",
            time: "18:00",
            host: "AGF",
            status: "scheduled"
        }
    ];

    const startMeeting = (type: 'audio' | 'video') => {
        setMeetingType(type);
        setMeetingStatus('starting');
        // Simulate connection
        setTimeout(() => setMeetingStatus('active'), 1500);
    };

    const endMeeting = () => {
        setMeetingStatus('idle');
        setIsMuted(false);
        setIsVideoOff(false);
    };

    // Active meeting view
    if (meetingStatus !== 'idle') {
        return (
            <div className="h-full flex flex-col neu-inset rounded-2xl overflow-hidden relative bg-black/20">
                <div className="flex-1 flex items-center justify-center relative p-4">
                    {meetingType === 'video' && !isVideoOff ? (
                        <div className="w-full h-full rounded-xl overflow-hidden bg-slate-900/50 flex items-center justify-center border border-white/5">
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 rounded-full bg-white/5 mx-auto flex items-center justify-center animate-pulse">
                                    <Video className="w-8 h-8 text-white/20" />
                                </div>
                                <span className="text-white/40 text-sm font-medium">Salle de réunion (Simulation)</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
                            <div className="w-32 h-32 rounded-full flex items-center justify-center p-1 bg-card/50 border border-border/50">
                                <Avatar className="w-full h-full border-4 border-background/50">
                                    <AvatarFallback className="bg-primary/20 text-primary text-4xl font-bold">
                                        <Users className="w-12 h-12" />
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-foreground">iRéunion</h3>
                                <p className="text-green-500 text-sm font-medium animate-pulse">
                                    {meetingStatus === 'starting' ? 'Connexion...' : 'En cours'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">0 participants</p>
                            </div>
                        </div>
                    )}

                    {meetingStatus === 'starting' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm z-10">
                            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 animate-bounce bg-card/50 border border-border/50">
                                <Users className="w-10 h-10 text-primary" />
                            </div>
                            <span className="text-foreground font-medium animate-pulse">Création de la salle...</span>
                        </div>
                    )}
                </div>

                {meetingType === 'video' && (
                    <div className="absolute top-4 right-4 w-32 h-44 rounded-xl overflow-hidden border-2 border-primary/20 shadow-2xl bg-card/50">
                        <div className="w-full h-full flex items-center justify-center bg-black/40 backdrop-blur-md">
                            <span className="text-[10px] text-white/50 font-medium">Moi</span>
                        </div>
                    </div>
                )}

                <div className="p-6 flex justify-center gap-6 bg-gradient-to-t from-background/90 to-transparent backdrop-blur-sm">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`rounded-full w-14 h-14 transition-all duration-300 ${isMuted
                            ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg'
                            : 'bg-card/50 border border-border/50 hover:text-primary hover:scale-110'}`}
                        onClick={() => setIsMuted(!isMuted)}
                    >
                        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </Button>

                    {meetingType === 'video' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`rounded-full w-14 h-14 transition-all duration-300 ${isVideoOff
                                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg'
                                : 'bg-card/50 border border-border/50 hover:text-primary hover:scale-110'}`}
                            onClick={() => setIsVideoOff(!isVideoOff)}
                        >
                            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                        </Button>
                    )}

                    <Button
                        variant="destructive"
                        size="icon"
                        className="rounded-full w-14 h-14 bg-red-500 hover:bg-red-600 shadow-lg hover:scale-110 transition-all duration-300"
                        onClick={endMeeting}
                    >
                        <PhoneOff className="w-6 h-6" />
                    </Button>
                </div>
            </div>
        );
    }

    // Idle view with quick start buttons
    return (
        <div className="h-full flex flex-col gap-6">
            {/* Quick Start Section */}
            <div className="bg-card/50 border border-border/50 p-6 rounded-xl">
                <div className="text-center mb-4">
                    <h3 className="font-bold text-lg text-foreground">Démarrer une réunion instantanée</h3>
                    <p className="text-sm text-muted-foreground">Lancez une réunion audio ou vidéo immédiatement</p>
                </div>
                <div className="flex justify-center gap-4">
                    <Button
                        size="lg"
                        className="rounded-full w-20 h-20 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 hover:scale-110 transition-all duration-300 border-2 border-blue-500/20 flex flex-col gap-1"
                        onClick={() => startMeeting('audio')}
                    >
                        <Phone className="w-7 h-7" />
                        <span className="text-xs">Audio</span>
                    </Button>
                    <Button
                        size="lg"
                        className="rounded-full w-20 h-20 bg-green-500/10 hover:bg-green-500/20 text-green-500 hover:scale-110 transition-all duration-300 border-2 border-green-500/20 flex flex-col gap-1"
                        onClick={() => startMeeting('video')}
                    >
                        <Video className="w-7 h-7" />
                        <span className="text-xs">Vidéo</span>
                    </Button>
                </div>
            </div>

            {/* Scheduled Meetings */}
            <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-primary bg-primary/10">
                        <CalendarDays className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-foreground">Réunions planifiées</h3>
                </div>
                <Button size="sm" className="bg-card/50 border border-border/50 hover:text-primary transition-all gap-2 text-xs font-medium">
                    <Plus className="w-3 h-3" /> Planifier
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {upcomingMeetings.map((meeting) => (
                    <div key={meeting.id} className="bg-card/30 border border-border/30 p-4 rounded-xl group hover:bg-card/50 transition-all duration-300">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">{meeting.title}</h4>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1.5">
                                    <Users className="w-3.5 h-3.5" />
                                    <span>Organisé par <span className="font-medium text-foreground/80">{meeting.host}</span></span>
                                </p>
                            </div>
                            <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${meeting.status === 'upcoming'
                                ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                }`}>
                                {meeting.status === 'upcoming' ? 'Bientôt' : 'Prévu'}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border/50 pt-3">
                            <span className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md">
                                <Calendar className="w-3.5 h-3.5" /> {meeting.date}
                            </span>
                            <span className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md">
                                <Clock className="w-3.5 h-3.5" /> {meeting.time}
                            </span>
                        </div>

                        {meeting.status === 'upcoming' && (
                            <Button size="sm" className="w-full mt-4 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                                <Video className="w-3.5 h-3.5" /> Rejoindre la salle
                            </Button>
                        )}
                    </div>
                ))}

                <div className="bg-card/20 p-8 rounded-xl flex flex-col items-center justify-center gap-3 text-muted-foreground mt-6 border border-dashed border-border/30">
                    <Calendar className="w-10 h-10 opacity-20" />
                    <p className="text-sm font-medium text-center opacity-60">Aucune autre réunion prévue.</p>
                </div>
            </div>
        </div>
    );
}
