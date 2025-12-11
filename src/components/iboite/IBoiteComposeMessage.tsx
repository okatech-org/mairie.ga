/**
 * Composant: IBoiteComposeMessage
 * 
 * Interface de composition de message iBoîte.
 * Différencie les messages internes (sans email) des externes (avec email).
 */

import React, { useState, useCallback } from 'react';
import {
    Send,
    Paperclip,
    X,
    FileText,
    Image,
    Film,
    Link as LinkIcon,
    AlertCircle,
    Mail,
    MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { IBoiteRecipientSearch } from './IBoiteRecipientSearch';
import { iBoiteService } from '@/services/iboite-service';
import { useUserEnvironment } from '@/hooks/useUserEnvironment';
import { IBoiteAttachment, UserEnvironment } from '@/types/environments';

// ============================================================
// TYPES
// ============================================================

interface Recipient {
    type: 'USER' | 'SERVICE';
    id: string;
    displayName: string;
    subtitle?: string;
    avatarUrl?: string;
    environment?: UserEnvironment;
}

interface IBoiteComposeMessageProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;

    // Pré-remplissage
    initialRecipients?: Recipient[];
    initialSubject?: string;
    replyToConversationId?: string;

    // Callbacks
    onSent?: (conversationId: string) => void;
    onError?: (error: string) => void;
}

// ============================================================
// COMPONENT
// ============================================================

