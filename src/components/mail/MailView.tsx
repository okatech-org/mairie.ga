import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Reply, ReplyAll, Forward, Trash2, MoreVertical, Paperclip, Download, File as FileIcon, Printer, Star } from 'lucide-react';
import { Conversation } from '@/types/messaging';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MailViewProps {
    mail: Conversation | null;
    onReply: () => void;
    onReplyAll?: () => void;
    onForward?: () => void;
    onDelete?: (mailId: string) => void;
    onStar?: (mailId: string) => void;
}

export function MailView({ mail, onReply, onReplyAll, onForward, onDelete, onStar }: MailViewProps) {
    const [isStarred, setIsStarred] = useState(false);

    if (!mail) return null;

    const handlePrint = () => {
        window.print();
        toast.info('Impression du message...');
    };

    const handleDelete = () => {
        if (onDelete) {
            onDelete(mail.id);
        } else {
            toast.success('Message déplacé vers la corbeille');
        }
    };

    const handleStar = () => {
        setIsStarred(!isStarred);
        if (onStar) {
            onStar(mail.id);
        }
        toast.success(isStarred ? 'Favori retiré' : 'Ajouté aux favoris ⭐');
    };

    const handleReplyAll = () => {
        if (onReplyAll) {
            onReplyAll();
        } else {
            // Fallback: use regular reply
            onReply();
            toast.info('Réponse à tous les destinataires');
        }
    };

    const handleForward = () => {
        if (onForward) {
            onForward();
        } else {
            toast.info('Fonctionnalité de transfert à venir');
        }
    };

    const handleDownloadAttachment = (attachment: { name: string; url: string }) => {
        // For demo, show toast - in production, trigger download
        toast.success(`Téléchargement de ${attachment.name}...`);
        // If there's a real URL, open it
        if (attachment.url && attachment.url !== '#') {
            window.open(attachment.url, '_blank');
        }
    };

    const handleMarkAsUnread = () => {
        toast.success('Message marqué comme non lu');
    };

    const handleArchive = () => {
        toast.success('Message archivé');
    };

    const handleReportSpam = () => {
        toast.success('Message signalé comme spam');
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 px-4 border-b shrink-0 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex gap-1">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={onReply}>
                                    <Reply className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Répondre</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={handleReplyAll}>
                                    <ReplyAll className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Répondre à tous</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={handleForward}>
                                    <Forward className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Transférer</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <Separator orientation="vertical" className="h-6 mx-2" />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={handlePrint}>
                                <Printer className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Imprimer</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={handleDelete}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Supprimer</TooltipContent>
                    </Tooltip>
                </div>
                <div className="flex gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={handleStar}>
                                <Star className={`w-4 h-4 ${isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{isStarred ? 'Retirer des favoris' : 'Ajouter aux favoris'}</TooltipContent>
                    </Tooltip>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleMarkAsUnread}>
                                Marquer comme non lu
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleArchive}>
                                Archiver
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleReportSpam} className="text-destructive">
                                Signaler comme spam
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <ScrollArea className="flex-1 bg-muted/10">
                <div className="p-8 max-w-4xl mx-auto">
                    {/* Email Container (Paper Look) */}
                    <div className="bg-background rounded-xl shadow-sm border p-8 min-h-[600px]">
                        {/* Header */}
                        <div className="flex flex-col gap-6 mb-8">
                            <div className="flex items-start justify-between gap-4">
                                <h1 className="text-2xl font-bold flex-1 break-words leading-tight">{mail.subject}</h1>
                                <Badge variant="secondary" className="text-xs px-2 py-1 shrink-0 uppercase tracking-wider font-semibold">
                                    {mail.type}
                                </Badge>
                            </div>

                            <div className="flex items-start gap-4">
                                <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                                        {mail.lastMessage.senderName[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline flex-wrap gap-2">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-lg">{mail.lastMessage.senderName}</span>
                                            <span className="text-sm text-muted-foreground">
                                                &lt;{mail.lastMessage.senderId}@exemple.com&gt;
                                            </span>
                                        </div>
                                        <span className="text-sm text-muted-foreground font-medium">
                                            {new Date(mail.lastMessage.timestamp).toLocaleString(undefined, {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        À: <span className="text-foreground font-medium">Moi</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator className="mb-8" />

                        {/* Body */}
                        <div className="prose prose-sm max-w-none dark:prose-invert mb-12 whitespace-pre-wrap leading-relaxed text-foreground/90">
                            {mail.lastMessage.content}
                        </div>

                        {/* Attachments */}
                        {mail.lastMessage.attachments && mail.lastMessage.attachments.length > 0 && (
                            <div className="border rounded-lg p-4 bg-muted/20">
                                <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-foreground/80">
                                    <Paperclip className="w-4 h-4" />
                                    {mail.lastMessage.attachments.length} Pièce(s) jointe(s)
                                </h4>
                                <div className="flex flex-wrap gap-3">
                                    {mail.lastMessage.attachments.map((att) => (
                                        <div
                                            key={att.id}
                                            className="flex items-center gap-3 p-3 border rounded-lg bg-background hover:bg-accent transition-all cursor-pointer group shadow-sm hover:shadow-md"
                                            onClick={() => handleDownloadAttachment(att)}
                                        >
                                            <div className="p-2.5 bg-primary/10 rounded-md text-primary">
                                                <FileIcon className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-foreground/90">{att.name}</span>
                                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{att.size || '1.2 MB'}</span>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                <Download className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer Actions */}
                        <div className="mt-12 flex gap-4">
                            <Button variant="outline" onClick={onReply} className="gap-2">
                                <Reply className="w-4 h-4" /> Répondre
                            </Button>
                            <Button variant="outline" onClick={handleForward} className="gap-2">
                                <Forward className="w-4 h-4" /> Transférer
                            </Button>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
