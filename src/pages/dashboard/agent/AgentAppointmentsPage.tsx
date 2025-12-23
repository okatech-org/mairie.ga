import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Calendar as CalendarIcon,
    Clock,
    Search,
    Filter,
    MoreVertical,
    CheckCircle2,
    XCircle,
    AlertCircle,
    User,
    MapPin
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { appointmentService } from '@/services/appointmentService';
import { Appointment, AppointmentStatus } from '@/types/appointment';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_STYLES: Record<string, { label: string; color: string; icon: any }> = {
    [AppointmentStatus.CONFIRMED]: { label: 'Confirmé', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
    [AppointmentStatus.SCHEDULED]: { label: 'Planifié', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
    [AppointmentStatus.COMPLETED]: { label: 'Terminé', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle2 },
    [AppointmentStatus.CANCELLED]: { label: 'Annulé', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
    [AppointmentStatus.NO_SHOW]: { label: 'Absent', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: AlertCircle },
};

export default function AgentAppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            const data = await appointmentService.getAll();
            setAppointments(data);
        } catch (error) {
            console.error("Failed to load appointments", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAppointments = appointments.filter(app => {
        const citizenName = app.profile ? `${app.profile.first_name} ${app.profile.last_name}` : 'Inconnu';
        const matchesSearch = citizenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.citizen_id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter ? app.status === statusFilter : true;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Gestion des Rendez-vous</h1>
                    <p className="text-muted-foreground">
                        Visualisez et gérez les rendez-vous consulaires.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button className="neu-raised gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Vue Calendrier
                    </Button>
                    <Button className="neu-raised bg-primary text-primary-foreground hover:shadow-neo-md border-none gap-2">
                        <Clock className="w-4 h-4" />
                        Nouveau RDV
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="neu-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Rechercher un citoyen (Nom, ID)..."
                        className="pl-9 bg-transparent border-none shadow-none focus-visible:ring-0"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`rounded-full ${statusFilter === null ? 'bg-primary/10 text-primary font-bold' : ''}`}
                        onClick={() => setStatusFilter(null)}
                    >
                        Tous
                    </Button>
                    {Object.entries(STATUS_STYLES).map(([key, style]) => (
                        <Button
                            key={key}
                            variant="ghost"
                            size="sm"
                            className={`rounded-full gap-2 ${statusFilter === key ? 'bg-muted font-bold' : ''}`}
                            onClick={() => setStatusFilter(key)}
                        >
                            <div className={`w-2 h-2 rounded-full ${style.color.split(' ')[0].replace('bg-', 'bg-')}`} />
                            {style.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Appointments List */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-12 text-muted-foreground">Chargement...</div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        Aucun rendez-vous trouvé.
                    </div>
                ) : (
                    filteredAppointments.map((app) => {
                        const style = STATUS_STYLES[app.status] || STATUS_STYLES[AppointmentStatus.SCHEDULED];
                        const StatusIcon = style.icon;
                        const citizenName = app.profile ? `${app.profile.first_name} ${app.profile.last_name}` : 'Inconnu';

                        return (
                            <div key={app.id} className="neu-raised p-4 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group hover:shadow-neo-lg transition-all">
                                {/* Time & Date */}
                                <div className="flex md:flex-col items-center md:items-start gap-2 md:gap-0 min-w-[100px] border-r md:border-r-0 border-border pr-4 md:pr-0">
                                    <span className="text-xl font-bold text-primary">{format(new Date(app.appointment_date), 'HH:mm')}</span>
                                    <span className="text-sm text-muted-foreground font-medium">{format(new Date(app.appointment_date), 'd MMM', { locale: fr })}</span>
                                </div>

                                {/* Citizen Info */}
                                <div className="flex items-center gap-4 flex-1">
                                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                            {citizenName.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-bold text-lg leading-none mb-1">{citizenName}</h3>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className="bg-muted px-1.5 py-0.5 rounded text-xs font-medium">{app.citizen_id.substring(0, 8)}</span>
                                            <span>•</span>
                                            <span>{app.service?.name || 'Service'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Location & Status */}
                                <div className="flex flex-col md:items-end gap-1 min-w-[150px]">
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {app.organization?.name || 'Ambassade'}
                                    </div>
                                    <Badge variant="outline" className={`${style.color} gap-1`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {style.label}
                                    </Badge>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 mt-2 md:mt-0">
                                    <Button variant="ghost" size="sm" className="hidden md:flex">Détails</Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>Voir le dossier</DropdownMenuItem>
                                            <DropdownMenuItem>Modifier le statut</DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive">Annuler le RDV</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
