import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, Filter, Building2, User, Mail, Shield, UserPlus } from "lucide-react";
import { COUNTRY_FLAGS } from "@/types/entity";
import { UserDialog } from "@/components/super-admin/UserDialog";
import { useToast } from "@/components/ui/use-toast";
import { profileService, ProfileWithRole } from "@/services/profileService";
import { MunicipalRole } from "@/types/municipal-roles";

export default function SuperAdminUsers() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [profiles, setProfiles] = useState<ProfileWithRole[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        setLoading(true);
        try {
            const data = await profileService.getAll();
            setProfiles(data);
        } catch (error) {
            console.error("Failed to load profiles", error);
            toast({
                title: "Erreur",
                description: "Impossible de charger les utilisateurs.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setSelectedUser(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (user: any) => {
        // Map table user to dialog format
        setSelectedUser({
            ...user,
            entityId: user.organizationId || user.employer || "", // Prefer explicit ID, fallback to employer
            name: user.name,
            role: user.role,
            email: user.email
            // Add other complex fields if they were persisted/available
        });
        setIsDialogOpen(true);
    };

    const handleSave = async (data: any) => {
        try {
            if (selectedUser) {
                // Update existing user
                const [firstName, ...lastNameParts] = data.name.split(' ');
                const lastName = lastNameParts.join(' ');

                await profileService.update(selectedUser.id, {
                    first_name: firstName,
                    last_name: lastName,
                    role: data.role,
                    email: data.email,
                    // Pass specific fields that profileService.update now handles for 'employer'
                    entityId: data.entityId,
                    // Note: complex fields (functions, etc) would go to specific columns if schema allows
                } as any);

                toast({
                    title: "Utilisateur modifié",
                    description: `Les droits de ${data.name} ont été mis à jour avec succès.`,
                });
            } else {
                // Create new user (Simulation)
                await profileService.create(data);

                toast({
                    title: "Invitation envoyée",
                    description: `Un email d'invitation a été envoyé à ${data.email} pour rejoindre ${data.entityId || "l'organisation"}.`,
                    variant: "default"
                });
            }
            // Reload to see changes (even if simulated, we might want to refresh what we can)
            loadProfiles();
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Failed to save user", error);
            toast({
                title: "Erreur",
                description: "Une erreur est survenue lors de l'enregistrement.",
                variant: "destructive"
            });
        }
    };

    // 1. Enrich Users with Entity Data
    const enrichedUsers = useMemo(() => {
        return profiles.map(user => {
            const orgName = user.organization?.name || user.employer || "Non assigné";
            const country = user.organization?.metadata?.country || "Gabon"; // Default to Gabon for now if generic

            return {
                id: user.id,
                name: `${user.first_name} ${user.last_name}`,
                email: user.email,
                role: user.role,
                employer: user.employer,
                organizationId: user.employer, // Use employer as link id
                entityName: orgName,
                country: country,
                countryCode: user.organization?.metadata?.countryCode || "GA",
                // Preserve original profile for full mapping if needed
                original: user
            };
        });
    }, [profiles]);

    // 2. Filter Users (Smart Search)
    const filteredUsers = useMemo(() => {
        if (!searchTerm) return enrichedUsers;
        const lowerTerm = searchTerm.toLowerCase();
        return enrichedUsers.filter(user =>
            user.name.toLowerCase().includes(lowerTerm) ||
            user.email?.toLowerCase().includes(lowerTerm) ||
            user.role?.toLowerCase().includes(lowerTerm) ||
            user.entityName.toLowerCase().includes(lowerTerm)
        );
    }, [searchTerm, enrichedUsers]);

    // 3. Segment Users: Country -> Organization -> Users
    const segmentedData = useMemo(() => {
        const countries: Record<string, Record<string, typeof enrichedUsers>> = {};

        filteredUsers.forEach(user => {
            const countryKey = user.country;
            const orgKey = user.entityName;

            if (!countries[countryKey]) countries[countryKey] = {};
            if (!countries[countryKey][orgKey]) countries[countryKey][orgKey] = [];

            countries[countryKey][orgKey].push(user);
        });

        return countries;
    }, [filteredUsers]);

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Gestion des Utilisateurs</h1>
                        <p className="text-muted-foreground">
                            Vue segmentée du personnel diplomatique par pays et organisation.
                        </p>
                    </div>
                    <Button className="neu-raised gap-2" onClick={handleAdd}>
                        <UserPlus className="w-4 h-4" />
                        Ajouter un Utilisateur
                    </Button>
                </div>

                {/* Smart Search Bar */}
                <Card className="neu-raised">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Rechercher par nom, email, rôle, pays ou organisation..."
                                className="pl-9 neu-inset"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="neu-raised gap-2">
                            <Filter className="w-4 h-4" />
                            Filtres
                        </Button>
                    </CardContent>
                </Card>

                {/* Segmented View */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : Object.keys(segmentedData).length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                            Aucun utilisateur trouvé pour cette recherche.
                        </div>
                    ) : (
                        Object.entries(segmentedData).map(([country, orgs]) => (
                            <Card key={country} className="neu-raised overflow-hidden border-none shadow-md">
                                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-3 pt-4 border-b">
                                    <CardTitle className="flex items-center gap-3 text-lg">
                                        <span className="text-2xl shadow-sm rounded bg-white px-1">{COUNTRY_FLAGS[Object.values(orgs)[0][0].countryCode] || '🏳️'}</span>
                                        {country}
                                        <Badge variant="secondary" className="ml-auto font-normal">
                                            {Object.values(orgs).reduce((acc, users) => acc + users.length, 0)} personnel(s)
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Accordion type="multiple" className="w-full">
                                        {Object.entries(orgs).map(([orgName, users]) => (
                                            <AccordionItem key={orgName} value={orgName} className="border-b last:border-0">
                                                <AccordionTrigger className="px-6 py-4 hover:bg-muted/5 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-primary/10 p-2 rounded-full">
                                                            <Building2 className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <span className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{orgName}</span>
                                                        <Badge variant="outline" className="text-xs font-normal ml-2">
                                                            {users.length}
                                                        </Badge>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="px-0 pb-0 bg-muted/5">
                                                    <div className="divide-y">
                                                        {users.map(user => (
                                                            <div key={user.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 pl-14 hover:bg-background transition-colors group">
                                                                <div className="flex items-center gap-4 mb-3 md:mb-0">
                                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold shadow-sm">
                                                                        {user.name.substring(0, 2).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium text-sm text-foreground">{user.name}</div>
                                                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                            <Mail className="h-3 w-3" /> {user.email || 'N/A'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                                                    <Badge variant={user.role === 'ADMIN' || user.role === 'super_admin' ? 'default' : 'secondary'} className="text-[10px] uppercase tracking-wider">
                                                                        <Shield className="h-3 w-3 mr-1" />
                                                                        {user.role}
                                                                    </Badge>
                                                                    <Button variant="ghost" size="sm" className="h-8 text-xs opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEdit(user)}>
                                                                        Gérer
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                <UserDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    initialData={selectedUser}
                    onSave={handleSave}
                />
            </div>
        </DashboardLayout>
    );
}
