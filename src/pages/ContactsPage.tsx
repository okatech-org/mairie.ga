import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Users,
    Building2,
    UserCheck,
    Globe,
    Landmark,
    Phone,
    Mail,
    MapPin,
    Star,
    Circle,
    ChevronRight,
    Filter,
    X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    getAllContacts,
    searchContacts,
    type Contact,
    type ContactGroup,
    type ContactCategory,
    CATEGORY_CONFIG
} from '@/services/contactService';

// Mapping des icônes par catégorie
const CategoryIcon: Record<ContactCategory, React.ReactNode> = {
    citizen: <Users className="w-5 h-5" />,
    enterprise: <Building2 className="w-5 h-5" />,
    association: <UserCheck className="w-5 h-5" />,
    foreigner: <Globe className="w-5 h-5" />,
    collaborator: <Users className="w-5 h-5" />,
    inter_municipality: <Landmark className="w-5 h-5" />,
    administration: <Landmark className="w-5 h-5" />,
};

const ContactCard: React.FC<{ contact: Contact; onClick?: () => void }> = ({ contact, onClick }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl neu-raised hover:shadow-neo-lg transition-all cursor-pointer group"
            onClick={onClick}
        >
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                        {contact.firstName?.[0] || contact.name[0]}
                    </div>
                    {contact.isOnline !== undefined && (
                        <Circle
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 ${contact.isOnline ? 'text-green-500 fill-green-500' : 'text-gray-400 fill-gray-400'
                                }`}
                        />
                    )}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">
                            {contact.name}
                        </h3>
                        {contact.isOnline && (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                                En ligne
                            </Badge>
                        )}
                    </div>

                    {contact.position && (
                        <p className="text-sm text-muted-foreground truncate">
                            {contact.position}
                        </p>
                    )}

                    {contact.organization && (
                        <p className="text-xs text-muted-foreground/80 truncate">
                            {contact.organization}
                        </p>
                    )}

                    {contact.department && (
                        <p className="text-xs text-muted-foreground/80 truncate">
                            {contact.department}
                        </p>
                    )}

                    {/* Tags */}
                    {contact.tags && contact.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {contact.tags.slice(0, 3).map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {contact.phone && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-600"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `tel:${contact.phone}`;
                            }}
                        >
                            <Phone className="w-4 h-4" />
                        </Button>
                    )}
                    {contact.email && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-600"
                            onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `mailto:${contact.email}`;
                            }}
                        >
                            <Mail className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const ContactDetailModal: React.FC<{ contact: Contact | null; onClose: () => void }> = ({ contact, onClose }) => {
    if (!contact) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-md p-6 rounded-2xl neu-raised bg-background"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                            {contact.firstName?.[0] || contact.name[0]}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{contact.name}</h2>
                            {contact.position && (
                                <p className="text-muted-foreground">{contact.position}</p>
                            )}
                        </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Détails */}
                <div className="space-y-4">
                    {contact.organization && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                            <span>{contact.organization}</span>
                        </div>
                    )}

                    {contact.department && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Users className="w-5 h-5 text-muted-foreground" />
                            <span>{contact.department}</span>
                        </div>
                    )}

                    {contact.email && (
                        <a
                            href={`mailto:${contact.email}`}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                            <Mail className="w-5 h-5 text-blue-500" />
                            <span className="text-blue-600">{contact.email}</span>
                        </a>
                    )}

                    {contact.phone && (
                        <a
                            href={`tel:${contact.phone}`}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                            <Phone className="w-5 h-5 text-green-500" />
                            <span className="text-green-600">{contact.phone}</span>
                        </a>
                    )}

                    {contact.address && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <MapPin className="w-5 h-5 text-muted-foreground" />
                            <span>{contact.address}</span>
                        </div>
                    )}

                    {contact.tags && contact.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {contact.tags.map((tag, idx) => (
                                <Badge key={idx} variant="secondary">{tag}</Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                    {contact.email && (
                        <Button
                            className="flex-1"
                            onClick={() => window.location.href = `mailto:${contact.email}`}
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            Envoyer un email
                        </Button>
                    )}
                    {contact.phone && (
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => window.location.href = `tel:${contact.phone}`}
                        >
                            <Phone className="w-4 h-4 mr-2" />
                            Appeler
                        </Button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export const ContactsPage: React.FC = () => {
    const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Contact[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<ContactCategory | 'all'>('all');
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Charger les contacts
    useEffect(() => {
        const loadContacts = async () => {
            setIsLoading(true);
            try {
                const groups = await getAllContacts();
                setContactGroups(groups);
            } catch (error) {
                console.error('Erreur chargement contacts:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadContacts();
    }, []);

    // Recherche
    useEffect(() => {
        const doSearch = async () => {
            if (searchQuery.trim().length >= 2) {
                const results = await searchContacts(searchQuery);
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        };
        doSearch();
    }, [searchQuery]);

    // Filtrer les groupes par catégorie
    const filteredGroups = selectedCategory === 'all'
        ? contactGroups
        : contactGroups.filter(g => g.category === selectedCategory);

    // Contacts à afficher
    const displayedContacts = searchQuery.trim().length >= 2
        ? searchResults
        : filteredGroups.flatMap(g => g.contacts);

    const totalContacts = contactGroups.reduce((sum, g) => sum + g.count, 0);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
                <div className="max-w-6xl mx-auto p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold">Contacts</h1>
                            <p className="text-muted-foreground">
                                {totalContacts} contacts disponibles
                            </p>
                        </div>
                    </div>

                    {/* Barre de recherche */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Rechercher un contact..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-12 rounded-xl"
                        />
                        {searchQuery && (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="absolute right-2 top-1/2 -translate-y-1/2"
                                onClick={() => setSearchQuery('')}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    {/* Filtres par catégorie */}
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                        <Button
                            variant={selectedCategory === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory('all')}
                            className="rounded-full whitespace-nowrap"
                        >
                            Tous ({totalContacts})
                        </Button>
                        {contactGroups.map((group) => (
                            <Button
                                key={group.category}
                                variant={selectedCategory === group.category ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedCategory(group.category)}
                                className="rounded-full whitespace-nowrap"
                            >
                                <span className="mr-1">{group.icon}</span>
                                {group.label} ({group.count})
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Contenu */}
            <div className="max-w-6xl mx-auto p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                ) : searchQuery.trim().length >= 2 ? (
                    // Résultats de recherche
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            {searchResults.length} résultat(s) pour "{searchQuery}"
                        </p>
                        {searchResults.map((contact) => (
                            <ContactCard
                                key={contact.id}
                                contact={contact}
                                onClick={() => setSelectedContact(contact)}
                            />
                        ))}
                        {searchResults.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground">
                                Aucun contact trouvé
                            </div>
                        )}
                    </div>
                ) : (
                    // Liste groupée
                    <div className="space-y-8">
                        {filteredGroups.map((group) => (
                            <div key={group.category}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        {CategoryIcon[group.category]}
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-lg">{group.label}</h2>
                                        <p className="text-sm text-muted-foreground">
                                            {group.count} contact(s)
                                        </p>
                                    </div>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {group.contacts.map((contact) => (
                                        <ContactCard
                                            key={contact.id}
                                            contact={contact}
                                            onClick={() => setSelectedContact(contact)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de détail */}
            <AnimatePresence>
                {selectedContact && (
                    <ContactDetailModal
                        contact={selectedContact}
                        onClose={() => setSelectedContact(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default ContactsPage;
