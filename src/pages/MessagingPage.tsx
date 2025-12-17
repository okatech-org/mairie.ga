import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import { MailSidebar } from '@/components/mail/MailSidebar';
import { MailList } from '@/components/mail/MailList';
import { MailView } from '@/components/mail/MailView';
import { MailComposer } from '@/components/mail/MailComposer';
import { messagingService } from '@/services/messaging-service';
import { Button } from '@/components/ui/button';
import { Plus, Search, Menu, Mail, FolderOpen, Loader2, X, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Conversation, Message } from '@/types/messaging';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types for filter
type MailType = 'all' | 'OFFICIAL' | 'COMMERCIAL' | 'ASSOCIATION';

export default function MessagingPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // Core states
    const [currentFolder, setCurrentFolder] = useState('inbox');
    const [selectedMailId, setSelectedMailId] = useState<string | null>(null);
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [replyTo, setReplyTo] = useState<{ subject: string; recipient: string } | undefined>(undefined);

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<MailType>('all');
    const [isSearching, setIsSearching] = useState(false);

    // Loading state
    const [isLoading, setIsLoading] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [correspondenceCount, setCorrespondenceCount] = useState(0);

    // Initialize conversations - now user-specific
    useEffect(() => {
        const loadConversations = async () => {
            setIsLoading(true);
            try {
                // Load user-specific conversations from messaging service
                const userConversations = await messagingService.getConversations();
                setConversations(userConversations);
                console.log('[MessagingPage] Loaded conversations:', userConversations.length);
            } catch (error) {
                console.error('Error loading conversations:', error);
                toast.error('Erreur lors du chargement des messages');
            } finally {
                setIsLoading(false);
            }
        };

        const loadCorrespondenceCount = async () => {
            try {
                const { correspondanceService } = await import('@/services/correspondanceService');
                const count = await correspondanceService.getUnreadCount();
                setCorrespondenceCount(count);
            } catch (error) {
                console.error('Error loading correspondence count:', error);
                setCorrespondenceCount(0);
            }
        };

        loadConversations();
        loadCorrespondenceCount();
    }, []);

    // Handle navigation state (from iAsted or other pages)
    useEffect(() => {
        const state = location.state as {
            compose?: boolean;
            recipient?: string;
            subject?: string;
            body?: string;
            openMail?: string;
            search?: string;
        } | null;

        if (state?.compose) {
            setIsComposerOpen(true);
            if (state.recipient) {
                setReplyTo({
                    subject: state.subject || '',
                    recipient: state.recipient,
                });
            }
        }

        if (state?.openMail) {
            const mailToOpen = conversations.find(m => m.id === state.openMail);
            if (mailToOpen) {
                setSelectedMailId(mailToOpen.id);
                // Also load messages for this conversation
                messagingService.getMessages(mailToOpen.id).then(setMessages);
            }
        }

        if (state?.search) {
            setSearchQuery(state.search);
        }

        // Clear location state after processing
        if (state) {
            window.history.replaceState({}, document.title);
        }
    }, [location.state, conversations]);

    // Calculate unread count
    const unreadCount = useMemo(() => {
        return conversations.filter(c => c.unreadCount > 0).length;
    }, [conversations]);

    // Filter mails based on folder, search, and type
    const filteredMails = useMemo(() => {
        let mails = [...conversations];

        // Filter by folder
        switch (currentFolder) {
            case 'inbox':
                // All incoming messages
                break;
            case 'sent':
                mails = mails.filter(mail => mail.lastMessage.senderId === 'current-user');
                break;
            case 'drafts':
                // In production, filter by draft status
                mails = [];
                break;
            case 'archive':
                // In production, filter by archived status
                mails = [];
                break;
            case 'trash':
                // In production, filter by deleted status
                mails = [];
                break;
            case 'spam':
                // In production, filter by spam status
                mails = mails.filter(mail => mail.lastMessage.isPromotional);
                break;
        }

        // Filter by type
        if (typeFilter !== 'all') {
            mails = mails.filter(mail => mail.type === typeFilter);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            mails = mails.filter(mail =>
                mail.subject.toLowerCase().includes(query) ||
                mail.lastMessage.senderName.toLowerCase().includes(query) ||
                mail.lastMessage.content.toLowerCase().includes(query)
            );
        }

        return mails;
    }, [conversations, currentFolder, searchQuery, typeFilter]);

    const selectedMail = useMemo(() => {
        if (!selectedMailId) return null;
        return filteredMails.find(m => m.id === selectedMailId) || null;
    }, [selectedMailId, filteredMails]);

    // Handlers
    const handleReply = useCallback(() => {
        if (selectedMail) {
            setReplyTo({
                subject: selectedMail.subject,
                recipient: `${selectedMail.lastMessage.senderId}@exemple.com`
            });
            setIsComposerOpen(true);
        }
    }, [selectedMail]);

    const handleCompose = useCallback(() => {
        setReplyTo(undefined);
        setIsComposerOpen(true);
    }, []);

    const handleSearch = useCallback((value: string) => {
        setSearchQuery(value);
        setIsSearching(value.length > 0);
    }, []);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
        setIsSearching(false);
    }, []);

    const handleSelectFolder = useCallback((folder: string) => {
        setCurrentFolder(folder);
        setSelectedMailId(null);
        clearSearch();
    }, [clearSearch]);

    const handleSelectMail = useCallback(async (id: string) => {
        setSelectedMailId(id);

        // Load messages for this conversation
        try {
            const conversationMessages = await messagingService.getMessages(id);
            setMessages(conversationMessages);
        } catch (error) {
            console.error('Error loading messages:', error);
            toast.error('Erreur lors du chargement de la conversation');
        }

        // Mark as read (update local state - in production, call API)
        setConversations(prev => prev.map(conv =>
            conv.id === id ? { ...conv, unreadCount: 0 } : conv
        ));
    }, []);

    // Type filter labels
    const typeFilterLabels: Record<MailType, string> = {
        'all': 'Tous les types',
        'OFFICIAL': 'Officiels',
        'COMMERCIAL': 'Commerciaux',
        'ASSOCIATION': 'Associations',
    };

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-6rem)] flex flex-col overflow-hidden rounded-2xl neu-card border-none shadow-inner bg-muted/30">
                {/* Global Mail Header */}
                <div className="flex items-center justify-between p-4 border-b bg-background/50 backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden">
                                    <Menu className="w-5 h-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-72 p-0">
                                <div className="p-4 border-b flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-lg">iBoîte</span>
                                </div>
                                <div className="p-4">
                                    <Button className="w-full gap-2 mb-4 neu-raised" onClick={handleCompose}>
                                        <Plus className="w-4 h-4" /> Nouveau Message
                                    </Button>
                                    <Button
                                        className="w-full gap-2 mb-4 neu-raised text-amber-600 font-bold"
                                        onClick={() => navigate('/icorrespondance')}
                                    >
                                        <FolderOpen className="w-4 h-4" /> Correspondance
                                        <span className="ml-auto bg-amber-500 text-white text-[10px] items-center justify-center flex h-5 min-w-5 rounded-full px-1">
                                            {correspondenceCount}
                                        </span>
                                    </Button>
                                    <MailSidebar
                                        currentFolder={currentFolder}
                                        onSelectFolder={handleSelectFolder}
                                        unreadCount={unreadCount}
                                    />
                                </div>
                            </SheetContent>
                        </Sheet>
                        <div className="hidden md:flex items-center gap-2 text-primary">
                            <Mail className="w-6 h-6" />
                            <h1 className="text-xl font-bold">iBoîte</h1>
                        </div>
                    </div>

                    {/* Search Bar with clear button */}
                    <div className="flex-1 max-w-xl mx-4 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Rechercher dans tous les messages..."
                            className="pl-10 pr-10 bg-background/50 border-none shadow-sm focus-visible:ring-1 focus-visible:ring-primary/20 transition-all hover:bg-background/80"
                        />
                        {isSearching && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={clearSearch}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    {/* Correspondance Button */}
                    <Button
                        className="gap-2 hidden md:flex neu-raised hover:translate-y-[-2px] transition-transform text-amber-600 font-bold relative mr-2"
                        onClick={() => navigate('/icorrespondance')}
                    >
                        <FolderOpen className="w-4 h-4" />
                        <span className="hidden lg:inline">Correspondance</span>
                        <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                            {correspondenceCount}
                        </span>
                    </Button>

                    {/* New Message Button */}
                    <Button className="gap-2 hidden md:flex neu-raised hover:text-primary" onClick={handleCompose}>
                        <Plus className="w-4 h-4" />
                        <span className="hidden lg:inline">Nouveau Message</span>
                    </Button>
                </div>

                {/* 3-Pane Layout Content */}
                <div className="flex-1 flex min-h-0">

                    {/* Pane 1: Sidebar (Folders) */}
                    <div className="hidden md:flex w-48 flex-col border-r bg-background/30 p-3 gap-3">
                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                            <Button
                                className="w-full gap-2 neu-raised hover:translate-y-[-2px] transition-transform text-primary font-bold text-sm"
                                onClick={handleCompose}
                            >
                                <Plus className="w-4 h-4" /> <span className="truncate">Nouveau</span>
                            </Button>
                        </div>
                        <MailSidebar
                            currentFolder={currentFolder}
                            onSelectFolder={handleSelectFolder}
                            unreadCount={unreadCount}
                        />
                    </div>

                    {/* Pane 2: Mail List */}
                    <div className={`${selectedMailId ? 'hidden lg:flex' : 'flex'} w-full lg:w-[260px] xl:w-[280px] flex-col border-r bg-background/10`}>
                        <div className="p-3 border-b flex justify-between items-center bg-background/20">
                            <span className="text-sm font-medium text-muted-foreground">
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Chargement...
                                    </span>
                                ) : (
                                    <>
                                        {filteredMails.length} message{filteredMails.length > 1 ? 's' : ''}
                                        {searchQuery && ` pour "${searchQuery}"`}
                                    </>
                                )}
                            </span>

                            {/* Filter Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                                        <Filter className="w-3 h-3" />
                                        {typeFilter !== 'all' && (
                                            <span className="hidden sm:inline">{typeFilterLabels[typeFilter]}</span>
                                        )}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Filtrer par type</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {(Object.keys(typeFilterLabels) as MailType[]).map((type) => (
                                        <DropdownMenuItem
                                            key={type}
                                            onClick={() => setTypeFilter(type)}
                                            className={typeFilter === type ? 'bg-accent' : ''}
                                        >
                                            {typeFilterLabels[type]}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredMails.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 p-4">
                                <Mail className="w-10 h-10 opacity-20" />
                                <p className="text-sm text-center">
                                    {searchQuery
                                        ? `Aucun résultat pour "${searchQuery}"`
                                        : currentFolder === 'inbox'
                                            ? 'Aucun message'
                                            : `Aucun message dans ${currentFolder}`
                                    }
                                </p>
                                {searchQuery && (
                                    <Button variant="link" size="sm" onClick={clearSearch}>
                                        Effacer la recherche
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <MailList
                                mails={filteredMails}
                                selectedId={selectedMailId}
                                onSelect={handleSelectMail}
                            />
                        )}
                    </div>

                    {/* Pane 3: Reading View */}
                    <div className={`${!selectedMailId ? 'hidden lg:flex' : 'flex'} flex-1 flex-col bg-background`}>
                        {selectedMailId ? (
                            <>
                                <div className="lg:hidden p-2 border-b flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedMailId(null)}>
                                        ← Retour
                                    </Button>
                                </div>
                                <MailView
                                    mail={selectedMail}
                                    messages={messages}
                                    onReply={handleReply}
                                />
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4 bg-muted/5">
                                <div className="w-24 h-24 rounded-full neu-inset flex items-center justify-center">
                                    <Mail className="w-12 h-12 opacity-20" />
                                </div>
                                <p className="font-medium">Sélectionnez un message pour le lire</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <MailComposer
                isOpen={isComposerOpen}
                onClose={() => setIsComposerOpen(false)}
                replyTo={replyTo}
            />
        </DashboardLayout >
    );
}
