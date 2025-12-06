import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Conversation } from '@/types/messaging';
import { Paperclip } from 'lucide-react';

interface MailListProps {
    mails: Conversation[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export function MailList({ mails, selectedId, onSelect }: MailListProps) {
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

        if (isToday) {
            return time;
        }
        return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    };

    // Helper to truncate text with ellipsis
    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    };

    return (
        <ScrollArea className="h-full w-full">
            <div className="w-full">
                {mails.map((mail) => (
                    <div
                        key={mail.id}
                        onClick={() => onSelect(mail.id)}
                        className={cn(
                            "px-3 py-2.5 cursor-pointer transition-colors border-b border-border/30 hover:bg-muted/40 relative",
                            selectedId === mail.id
                                ? "bg-primary/5 border-l-2 border-l-primary"
                                : "bg-transparent border-l-2 border-l-transparent"
                        )}
                    >
                        {/* Row 1: Sender + Date */}
                        <div className="flex items-center justify-between gap-2">
                            <span className={cn(
                                "text-xs font-semibold",
                                mail.unreadCount > 0 ? "text-foreground" : "text-foreground/70"
                            )}>
                                {truncateText(mail.lastMessage.senderName, 25)}
                            </span>
                            <div className="flex items-center gap-1 shrink-0 text-[10px] text-muted-foreground">
                                {mail.lastMessage.attachments && mail.lastMessage.attachments.length > 0 && (
                                    <Paperclip className="w-2.5 h-2.5" />
                                )}
                                <span className={mail.unreadCount > 0 ? "text-primary font-medium" : ""}>
                                    {formatDateTime(mail.lastMessage.timestamp)}
                                </span>
                            </div>
                        </div>

                        {/* Row 2: Subject */}
                        <div className={cn(
                            "text-xs mt-0.5",
                            mail.unreadCount > 0 ? "font-semibold text-foreground" : "text-foreground/60"
                        )}>
                            {truncateText(mail.subject, 35)}
                        </div>

                        {/* Row 3: Preview */}
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                            {truncateText(mail.lastMessage.content, 45)}
                        </p>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