export function IBoiteComposeMessage({
    open,
    onOpenChange,
    initialRecipients = [],
    initialSubject = '',
    replyToConversationId,
    onSent,
    onError
}: IBoiteComposeMessageProps) {
    const { canSendExternalEmail, organizationId, isMunicipalStaff, isBackOffice } = useUserEnvironment();

    // État du formulaire
    const [recipients, setRecipients] = useState<Recipient[]>(initialRecipients);
    const [subject, setSubject] = useState(initialSubject);
    const [content, setContent] = useState('');
    const [attachments, setAttachments] = useState<IBoiteAttachment[]>([]);
    const [isOfficial, setIsOfficial] = useState(false);
    const [officialReference, setOfficialReference] = useState('');

    // Mode externe (email)
    const [isExternalMode, setIsExternalMode] = useState(false);
    const [externalEmail, setExternalEmail] = useState('');
    const [externalName, setExternalName] = useState('');
    const [externalOrganization, setExternalOrganization] = useState('');

    // État de soumission
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset
    const resetForm = useCallback(() => {
        setRecipients([]);
        setSubject('');
        setContent('');
        setAttachments([]);
        setIsOfficial(false);
        setOfficialReference('');
        setIsExternalMode(false);
        setExternalEmail('');
        setExternalName('');
        setExternalOrganization('');
        setError(null);
    }, []);

    // Fermer le dialog
    const handleClose = useCallback(() => {
        onOpenChange(false);
        resetForm();
    }, [onOpenChange, resetForm]);

    // Ajouter une pièce jointe
    const handleAddAttachment = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        const newAttachments: IBoiteAttachment[] = Array.from(files).map((file, idx) => {
            const type = file.type.startsWith('image/') ? 'IMAGE'
                : file.type === 'application/pdf' ? 'PDF'
                    : file.type.startsWith('video/') ? 'VIDEO'
                        : file.type.startsWith('audio/') ? 'AUDIO'
                            : 'DOCUMENT';

            return {
                id: `temp_${Date.now()}_${idx}`,
                name: file.name,
                type,
                url: URL.createObjectURL(file),
                size: file.size,
                mimeType: file.type
            };
        });

        setAttachments(prev => [...prev, ...newAttachments]);
    }, []);

    // Supprimer une pièce jointe
    const handleRemoveAttachment = useCallback((attachmentId: string) => {
        setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    }, []);

    // Envoyer le message
    const handleSend = useCallback(async () => {
        // Validation
        if (isExternalMode) {
            if (!externalEmail) {
                setError('Veuillez saisir une adresse email');
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(externalEmail)) {
                setError('Adresse email invalide');
                return;
            }
        } else {
            if (recipients.length === 0 && !replyToConversationId) {
                setError('Veuillez sélectionner au moins un destinataire');
                return;
            }
        }

        if (!content.trim()) {
            setError('Le message ne peut pas être vide');
            return;
        }

        setIsSending(true);
        setError(null);

        try {
            if (isExternalMode) {
                // Envoi de correspondance externe (email)
                if (!organizationId) {
                    throw new Error('Organisation non définie');
                }

                await iBoiteService.sendExternalCorrespondence({
                    recipientEmail: externalEmail,
                    recipientName: externalName || undefined,
                    recipientOrganization: externalOrganization || undefined,
                    subject: subject || '(Sans objet)',
                    body: content,
                    attachments,
                    organizationId
                });

                handleClose();
                onSent?.('external');
            } else if (replyToConversationId) {
                // Réponse dans une conversation existante
                await iBoiteService.sendMessage({
                    conversationId: replyToConversationId,
                    content,
                    attachments,
                    isOfficial,
                    officialReference: isOfficial ? officialReference : undefined
                });

                handleClose();
                onSent?.(replyToConversationId);
            } else {
                // Nouvelle conversation
                const conversation = await iBoiteService.createConversation({
                    type: recipients.length === 1 ? 'PRIVATE' : 'GROUP',
                    subject: subject || undefined,
                    participantIds: recipients.map(r => r.id),
                    initialMessage: content
                });

                if (!conversation) {
                    throw new Error('Erreur lors de la création de la conversation');
                }

                handleClose();
                onSent?.(conversation.id);
            }
        } catch (err: any) {
            const errorMsg = err.message || 'Erreur lors de l\'envoi';
            setError(errorMsg);
            onError?.(errorMsg);
        } finally {
            setIsSending(false);
        }
    }, [
        isExternalMode, externalEmail, externalName, externalOrganization,
        recipients, content, subject, attachments, isOfficial, officialReference,
        replyToConversationId, organizationId, handleClose, onSent, onError
    ]);

    // Icône de pièce jointe
    const getAttachmentIcon = (type: IBoiteAttachment['type']) => {
        switch (type) {
            case 'IMAGE': return <Image className="h-4 w-4" />;
            case 'PDF': return <FileText className="h-4 w-4" />;
            case 'VIDEO': return <Film className="h-4 w-4" />;
            default: return <LinkIcon className="h-4 w-4" />;
        }
    };

    // Formatage de la taille
    const formatSize = (bytes?: number) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isExternalMode ? (
                            <>
                                <Mail className="h-5 w-5" />
                                Nouveau courrier externe
                            </>
                        ) : (
                            <>
                                <MessageSquare className="h-5 w-5" />
                                {replyToConversationId ? 'Répondre' : 'Nouveau message'}
                            </>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-4">
                    {/* Bascule Interne/Externe */}
                    {canSendExternalEmail && !replyToConversationId && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                                <Label className="text-sm font-medium">
                                    {isExternalMode ? 'Courrier externe (Email)' : 'Message interne (iBoîte)'}
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    {isExternalMode
                                        ? 'Envoyer par email à un destinataire externe'
                                        : 'Envoyer via iBoîte (sans email)'}
                                </p>
                            </div>
                            <Switch
                                checked={isExternalMode}
                                onCheckedChange={setIsExternalMode}
                            />
                        </div>
                    )}

                    {/* Destinataire(s) */}
                    {!replyToConversationId && (
                        <div className="space-y-2">
                            <Label>
                                {isExternalMode ? 'Destinataire externe' : 'Destinataire(s)'}
                            </Label>

                            {isExternalMode ? (
                                <div className="space-y-2">
                                    <Input
                                        type="email"
                                        placeholder="exemple@domaine.com"
                                        value={externalEmail}
                                        onChange={e => setExternalEmail(e.target.value)}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            placeholder="Nom (optionnel)"
                                            value={externalName}
                                            onChange={e => setExternalName(e.target.value)}
                                        />
                                        <Input
                                            placeholder="Organisation (optionnel)"
                                            value={externalOrganization}
                                            onChange={e => setExternalOrganization(e.target.value)}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <IBoiteRecipientSearch
                                    onSelect={setRecipients}
                                    selectedRecipients={recipients}
                                    multiple
                                    placeholder="Rechercher par nom ou service..."
                                />
                            )}
                        </div>
                    )}

                    {/* Objet */}
                    {(isExternalMode || recipients.length > 1 || !replyToConversationId) && (
                        <div className="space-y-2">
                            <Label>Objet</Label>
                            <Input
                                placeholder="Objet du message..."
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Message officiel (personnel municipal uniquement) */}
                    {(isMunicipalStaff || isBackOffice) && (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="official"
                                    checked={isOfficial}
                                    onCheckedChange={setIsOfficial}
                                />
                                <Label htmlFor="official" className="text-sm cursor-pointer">
                                    Message officiel
                                </Label>
                            </div>

                            {isOfficial && (
                                <Input
                                    placeholder="N° de référence"
                                    value={officialReference}
                                    onChange={e => setOfficialReference(e.target.value)}
                                    className="flex-1"
                                />
                            )}
                        </div>
                    )}

                    {/* Contenu */}
                    <div className="space-y-2">
                        <Label>Message</Label>
                        <Textarea
                            placeholder="Rédigez votre message..."
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            rows={8}
                            className="resize-none"
                        />
                    </div>

                    {/* Pièces jointes */}
                    {attachments.length > 0 && (
                        <div className="space-y-2">
                            <Label>Pièces jointes</Label>
                            <div className="flex flex-wrap gap-2">
                                {attachments.map(att => (
                                    <Badge
                                        key={att.id}
                                        variant="secondary"
                                        className="flex items-center gap-2 pr-1"
                                    >
                                        {getAttachmentIcon(att.type)}
                                        <span className="max-w-[120px] truncate">{att.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatSize(att.size)}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                                            onClick={() => handleRemoveAttachment(att.id)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Erreur */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter className="flex items-center gap-2">
                    <div className="flex-1">
                        <input
                            type="file"
                            id="attachments"
                            multiple
                            className="hidden"
                            onChange={handleAddAttachment}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => document.getElementById('attachments')?.click()}
                        >
                            <Paperclip className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button variant="outline" onClick={handleClose} disabled={isSending}>
                        Annuler
                    </Button>
                    <Button onClick={handleSend} disabled={isSending} className="gap-2">
                        <Send className="h-4 w-4" />
                        {isSending ? 'Envoi...' : 'Envoyer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default IBoiteComposeMessage;
