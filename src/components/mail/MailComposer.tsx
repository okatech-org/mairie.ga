import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Paperclip, Send, Loader2, X, FileText } from 'lucide-react';
import { useState, useRef } from 'react';
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

interface Attachment {
    file: File;
    uploading: boolean;
    url?: string;
}

export function MailComposer({ isOpen, onClose, replyTo }: MailComposerProps) {
    const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
    const [recipient, setRecipient] = useState(replyTo ? replyTo.recipient : '');
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        
        // Only accept PDF files
        if (file.type !== 'application/pdf') {
            toast.error('Seuls les fichiers PDF sont acceptés');
            return;
        }

        // Max 10MB
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Le fichier ne doit pas dépasser 10 Mo');
            return;
        }

        const newAttachment: Attachment = { file, uploading: true };
        setAttachments(prev => [...prev, newAttachment]);

        try {
            const fileName = `${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage
                .from('email-attachments')
                .upload(fileName, file);

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('email-attachments')
                .getPublicUrl(data.path);

            setAttachments(prev => 
                prev.map(att => 
                    att.file === file 
                        ? { ...att, uploading: false, url: urlData.publicUrl }
                        : att
                )
            );
            toast.success('Fichier joint avec succès');
        } catch (error: any) {
            console.error('Erreur upload:', error);
            toast.error('Erreur lors du téléchargement du fichier');
            setAttachments(prev => prev.filter(att => att.file !== file));
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (file: File) => {
        setAttachments(prev => prev.filter(att => att.file !== file));
    };

    const handleSend = async () => {
        if (!recipient || !subject) {
            toast.error('Veuillez remplir le destinataire et l\'objet');
            return;
        }

        // Check if any attachment is still uploading
        if (attachments.some(att => att.uploading)) {
            toast.error('Veuillez attendre la fin du téléchargement des pièces jointes');
            return;
        }

        setIsSending(true);

        try {
            const attachment = attachments.length > 0 ? attachments[0] : null;
            
            const { data, error } = await supabase.functions.invoke('send-official-correspondence', {
                body: {
                    to: recipient,
                    subject: subject,
                    body: content,
                    attachmentUrl: attachment?.url,
                    attachmentName: attachment?.file.name,
                }
            });

            if (error) throw error;

            if (data?.success) {
                toast.success('Email envoyé avec succès');
                setSubject('');
                setRecipient('');
                setContent('');
                setAttachments([]);
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
            setAttachments([]);
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

                    {/* Attachments display */}
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                            {attachments.map((att, index) => (
                                <div 
                                    key={index}
                                    className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2 text-sm"
                                >
                                    <FileText className="w-4 h-4 text-primary" />
                                    <span className="max-w-[150px] truncate">{att.file.name}</span>
                                    {att.uploading ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                    ) : (
                                        <button 
                                            onClick={() => removeAttachment(att.file)}
                                            className="hover:text-destructive transition-colors"
                                            disabled={isSending}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="p-4 border-t bg-muted/10 flex justify-between items-center sm:justify-between">
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={isSending || attachments.length >= 1}
                        />
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="gap-2 text-muted-foreground"
                            disabled={isSending || attachments.length >= 1}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip className="w-4 h-4" /> 
                            {attachments.length >= 1 ? 'Pièce jointe ajoutée' : 'Joindre un PDF'}
                        </Button>
                    </div>
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
