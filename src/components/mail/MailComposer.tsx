import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Paperclip, Send, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MailComposerProps {
    isOpen: boolean;
    onClose: () => void;
    replyTo?: {
        subject: string;
        recipient: string;
    };
}

export function MailComposer({ isOpen, onClose, replyTo }: MailComposerProps) {
    const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
    const [recipient, setRecipient] = useState(replyTo ? replyTo.recipient : '');
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!recipient || !subject) {
            toast.error('Veuillez remplir le destinataire et l\'objet');
            return;
        }

        setIsSending(true);

        try {
            const { data, error } = await supabase.functions.invoke('send-official-correspondence', {
                body: {
                    to: recipient,
                    subject: subject,
                    body: content,
                }
            });

            if (error) throw error;

            if (data?.success) {
                toast.success('Email envoyé avec succès');
                setSubject('');
                setRecipient('');
                setContent('');
                onClose();
            } else {
                throw new Error(data?.error || 'Erreur lors de l\'envoi');
            }
        } catch (error: any) {
            console.error('Erreur envoi email:', error);
            toast.error(error.message || 'Erreur lors de l\'envoi de l\'email');
        } finally {
            setIsSending(false);
        }
    };

    const handleClose = () => {
        if (!isSending) {
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-4 border-b bg-muted/30">
                    <DialogTitle className="flex items-center justify-between">
                        <span>{replyTo ? 'Répondre' : 'Nouveau Message'}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="p-4 flex flex-col gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="to" className="text-xs font-medium text-muted-foreground">À</Label>
                        <Input
                            id="to"
                            type="email"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            className="border-0 border-b rounded-none px-0 focus-visible:ring-0 shadow-none"
                            placeholder="destinataire@exemple.com"
                            disabled={isSending}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="subject" className="text-xs font-medium text-muted-foreground">Objet</Label>
                        <Input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="border-0 border-b rounded-none px-0 focus-visible:ring-0 shadow-none font-medium"
                            placeholder="Sujet du message"
                            disabled={isSending}
                        />
                    </div>

                    <div className="min-h-[200px]">
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[200px] border-0 focus-visible:ring-0 resize-none p-0 shadow-none"
                            placeholder="Rédigez votre message ici..."
                            disabled={isSending}
                        />
                    </div>
                </div>

                <DialogFooter className="p-4 border-t bg-muted/10 flex justify-between items-center sm:justify-between">
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" disabled={isSending}>
                        <Paperclip className="w-4 h-4" /> Joindre un fichier
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={handleClose} disabled={isSending}>
                            Annuler
                        </Button>
                        <Button onClick={handleSend} disabled={isSending} className="gap-2">
                            {isSending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Envoi...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Envoyer
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
