/**
 * Composant: IBoiteRecipientSearch
 * 
 * Recherche de destinataires iBoîte par nom ou service.
 * Pas d'email dans l'écosystème interne - la recherche se fait par:
 * - Nom/Prénom
 * - Service/Département
 * - Fonction/Rôle
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, User, Building2, Users, Star, Clock, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { iBoiteService } from '@/services/iboite-service';
import {
    IBoiteUserSearchResult,
    IBoiteServiceSearchResult,
    IBoiteContact,
    UserEnvironment,
    getRoleLabel
} from '@/types/environments';

// ============================================================
// TYPES
// ============================================================

interface Recipient {
    type: 'USER' | 'SERVICE';
    id: string;
    displayName: string;
    subtitle?: string;
    avatarUrl?: string;
    environment?: UserEnvironment;
}

interface IBoiteRecipientSearchProps {
    onSelect: (recipients: Recipient[]) => void;
    selectedRecipients?: Recipient[];
    multiple?: boolean;
    placeholder?: string;
    className?: string;
    showContacts?: boolean;
    showServices?: boolean;
    disabled?: boolean;
}

// ============================================================
// DEBOUNCE HOOK
// ============================================================

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// ============================================================
// COMPONENT
// ============================================================

export function IBoiteRecipientSearch({
    onSelect,
    selectedRecipients = [],
    multiple = false,
    placeholder = 'Rechercher un destinataire...',
    className,
    showContacts = true,
    showServices = true,
    disabled = false
}: IBoiteRecipientSearchProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'search' | 'contacts' | 'services'>('search');

    // Résultats de recherche
    const [userResults, setUserResults] = useState<IBoiteUserSearchResult[]>([]);
    const [serviceResults, setServiceResults] = useState<IBoiteServiceSearchResult[]>([]);
    const [contacts, setContacts] = useState<IBoiteContact[]>([]);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const debouncedQuery = useDebounce(query, 300);

    // Fermer quand on clique en dehors
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Charger les contacts
    useEffect(() => {
        if (showContacts) {
            iBoiteService.getContacts().then(setContacts);
        }
    }, [showContacts]);

    // Recherche
    useEffect(() => {
        const search = async () => {
            if (!debouncedQuery || debouncedQuery.length < 2) {
                setUserResults([]);
                setServiceResults([]);
                return;
            }

            setIsLoading(true);

            try {
                const [users, services] = await Promise.all([
                    iBoiteService.searchUsers({ query: debouncedQuery }),
                    showServices ? iBoiteService.searchServices({ query: debouncedQuery }) : []
                ]);

                setUserResults(users);
                setServiceResults(services);
            } catch (error) {
                console.error('[IBoiteRecipientSearch] Search error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        search();
    }, [debouncedQuery, showServices]);

    // Sélectionner un destinataire
    const handleSelect = useCallback((recipient: Recipient) => {
        if (multiple) {
            const exists = selectedRecipients.some(r => r.id === recipient.id);
            if (exists) {
                onSelect(selectedRecipients.filter(r => r.id !== recipient.id));
            } else {
                onSelect([...selectedRecipients, recipient]);
            }
        } else {
            onSelect([recipient]);
            setIsOpen(false);
            setQuery('');
        }
    }, [multiple, selectedRecipients, onSelect]);

    // Supprimer un destinataire
    const handleRemove = useCallback((recipientId: string) => {
        onSelect(selectedRecipients.filter(r => r.id !== recipientId));
    }, [selectedRecipients, onSelect]);

    // Convertir les résultats en Recipients
    const userToRecipient = (user: IBoiteUserSearchResult): Recipient => ({
        type: 'USER',
        id: user.userId,
        displayName: user.displayName,
        subtitle: `${getRoleLabel(user.roleLabel)}${user.organizationName ? ` • ${user.organizationName}` : ''}`,
        avatarUrl: user.avatarUrl,
        environment: user.environment
    });

    const serviceToRecipient = (service: IBoiteServiceSearchResult): Recipient => ({
        type: 'SERVICE',
        id: service.serviceId,
        displayName: service.serviceName,
        subtitle: service.organizationName
    });

    const contactToRecipient = (contact: IBoiteContact): Recipient => ({
        type: 'USER',
        id: contact.contactUserId || contact.id,
        displayName: contact.displayName,
        subtitle: `${contact.displayRole || ''}${contact.displayOrganization ? ` • ${contact.displayOrganization}` : ''}`,
        avatarUrl: contact.avatarUrl
    });

    // Vérifier si un destinataire est sélectionné
    const isSelected = (id: string) => selectedRecipients.some(r => r.id === id);

    // Obtenir les initiales
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Badge d'environnement
    const getEnvironmentBadge = (env?: UserEnvironment) => {
        if (!env) return null;

        const config: Record<UserEnvironment, { label: string; className: string }> = {
            [UserEnvironment.BACK_OFFICE]: {
                label: 'Admin',
                className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
            },
            [UserEnvironment.MUNICIPAL_STAFF]: {
                label: 'Municipal',
                className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            },
            [UserEnvironment.PUBLIC_USER]: {
                label: 'Usager',
                className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            }
        };

        const c = config[env];
        return <Badge variant="outline" className={cn('text-[10px] ml-2', c.className)}>{c.label}</Badge>;
    };

    return (
        <div ref={containerRef} className={cn('relative w-full', className)}>
            {/* Champ de recherche */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    value={query}
                    onChange={e => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        setActiveTab('search');
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className="pl-10"
                    disabled={disabled}
                />
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
            </div>

            {/* Destinataires sélectionnés */}
            {selectedRecipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {selectedRecipients.map(recipient => (
                        <Badge
                            key={recipient.id}
                            variant="secondary"
                            className="flex items-center gap-1 pr-1"
                        >
                            <Avatar className="h-4 w-4">
                                <AvatarImage src={recipient.avatarUrl} />
                                <AvatarFallback className="text-[8px]">
                                    {getInitials(recipient.displayName)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="max-w-[120px] truncate">{recipient.displayName}</span>
                            {!disabled && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() => handleRemove(recipient.id)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </Badge>
                    ))}
                </div>
            )}

            {/* Dropdown de résultats */}
            {isOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg overflow-hidden">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                        <TabsList className="w-full rounded-none border-b">
                            <TabsTrigger value="search" className="flex-1">
                                <Search className="h-3 w-3 mr-1" />
                                Recherche
                            </TabsTrigger>
                            {showContacts && (
                                <TabsTrigger value="contacts" className="flex-1">
                                    <User className="h-3 w-3 mr-1" />
                                    Contacts
                                </TabsTrigger>
                            )}
                            {showServices && (
                                <TabsTrigger value="services" className="flex-1">
                                    <Building2 className="h-3 w-3 mr-1" />
                                    Services
                                </TabsTrigger>
                            )}
                        </TabsList>

                        <ScrollArea className="max-h-[300px]">
                            {/* Onglet Recherche */}
                            <TabsContent value="search" className="m-0">
                                {!query && (
                                    <div className="p-4 text-center text-muted-foreground text-sm">
                                        Tapez un nom pour rechercher...
                                    </div>
                                )}

                                {query && userResults.length === 0 && serviceResults.length === 0 && !isLoading && (
                                    <div className="p-4 text-center text-muted-foreground text-sm">
                                        Aucun résultat pour "{query}"
                                    </div>
                                )}

                                {/* Utilisateurs */}
                                {userResults.length > 0 && (
                                    <div className="p-2">
                                        <div className="text-xs font-medium text-muted-foreground px-2 py-1 flex items-center">
                                            <Users className="h-3 w-3 mr-1" />
                                            Personnes
                                        </div>
                                        {userResults.map(user => (
                                            <ResultItem
                                                key={user.userId}
                                                recipient={userToRecipient(user)}
                                                isSelected={isSelected(user.userId)}
                                                onClick={() => handleSelect(userToRecipient(user))}
                                                getInitials={getInitials}
                                                getEnvironmentBadge={() => getEnvironmentBadge(user.environment)}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Services */}
                                {serviceResults.length > 0 && (
                                    <div className="p-2 border-t">
                                        <div className="text-xs font-medium text-muted-foreground px-2 py-1 flex items-center">
                                            <Building2 className="h-3 w-3 mr-1" />
                                            Services
                                        </div>
                                        {serviceResults.map(service => (
                                            <ResultItem
                                                key={service.serviceId}
                                                recipient={serviceToRecipient(service)}
                                                isSelected={isSelected(service.serviceId)}
                                                onClick={() => handleSelect(serviceToRecipient(service))}
                                                getInitials={getInitials}
                                                isService
                                            />
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* Onglet Contacts */}
                            {showContacts && (
                                <TabsContent value="contacts" className="m-0">
                                    {contacts.length === 0 ? (
                                        <div className="p-4 text-center text-muted-foreground text-sm">
                                            Aucun contact enregistré
                                        </div>
                                    ) : (
                                        <div className="p-2">
                                            {/* Favoris */}
                                            {contacts.filter(c => c.isFavorite).length > 0 && (
                                                <>
                                                    <div className="text-xs font-medium text-muted-foreground px-2 py-1 flex items-center">
                                                        <Star className="h-3 w-3 mr-1 text-yellow-500" />
                                                        Favoris
                                                    </div>
                                                    {contacts.filter(c => c.isFavorite).map(contact => (
                                                        <ResultItem
                                                            key={contact.id}
                                                            recipient={contactToRecipient(contact)}
                                                            isSelected={isSelected(contact.contactUserId || contact.id)}
                                                            onClick={() => handleSelect(contactToRecipient(contact))}
                                                            getInitials={getInitials}
                                                            isFavorite
                                                        />
                                                    ))}
                                                </>
                                            )}

                                            {/* Récents */}
                                            <div className="text-xs font-medium text-muted-foreground px-2 py-1 mt-2 flex items-center">
                                                <Clock className="h-3 w-3 mr-1" />
                                                Récents
                                            </div>
                                            {contacts.filter(c => !c.isFavorite).slice(0, 10).map(contact => (
                                                <ResultItem
                                                    key={contact.id}
                                                    recipient={contactToRecipient(contact)}
                                                    isSelected={isSelected(contact.contactUserId || contact.id)}
                                                    onClick={() => handleSelect(contactToRecipient(contact))}
                                                    getInitials={getInitials}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>
                            )}

                            {/* Onglet Services */}
                            {showServices && (
                                <TabsContent value="services" className="m-0">
                                    <div className="p-4 text-center text-muted-foreground text-sm">
                                        Utilisez la recherche pour trouver un service
                                    </div>
                                </TabsContent>
                            )}
                        </ScrollArea>
                    </Tabs>
                </div>
            )}
        </div>
    );
}

// ============================================================
// SUB-COMPONENT: ResultItem
// ============================================================

interface ResultItemProps {
    recipient: Recipient;
    isSelected: boolean;
    onClick: () => void;
    getInitials: (name: string) => string;
    getEnvironmentBadge?: () => React.ReactNode;
    isService?: boolean;
    isFavorite?: boolean;
}

function ResultItem({
    recipient,
    isSelected,
    onClick,
    getInitials,
    getEnvironmentBadge,
    isService,
    isFavorite
}: ResultItemProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'w-full flex items-center gap-3 px-2 py-2 rounded-md text-left transition-colors',
                'hover:bg-muted/50',
                isSelected && 'bg-primary/10 hover:bg-primary/20'
            )}
        >
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={recipient.avatarUrl} />
                <AvatarFallback className={cn(
                    'text-xs',
                    isService && 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                )}>
                    {isService ? <Building2 className="h-4 w-4" /> : getInitials(recipient.displayName)}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="flex items-center">
                    <span className={cn(
                        'font-medium truncate',
                        isSelected && 'text-primary'
                    )}>
                        {recipient.displayName}
                    </span>
                    {isFavorite && <Star className="h-3 w-3 ml-1 text-yellow-500 fill-yellow-500" />}
                    {getEnvironmentBadge?.()}
                </div>
                {recipient.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">
                        {recipient.subtitle}
                    </p>
                )}
            </div>

            {isSelected && (
                <div className="shrink-0 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}
        </button>
    );
}

export default IBoiteRecipientSearch;
