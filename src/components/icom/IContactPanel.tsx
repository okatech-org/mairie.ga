/**
 * IContactPanel - Panneau iContact style WhatsApp
 * 
 * Layout à 2 panneaux:
 * - Gauche: Annuaire des contacts avec recherche
 * - Droite: Détails du contact sélectionné
 */

import React, { useState, useEffect } from 'react';
import {
    Search,
    Phone,
    Video,
    MessageSquare,
    Star,
    Building2,
    User,
    Users,
    ChevronLeft,
    Mail,
    Briefcase,
    UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { iBoiteService } from '@/services/iboite-service';
import { IBoiteRecipientSearch, Recipient } from '@/components/iboite/IBoiteRecipientSearch';
import type { ContactDirectoryEntry } from '@/types/environments';

interface IContactPanelProps {
    onStartChat?: (userId: string, displayName: string) => void;
    onStartCall?: (userId: string, displayName: string) => void;
    onStartVideo?: (userId: string, displayName: string) => void;
}

export function IContactPanel({ onStartChat, onStartCall, onStartVideo }: IContactPanelProps) {
    const [contacts, setContacts] = useState<ContactDirectoryEntry[]>([]);
    const [selectedContact, setSelectedContact] = useState<ContactDirectoryEntry | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'services'>('all');
    const [isLoading, setIsLoading] = useState(true);

    // Charger les contacts
    useEffect(() => {
        const loadContacts = async () => {
            setIsLoading(true);
            try {
                const data = await iBoiteService.getContactsDirectory({
                    includeServices: true,
                    limit: 200
                });
                setContacts(data);
            } catch (error) {
                console.error('[IContactPanel] Error loading contacts:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadContacts();
    }, []);

    // Filtrer les contacts
    const filteredContacts = contacts.filter(c => {
        const matchesSearch = !searchQuery ||
            c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.organizationName?.toLowerCase().includes(searchQuery.toLowerCase());

        if (activeTab === 'favorites') return matchesSearch && c.isPublicContact;
        if (activeTab === 'services') return matchesSearch && c.services && c.services.length > 0;
        return matchesSearch;
    });

    // Grouper par lettre
    const groupedContacts = filteredContacts.reduce((acc, contact) => {
        const letter = contact.displayName[0]?.toUpperCase() || '#';
        if (!acc[letter]) acc[letter] = [];
        acc[letter].push(contact);
        return acc;
    }, {} as Record<string, ContactDirectoryEntry[]>);

    const getInitials = (name: string) =>
        name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

    return (
        <div className="flex h-full">
            {/* Panneau gauche - Liste */}
            <div className={cn(
                "w-80 border-r flex flex-col bg-muted/30",
                selectedContact && "hidden md:flex"
            )}>
                <div className="p-3 border-b space-y-3">
                    <h2 className="font-semibold">Contacts</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                    <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
                        <TabsList className="w-full grid grid-cols-3">
                            <TabsTrigger value="all" className="text-xs">Tous</TabsTrigger>
                            <TabsTrigger value="favorites" className="text-xs">Favoris</TabsTrigger>
                            <TabsTrigger value="services" className="text-xs">Services</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <ScrollArea className="flex-1">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                    ) : Object.keys(groupedContacts).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Aucun contact</p>
                        </div>
                    ) : (
                        Object.entries(groupedContacts).sort().map(([letter, contacts]) => (
                            <div key={letter}>
                                <div className="px-3 py-1 bg-muted/50 text-xs font-semibold text-muted-foreground sticky top-0">
                                    {letter}
                                </div>
                                {contacts.map(contact => (
                                    <button
                                        key={contact.userId}
                                        onClick={() => setSelectedContact(contact)}
                                        className={cn(
                                            "w-full p-3 flex gap-3 text-left hover:bg-muted/50 transition-colors",
                                            selectedContact?.userId === contact.userId && "bg-primary/10"
                                        )}
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {getInitials(contact.displayName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium truncate">{contact.displayName}</span>
                                                {contact.isPublicContact && (
                                                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />
                                                )}
                                            </div>
                                            {contact.position && (
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {contact.position}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ))
                    )}
                </ScrollArea>
            </div>

            {/* Panneau droite - Détails */}
            <div className={cn(
                "flex-1 flex flex-col",
                !selectedContact && "hidden md:flex"
            )}>
                {selectedContact ? (
                    <>
                        <div className="p-4 border-b flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden"
                                onClick={() => setSelectedContact(null)}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <span className="font-semibold">Détails du contact</span>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto">
                            {/* Avatar et nom */}
                            <div className="text-center mb-6">
                                <Avatar className="h-24 w-24 mx-auto mb-4">
                                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                                        {getInitials(selectedContact.displayName)}
                                    </AvatarFallback>
                                </Avatar>
                                <h3 className="text-xl font-semibold">{selectedContact.displayName}</h3>
                                {selectedContact.position && (
                                    <p className="text-muted-foreground">{selectedContact.position}</p>
                                )}
                                {selectedContact.organizationName && (
                                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        {selectedContact.organizationName}
                                    </p>
                                )}
                            </div>

                            {/* Actions rapides */}
                            <div className="flex justify-center gap-4 mb-6">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="flex flex-col items-center py-4 px-6 h-auto gap-1"
                                    onClick={() => onStartChat?.(selectedContact.userId, selectedContact.displayName)}
                                >
                                    <MessageSquare className="h-6 w-6 text-primary" />
                                    <span className="text-xs">Message</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="flex flex-col items-center py-4 px-6 h-auto gap-1"
                                    onClick={() => onStartCall?.(selectedContact.userId, selectedContact.displayName)}
                                >
                                    <Phone className="h-6 w-6 text-green-500" />
                                    <span className="text-xs">Appel</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="flex flex-col items-center py-4 px-6 h-auto gap-1"
                                    onClick={() => onStartVideo?.(selectedContact.userId, selectedContact.displayName)}
                                >
                                    <Video className="h-6 w-6 text-blue-500" />
                                    <span className="text-xs">Vidéo</span>
                                </Button>
                            </div>

                            {/* Infos supplémentaires */}
                            <Card>
                                <CardContent className="p-4 space-y-3">
                                    {(selectedContact.phone || selectedContact.servicePhone) && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">{selectedContact.servicePhone || selectedContact.phone}</span>
                                        </div>
                                    )}
                                    {selectedContact.services && selectedContact.services.length > 0 && (
                                        <div className="flex items-start gap-3">
                                            <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div className="flex gap-1 flex-wrap">
                                                {selectedContact.services.map(s => (
                                                    <Badge key={s.id} variant="secondary" className="text-xs">
                                                        {s.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <Users className="h-16 w-16 mx-auto text-primary opacity-50" />
                            <h3 className="font-semibold text-lg mb-1 mt-4">iContact</h3>
                            <p className="text-sm text-muted-foreground">
                                Sélectionnez un contact pour voir ses détails
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default IContactPanel;
