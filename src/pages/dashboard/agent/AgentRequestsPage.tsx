import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    FileText, Search, Clock, CheckCircle2, XCircle,
    AlertCircle, Eye, Play, CheckCheck, Filter,
    Calendar, User, Mail, Paperclip, RefreshCw, Bell
} from "lucide-react";
import { requestService } from "@/services/requestService";
import { ServiceRequest, RequestStatus } from "@/types/request";
import { RequestDetailModal } from "@/components/requests/RequestDetailModal";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function AgentRequestsPage() {
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [activeTab, setActiveTab] = useState<string>("all");

    // Modal states
    const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [newUpdates, setNewUpdates] = useState<string[]>([]);

    useEffect(() => {
        loadRequests();
    }, []);

    // Realtime subscription for request updates
    useEffect(() => {
        const channel = supabase
            .channel('agent-requests-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'requests'
                },
                (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        const updatedRequest = payload.new as ServiceRequest;
                        setRequests(prev =>
                            prev.map(req =>
                                req.id === updatedRequest.id ? { ...req, ...updatedRequest } : req
                            )
                        );
                        setNewUpdates(prev => [...prev, updatedRequest.id]);
                        setTimeout(() => {
                            setNewUpdates(prev => prev.filter(id => id !== updatedRequest.id));
                        }, 5000);
                    } else if (payload.eventType === 'INSERT') {
                        loadRequests(); // Reload to get full joined data
                        toast.success("Nouvelle demande reçue", {
                            icon: <Bell className="h-4 w-4" />
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await requestService.getAll();
            setRequests(data || []);
        } catch (error) {
            console.error("Failed to load requests", error);
            toast.error("Impossible de charger les demandes");
        } finally {
            setLoading(false);
        }
    };

    const handleViewRequest = (request: ServiceRequest) => {
        setSelectedRequest(request);
        setDetailModalOpen(true);
        setNewUpdates(prev => prev.filter(id => id !== request.id));
    };

    const handleProcessRequest = async (request: ServiceRequest) => {
        setProcessingId(request.id);
        try {
            await requestService.updateStatus(request.id, 'IN_PROGRESS' as any);
            setRequests(prev =>
                prev.map(req =>
                    req.id === request.id ? { ...req, status: 'IN_PROGRESS' as any } : req
                )
            );
            toast.success("Demande prise en charge", {
                description: `Dossier ${request.numero_dossier || request.id.substring(0, 8)} en cours de traitement`
            });
        } catch (error) {
            console.error("Failed to process request", error);
            toast.error("Impossible de traiter la demande");
        } finally {
            setProcessingId(null);
        }
    };

    const handleValidateRequest = async (request: ServiceRequest) => {
        setProcessingId(request.id);
        try {
            await requestService.updateStatus(request.id, 'VALIDATED' as any);
            setRequests(prev =>
                prev.map(req =>
                    req.id === request.id ? { ...req, status: 'VALIDATED' as any } : req
                )
            );
            toast.success("Demande validée", {
                description: `Dossier ${request.numero_dossier || request.id.substring(0, 8)} validé avec succès`
            });
        } catch (error) {
            console.error("Failed to validate request", error);
            toast.error("Impossible de valider la demande");
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectRequest = async () => {
        if (!selectedRequest || !rejectionReason.trim()) return;

        setProcessingId(selectedRequest.id);
        try {
            await requestService.update(selectedRequest.id, {
                status: 'REJECTED' as any,
                motif_rejet: rejectionReason
            });
            setRequests(prev =>
                prev.map(req =>
                    req.id === selectedRequest.id ? { ...req, status: 'REJECTED' as any, motif_rejet: rejectionReason } : req
                )
            );
            toast.success("Demande rejetée", {
                description: `Motif: ${rejectionReason.substring(0, 50)}...`
            });
            setRejectModalOpen(false);
            setRejectionReason("");
            setSelectedRequest(null);
        } catch (error) {
            console.error("Failed to reject request", error);
            toast.error("Impossible de rejeter la demande");
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectModal = (request: ServiceRequest) => {
        setSelectedRequest(request);
        setRejectModalOpen(true);
    };

    const getStatusBadge = (status: RequestStatus) => {
        const config = {
            [RequestStatus.PENDING]: { variant: "outline" as const, className: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
            [RequestStatus.IN_PROGRESS]: { variant: "outline" as const, className: "bg-blue-50 text-blue-700 border-blue-200", icon: Play },
            [RequestStatus.AWAITING_DOCUMENTS]: { variant: "outline" as const, className: "bg-orange-50 text-orange-700 border-orange-200", icon: AlertCircle },
            [RequestStatus.VALIDATED]: { variant: "outline" as const, className: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
            [RequestStatus.REJECTED]: { variant: "outline" as const, className: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
            [RequestStatus.COMPLETED]: { variant: "outline" as const, className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCheck }
        };

        const { className, icon: Icon } = config[status] || config[RequestStatus.PENDING];
        return (
            <Badge className={`${className} gap-1 font-medium`}>
                <Icon className="w-3 h-3" />
                {status.replace(/_/g, ' ')}
            </Badge>
        );
    };

    const getTypeBadge = (type: string) => {
        return <Badge variant="outline" className="text-xs">{type}</Badge>;
    };

    const filteredRequests = requests.filter(request => {
        const citizenName = request.citizen_name || 'Inconnu';
        const subject = request.service?.name || request.subject || 'Demande';

        // Search filter
        const matchesSearch = citizenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (request.numero_dossier || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            subject.toLowerCase().includes(searchTerm.toLowerCase());

        // Type filter (using service name as type for now)
        const matchesType = filterType === "all" || (request.service?.name === filterType);

        // Status filter
        const matchesStatus = filterStatus === "all" || request.status === filterStatus;

        // Tab filter
        const matchesTab = activeTab === "all" ||
            (activeTab === "pending" && request.status === RequestStatus.PENDING) ||
            (activeTab === "in-progress" && request.status === RequestStatus.IN_PROGRESS) ||
            (activeTab === "completed" && (request.status === RequestStatus.COMPLETED || request.status === RequestStatus.VALIDATED));

        return matchesSearch && matchesType && matchesStatus && matchesTab;
    });

    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === RequestStatus.PENDING).length,
        inProgress: requests.filter(r => r.status === RequestStatus.IN_PROGRESS).length,
        completed: requests.filter(r => r.status === RequestStatus.COMPLETED || r.status === RequestStatus.VALIDATED).length
    };

    // Extract unique service names for filter
    const serviceTypes = Array.from(new Set(requests.map(r => r.service?.name).filter(Boolean)));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Demandes de Services</h1>
                    <p className="text-muted-foreground">Gérez les demandes des citoyens et suivez leur progression</p>
                </div>
                <Button variant="outline" size="icon" onClick={loadRequests} disabled={loading} className="neu-raised">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
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
                            Suivi en temps réel activé - Les nouvelles demandes apparaîtront automatiquement
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="neu-raised">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <FileText className="w-8 h-8 text-primary opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-raised">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">En attente</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-raised">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">En cours</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                            </div>
                            <Play className="w-8 h-8 text-blue-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-raised">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Terminées</p>
                                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                            </div>
                            <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="neu-raised">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground flex items-center gap-2">
                                <Search className="w-3 h-3" />
                                Recherche
                            </Label>
                            <Input
                                placeholder="Nom, N° dossier, sujet..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="neu-inset"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground flex items-center gap-2">
                                <Filter className="w-3 h-3" />
                                Type de service
                            </Label>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="neu-inset">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les types</SelectItem>
                                    {serviceTypes.map((type) => (
                                        <SelectItem key={type as string} value={type as string}>{type as string}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground flex items-center gap-2">
                                <Filter className="w-3 h-3" />
                                Statut
                            </Label>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="neu-inset">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les statuts</SelectItem>
                                    {Object.values(RequestStatus).map(status => (
                                        <SelectItem key={status} value={status}>{status.replace(/_/g, ' ')}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button
                                variant="outline"
                                className="w-full neu-raised"
                                onClick={() => {
                                    setSearchTerm("");
                                    setFilterType("all");
                                    setFilterStatus("all");
                                }}
                            >
                                Réinitialiser
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs and Request List */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="neu-inset mb-4">
                    <TabsTrigger value="all">Toutes ({stats.total})</TabsTrigger>
                    <TabsTrigger value="pending">En attente ({stats.pending})</TabsTrigger>
                    <TabsTrigger value="in-progress">En cours ({stats.inProgress})</TabsTrigger>
                    <TabsTrigger value="completed">Terminées ({stats.completed})</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                    {loading ? (
                        <div className="text-center py-12">
                            <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
                            <p className="text-muted-foreground">Chargement des demandes...</p>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <Card className="neu-raised">
                            <CardContent className="p-12 text-center">
                                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <h3 className="text-lg font-semibold mb-2">Aucune demande trouvée</h3>
                                <p className="text-sm text-muted-foreground">Essayez de modifier vos filtres de recherche</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <AnimatePresence>
                            {filteredRequests.map((request) => (
                                <motion.div
                                    key={request.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <Card className={`neu-raised hover:shadow-lg transition-all ${newUpdates.includes(request.id) ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
                                        <CardContent className="p-6">
                                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                <div className="flex-1 space-y-3">
                                                    {/* Header */}
                                                    <div className="flex items-start gap-3">
                                                        <div className="relative">
                                                            <div className="neu-inset w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                                                                <FileText className="w-5 h-5 text-primary" />
                                                            </div>
                                                            {newUpdates.includes(request.id) && (
                                                                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                                    <Bell className="relative h-4 w-4 text-primary" />
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                <span className="font-mono text-xs text-muted-foreground">
                                                                    {request.numero_dossier || request.id.substring(0, 8).toUpperCase()}
                                                                </span>
                                                                {getStatusBadge(request.status)}
                                                                {getTypeBadge(request.service?.name || request.type || 'Service')}
                                                            </div>
                                                            <h3 className="font-semibold text-lg">{request.service?.name || request.subject || 'Demande'}</h3>
                                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                                {request.description || 'Aucune description'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Details */}
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t">
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <User className="w-4 h-4 text-muted-foreground" />
                                                            <span className="font-medium">
                                                                {request.citizen_name || 'Inconnu'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Mail className="w-4 h-4" />
                                                            <span className="truncate">
                                                                {request.citizen_email || 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>{formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: fr })}</span>
                                                        </div>
                                                    </div>

                                                    {request.attached_documents && request.attached_documents.length > 0 && (
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Paperclip className="w-4 h-4" />
                                                            <span>{request.attached_documents.length} document(s) joint(s)</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex md:flex-col gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="neu-raised flex-1 md:flex-none"
                                                        onClick={() => handleViewRequest(request)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Voir
                                                    </Button>
                                                    {request.status === RequestStatus.PENDING && (
                                                        <Button
                                                            size="sm"
                                                            className="neu-raised flex-1 md:flex-none"
                                                            onClick={() => handleProcessRequest(request)}
                                                            disabled={processingId === request.id}
                                                        >
                                                            <Play className="w-4 h-4 mr-2" />
                                                            Traiter
                                                        </Button>
                                                    )}
                                                    {request.status === RequestStatus.IN_PROGRESS && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                className="neu-raised flex-1 md:flex-none bg-green-600 hover:bg-green-700"
                                                                onClick={() => handleValidateRequest(request)}
                                                                disabled={processingId === request.id}
                                                            >
                                                                <CheckCheck className="w-4 h-4 mr-2" />
                                                                Valider
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                className="neu-raised flex-1 md:flex-none"
                                                                onClick={() => openRejectModal(request)}
                                                                disabled={processingId === request.id}
                                                            >
                                                                <XCircle className="w-4 h-4 mr-2" />
                                                                Rejeter
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </TabsContent>
            </Tabs>

            {/* Detail Modal */}
            <RequestDetailModal
                request={selectedRequest}
                open={detailModalOpen}
                onOpenChange={setDetailModalOpen}
            />

            {/* Rejection Modal */}
            <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Rejeter la demande</DialogTitle>
                        <DialogDescription>
                            Veuillez indiquer le motif du rejet. Cette information sera communiquée au citoyen.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="rejection-reason">Motif du rejet</Label>
                            <Textarea
                                id="rejection-reason"
                                placeholder="Ex: Documents manquants, conditions non remplies..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="min-h-[120px] neu-inset"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRejectRequest}
                            disabled={!rejectionReason.trim() || processingId !== null}
                        >
                            Confirmer le rejet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
