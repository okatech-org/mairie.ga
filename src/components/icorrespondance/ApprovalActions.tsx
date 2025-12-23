/**
 * ApprovalActions Component
 * Buttons and dialogs for folder approval workflow
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
    CheckCircle, XCircle, Send, Printer, MessageSquare, Loader2, User
} from 'lucide-react';
import { correspondanceService } from '@/services/correspondanceService';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Approver {
    id: string;
    name: string;
    role: string;
}

interface ApprovalActionsProps {
    folderId: string;
    currentStatus: string;
    userRole: string;
    isCurrentHolder: boolean;
    onActionComplete?: () => void;
    className?: string;
}

export function ApprovalActions({
    folderId,
    currentStatus,
    userRole,
    isCurrentHolder,
    onActionComplete,
    className,
}: ApprovalActionsProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [dialogType, setDialogType] = useState<'approve' | 'reject' | 'deliver' | 'submit' | null>(null);
    const [comment, setComment] = useState('');
    const [deliveryMethod, setDeliveryMethod] = useState<'PRINT' | 'IBOITE'>('PRINT');
    const [approvers, setApprovers] = useState<Approver[]>([]);
    const [selectedApproverId, setSelectedApproverId] = useState<string>('');

    const isApprover = ['MAIRE', 'maire', 'MAIRE_ADJOINT', 'maire_adjoint', 'admin'].includes(userRole);
    const isAgent = ['AGENT', 'agent', 'CHEF_SERVICE', 'chef_service', 'SECRETAIRE_GENERAL', 'secretaire_general', 'admin'].includes(userRole);

    // Load approvers when submit dialog opens
    useEffect(() => {
        if (dialogType === 'submit') {
            loadApprovers();
        }
    }, [dialogType]);

    const loadApprovers = async () => {
        try {
            // Get users with MAIRE or MAIRE_ADJOINT roles from user_environments
            const { data, error } = await supabase
                .from('user_environments')
                .select(`
                    user_id,
                    role,
                    profiles!inner(first_name, last_name)
                `)
                .in('role', ['MAIRE', 'MAIRE_ADJOINT'])
                .eq('is_active', true);

            if (error) {
                console.error('Error loading approvers:', error);
                // Fallback: use mock data
                setApprovers([
                    { id: 'mock-maire', name: 'M. le Maire', role: 'MAIRE' },
                    { id: 'mock-adjoint', name: 'M. le Maire Adjoint', role: 'MAIRE_ADJOINT' },
                ]);
                return;
            }

            const approverList = (data || []).map((item: any) => ({
                id: item.user_id,
                name: `${item.profiles?.first_name || ''} ${item.profiles?.last_name || ''}`.trim() || 'Approbateur',
                role: item.role,
            }));

            if (approverList.length === 0) {
                // Fallback if no approvers found
                setApprovers([
                    { id: 'mock-maire', name: 'M. le Maire', role: 'MAIRE' },
                ]);
            } else {
                setApprovers(approverList);
            }
        } catch (error) {
            console.error('Error loading approvers:', error);
            setApprovers([
                { id: 'mock-maire', name: 'M. le Maire', role: 'MAIRE' },
            ]);
        }
    };

    const handleApprove = async () => {
        setLoading(true);
        try {
            await correspondanceService.approveFolder(folderId, comment || undefined);
            toast({
                title: "✅ Dossier approuvé",
                description: "Le dossier a été approuvé et retourné à l'agent.",
            });
            setDialogType(null);
            setComment('');
            onActionComplete?.();
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message || "Échec de l'approbation",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!comment.trim()) {
            toast({
                title: "Motif requis",
                description: "Veuillez indiquer le motif du rejet",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            await correspondanceService.rejectFolder(folderId, comment);
            toast({
                title: "❌ Dossier rejeté",
                description: "Le dossier a été rejeté et retourné à l'agent.",
            });
            setDialogType(null);
            setComment('');
            onActionComplete?.();
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message || "Échec du rejet",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeliver = async () => {
        setLoading(true);
        try {
            await correspondanceService.markAsDelivered(folderId, deliveryMethod);
            toast({
                title: deliveryMethod === 'PRINT' ? "🖨️ Document remis" : "📧 Envoyé via iBoîte",
                description: deliveryMethod === 'PRINT'
                    ? "Le document a été marqué comme imprimé et remis."
                    : "Le document a été envoyé via iBoîte.",
            });
            setDialogType(null);
            onActionComplete?.();
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message || "Échec de la remise",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedApproverId) {
            toast({
                title: "Sélection requise",
                description: "Veuillez sélectionner un approbateur",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            await correspondanceService.submitForApproval(folderId, selectedApproverId, comment || undefined);
            toast({
                title: "📤 Dossier soumis",
                description: "Le dossier a été envoyé pour approbation.",
            });
            setDialogType(null);
            setComment('');
            setSelectedApproverId('');
            onActionComplete?.();
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message || "Échec de la soumission",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Render actions based on status and role
    const renderActions = () => {
        // Pending approval - Maire/Adjoint actions
        if (currentStatus === 'PENDING_APPROVAL' && isApprover && isCurrentHolder) {
            return (
                <div className="flex gap-2">
                    <Button
                        variant="default"
                        size="sm"
                        className="gap-2 bg-green-600 hover:bg-green-700"
                        onClick={() => setDialogType('approve')}
                    >
                        <CheckCircle className="h-4 w-4" />
                        Approuver
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        onClick={() => setDialogType('reject')}
                    >
                        <XCircle className="h-4 w-4" />
                        Rejeter
                    </Button>
                </div>
            );
        }

        // Approved or Ready for delivery - Agent actions
        if ((currentStatus === 'APPROVED' || currentStatus === 'READY_FOR_DELIVERY') && isAgent && isCurrentHolder) {
            return (
                <Button
                    variant="default"
                    size="sm"
                    className="gap-2"
                    onClick={() => setDialogType('deliver')}
                >
                    <Send className="h-4 w-4" />
                    Remettre le document
                </Button>
            );
        }

        // Draft - Agent can submit for approval
        if (currentStatus === 'DRAFT' && isAgent && isCurrentHolder) {
            return (
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setDialogType('submit')}
                >
                    <Send className="h-4 w-4" />
                    Soumettre pour approbation
                </Button>
            );
        }

        return null;
    };

    return (
        <div className={cn("", className)}>
            {renderActions()}

            {/* Approve Dialog */}
            <Dialog open={dialogType === 'approve'} onOpenChange={(open) => !open && setDialogType(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            Approuver le dossier
                        </DialogTitle>
                        <DialogDescription>
                            Le dossier sera approuvé et retourné à l'agent pour remise.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="comment">Commentaire (optionnel)</Label>
                            <Textarea
                                id="comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Ajouter un commentaire..."
                                className="mt-2"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogType(null)}>
                            Annuler
                        </Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700 gap-2"
                            onClick={handleApprove}
                            disabled={loading}
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Approuver
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={dialogType === 'reject'} onOpenChange={(open) => !open && setDialogType(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <XCircle className="h-5 w-5" />
                            Rejeter le dossier
                        </DialogTitle>
                        <DialogDescription>
                            Le dossier sera rejeté et retourné à l'agent pour correction.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="reason">Motif du rejet *</Label>
                            <Textarea
                                id="reason"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Indiquez le motif du rejet..."
                                className="mt-2"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogType(null)}>
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={loading || !comment.trim()}
                            className="gap-2"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Rejeter
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Deliver Dialog */}
            <Dialog open={dialogType === 'deliver'} onOpenChange={(open) => !open && setDialogType(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remettre le document</DialogTitle>
                        <DialogDescription>
                            Choisissez le mode de remise du document au destinataire.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <button
                            className={cn(
                                "flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all",
                                deliveryMethod === 'PRINT'
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                            )}
                            onClick={() => setDeliveryMethod('PRINT')}
                        >
                            <Printer className={cn(
                                "h-10 w-10",
                                deliveryMethod === 'PRINT' ? "text-primary" : "text-muted-foreground"
                            )} />
                            <span className="font-medium">Impression</span>
                            <span className="text-xs text-muted-foreground text-center">
                                Imprimer et remettre<br />physiquement
                            </span>
                        </button>
                        <button
                            className={cn(
                                "flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all",
                                deliveryMethod === 'IBOITE'
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                            )}
                            onClick={() => setDeliveryMethod('IBOITE')}
                        >
                            <MessageSquare className={cn(
                                "h-10 w-10",
                                deliveryMethod === 'IBOITE' ? "text-primary" : "text-muted-foreground"
                            )} />
                            <span className="font-medium">iBoîte</span>
                            <span className="text-xs text-muted-foreground text-center">
                                Envoyer via la<br />messagerie
                            </span>
                        </button>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogType(null)}>
                            Annuler
                        </Button>
                        <Button onClick={handleDeliver} disabled={loading} className="gap-2">
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Confirmer la remise
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Submit Dialog */}
            <Dialog open={dialogType === 'submit'} onOpenChange={(open) => !open && setDialogType(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5 text-primary" />
                            Soumettre pour approbation
                        </DialogTitle>
                        <DialogDescription>
                            Sélectionnez l'approbateur qui validera ce dossier.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Approbateur *</Label>
                            <div className="grid grid-cols-1 gap-2 mt-2">
                                {approvers.map((approver) => (
                                    <button
                                        key={approver.id}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                                            selectedApproverId === approver.id
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-primary/50"
                                        )}
                                        onClick={() => setSelectedApproverId(approver.id)}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center",
                                            selectedApproverId === approver.id
                                                ? "bg-primary/20 text-primary"
                                                : "bg-muted text-muted-foreground"
                                        )}>
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{approver.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {approver.role === 'MAIRE' ? 'Maire' : 'Maire Adjoint'}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="submitComment">Commentaire (optionnel)</Label>
                            <Textarea
                                id="submitComment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Ajouter un commentaire pour l'approbateur..."
                                className="mt-2"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogType(null)}>
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !selectedApproverId}
                            className="gap-2"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Soumettre
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default ApprovalActions;
