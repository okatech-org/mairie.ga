/**
 * Page iBoîte - Messagerie Interne Complète
 * 
 * Liste des conversations, interface de chat et composition de nouveaux messages.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import { iBoiteService } from '@/services/iboite-service';
import { IBoiteComposeMessage } from '@/components/iboite/IBoiteComposeMessage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Plus,
    Search,
    Mail,
    Send,
    Archive,
    Star,
    Trash2,
    MoreVertical,
    Paperclip,
    ChevronLeft,
    Users,
    Clock,
    Check,
    CheckCheck,
    Loader2,
    Inbox,
    FolderOpen,
    MessageSquare
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { IBoiteConversation, IBoiteMessage } from '@/types/environments';

// ============================================================
// COMPOSANTS INTERNES
// ============================================================

interface ConversationItemProps {
    conversation: IBoiteConversation;
    isSelected: boolean;
    onClick: () => void;
}

function ConversationItem({ conversation, isSelected, onClick }: ConversationItemProps) {
    const initials = conversation.displayName
        ?.split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?';

    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full p-3 flex gap-3 text-left transition-all hover:bg-accent/50 rounded-lg",
                isSelected && "bg-accent"
            )}
        >
            <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={conversation.avatarUrl} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {initials}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                        "font-medium truncate text-sm",
                        conversation.unreadCount > 0 && "font-semibold"
                    )}>
                        {conversation.displayName}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                        {conversation.lastMessageAt
                            ? formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true, locale: fr })
                            : ''
                        }
                    </span>
                </div>

                {conversation.subject && (
                    <p className="text-xs text-muted-foreground truncate">
                        {conversation.subject}
                    </p>
                )}

                <p className={cn(
                    "text-xs truncate mt-0.5",
                    conversation.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
                )}>
                    {conversation.lastMessagePreview || 'Nouvelle conversation'}
                </p>
            </div>

            {conversation.unreadCount > 0 && (
                <Badge variant="default" className="h-5 min-w-5 rounded-full text-[10px] shrink-0">
                    {conversation.unreadCount}
                </Badge>
            )}
        </button>
    );
}

interface MessageBubbleProps {
    message: IBoiteMessage;
    isOwnMessage: boolean;
}

function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
    return (
        <div className={cn(
            "flex gap-2 max-w-[80%]",
            isOwnMessage ? "ml-auto flex-row-reverse" : ""
        )}>
            {!isOwnMessage && (
                <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-muted text-xs">
                        {message.senderName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'}
                    </AvatarFallback>
                </Avatar>
            )}

            <div className={cn(
                "rounded-2xl px-4 py-2",
                isOwnMessage
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
            )}>
                {!isOwnMessage && (
                    <p className="text-xs font-medium mb-1 opacity-70">
                        {message.senderName}
                    </p>
                )}

                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {message.isOfficial && (
                    <Badge variant="outline" className="mt-2 text-[10px]">
                        Message officiel {message.officialReference && `• ${message.officialReference}`}
                    </Badge>
                )}

                <div className={cn(
                    "flex items-center gap-1 mt-1 text-[10px]",
                    isOwnMessage ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"
                )}>
                    <span>{format(new Date(message.createdAt), 'HH:mm', { locale: fr })}</span>
                    {isOwnMessage && <CheckCheck className="h-3 w-3" />}
                </div>
            </div>
        </div>
    );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================

export default function IBoitePage() {
    const navigate = useNavigate();

    // États
    const [conversations, setConversations] = useState<IBoiteConversation[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<IBoiteMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [activeFolder, setActiveFolder] = useState<'inbox' | 'starred' | 'archive'>('inbox');

    // Charger les conversations
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const { supabase } = await import('@/integrations/supabase/client');
                const { data: session } = await supabase.auth.getSession();
                if (session?.session?.user?.id) {
                    setCurrentUserId(session.session.user.id);
                }

                const convs = await iBoiteService.getConversations({
                    archived: activeFolder === 'archive'
                });
                setConversations(convs);
            } catch (error) {
                console.error('[IBoitePage] Error loading conversations:', error);
                toast.error('Erreur lors du chargement des conversations');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [activeFolder]);

    // Charger les messages de la conversation sélectionnée
    useEffect(() => {
        if (!selectedConversationId) {
            setMessages([]);
            return;
        }

        const loadMessages = async () => {
            setIsLoadingMessages(true);
            try {
                const msgs = await iBoiteService.getMessages(selectedConversationId);
                setMessages(msgs.reverse()); // Ordre chronologique
            } catch (error) {
                console.error('[IBoitePage] Error loading messages:', error);
                toast.error('Erreur lors du chargement des messages');
            } finally {
                setIsLoadingMessages(false);
            }
        };

        loadMessages();
    }, [selectedConversationId]);

    // Conversation sélectionnée
    const selectedConversation = useMemo(() => {
        return conversations.find(c => c.id === selectedConversationId) || null;
    }, [conversations, selectedConversationId]);

    // Filtrer les conversations
    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        const query = searchQuery.toLowerCase();
        return conversations.filter(c =>
            c.displayName?.toLowerCase().includes(query) ||
            c.subject?.toLowerCase().includes(query) ||
            c.lastMessagePreview?.toLowerCase().includes(query)
        );
    }, [conversations, searchQuery]);

    // Compteur non lus
    const unreadCount = useMemo(() => {
        return conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
    }, [conversations]);

    // Envoyer un message
    const handleSendMessage = useCallback(async () => {
        if (!newMessage.trim() || !selectedConversationId || isSending) return;

        setIsSending(true);
        try {
            const sent = await iBoiteService.sendMessage({
                conversationId: selectedConversationId,
                content: newMessage.trim()
            });

            if (sent) {
                setMessages(prev => [...prev, sent]);
                setNewMessage('');

                // Mettre à jour la conversation dans la liste
                setConversations(prev => prev.map(c =>
                    c.id === selectedConversationId
                        ? {
                            ...c,
                            lastMessagePreview: sent.content,
                            lastMessageAt: sent.createdAt
                        }
                        : c
                ));
            }
        } catch (error) {
            console.error('[IBoitePage] Error sending message:', error);
            toast.error('Erreur lors de l\'envoi du message');
        } finally {
            setIsSending(false);
        }
    }, [newMessage, selectedConversationId, isSending]);

    // Callback après envoi depuis le composer
    const handleMessageSent = useCallback((conversationId: string) => {
        toast.success('Message envoyé');
        setIsComposeOpen(false);

        // Recharger les conversations
        iBoiteService.getConversations({
            archived: activeFolder === 'archive'
        }).then(convs => {
            setConversations(convs);
            if (conversationId !== 'external') {
                setSelectedConversationId(conversationId);
            }
        });
    }, [activeFolder]);

    // Navigation retour (mobile)
    const handleBack = useCallback(() => {
        setSelectedConversationId(null);
    }, []);

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-6rem)] flex rounded-2xl overflow-hidden border bg-background/50 backdrop-blur-sm">
                {/* Sidebar - Liste des conversations */}
                <div className={cn(
                    "w-full md:w-80 lg:w-96 flex flex-col border-r bg-background/30",
                    selectedConversationId && "hidden md:flex"
                )}>
                    {/* Header */}
                    <div className="p-4 border-b space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Mail className="h-5 w-5 text-primary" />
                                <h1 className="font-bold text-lg">iBoîte</h1>
                                {unreadCount > 0 && (
                                    <Badge variant="default" className="h-5 text-xs">
                                        {unreadCount}
                                    </Badge>
                                )}
                            </div>
                            <Button size="sm" onClick={() => setIsComposeOpen(true)}>
                                <Plus className="h-4 w-4 mr-1" />
                                Nouveau
                            </Button>
                        </div>

                        {/* Recherche */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher..."
                                className="pl-9 bg-muted/50"
                            />
                        </div>

                        {/* Onglets */}
                        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
                            <Button
                                variant={activeFolder === 'inbox' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="flex-1 h-8"
                                onClick={() => setActiveFolder('inbox')}
                            >
                                <Inbox className="h-4 w-4 mr-1" />
                                Boîte
                            </Button>
                            <Button
                                variant={activeFolder === 'starred' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="flex-1 h-8"
                                onClick={() => setActiveFolder('starred')}
                            >
                                <Star className="h-4 w-4 mr-1" />
                                Favoris
                            </Button>
                            <Button
                                variant={activeFolder === 'archive' ? 'secondary' : 'ghost'}
                                size="sm"
                                className="flex-1 h-8"
                                onClick={() => setActiveFolder('archive')}
                            >
                                <Archive className="h-4 w-4 mr-1" />
                                Archives
                            </Button>
                        </div>
                    </div>

                    {/* Liste des conversations */}
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                    <MessageSquare className="h-12 w-12 opacity-20 mb-3" />
                                    <p className="text-sm">Aucune conversation</p>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => setIsComposeOpen(true)}
                                    >
                                        Démarrer une conversation
                                    </Button>
                                </div>
                            ) : (
                                filteredConversations.map(conv => (
                                    <ConversationItem
                                        key={conv.id}
                                        conversation={conv}
                                        isSelected={conv.id === selectedConversationId}
                                        onClick={() => setSelectedConversationId(conv.id)}
                                    />
                                ))
                            )}
                        </div>
                    </ScrollArea>

                    {/* Accès Correspondance */}
                    <div className="p-3 border-t">
                        <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => navigate('/icorrespondance')}
                        >
                            <FolderOpen className="h-4 w-4 mr-2 text-amber-500" />
                            Correspondance officielle
                        </Button>
                    </div>
                </div>

                {/* Zone de chat */}
                <div className={cn(
                    "flex-1 flex flex-col",
                    !selectedConversationId && "hidden md:flex"
                )}>
                    {selectedConversation ? (
                        <>
                            {/* Header conversation */}
                            <div className="p-4 border-b flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden"
                                    onClick={handleBack}
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>

                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={selectedConversation.avatarUrl} />
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {selectedConversation.displayName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0">
                                    <h2 className="font-semibold truncate">
                                        {selectedConversation.displayName}
                                    </h2>
                                    {selectedConversation.subject && (
                                        <p className="text-xs text-muted-foreground truncate">
                                            {selectedConversation.subject}
                                        </p>
                                    )}
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            <Star className="h-4 w-4 mr-2" />
                                            Marquer comme favori
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Archive className="h-4 w-4 mr-2" />
                                            Archiver
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Supprimer
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Messages */}
                            <ScrollArea className="flex-1 p-4">
                                {isLoadingMessages ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                        <MessageSquare className="h-12 w-12 opacity-20 mb-3" />
                                        <p className="text-sm">Aucun message</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map(msg => (
                                            <MessageBubble
                                                key={msg.id}
                                                message={msg}
                                                isOwnMessage={msg.senderId === currentUserId}
                                            />
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>

                            {/* Zone de saisie */}
                            <div className="p-4 border-t bg-background/50">
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="shrink-0">
                                        <Paperclip className="h-5 w-5" />
                                    </Button>
                                    <Textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Écrire un message..."
                                        className="resize-none min-h-[44px] max-h-32"
                                        rows={1}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                    />
                                    <Button
                                        size="icon"
                                        className="shrink-0"
                                        disabled={!newMessage.trim() || isSending}
                                        onClick={handleSendMessage}
                                    >
                                        {isSending ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <Send className="h-5 w-5" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                            <Mail className="h-16 w-16 opacity-20 mb-4" />
                            <h2 className="text-xl font-semibold mb-2">iBoîte</h2>
                            <p className="text-sm mb-4">Sélectionnez une conversation ou créez-en une nouvelle</p>
                            <Button onClick={() => setIsComposeOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Nouveau message
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de composition */}
            <IBoiteComposeMessage
                open={isComposeOpen}
                onOpenChange={setIsComposeOpen}
                onSent={handleMessageSent}
                onError={(err) => toast.error(err)}
            />
        </DashboardLayout>
    );
}
