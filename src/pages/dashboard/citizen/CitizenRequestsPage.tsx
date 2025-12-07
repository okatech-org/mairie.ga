import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Plus, Clock, CheckCircle, XCircle, AlertCircle, Bell, Eye, RefreshCw } from 'lucide-react';
import { requestService } from '@/services/requestService';
import { ServiceRequest, RequestStatus } from '@/types/request';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { RequestDetailModal } from '@/components/requests/RequestDetailModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '@/hooks/useAuth';

export default function CitizenRequestsPage() {
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [newUpdates, setNewUpdates] = useState<string[]>([]);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            loadRequests();
        }
    }, [user]);

    // Realtime subscription setup remains similar but could be optimized to filter by user_id if RLS didn't handle it
    // For now assuming RLS or client-side filtering logic via `requestService.getAll`

    useEffect(() => {
        // Realtime subscription for request updates
        const channel = supabase
            .channel('requests-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'requests',
                    filter: user ? `citizen_id=eq.${user.id}` : undefined
                },
                (payload) => {
                    const updatedRequest = payload.new as ServiceRequest;
                    setRequests(prev =>
                        prev.map(req =>
                            req.id === updatedRequest.id ? updatedRequest : req
                        )
                    );

                    // Show notification
                    toast.success("Mise à jour de votre demande", {
                        description: `Le statut de votre demande a été mis à jour`,
                        icon: <Bell className="h-4 w-4" />
                    });

                    setNewUpdates(prev => [...prev, updatedRequest.id]);

                    // Clear update indicator after 5 seconds
                    setTimeout(() => {
                        setNewUpdates(prev => prev.filter(id => id !== updatedRequest.id));
                    }, 5000);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const loadRequests = async () => {
        if (!user) return;
        try {
            const data = await requestService.getAll(user.id);
            setRequests(data);
        } catch (error) {
            console.error("Failed to load requests", error);
            toast.error("Impossible de charger vos demandes");
        } finally {
            setLoading(false);
        }
    };

    const handleViewRequest = (request: ServiceRequest) => {
        setSelectedRequest(request);
        setDetailModalOpen(true);
        // Clear update indicator when viewing
        setNewUpdates(prev => prev.filter(id => id !== request.id));
    };

    const getStatusBadge = (status: RequestStatus) => {
        switch (status) {
            case RequestStatus.COMPLETED:
            case RequestStatus.VALIDATED:
                return <Badge className="bg-green-500 hover:bg-green-600 gap-1"><CheckCircle className="w-3 h-3" /> Terminé</Badge>;
            case RequestStatus.IN_PROGRESS:
                return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 gap-1"><Clock className="w-3 h-3" /> En traitement</Badge>;
            case RequestStatus.PENDING:
                return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 gap-1"><Clock className="w-3 h-3" /> En attente</Badge>;
            case RequestStatus.AWAITING_DOCUMENTS:
                return <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 gap-1"><FileText className="w-3 h-3" /> Documents requis</Badge>;
            case RequestStatus.REJECTED:
                return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Rejeté</Badge>;
            default:
                return <Badge variant="outline" className="gap-1"><AlertCircle className="w-3 h-3" /> Inconnu</Badge>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Mes Demandes</h1>
                    <p className="text-muted-foreground">Suivez l'état de vos démarches administratives en temps réel.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={loadRequests} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Nouvelle Demande
                    </Button>
                </div>
            </div>

            {/* Realtime indicator */}
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-muted-foreground">
                            Suivi en temps réel activé - Vous recevrez une notification à chaque mise à jour
                        </span>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-10 text-muted-foreground">Chargement...</div>
                ) : (
                    <AnimatePresence>
                        {requests.map((req) => (
                            <motion.div
                                key={req.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={`neu-card p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-primary/20 transition-all cursor-pointer ${newUpdates.includes(req.id) ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                                onClick={() => handleViewRequest(req)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="relative">
                                        <div className="p-3 bg-primary/10 rounded-lg text-primary mt-1 md:mt-0">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        {newUpdates.includes(req.id) && (
                                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                <Bell className="relative h-4 w-4 text-primary" />
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{req.service?.name || req.subject}</h3>
                                        <div className="text-sm text-muted-foreground flex flex-col md:flex-row gap-1 md:gap-4">
                                            <span>N° {req.numero_dossier || req.id.substring(0, 8).toUpperCase()}</span>
                                            <span className="hidden md:inline">•</span>
                                            <span>Déposée le {format(new Date(req.created_at), 'dd MMM yyyy', { locale: fr })}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <div className="flex flex-col items-end gap-2 flex-1">
                                        {getStatusBadge(req.status)}
                                        <span className="text-xs text-muted-foreground">
                                            Mis à jour le {format(new Date(req.updated_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                                        </span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="shrink-0">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}

                {!loading && requests.length === 0 && (
                    <div className="text-center py-12 neu-inset rounded-xl">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground mb-4">Aucune demande en cours.</p>
                        <Button>Créer ma première demande</Button>
                    </div>
                )}
            </div>

            <RequestDetailModal
                request={selectedRequest}
                open={detailModalOpen}
                onOpenChange={setDetailModalOpen}
            />
        </div>
    );
}
