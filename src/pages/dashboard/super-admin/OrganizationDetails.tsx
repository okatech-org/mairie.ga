import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
    Building2, MapPin, Globe, ArrowLeft,
    Save, Users, CreditCard, FileText, Settings, Activity, Calendar,
    Clock, CheckCircle2, AlertTriangle, FileCheck, ShoppingCart, Plus, Minus,
    Download, FileDown, AlertCircle
} from "lucide-react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Organization } from "@/types/organization";
import { organizationService } from "@/services/organizationService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


import { profileService, ProfileWithRole } from "@/services/profileService";
import { UserDialog } from "@/components/super-admin/UserDialog";

// Refined Pricing Data (4 Tiers)
const PLANS = {
    VILLAGE: {
        name: 'Pack Village',
        price: 0,
        popLimit: 2000,
        agentLimit: 5,
        description: 'Digitalisation rurale',
        features: ['État Civil (Naissances)', '5 Agents', 'Support Communautaire']
    },
    BOURG: {
        name: 'Pack Bourg',
        price: 500000,
        popLimit: 10000,
        agentLimit: 15,
        description: 'Communes en développement',
        features: ['Tout Village +', 'Mariages & Décès', 'Archives (100 Go)', '15 Agents']
    },
    CITE: {
        name: 'Pack Cité',
        price: 2500000,
        popLimit: 100000,
        agentLimit: 50,
        description: 'Villes moyennes',
        features: ['Tout Bourg +', 'Urbanisme', 'Signalements', '50 Agents', 'App Citoyen']
    },
    METROPOLE: {
        name: 'Pack Métropole',
        price: 10000000,
        popLimit: Infinity,
        agentLimit: Infinity,
        description: 'Grandes agglomérations',
        features: ['Tout Cité +', 'Modules iAsted (IA)', 'API Ouverte', 'Agents Illimités', 'Support VIP']
    }
};

// Granular Options with Unit Pricing
const OPTIONS_CATALOG = [
    { id: 'storage_unit', name: 'Stockage Cloud (+100 Go)', price: 15000, category: 'Infrastructure', type: 'quantity', unit: 'blocs' },
    { id: 'sms_pack_10k', name: 'Pack SMS (+10k)', price: 100000, category: 'Communication', type: 'quantity', unit: 'packs' },
    { id: 'agent_pack_5', name: 'Pack Agents (+5)', price: 50000, category: 'RH', type: 'quantity', unit: 'packs' },
    { id: 'module_travaux', name: 'Module "Grands Travaux"', price: 250000, category: 'Module', type: 'boolean' },
    { id: 'kit_nomade', name: 'Kit État Civil Nomade', price: 150000, category: 'Matériel', type: 'quantity', unit: 'kits' },
    { id: 'formation', name: 'Formation Continue', price: 300000, category: 'Service', type: 'boolean' },
];

