import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Bell, Shield, Save, Clock, Monitor } from 'lucide-react';
import { useSessionConfigStore, InactivityTimeout } from '@/stores/sessionConfigStore';
import { toast } from 'sonner';
import { ActiveSessionsManager } from '@/components/auth/ActiveSessionsManager';
import { NotificationPreferencesForm } from '@/components/notifications/NotificationPreferencesForm';

const timeoutOptions: { value: InactivityTimeout; label: string }[] = [
    { value: 0, label: 'Désactivé' },
    { value: 5, label: '5 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 heure' },
];

export default function CitizenSettingsPage() {
    const { inactivityTimeout, setInactivityTimeout } = useSessionConfigStore();

    const handleTimeoutChange = (value: string) => {
        const timeout = parseInt(value) as InactivityTimeout;
        setInactivityTimeout(timeout);
        toast.success("Paramètre enregistré", {
            description: timeout === 0 
                ? "La déconnexion automatique est désactivée." 
                : `Déconnexion automatique après ${timeout} minutes d'inactivité.`
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold">Paramètres</h1>
                <p className="text-muted-foreground">Gérez vos préférences et informations personnelles.</p>
            </div>

            <div className="grid gap-8">
                {/* Profile Settings */}
                <div className="neu-card p-6 rounded-xl space-y-6">
                    <div className="flex items-center gap-3 border-b pb-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <User className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold">Profil</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Prénom</Label>
                            <Input defaultValue="Jean" />
                        </div>
                        <div className="space-y-2">
                            <Label>Nom</Label>
                            <Input defaultValue="Dupont" />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input defaultValue="jean.dupont@example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label>Téléphone</Label>
                            <Input defaultValue="+33 6 12 34 56 78" />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button>
                            <Save className="w-4 h-4 mr-2" /> Enregistrer
                        </Button>
                    </div>
                </div>

                {/* Session & Security */}
                <div className="neu-card p-6 rounded-xl space-y-6">
                    <div className="flex items-center gap-3 border-b pb-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Clock className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold">Session</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Déconnexion automatique</Label>
                                <p className="text-sm text-muted-foreground">
                                    Se déconnecter automatiquement après une période d'inactivité pour protéger votre compte.
                                </p>
                            </div>
                            <Select 
                                value={inactivityTimeout.toString()} 
                                onValueChange={handleTimeoutChange}
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {timeoutOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value.toString()}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Active Sessions */}
                    <div className="border-t pt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Monitor className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Appareils connectés</h3>
                                <p className="text-sm text-muted-foreground">Gérez vos sessions actives sur tous vos appareils.</p>
                            </div>
                        </div>
                        <ActiveSessionsManager />
                    </div>
                </div>

                {/* Notifications */}
                <NotificationPreferencesForm />

                {/* Security */}
                <div className="neu-card p-6 rounded-xl space-y-6">
                    <div className="flex items-center gap-3 border-b pb-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold">Sécurité</h2>
                    </div>

                    <div className="space-y-4">
                        <Button variant="outline" className="w-full justify-start">
                            Changer le mot de passe
                        </Button>
                        <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                            Supprimer mon compte
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
