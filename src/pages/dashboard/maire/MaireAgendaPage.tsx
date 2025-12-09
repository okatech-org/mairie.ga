import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Users,
    Plus,
    Video,
    FileText
} from "lucide-react";

interface Appointment {
    id: string;
    title: string;
    time: string;
    location: string;
    type: 'reunion' | 'audience' | 'ceremonie' | 'visite';
    attendees?: string[];
}

const MOCK_APPOINTMENTS: Record<string, Appointment[]> = {
    '2024-12-09': [
        { id: '1', title: 'Conseil Municipal', time: '09:00', location: 'Salle du Conseil', type: 'reunion', attendees: ['Adjoints', 'Conseillers'] },
        { id: '2', title: 'Audience - M. Ndong', time: '11:00', location: 'Bureau du Maire', type: 'audience' },
        { id: '3', title: 'Inauguration École', time: '15:00', location: 'Quartier Louis', type: 'ceremonie' },
    ],
    '2024-12-10': [
        { id: '4', title: 'Réunion Urbanisme', time: '10:00', location: 'Salle de réunion A', type: 'reunion' },
        { id: '5', title: 'Visite chantier voirie', time: '14:00', location: 'Avenue de la Libération', type: 'visite' },
    ],
    '2024-12-11': [
        { id: '6', title: 'Audience - Association Femmes', time: '09:30', location: 'Bureau du Maire', type: 'audience' },
        { id: '7', title: 'Vidéoconférence Ministère', time: '16:00', location: 'Visio', type: 'reunion' },
    ]
};

const typeColors: Record<string, string> = {
    'reunion': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'audience': 'bg-green-500/10 text-green-500 border-green-500/20',
    'ceremonie': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    'visite': 'bg-orange-500/10 text-orange-500 border-orange-500/20'
};

const typeLabels: Record<string, string> = {
    'reunion': 'Réunion',
    'audience': 'Audience',
    'ceremonie': 'Cérémonie',
    'visite': 'Visite terrain'
};

export default function MaireAgendaPage() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    const dateKey = selectedDate?.toISOString().split('T')[0] || '';
    const dayAppointments = MOCK_APPOINTMENTS[dateKey] || [];

    const stats = {
        today: 3,
        week: 12,
        pending: 5
    };

    return (
        <div className="space-y-6 p-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Agenda du Maire
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gérez vos rendez-vous, réunions et audiences
                    </p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nouveau RDV
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <CalendarIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.today}</p>
                                <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <Clock className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.week}</p>
                                <p className="text-sm text-muted-foreground">Cette semaine</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-orange-500/10">
                                <Users className="h-6 w-6 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.pending}</p>
                                <p className="text-sm text-muted-foreground">Demandes en attente</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <Card className="neu-card border-none">
                    <CardHeader>
                        <CardTitle className="text-lg">Calendrier</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="rounded-md"
                        />
                    </CardContent>
                </Card>

                {/* Day View */}
                <Card className="neu-card border-none lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            {selectedDate?.toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long'
                            })}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px] pr-4">
                            {dayAppointments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <CalendarIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                    <p className="text-muted-foreground">Aucun rendez-vous prévu</p>
                                    <Button variant="link" className="mt-2">
                                        Ajouter un rendez-vous
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {dayAppointments.map((apt) => (
                                        <div
                                            key={apt.id}
                                            className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant="outline" className={typeColors[apt.type]}>
                                                            {typeLabels[apt.type]}
                                                        </Badge>
                                                        <span className="text-sm font-medium text-primary">
                                                            {apt.time}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-semibold">{apt.title}</h3>
                                                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3" />
                                                            {apt.location}
                                                        </span>
                                                        {apt.attendees && (
                                                            <span className="flex items-center gap-1">
                                                                <Users className="h-3 w-3" />
                                                                {apt.attendees.join(', ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {apt.location === 'Visio' && (
                                                        <Button size="sm" variant="outline" className="gap-1">
                                                            <Video className="h-3 w-3" />
                                                            Rejoindre
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="ghost">
                                                        <FileText className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
