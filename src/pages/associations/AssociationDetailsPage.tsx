import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Association } from '@/types/association';
import { associationService } from '@/services/association-service';
import { Button } from '@/components/ui/button';
import { EntityStatusBadge } from '@/components/shared/EntityStatusBadge';
import { MapPin, Globe, Phone, Mail, ArrowLeft, Users, Calendar } from 'lucide-react';

export default function AssociationDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const [association, setAssociation] = useState<Association | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAssociation = async () => {
            if (!id) return;
            try {
                const data = await associationService.getById(id);
                setAssociation(data || null);
            } catch (error) {
                console.error('Failed to fetch association', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAssociation();
    }, [id]);

    if (isLoading) return <div className="container mx-auto py-8">Chargement...</div>;
    if (!association) return <div className="container mx-auto py-8">Association non trouvée</div>;

    return (
        <div className="container mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6 max-w-4xl mx-auto">
                <Link to="/associations">
                    <Button variant="ghost" className="gap-2 pl-0 hover:pl-0 hover:bg-transparent">
                        <ArrowLeft className="w-4 h-4" /> Retour aux associations
                    </Button>
                </Link>

                <div className="neu-raised p-8 rounded-xl space-y-6">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                            <div className="neu-inset w-20 h-20 rounded-xl flex items-center justify-center text-4xl">
                                🤝
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">{association.name}</h1>
                                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                    <span className="font-semibold">{association.associationType}</span>
                                </div>
                            </div>
                        </div>
                        <EntityStatusBadge status={association.status} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                            <div>
                                <h2 className="text-xl font-semibold mb-2">À propos</h2>
                                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                                    {association.description}
                                </p>
                            </div>

                            {association.objectives && (
                                <div className="p-4 bg-muted/30 rounded-lg">
                                    <h3 className="font-semibold mb-2">Objectifs</h3>
                                    <p className="text-sm text-muted-foreground">{association.objectives}</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="neu-inset p-6 rounded-xl space-y-4">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Coordonnées
                                </h3>

                                <div className="space-y-3 text-sm">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                                        <div>
                                            <div>{association.address.street}</div>
                                            <div>{association.address.postalCode} {association.address.city}</div>
                                            <div>{association.address.country}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                        <a href={`mailto:${association.email}`} className="hover:underline text-primary">
                                            {association.email}
                                        </a>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                        <a href={`tel:${association.phone}`} className="hover:underline">
                                            {association.phone}
                                        </a>
                                    </div>

                                    {association.website && (
                                        <div className="flex items-center gap-3">
                                            <Globe className="w-4 h-4 text-muted-foreground" />
                                            <a href={association.website} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary">
                                                Site Web
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {association.memberCount && (
                                    <div className="neu-raised p-3 rounded-lg text-center">
                                        <div className="text-xs text-muted-foreground mb-1">Membres</div>
                                        <div className="font-bold flex items-center justify-center gap-1">
                                            <Users className="w-3 h-3" /> {association.memberCount}
                                        </div>
                                    </div>
                                )}
                                {association.foundingYear && (
                                    <div className="neu-raised p-3 rounded-lg text-center">
                                        <div className="text-xs text-muted-foreground mb-1">Création</div>
                                        <div className="font-bold flex items-center justify-center gap-1">
                                            <Calendar className="w-3 h-3" /> {association.foundingYear}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