export default function OrganizationDetails() {
    const { entityId } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "general";
    const { toast } = useToast();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);

    // Billing State
    const [selectedPlan, setSelectedPlan] = useState<'VILLAGE' | 'BOURG' | 'CITE' | 'METROPOLE'>('CITE');
    const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});

    // User Management State
    const [users, setUsers] = useState<ProfileWithRole[]>([]);
    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    // Mock Invoices
    const invoices = [
        { id: 'INV-2024-001', date: '01/01/2024', amount: 2500000, status: 'PAID', details: 'Abonnement Mensuel (Cité)' },
        { id: 'INV-2024-002', date: '01/02/2024', amount: 2650000, status: 'PAID', details: 'Abonnement + SMS Pack' },
        { id: 'INV-2024-003', date: '01/03/2024', amount: 3750000, status: 'LATE', details: 'Abonnement + Kit Nomade (x2)' },
    ];

    useEffect(() => {
        const loadOrganization = async () => {
            if (!entityId) return;
            try {
                const data = await organizationService.getById(entityId);
                setOrganization(data);

                // Auto-select plan based on population if available
                const pop = ((data as any).metadata as any)?.population;
                if (pop) {
                    if (pop < 2000) setSelectedPlan('VILLAGE');
                    else if (pop < 10000) setSelectedPlan('BOURG');
                    else if (pop < 100000) setSelectedPlan('CITE');
                    else setSelectedPlan('METROPOLE');
                }

                // Load Users
                const orgUsers = await profileService.getByOrganizationId(entityId);
                setUsers(orgUsers);

            } catch (error) {
                console.error("Failed to load organization", error);
                toast({ title: "Erreur", description: "Impossible de charger l'organisation.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        loadOrganization();
    }, [entityId, toast]);

    const handleSave = async () => {
        if (!organization) return;
        try {
            // In a real app, we would save selectedPlan and selectedOptions here
            const updatedMetadata = {
                ...organization.metadata,
                plan: selectedPlan,
                options: selectedOptions
            };
            await organizationService.update(organization.id, { ...organization, metadata: updatedMetadata } as any);
            toast({
                title: "Modifications enregistrées",
                description: "Les informations de l'organisation ont été mises à jour.",
            });
        } catch (error) {
            console.error("Failed to update organization", error);
            toast({
                title: "Erreur",
                description: "Impossible de sauvegarder les modifications.",
                variant: "destructive"
            });
        }
    };

    const updateOption = (optionId: string, value: number | boolean) => {
        setSelectedOptions(prev => {
            const next = { ...prev };
            if (typeof value === 'boolean') {
                if (value) next[optionId] = 1;
                else delete next[optionId];
            } else {
                if (value > 0) next[optionId] = value;
                else delete next[optionId];
            }
            return next;
        });
    };

    const calculateTotal = () => {
        let total = PLANS[selectedPlan].price;
        Object.entries(selectedOptions).forEach(([id, qty]) => {
            const opt = OPTIONS_CATALOG.find(o => o.id === id);
            if (opt) total += opt.price * qty;
        });
        return total;
    };

    // User Management Handlers
    const handleAddUser = () => {
        setSelectedUser({
            entityId: organization?.id || entityId, // Pre-fill organization ID
            name: "",
            email: "",
            role: "AGENT_MUNICIPAL",
            functions: []
        });
        setIsUserDialogOpen(true);
    };

    const handleEditUser = (user: ProfileWithRole) => {
        setSelectedUser({
            ...user,
            name: `${user.first_name} ${user.last_name}`,
            entityId: user.employer || (user as any).organization_id,
            // Map other fields if necessary
        });
        setIsUserDialogOpen(true);
    };

    const handleSaveUser = async (userData: any) => {
        try {
            if (userData.id && !userData.id.startsWith('temp-')) {
                // Update
                const [firstName, ...lastNameParts] = userData.name.split(' ');
                await profileService.update(userData.id, {
                    first_name: firstName,
                    last_name: lastNameParts.join(' '),
                    role: userData.role,
                    email: userData.email,
                    // entityId is usually fixed here, but we pass it
                } as any);
                toast({ title: "Utilisateur mis à jour", description: "Les modifications ont été enregistrées." });
            } else {
                // Create
                await profileService.create(userData);
                toast({ title: "Utilisateur invité", description: "L'invitation a été envoyée." });
            }

            // Reload users
            if (entityId) {
                const refreshedUsers = await profileService.getByOrganizationId(entityId);
                setUsers(refreshedUsers);
            }
            setIsUserDialogOpen(false);
        } catch (e) {
            console.error(e);
            toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
        }
    };

    if (loading) return <DashboardLayout><div className="flex items-center justify-center h-96">Chargement...</div></DashboardLayout>;
    if (!organization) return <DashboardLayout><div className="flex items-center justify-center h-96">Organisation introuvable</div></DashboardLayout>;
    const metadata = organization.metadata as any || {};

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/super-admin/organizations')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            {/* Re-render key added to force update */}
                            <div key="org-avatar" className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: metadata?.color || '#009e49' }}>
                                {organization.name ? (organization.name.charAt(10) || organization.name.charAt(0)) : 'M'}
                            </div>
                            <h1 className="text-2xl font-bold text-foreground">{organization.name}</h1>
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Actif</span>
                        </div>
                        <p className="text-muted-foreground flex items-center gap-2 mt-1">
                            <MapPin className="w-4 h-4" /> {metadata.city || organization.city || 'N/A'}, {metadata.province || 'Province'}
                        </p>
                    </div>
                    <Button onClick={handleSave} className="gap-2">
                        <Save className="w-4 h-4" />
                        Enregistrer
                    </Button>
                </div>

                <Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })} className="w-full">
                    <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-xl mb-6 overflow-x-auto">
                        <TabsTrigger value="general" className="gap-2 px-4 py-2"><Building2 className="w-4 h-4" /> Général</TabsTrigger>
                        <TabsTrigger value="activity" className="gap-2 px-4 py-2"><Activity className="w-4 h-4" /> Activité</TabsTrigger>
                        <TabsTrigger value="finance" className="gap-2 px-4 py-2"><CreditCard className="w-4 h-4" /> Facturation & Hub</TabsTrigger>
                        <TabsTrigger value="options" className="gap-2 px-4 py-2"><ShoppingCart className="w-4 h-4" /> Offre & Options</TabsTrigger>
                        <TabsTrigger value="users" className="gap-2 px-4 py-2"><Users className="w-4 h-4" /> Personnel</TabsTrigger>
                    </TabsList>

                    {/* GENERAL TAB */}
                    <TabsContent value="general" className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="neu-raised p-6 rounded-xl space-y-4">
                                <h3 className="font-bold text-lg flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Identité</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Nom de la Mairie</Label>
                                        <Input value={organization.name} onChange={(e) => setOrganization({ ...organization, name: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label>Type</Label><Input value={organization.type === 'MAIRIE_CENTRALE' ? 'Mairie Centrale' : 'Arrondissement'} disabled /></div>
                                        <div className="space-y-2">
                                            <Label>Population</Label>
                                            <Input value={metadata.population || ''} onChange={(e) => {
                                                const newMetadata = { ...metadata, population: parseInt(e.target.value) };
                                                setOrganization({ ...organization, metadata: newMetadata });
                                            }} type="number" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="neu-raised p-6 rounded-xl space-y-4">
                                <h3 className="font-bold text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Localisation</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><Label>Département</Label><Input value={metadata.city || organization.city || ''} onChange={(e) => setOrganization({ ...organization, city: e.target.value, metadata: { ...metadata, city: e.target.value } })} /></div>
                                        <div className="space-y-2"><Label>Province</Label><Input value={metadata.province || ''} onChange={(e) => setOrganization({ ...organization, metadata: { ...metadata, province: e.target.value } })} /></div>
                                    </div>
                                    <div className="space-y-2"><Label>Adresse</Label><Input defaultValue={`Mairie de ${organization.name}`} /></div>
                                </div>
                            </div>
                            {/* Jurisdiction */}
                            <div className="neu-raised p-6 rounded-xl space-y-4 md:col-span-2">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-primary" />
                                    Territoire de compétence
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {metadata.jurisdiction?.map((prov: string) => (
                                        <div key={prov} className="neu-inset px-4 py-2 rounded-lg flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: metadata.color || '#009e49' }}>
                                                {prov.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm">{prov}</div>
                                                <div className="text-xs text-muted-foreground">Province</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ACTIVITY TAB */}
                    <TabsContent value="activity">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="neu-raised p-4 rounded-xl flex flex-col"><span className="text-sm text-muted-foreground mb-1">Dossiers en attente</span><div className="flex items-center justify-between"><span className="text-2xl font-bold text-orange-500">12</span><Clock className="w-5 h-5 text-orange-500 opacity-50" /></div></div>
                                <div className="neu-raised p-4 rounded-xl flex flex-col"><span className="text-sm text-muted-foreground mb-1">Traités ce mois</span><div className="flex items-center justify-between"><span className="text-2xl font-bold text-green-500">145</span><CheckCircle2 className="w-5 h-5 text-green-500 opacity-50" /></div></div>
                                <div className="neu-raised p-4 rounded-xl flex flex-col"><span className="text-sm text-muted-foreground mb-1">Signalements</span><div className="flex items-center justify-between"><span className="text-2xl font-bold text-red-500">3</span><AlertTriangle className="w-5 h-5 text-red-500 opacity-50" /></div></div>
                                <div className="neu-raised p-4 rounded-xl flex flex-col"><span className="text-sm text-muted-foreground mb-1">Rendez-vous</span><div className="flex items-center justify-between"><span className="text-2xl font-bold text-blue-500">8</span><Calendar className="w-5 h-5 text-blue-500 opacity-50" /></div></div>
                            </div>
                            {/* Recent Activity List */}
                            <div className="neu-raised p-6 rounded-xl">
                                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-primary" />
                                    Flux d'activité récent
                                </h3>
                                <div className="space-y-4">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-gray-50/50 dark:bg-gray-800/30">
                                            <div className={`mt-1 p-2 rounded-full ${i % 2 === 0 ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                                {i % 2 === 0 ? <FileCheck className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-semibold text-sm">
                                                        {i % 2 === 0 ? "Validation d'acte de naissance" : "Nouvelle demande de mariage"}
                                                    </h4>
                                                    <span className="text-xs text-muted-foreground">Il y a {i * 2}h</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Traité par Agent {['Mbadinga', 'Kombila', 'Nzé'][i % 3]} - Dossier #{2024000 + i}
                                                </p>
                                            </div>
                                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                <ArrowLeft className="w-4 h-4 rotate-180" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* FINANCE HUB TAB */}
                    <TabsContent value="finance">
                        <div className="space-y-6">
                            <div className="grid md:grid-cols-3 gap-6">
                                <Card className="md:col-span-2">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Historique des Factures</CardTitle>
                                        <CardDescription>Tous les paiements et factures émises pour cet organisme.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>N° Facture</TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Détails</TableHead>
                                                    <TableHead className="text-right">Montant</TableHead>
                                                    <TableHead className="text-center">Statut</TableHead>
                                                    <TableHead className="text-right">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {invoices.map((inv) => (
                                                    <TableRow key={inv.id}>
                                                        <TableCell className="font-medium">{inv.id}</TableCell>
                                                        <TableCell>{inv.date}</TableCell>
                                                        <TableCell className="text-xs text-muted-foreground">{inv.details}</TableCell>
                                                        <TableCell className="text-right font-bold">{inv.amount.toLocaleString()} FCFA</TableCell>
                                                        <TableCell className="text-center">
                                                            {inv.status === 'PAID' ? (
                                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Payée</Badge>
                                                            ) : (
                                                                <Badge variant="destructive" className="animate-pulse">En Retard</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button size="icon" variant="ghost" className="h-8 w-8"><Download className="w-4 h-4" /></Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                    <CardFooter className="flex justify-between border-t p-4 bg-muted/20">
                                        <div className="text-xs text-muted-foreground">Affichage des 3 dernières factures sur 12</div>
                                        <Button variant="outline" size="sm" className="gap-2"><FileDown className="w-4 h-4" /> Exporter Tout (CSV)</Button>
                                    </CardFooter>
                                </Card>

                                <div className="space-y-6">
                                    <Card className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/10">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-red-600 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> Compte Débiteur</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm font-medium mb-1">Montant dû : 3.750.000 FCFA</p>
                                            <p className="text-xs text-muted-foreground">Facture #INV-2024-003 en retard de 6 jours.</p>
                                        </CardContent>
                                        <CardFooter>
                                            <Button size="sm" variant="destructive" className="w-full">Envoyer Rappel</Button>
                                        </CardFooter>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Moyen de Paiement</CardTitle></CardHeader>
                                        <CardContent className="flex items-center gap-3">
                                            <div className="w-10 h-6 bg-slate-800 rounded text-white flex items-center justify-center text-[10px] font-bold">VISA</div>
                                            <div className="flex-1">
                                                <div className="font-bold text-sm">•••• 4242</div>
                                                <div className="text-xs text-muted-foreground">Expire 12/25</div>
                                            </div>
                                            <Button variant="ghost" size="sm">Éditer</Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* OPTIONS & PRICING TAB */}
                    <TabsContent value="options">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                {/* Pack Selector */}
                                <div className="neu-raised p-6 rounded-xl">
                                    <h3 className="font-bold text-lg mb-4">Pack Principal (Abonnement)</h3>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                        {Object.entries(PLANS).map(([key, plan]) => (
                                            <div
                                                key={key}
                                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all relative overflow-hidden ${selectedPlan === key ? 'border-primary bg-primary/5' : 'border-transparent bg-card hover:border-border'}`}
                                                onClick={() => setSelectedPlan(key as any)}
                                            >
                                                {key === 'VILLAGE' && <Badge variant="secondary" className="mb-2 text-[10px]">Gratuit</Badge>}
                                                <div className="font-bold text-sm mb-1">{plan.name}</div>
                                                <div className="text-xs text-muted-foreground mb-2 line-clamp-2 h-8">{plan.description}</div>
                                                <div className="font-bold text-primary text-sm">{plan.price > 0 ? `${(plan.price / 1000000).toFixed(1)}M` : '0'} <span className="text-[10px] font-normal text-muted-foreground">/mois</span></div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 p-4 bg-muted/30 rounded-lg text-sm">
                                        <h4 className="font-bold mb-2 text-primary">{PLANS[selectedPlan].name} inclus :</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {PLANS[selectedPlan].features.map((f, i) => (
                                                <div key={i} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> <span>{f}</span></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Options Catalog */}
                                <div className="neu-raised p-6 rounded-xl">
                                    <h3 className="font-bold text-lg mb-4">Options à la Carte</h3>
                                    <div className="space-y-3">
                                        {OPTIONS_CATALOG.map((option) => (
                                            <div key={option.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[10px]">{option.category}</Badge>
                                                        <span className="font-semibold text-sm">{option.name}</span>
                                                    </div>
                                                    <div className="text-xs font-bold text-primary mt-0.5">{option.price.toLocaleString()} FCFA <span className="text-muted-foreground font-normal">/ {option.unit || 'mois'}</span></div>
                                                </div>
                                                {option.type === 'quantity' ? (
                                                    <div className="flex items-center gap-2 bg-muted rounded-md p-1">
                                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateOption(option.id, (selectedOptions[option.id] || 0) - 1)}><Minus className="w-3 h-3" /></Button>
                                                        <span className="font-bold w-4 text-center text-sm">{selectedOptions[option.id] || 0}</span>
                                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateOption(option.id, (selectedOptions[option.id] || 0) + 1)}><Plus className="w-3 h-3" /></Button>
                                                    </div>
                                                ) : (
                                                    <Switch checked={!!selectedOptions[option.id]} onCheckedChange={(c) => updateOption(option.id, c)} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Sticky Invoice Estimator */}
                            <div className="lg:col-span-1">
                                <div className="neu-raised p-6 rounded-xl sticky top-6 border-l-4 border-primary shadow-xl">
                                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Estimation</h3>
                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between items-center text-sm pb-2 border-b">
                                            <span className="font-medium">{PLANS[selectedPlan].name}</span>
                                            <span>{PLANS[selectedPlan].price.toLocaleString()}</span>
                                        </div>
                                        {Object.entries(selectedOptions).map(([id, qty]) => {
                                            const opt = OPTIONS_CATALOG.find(o => o.id === id);
                                            if (!opt) return null;
                                            return (
                                                <div key={id} className="flex justify-between items-center text-sm text-muted-foreground">
                                                    <span className="truncate max-w-[150px]">{opt.name} {qty > 1 && `(x${qty})`}</span>
                                                    <span>{(opt.price * qty).toLocaleString()}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700 mb-6">
                                        <span className="font-bold text-lg">TOTAL / mois</span>
                                        <span className="font-bold text-xl text-primary">{calculateTotal().toLocaleString()} <span className="text-xs text-foreground">FCFA</span></span>
                                    </div>
                                    <Button className="w-full h-12 text-lg font-bold shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-primary/80" onClick={() => toast({ title: "Devis validé", description: "Le contrat a été mis à jour avec succès." })}>
                                        Valider le contrat
                                    </Button>
                                    <p className="text-xs text-center text-muted-foreground mt-4">Paiement via DGCL - Trésor Public</p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="users">
                        <div className="neu-raised p-6 rounded-xl">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="font-bold text-lg">Gestion du Personnel</h3>
                                    <p className="text-sm text-muted-foreground">Gérez les rôles, les accès et les options des utilisateurs.</p>
                                </div>
                                <Button size="sm" className="gap-2" onClick={handleAddUser}><Plus className="w-4 h-4" /> Ajouter un utilisateur</Button>
                            </div>

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[250px]">Utilisateur</TableHead>
                                            <TableHead>Rôle</TableHead>
                                            <TableHead>Options</TableHead>
                                            <TableHead>Statut</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    Aucun personnel trouvé pour cet organisme.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            users.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                                                                {user.first_name?.[0]}{user.last_name?.[0]}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">{user.first_name} {user.last_name}</div>
                                                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-mono">
                                                            {user.role}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1 flex-wrap">
                                                            {/* Mock options as they are not yet in DB schema fully */}
                                                            {['Signature', 'Accès'].map(opt => (
                                                                <Badge key={opt} variant="secondary" className="text-[10px]">{opt}</Badge>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Actif</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>Gérer</Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            <UserDialog
                                open={isUserDialogOpen}
                                onOpenChange={setIsUserDialogOpen}
                                initialData={selectedUser}
                                onSave={handleSaveUser}
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
