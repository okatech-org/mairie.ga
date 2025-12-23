/**
 * ContactsDirectory - Annuaire des contacts
 * 
 * Affiche la liste des contacts accessibles selon le rôle de l'utilisateur:
 * - Personnel municipal: tous les contacts internes
 * - Visiteurs: seulement les contacts publics + services liés à leurs dossiers
 * 
 * Permet des actions rapides: iChat, iAppel, iCorrespondance
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Phone,
    MessageSquare,
    Video,
    Building2,
    User,
    Users,
    Filter,
    ChevronDown,
    Star,
    Briefcase,
    UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { iBoiteService } from '@/services/iboite-service';
import { IBoiteRecipientSearch, type Recipient } from '@/components/iboite/IBoiteRecipientSearch';
import type { ContactDirectoryEntry, ServiceMember } from '@/types/environments';

interface ContactsDirectoryProps {
    onStartChat?: (userId: string, displayName: string) => void;
    onStartCall?: (userId: string, displayName: string) => void;
    onStartMeeting?: (userId: string, displayName: string) => void;
    onAddToContacts?: (userId: string, displayName: string) => void;
    className?: string;
}

export const ContactsDirectory: React.FC<ContactsDirectoryProps> = ({
    onStartChat,
    onStartCall,
    onStartMeeting,
    onAddToContacts,
    className = ''
}) => {
    const [contacts, setContacts] = useState<ContactDirectoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'personnel' | 'services'>('all');
    const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);

    // Chargement des contacts
    useEffect(() => {
        const loadContacts = async () => {
            setLoading(true);
            try {
                const data = await iBoiteService.getContactsDirectory({
                    includeServices: true,
                    limit: 200
                });
                setContacts(data);
            } catch (error) {
                console.error('[ContactsDirectory] Error loading contacts:', error);
            } finally {
                setLoading(false);
            }
        };

        loadContacts();
    }, []);

    // Filtrage des contacts
    const filteredContacts = useMemo(() => {
        let result = contacts;

        // Filtre par type
        if (filter === 'personnel') {
            result = result.filter(c => c.environment === 'MUNICIPAL_STAFF');
        } else if (filter === 'services') {
            result = result.filter(c => c.services && c.services.length > 0);
        }

        // Filtre par recherche
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(c =>
                c.displayName.toLowerCase().includes(query) ||
                c.position?.toLowerCase().includes(query) ||
                c.organizationName?.toLowerCase().includes(query)
            );
        }

        return result;
    }, [contacts, filter, searchQuery]);

    // Grouper par organisation
    const groupedContacts = useMemo(() => {
        const groups: Record<string, ContactDirectoryEntry[]> = {};

        filteredContacts.forEach(contact => {
            const org = contact.organizationName || 'Autre';
            if (!groups[org]) {
                groups[org] = [];
            }
            groups[org].push(contact);
        });

        return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
    }, [filteredContacts]);

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Section de sélection des destinataires */}
            <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Destinataire(s)
                </h3>
                <IBoiteRecipientSearch
                    onSelect={(recipients) => {
                        setSelectedRecipients(recipients);
                        if (recipients.length > 0) {
                            const recipient = recipients[0];
                            // Ouvrir directement une action avec ce contact
                            onStartChat?.(recipient.id, recipient.displayName);
                        }
                    }}
                    selectedRecipients={selectedRecipients}
                    multiple={false}
                    placeholder="Rechercher un utilisateur, mairie, service..."
                    showOrganizations={true}
                    showServices={true}
                    showUsers={true}
                    showExternalInput={true}
                />
            </div>

            {/* Header avec recherche et filtres */}
            <div className="p-4 border-b border-border space-y-3">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un contact..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Filter className="h-4 w-4 mr-2" />
                                {filter === 'all' ? 'Tous' : filter === 'personnel' ? 'Personnel' : 'Services'}
                                <ChevronDown className="h-4 w-4 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setFilter('all')}>
                                <Users className="h-4 w-4 mr-2" />
                                Tous les contacts
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilter('personnel')}>
                                <User className="h-4 w-4 mr-2" />
                                Personnel municipal
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilter('services')}>
                                <Briefcase className="h-4 w-4 mr-2" />
                                Membres de services
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{filteredContacts.length} contact{filteredContacts.length > 1 ? 's' : ''}</span>
                </div>
            </div>

            {/* Liste des contacts */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {loading ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : groupedContacts.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Aucun contact trouvé</p>
                    </div>
                ) : (
                    <AnimatePresence>
                        {groupedContacts.map(([orgName, orgContacts]) => (
                            <motion.div
                                key={orgName}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="space-y-2"
                            >
                                {/* Nom de l'organisation */}
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                    <Building2 className="h-4 w-4" />
                                    <span>{orgName}</span>
                                    <Badge variant="secondary" className="text-xs">
                                        {orgContacts.length}
                                    </Badge>
                                </div>

                                {/* Contacts de l'organisation */}
                                <div className="space-y-2 pl-6">
                                    {orgContacts.map(contact => (
                                        <ContactCard
                                            key={contact.userId}
                                            contact={contact}
                                            onStartChat={onStartChat}
                                            onStartCall={onStartCall}
                                            onStartMeeting={onStartMeeting}
                                            onAddToContacts={onAddToContacts}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

// ============================================================
// Composant ContactCard
// ============================================================

interface ContactCardProps {
    contact: ContactDirectoryEntry;
    onStartChat?: (userId: string, displayName: string) => void;
    onStartCall?: (userId: string, displayName: string) => void;
    onStartMeeting?: (userId: string, displayName: string) => void;
    onAddToContacts?: (userId: string, displayName: string) => void;
}

const ContactCard: React.FC<ContactCardProps> = ({
    contact,
    onStartChat,
    onStartCall,
    onStartMeeting,
    onAddToContacts
}) => {
    const phone = contact.servicePhone || contact.phone;

    return (
        <Card className="bg-card hover:bg-muted/50 transition-colors">
            <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                    {/* Infos contact */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-medium truncate">
                                    {contact.displayName}
                                </span>
                                {contact.isPublicContact && (
                                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                )}
                            </div>
                            {contact.position && (
                                <p className="text-sm text-muted-foreground truncate">
                                    {contact.position}
                                </p>
                            )}
                            {contact.services && contact.services.length > 0 && (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                    {contact.services.slice(0, 2).map(service => (
                                        <Badge
                                            key={service.id}
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {service.name}
                                        </Badge>
                                    ))}
                                    {contact.services.length > 2 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{contact.services.length - 2}
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onStartChat?.(contact.userId, contact.displayName)}
                            title="iChat"
                        >
                            <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onStartCall?.(contact.userId, contact.displayName)}
                            title="iAppel"
                        >
                            <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onStartMeeting?.(contact.userId, contact.displayName)}
                            title="iRéunion"
                        >
                            <Video className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onAddToContacts?.(contact.userId, contact.displayName)}
                            title="iContact"
                        >
                            <UserPlus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ContactsDirectory;
