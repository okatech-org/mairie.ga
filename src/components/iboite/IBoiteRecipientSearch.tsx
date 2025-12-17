/**
 * Composant: IBoiteRecipientSearch
 * 
 * Recherche de destinataires iBoîte avec support pour:
 * - Utilisateurs (profiles)
 * - Organisations (mairies)
 * - Services municipaux
 * - Destinataires externes (email manuel)
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    Search,
    User,
    Building2,
    Briefcase,
    Mail,
    Star,
    Clock,
    X,
    Loader2,
    Users,
    MapPin
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { iBoiteService } from '@/services/iboite-service';
import type {
    GlobalRecipient,
    OrganizationRecipient,
    ServiceRecipient,
    RecipientType
} from '@/types/environments';

// ============================================================
// TYPES
// ============================================================

export interface Recipient {
    type: RecipientType;
    id: string;
    displayName: string;
    subtitle?: string;
    email?: string;
    avatarUrl?: string;
    organizationId?: string;
    organizationName?: string;
}

interface IBoiteRecipientSearchProps {
    onSelect: (recipients: Recipient[]) => void;
    selectedRecipients?: Recipient[];
    multiple?: boolean;
    placeholder?: string;
    className?: string;
    showOrganizations?: boolean;
    showServices?: boolean;
    showUsers?: boolean;
    showExternalInput?: boolean;
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
    showOrganizations = true,
    showServices = true,
    showUsers = true,
    showExternalInput = true,
    disabled = false
}: IBoiteRecipientSearchProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'search' | 'organizations' | 'services' | 'external'>('search');

    // Résultats
    const [searchResults, setSearchResults] = useState<GlobalRecipient[]>([]);
    const [organizations, setOrganizations] = useState<OrganizationRecipient[]>([]);
    const [services, setServices] = useState<ServiceRecipient[]>([]);

    // Email externe
    const [externalEmail, setExternalEmail] = useState('');
    const [externalName, setExternalName] = useState('');
    const [emailError, setEmailError] = useState<string | null>(null);

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

    // Charger les organisations au montage
    useEffect(() => {
        if (showOrganizations) {
            iBoiteService.getAllOrganizations().then(setOrganizations);
        }
    }, [showOrganizations]);

    // Charger les services au montage
    useEffect(() => {
        if (showServices) {
            iBoiteService.getOrganizationServices().then(setServices);
        }
    }, [showServices]);

    // Recherche globale
    useEffect(() => {
        const search = async () => {
            if (!debouncedQuery || debouncedQuery.length < 2) {
                setSearchResults([]);
                return;
            }

            setIsLoading(true);

            try {
                const results = await iBoiteService.searchGlobalRecipients({
                    query: debouncedQuery,
                    includeOrganizations: showOrganizations,
                    includeServices: showServices,
                    includeUsers: showUsers
                });

                setSearchResults(results);
            } catch (error) {
                console.error('[IBoiteRecipientSearch] Search error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        search();
    }, [debouncedQuery, showOrganizations, showServices, showUsers]);

    // Convertir GlobalRecipient en Recipient
    const globalToRecipient = (global: GlobalRecipient): Recipient => ({
        type: global.recipientType,
        id: global.recipientId,
        displayName: global.displayName,
        subtitle: global.subtitle,
        email: global.email,
        avatarUrl: global.avatarUrl,
        organizationId: global.organizationId,
        organizationName: global.organizationName
    });

    // Convertir OrganizationRecipient en Recipient
    const orgToRecipient = (org: OrganizationRecipient): Recipient => ({
        type: 'ORGANIZATION',
        id: org.id,
        displayName: org.name,
        subtitle: org.city || org.departement || 'Organisation',
        email: org.contactEmail,
        avatarUrl: org.logoUrl
    });

    // Convertir ServiceRecipient en Recipient
    const serviceToRecipient = (service: ServiceRecipient): Recipient => ({
        type: 'SERVICE',
        id: service.id,
        displayName: service.name,
        subtitle: service.organizationName || service.category || 'Service',
        organizationId: service.organizationId,
        organizationName: service.organizationName
    });

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

    // Ajouter un email externe
    const handleAddExternal = useCallback(() => {
        if (!externalEmail) {
            setEmailError('Veuillez saisir une adresse email');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(externalEmail)) {
            setEmailError('Adresse email invalide');
            return;
        }

        const externalRecipient: Recipient = {
            type: 'EXTERNAL',
            id: `external_${Date.now()}`,
            displayName: externalName || externalEmail,
            subtitle: externalName ? externalEmail : 'Destinataire externe',
            email: externalEmail
        };

        if (multiple) {
            onSelect([...selectedRecipients, externalRecipient]);
        } else {
            onSelect([externalRecipient]);
            setIsOpen(false);
        }

        setExternalEmail('');
        setExternalName('');
        setEmailError(null);
    }, [externalEmail, externalName, multiple, selectedRecipients, onSelect]);

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

    // Icône selon le type
    const getTypeIcon = (type: RecipientType) => {
        switch (type) {
            case 'USER': return <User className="h-4 w-4" />;
            case 'ORGANIZATION': return <Building2 className="h-4 w-4" />;
            case 'SERVICE': return <Briefcase className="h-4 w-4" />;
            case 'EXTERNAL': return <Mail className="h-4 w-4" />;
            default: return <User className="h-4 w-4" />;
        }
    };

    // Badge selon le type
    const getTypeBadge = (type: RecipientType) => {
        const config: Record<RecipientType, { label: string; className: string }> = {
            'USER': { label: 'Utilisateur', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
            'ORGANIZATION': { label: 'Organisation', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
            'SERVICE': { label: 'Service', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
            'EXTERNAL': { label: 'Externe', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' }
        };
        const c = config[type];
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
                            {getTypeIcon(recipient.type)}
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
                        <TabsList className="w-full rounded-none border-b grid grid-cols-4">
                            <TabsTrigger value="search" className="text-xs">
                                <Search className="h-3 w-3 mr-1" />
                                Recherche
                            </TabsTrigger>
                            {showOrganizations && (
                                <TabsTrigger value="organizations" className="text-xs">
                                    <Building2 className="h-3 w-3 mr-1" />
                                    Mairies
                                </TabsTrigger>
                            )}
                            {showServices && (
                                <TabsTrigger value="services" className="text-xs">
                                    <Briefcase className="h-3 w-3 mr-1" />
                                    Services
                                </TabsTrigger>
                            )}
                            {showExternalInput && (
                                <TabsTrigger value="external" className="text-xs">
                                    <Mail className="h-3 w-3 mr-1" />
                                    Externe
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

                                {query && searchResults.length === 0 && !isLoading && (
                                    <div className="p-4 text-center text-muted-foreground text-sm">
                                        Aucun résultat pour "{query}"
                                    </div>
                                )}

                                {searchResults.length > 0 && (
                                    <div className="p-2">
                                        {searchResults.map(result => (
                                            <ResultItem
                                                key={`${result.recipientType}_${result.recipientId}`}
                                                recipient={globalToRecipient(result)}
                                                isSelected={isSelected(result.recipientId)}
                                                onClick={() => handleSelect(globalToRecipient(result))}
                                                getInitials={getInitials}
                                                getTypeBadge={getTypeBadge}
                                                getTypeIcon={getTypeIcon}
                                            />
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            {/* Onglet Organisations */}
                            {showOrganizations && (
                                <TabsContent value="organizations" className="m-0">
                                    {organizations.length === 0 ? (
                                        <div className="p-4 text-center text-muted-foreground text-sm">
                                            Aucune organisation disponible
                                        </div>
                                    ) : (
                                        <div className="p-2">
                                            <div className="text-xs font-medium text-muted-foreground px-2 py-1 flex items-center">
                                                <Building2 className="h-3 w-3 mr-1" />
                                                Organisations ({organizations.length})
                                            </div>
                                            {organizations.map(org => (
                                                <ResultItem
                                                    key={org.id}
                                                    recipient={orgToRecipient(org)}
                                                    isSelected={isSelected(org.id)}
                                                    onClick={() => handleSelect(orgToRecipient(org))}
                                                    getInitials={getInitials}
                                                    getTypeBadge={getTypeBadge}
                                                    getTypeIcon={getTypeIcon}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>
                            )}

                            {/* Onglet Services */}
                            {showServices && (
                                <TabsContent value="services" className="m-0">
                                    {services.length === 0 ? (
                                        <div className="p-4 text-center text-muted-foreground text-sm">
                                            Aucun service disponible
                                        </div>
                                    ) : (
                                        <div className="p-2">
                                            <div className="text-xs font-medium text-muted-foreground px-2 py-1 flex items-center">
                                                <Briefcase className="h-3 w-3 mr-1" />
                                                Services ({services.length})
                                            </div>
                                            {services.map(service => (
                                                <ResultItem
                                                    key={service.id}
                                                    recipient={serviceToRecipient(service)}
                                                    isSelected={isSelected(service.id)}
                                                    onClick={() => handleSelect(serviceToRecipient(service))}
                                                    getInitials={getInitials}
                                                    getTypeBadge={getTypeBadge}
                                                    getTypeIcon={getTypeIcon}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>
                            )}

                            {/* Onglet Email Externe */}
                            {showExternalInput && (
                                <TabsContent value="external" className="m-0 p-4">
                                    <div className="space-y-3">
                                        <div className="text-sm font-medium flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            Ajouter un destinataire externe
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Envoyez un email à une personne hors de l'écosystème.
                                        </p>
                                        <Input
                                            type="email"
                                            placeholder="exemple@domaine.com"
                                            value={externalEmail}
                                            onChange={e => {
                                                setExternalEmail(e.target.value);
                                                setEmailError(null);
                                            }}
                                        />
                                        <Input
                                            placeholder="Nom (optionnel)"
                                            value={externalName}
                                            onChange={e => setExternalName(e.target.value)}
                                        />
                                        {emailError && (
                                            <p className="text-xs text-destructive">{emailError}</p>
                                        )}
                                        <Button
                                            size="sm"
                                            className="w-full"
                                            onClick={handleAddExternal}
                                        >
                                            <Mail className="h-4 w-4 mr-2" />
                                            Ajouter ce destinataire
                                        </Button>
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
    getTypeBadge: (type: RecipientType) => React.ReactNode;
    getTypeIcon: (type: RecipientType) => React.ReactNode;
}

function ResultItem({
    recipient,
    isSelected,
    onClick,
    getInitials,
    getTypeBadge,
    getTypeIcon
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
                    recipient.type === 'ORGANIZATION' && 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
                    recipient.type === 'SERVICE' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                    recipient.type === 'EXTERNAL' && 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                )}>
                    {recipient.type === 'ORGANIZATION' || recipient.type === 'SERVICE'
                        ? getTypeIcon(recipient.type)
                        : getInitials(recipient.displayName)}
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
                    {getTypeBadge(recipient.type)}
                </div>
                {recipient.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">
                        {recipient.subtitle}
                    </p>
                )}
                {recipient.email && recipient.type !== 'USER' && (
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {recipient.email}
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
