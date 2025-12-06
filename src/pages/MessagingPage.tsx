import { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { MailSidebar } from '@/components/mail/MailSidebar';
import { MailList } from '@/components/mail/MailList';
import { MailView } from '@/components/mail/MailView';
import { MailComposer } from '@/components/mail/MailComposer';
import { MOCK_CONVERSATIONS } from '@/data/mock-messages';
import { Button } from '@/components/ui/button';
import { Plus, Search, Menu, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

export default function MessagingPage() {
    const [currentFolder, setCurrentFolder] = useState('inbox');
    const [selectedMailId, setSelectedMailId] = useState<string | null>(null);
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [replyTo, setReplyTo] = useState<{ subject: string; recipient: string } | undefined>(undefined);

    // Filter mails based on folder (Mock Logic)
    const mails = MOCK_CONVERSATIONS.filter(mail => {
        if (currentFolder === 'inbox') return true; // Show all for demo
        if (currentFolder === 'sent') return mail.lastMessage.senderId === 'current-user'; // Mock check
        return false;
    });

    const selectedMail = selectedMailId ? mails.find(m => m.id === selectedMailId) || null : null;

    const handleReply = () => {
        if (selectedMail) {
            setReplyTo({
                subject: selectedMail.subject,
                recipient: selectedMail.lastMessage.senderName // Should be email in real app
            });
            setIsComposerOpen(true);
        }
    };

    const handleCompose = () => {
        setReplyTo(undefined);
        setIsComposerOpen(true);
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
                                    <MailSidebar
                                        currentFolder={currentFolder}
                                        onSelectFolder={setCurrentFolder}
                                        unreadCount={2}
                                    />
                                </div>
                            </SheetContent>
                        </Sheet>
                        <div className="hidden md:flex items-center gap-2 text-primary">
                            <Mail className="w-6 h-6" />
                            <h1 className="text-xl font-bold">iBoîte</h1>
                        </div>
                    </div>

                    <div className="flex-1 max-w-xl mx-4 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher dans tous les messages..."
                            className="pl-10 bg-background/50 border-none shadow-sm focus-visible:ring-1 focus-visible:ring-primary/20 transition-all hover:bg-background/80"
                        />
                    </div>

                    <Button className="gap-2 hidden md:flex neu-raised hover:text-primary" onClick={handleCompose}>
                        <Plus className="w-4 h-4" />
                        <span className="hidden lg:inline">Nouveau Message</span>
                    </Button>
                </div>

                {/* 3-Pane Layout Content */}
                <div className="flex-1 flex min-h-0">

                    {/* Pane 1: Sidebar (Folders) */}
                    <div className="hidden md:flex w-48 flex-col border-r bg-background/30 p-3 gap-3">
                        <Button className="w-full gap-2 neu-raised hover:translate-y-[-2px] transition-transform text-primary font-bold text-sm" onClick={handleCompose}>
                            <Plus className="w-4 h-4" /> <span className="truncate">Nouveau</span>
                        </Button>
                        <MailSidebar
                            currentFolder={currentFolder}
                            onSelectFolder={setCurrentFolder}
                            unreadCount={2}
                        />
                    </div>

                    {/* Pane 2: Mail List */}
                    <div className={`${selectedMailId ? 'hidden lg:flex' : 'flex'} w-full lg:w-64 flex-col border-r bg-background/10`}>
                        <div className="p-3 border-b flex justify-between items-center bg-background/20">
                            <span className="text-sm font-medium text-muted-foreground">
                                {mails.length} message{mails.length > 1 ? 's' : ''}
                            </span>
                            <Button variant="ghost" size="sm" className="h-8 text-xs">
                                Filtrer
                            </Button>
                        </div>
                        <MailList
                            mails={mails}
                            selectedId={selectedMailId}
                            onSelect={setSelectedMailId}
                        />
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
        </DashboardLayout>
    );
}
