import { useEffect, useState } from 'react';
import { Association } from '@/types/association';
import { associationService } from '@/services/association-service';
import { AssociationList } from '@/components/associations/AssociationList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CitizenAssociationsPage() {
    const [associations, setAssociations] = useState<Association[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAssociations = async () => {
            try {
                const data = await associationService.getAll();
                setAssociations(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAssociations();
    }, []);

    // Filter for "My Associations" (mock logic: ownerId = 'user-current')
    const myAssociations = associations.filter(a => a.ownerId === 'user-current');

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Associations</h1>
                    <p className="text-muted-foreground">Réseau associatif et gestion de vos associations.</p>
                </div>
                <Link to="/associations/new">
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Créer une association
                    </Button>
                </Link>
            </div>

            <Tabs defaultValue="network" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="network">Réseau Global</TabsTrigger>
                    <TabsTrigger value="mine">Mes Associations</TabsTrigger>
                </TabsList>

                <TabsContent value="network" className="mt-6">
                    <AssociationList associations={associations} isLoading={isLoading} />
                </TabsContent>

                <TabsContent value="mine" className="mt-6">
                    {myAssociations.length > 0 ? (
                        <AssociationList associations={myAssociations} isLoading={isLoading} />
                    ) : (
                        <div className="text-center py-12 neu-inset rounded-xl">
                            <p className="text-muted-foreground mb-4">Vous n'avez pas encore créé d'association.</p>
                            <Link to="/associations/new">
                                <Button variant="outline">Créer ma première association</Button>
                            </Link>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
