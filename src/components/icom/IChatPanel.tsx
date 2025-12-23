/**
 * IChatPanel - Panneau iChat style WhatsApp
 * 
 * Layout à 2 panneaux:
 * - Gauche: Liste des conversations avec recherche
 * - Droite: Conversation active avec zone de saisie
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Phone,
    Video,
    MoreVertical,
    Send,
    Paperclip,
    Smile,
    ChevronLeft,
    MessageSquare,
    Plus,
    Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { iBoiteService } from '@/services/iboite-service';
import { IBoiteRecipientSearch, Recipient } from '@/components/iboite/IBoiteRecipientSearch';
import type { IBoiteConversation, IBoiteMessage } from '@/types/environments';

interface IChatPanelProps {
    onStartCall?: (userId: string, displayName: string) => void;
    onStartVideo?: (userId: string, displayName: string) => void;
    onNewConversation?: () => void;
}

export function IChatPanel({ onStartCall, onStartVideo, onNewConversation }: IChatPanelProps) {
    const [conversations, setConversations] = useState<IBoiteConversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<IBoiteConversation | null>(null);
    const [messages, setMessages] = useState<IBoiteMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [showNewConversation, setShowNewConversation] = useState(false);
    const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Charger les conversations
    useEffect(() => {
        const loadConversations = async () => {
            setIsLoading(true);
            try {
                const data = await iBoiteService.getConversations();
                setConversations(data);
            } catch (error) {
                console.error('[IChatPanel] Error loading conversations:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadConversations();
    }, []);

    // Charger les messages quand une conversation est sélectionnée
    useEffect(() => {
        if (!selectedConversation) return;

        const loadMessages = async () => {
            try {
                const data = await iBoiteService.getMessages(selectedConversation.id);
                setMessages(data);
                // TODO: Implémenter markAsRead dans iBoiteService
            } catch (error) {
                console.error('[IChatPanel] Error loading messages:', error);
            }
        };
        loadMessages();
    }, [selectedConversation?.id]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Filtrer les conversations
    const filteredConversations = conversations.filter(c =>
        c.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Envoyer un message
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        setIsSending(true);
        try {
            await iBoiteService.sendMessage({
                conversationId: selectedConversation.id,
                content: newMessage.trim()
            });
            setNewMessage('');
            // Recharger les messages
            const data = await iBoiteService.getMessages(selectedConversation.id);
            setMessages(data);
        } catch (error) {
            console.error('[IChatPanel] Error sending message:', error);
        } finally {
            setIsSending(false);
        }
    };

    // Initiales pour avatar
    const getInitials = (name: string) =>
        name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

    return (
        <div className="flex h-full">
            {/* Panneau gauche - Liste des conversations */}
            <div className={cn(
                "w-80 border-r flex flex-col bg-muted/30",
                selectedConversation && "hidden md:flex"
            )}>
                {/* Header avec recherche */}
                <div className="p-3 border-b space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Conversations</h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowNewConversation(!showNewConversation)}
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>

                    {showNewConversation && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                <Users className="h-3 w-3" />
                                Destinataire(s)
                            </div>
                            <IBoiteRecipientSearch
                                onSelect={(recipients) => {
                                    setSelectedRecipients(recipients);
                                    if (recipients.length > 0) {
                                        // TODO: Créer une nouvelle conversation avec ce destinataire
                                        console.log('[IChatPanel] New conversation with:', recipients[0]);
                                    }
                                }}
                                selectedRecipients={selectedRecipients}
                                multiple={false}
                                placeholder="Tapez un nom pour rechercher..."
                                showOrganizations={true}
                                showServices={true}
                                showUsers={true}
                                showExternalInput={true}
                            />
                        </div>
                    )}

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                </div>

                {/* Liste des conversations */}
                <ScrollArea className="flex-1">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Aucune conversation</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredConversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedConversation(conv)}
                                    className={cn(
                                        "w-full p-3 flex gap-3 text-left hover:bg-muted/50 transition-colors",
                                        selectedConversation?.id === conv.id && "bg-primary/10"
                                    )}
                                >
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={conv.avatarUrl} />
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {getInitials(conv.displayName || '')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <span className="font-medium truncate">{conv.displayName}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {conv.lastMessagePreview || conv.subject || 'Nouvelle conversation'}
                                        </p>
                                    </div>
                                    {conv.unreadCount > 0 && (
                                        <Badge className="shrink-0">{conv.unreadCount}</Badge>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Panneau droite - Conversation active */}
            <div className={cn(
                "flex-1 flex flex-col",
                !selectedConversation && "hidden md:flex"
            )}>
                {selectedConversation ? (
                    <>
                        {/* Header conversation */}
                        <div className="h-16 px-4 border-b flex items-center gap-3 bg-background">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden"
                                onClick={() => setSelectedConversation(null)}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>

                            <Avatar className="h-10 w-10">
                                <AvatarImage src={selectedConversation.avatarUrl} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {getInitials(selectedConversation.displayName || '')}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate">{selectedConversation.displayName}</h3>
                                <p className="text-xs text-muted-foreground">En ligne</p>
                            </div>

                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onStartCall?.(selectedConversation.id, selectedConversation.displayName || '')}
                                >
                                    <Phone className="h-5 w-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onStartVideo?.(selectedConversation.id, selectedConversation.displayName || '')}
                                >
                                    <Video className="h-5 w-5" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Zone des messages */}
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-3">
                                {messages.map(msg => (
                                    <MessageBubble key={msg.id} message={msg} />
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>

                        {/* Zone de saisie */}
                        <div className="p-3 border-t bg-background">
                            <div className="flex gap-2 items-end">
                                <Button variant="ghost" size="icon" className="shrink-0">
                                    <Smile className="h-5 w-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="shrink-0">
                                    <Paperclip className="h-5 w-5" />
                                </Button>
                                <Textarea
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="Écrire un message..."
                                    className="min-h-[44px] max-h-32 resize-none"
                                    rows={1}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <Button
                                    size="icon"
                                    className="shrink-0"
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim() || isSending}
                                >
                                    <Send className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    /* État vide */
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                            <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
                            <h3 className="font-semibold text-lg mb-1">iChat</h3>
                            <p className="text-sm">Sélectionnez une conversation pour commencer</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Composant MessageBubble
function MessageBubble({ message }: { message: IBoiteMessage }) {
    const isOwn = message.senderName === 'Moi'; // TODO: comparer avec userId actuel

    return (
        <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
            <div className={cn(
                "max-w-[70%] rounded-2xl px-4 py-2",
                isOwn
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted rounded-bl-md"
            )}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className={cn(
                    "text-[10px] mt-1 text-right",
                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                    {new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
    );
}

export default IChatPanel;
