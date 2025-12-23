import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MunicipalRole } from "@/types/municipal-roles";
import { UserFunction } from "@/types/user-management";
import { serviceCatalog } from "@/services/serviceCatalog";
import { ServiceCategory, getCategoryIcon, getCategoryLabel } from "@/types/municipal-services";
import { ConsularService } from "@/types/services";
import { Shield, Briefcase, Settings, User, ScrollText, Building2, Coins, Heart, Search } from "lucide-react";

import { getDefaultsForRole } from "@/utils/role-permissions";

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: any | null;
    onSave: (data: any) => Promise<void>;
}

export function UserDialog({ open, onOpenChange, initialData, onSave }: UserDialogProps) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("general");
    const [services, setServices] = useState<ConsularService[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [formData, setFormData] = useState<any>({
        name: "",
        role: MunicipalRole.USAGER,
        entityId: "",
        email: "",
        functions: [],
        accessibleServices: []
    });

    useEffect(() => {
        const loadServices = async () => {
            try {
                const data = await serviceCatalog.getAll();
                setServices(data);
            } catch (error) {
                console.error("Failed to load services", error);
            }
        };
        loadServices();
    }, []);

    // Apply defaults when role changes for NEW users
    const handleRoleChange = (newRole: string) => {
        const defaults = getDefaultsForRole(newRole as MunicipalRole);

        // Filter services based on categories
        const defaultServices = services
            .filter(s => {
                // Cast to any to access category from mock data if strict type is missing it
                const serviceCategory = (s as any).category;
                return defaults.serviceCategories.includes(serviceCategory);
            })
            .map(s => ({
                serviceId: s.id,
                canView: defaults.serviceAccessLevel.canView,
                canProcess: defaults.serviceAccessLevel.canProcess,
                canValidate: defaults.serviceAccessLevel.canValidate
            }));

        setFormData((prev: any) => ({
            ...prev,
            role: newRole,
            functions: defaults.functions,
            accessibleServices: defaultServices
        }));
    };

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                functions: initialData.functions || [],
                accessibleServices: initialData.accessibleServices || []
            });
        } else {
            // Reset for new user
            setFormData({
                name: "",
                role: MunicipalRole.USAGER,
                entityId: "",
                email: "",
                functions: [],
                accessibleServices: []
            });
        }
    }, [initialData, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFunction = (func: UserFunction) => {
        setFormData((prev: any) => {
            const current = prev.functions || [];
            if (current.includes(func)) {
                return { ...prev, functions: current.filter((f: any) => f !== func) };
            } else {
                return { ...prev, functions: [...current, func] };
            }
        });
    };



    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        {initialData ? "Gestion de l'Utilisateur" : "Nouvel Utilisateur"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-1">
                            <TabsList className="grid w-full grid-cols-3 mb-4">
                                <TabsTrigger value="general" className="gap-2">
                                    <User className="w-4 h-4" /> Général
                                </TabsTrigger>
                                <TabsTrigger value="functions" className="gap-2">
                                    <Briefcase className="w-4 h-4" /> Fonctions
                                </TabsTrigger>
                                <TabsTrigger value="services" className="gap-2">
                                    <Settings className="w-4 h-4" /> Services
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1 px-1 -mx-1">
                            <div className="px-2 py-2">
                                <TabsContent value="general" className="space-y-4 mt-0">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nom complet</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => setFormData((p: any) => ({ ...p, name: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email || ""}
                                                onChange={(e) => setFormData((p: any) => ({ ...p, email: e.target.value }))}
                                                placeholder="exemple@consulat.ga"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="role">Rôle Principal</Label>
                                            <Select
                                                value={formData.role}
                                                onValueChange={(v) => {
                                                    // Only apply defaults if it's a new user (no initialData) to avoid overwriting custom edits on existing users
                                                    if (!initialData) {
                                                        handleRoleChange(v);
                                                    } else {
                                                        setFormData((p: any) => ({ ...p, role: v }));
                                                    }
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner un rôle" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ADMIN">Super Admin</SelectItem>
                                                    <SelectItem value={MunicipalRole.MAIRE}>Maire</SelectItem>
                                                    <SelectItem value={MunicipalRole.MAIRE_ADJOINT}>Maire Adjoint</SelectItem>
                                                    <SelectItem value={MunicipalRole.SECRETAIRE_GENERAL}>Secrétaire Général</SelectItem>
                                                    <SelectItem value={MunicipalRole.CHEF_SERVICE_ETAT_CIVIL}>Chef Service État Civil</SelectItem>
                                                    <SelectItem value={MunicipalRole.CHEF_SERVICE_URBANISME}>Chef Service Urbanisme</SelectItem>
                                                    <SelectItem value={MunicipalRole.OFFICIER_ETAT_CIVIL}>Officier État Civil</SelectItem>
                                                    <SelectItem value={MunicipalRole.AGENT_MUNICIPAL}>Agent Municipal</SelectItem>
                                                    <SelectItem value={MunicipalRole.AGENT_ACCUEIL}>Agent Accueil</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="entityId">ID Entité</Label>
                                            <Input
                                                id="entityId"
                                                value={formData.entityId || ""}
                                                onChange={(e) => setFormData((p: any) => ({ ...p, entityId: e.target.value }))}
                                                placeholder="ex: consulat-paris"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-muted/30 p-4 rounded-lg border">
                                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-muted-foreground" />
                                            Résumé des accès
                                        </h4>
                                        <div className="text-xs text-muted-foreground space-y-1">
                                            <p>• Rôle: <span className="font-bold text-foreground">{formData.role}</span></p>
                                            <p>• Entité: <span className="font-bold text-foreground">{formData.entityId || "Global"}</span></p>
                                            <p>• Fonctions activées: <span className="font-bold text-foreground">{formData.functions?.length || 0}</span></p>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="functions" className="space-y-6 mt-0">
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-sm font-bold mb-3 uppercase text-muted-foreground flex items-center gap-2">
                                                <ScrollText className="w-4 h-4" /> État Civil
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { id: UserFunction.CIVIL_REGISTRY_VIEW, label: "Consultation" },
                                                    { id: UserFunction.CIVIL_REGISTRY_CREATE, label: "Édition / Création" },
                                                    { id: UserFunction.CIVIL_REGISTRY_VALIDATE, label: "Validation / Signature" },
                                                    { id: UserFunction.CIVIL_REGISTRY_PRINT, label: "Impression Actes" }
                                                ].map(item => (
                                                    <div key={item.id} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 transition-colors">
                                                        <Checkbox
                                                            id={item.id}
                                                            checked={formData.functions?.includes(item.id)}
                                                            onCheckedChange={() => toggleFunction(item.id)}
                                                        />
                                                        <Label htmlFor={item.id} className="text-sm font-medium cursor-pointer flex-1">
                                                            {item.label}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <Separator />

                                        <div>
                                            <h3 className="text-sm font-bold mb-3 uppercase text-muted-foreground flex items-center gap-2">
                                                <Building2 className="w-4 h-4" /> Urbanisme
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { id: UserFunction.URBANISM_VIEW, label: "Consultation Dossiers" },
                                                    { id: UserFunction.URBANISM_PROCESS, label: "Instruction / Traitement" },
                                                    { id: UserFunction.URBANISM_VALIDATE, label: "Validation Permis" }
                                                ].map(item => (
                                                    <div key={item.id} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 transition-colors">
                                                        <Checkbox
                                                            id={item.id}
                                                            checked={formData.functions?.includes(item.id)}
                                                            onCheckedChange={() => toggleFunction(item.id)}
                                                        />
                                                        <Label htmlFor={item.id} className="text-sm font-medium cursor-pointer flex-1">
                                                            {item.label}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <Separator />

                                        <div>
                                            <h3 className="text-sm font-bold mb-3 uppercase text-muted-foreground flex items-center gap-2">
                                                <Coins className="w-4 h-4" /> Fiscalité
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { id: UserFunction.FISCAL_VIEW, label: "Consultation" },
                                                    { id: UserFunction.FISCAL_COLLECT, label: "Recouvrement / Encaissement" },
                                                    { id: UserFunction.FISCAL_VALIDATE, label: "Validation / Contrôle" }
                                                ].map(item => (
                                                    <div key={item.id} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 transition-colors">
                                                        <Checkbox
                                                            id={item.id}
                                                            checked={formData.functions?.includes(item.id)}
                                                            onCheckedChange={() => toggleFunction(item.id)}
                                                        />
                                                        <Label htmlFor={item.id} className="text-sm font-medium cursor-pointer flex-1">
                                                            {item.label}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <Separator />

                                        <div>
                                            <h3 className="text-sm font-bold mb-3 uppercase text-muted-foreground flex items-center gap-2">
                                                <Heart className="w-4 h-4" /> Affaires Sociales
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { id: UserFunction.SOCIAL_VIEW, label: "Consultation Dossiers" },
                                                    { id: UserFunction.SOCIAL_PROCESS, label: "Instruction Demandes" },
                                                    { id: UserFunction.SOCIAL_VALIDATE, label: "Validation Aides" }
                                                ].map(item => (
                                                    <div key={item.id} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 transition-colors">
                                                        <Checkbox
                                                            id={item.id}
                                                            checked={formData.functions?.includes(item.id)}
                                                            onCheckedChange={() => toggleFunction(item.id)}
                                                        />
                                                        <Label htmlFor={item.id} className="text-sm font-medium cursor-pointer flex-1">
                                                            {item.label}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <Separator />

                                        <div>
                                            <h3 className="text-sm font-bold mb-3 uppercase text-muted-foreground flex items-center gap-2">
                                                <Shield className="w-4 h-4" /> Administration
                                            </h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { id: UserFunction.USER_MANAGEMENT, label: "Gestion des Utilisateurs" },
                                                    { id: UserFunction.SETTINGS_MANAGEMENT, label: "Configuration Système" },
                                                    { id: UserFunction.REPORTING_VIEW, label: "Accès Statistiques" }
                                                ].map(item => (
                                                    <div key={item.id} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-muted/50 transition-colors">
                                                        <Checkbox
                                                            id={item.id}
                                                            checked={formData.functions?.includes(item.id)}
                                                            onCheckedChange={() => toggleFunction(item.id)}
                                                        />
                                                        <Label htmlFor={item.id} className="text-sm font-medium cursor-pointer flex-1">
                                                            {item.label}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="services" className="mt-0 space-y-4">
                                    <div className="bg-muted/30 p-4 rounded-lg border mb-4 space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">
                                                Définissez les services et niveaux d'autorisation pour cet agent.
                                            </p>
                                        </div>
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="search"
                                                placeholder="Rechercher un service..."
                                                className="pl-9 bg-background/50 border-input/50 focus:bg-background transition-all"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4 h-[400px] pr-2 overflow-y-auto custom-scrollbar">
                                        {Object.values(ServiceCategory).map((category) => {
                                            const categoryServices = services.filter((s: any) => {
                                                const matchesCategory = s.category === category;
                                                const matchesSearch = searchQuery
                                                    ? s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    s.description?.toLowerCase().includes(searchQuery.toLowerCase())
                                                    : true;
                                                return matchesCategory && matchesSearch;
                                            });

                                            if (categoryServices.length === 0) return null;

                                            const CategoryIcon = getCategoryIcon(category);
                                            const categoryLabel = getCategoryLabel(category);
                                            const isExpanded = searchQuery.length > 0; // Auto-expand when searching

                                            return (
                                                <div key={category as string} className="border rounded-lg overflow-hidden bg-card/50 shadow-sm">
                                                    <div className="bg-muted/30 p-3 border-b flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                                                <CategoryIcon className="w-4 h-4" />
                                                            </div>
                                                            <h3 className="font-semibold text-sm">{categoryLabel}</h3>
                                                        </div>
                                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                            {categoryServices.length}
                                                        </span>
                                                    </div>
                                                    <div className="p-2 space-y-2">
                                                        {categoryServices.map((service) => {
                                                            const access = formData.accessibleServices?.find((s: any) => s.serviceId === service.id);
                                                            const hasAccess = !!access;

                                                            return (
                                                                <div
                                                                    key={service.id}
                                                                    className={`border rounded-md p-3 transition-all duration-200 ${hasAccess ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/30 border-transparent'}`}
                                                                >
                                                                    <div className="flex items-start justify-between mb-3">
                                                                        <div className="flex items-center gap-3 w-full">
                                                                            <Switch
                                                                                checked={hasAccess}
                                                                                onCheckedChange={(checked) => {
                                                                                    setFormData((prev: any) => {
                                                                                        const current = prev.accessibleServices || [];
                                                                                        if (checked) {
                                                                                            // Default permissions on enable
                                                                                            return {
                                                                                                ...prev,
                                                                                                accessibleServices: [...current, {
                                                                                                    serviceId: service.id,
                                                                                                    canView: true,
                                                                                                    canProcess: false,
                                                                                                    canValidate: false
                                                                                                }]
                                                                                            };
                                                                                        } else {
                                                                                            return {
                                                                                                ...prev,
                                                                                                accessibleServices: current.filter((s: any) => s.serviceId !== service.id)
                                                                                            };
                                                                                        }
                                                                                    });
                                                                                }}
                                                                            />
                                                                            <div className="flex-1">
                                                                                <div className="font-medium text-sm flex items-center justify-between">
                                                                                    {service.name}
                                                                                    {hasAccess && <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Activé</span>}
                                                                                </div>
                                                                                <div className="text-xs text-muted-foreground line-clamp-1">{service.description}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {hasAccess && (
                                                                        <div className="pl-12 grid grid-cols-3 gap-2 animate-in slide-in-from-top-1 fade-in duration-200">
                                                                            <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-background/80 transition-colors">
                                                                                <Checkbox
                                                                                    id={`view-${service.id}`}
                                                                                    checked={access?.canView}
                                                                                    onCheckedChange={(c) => {
                                                                                        setFormData((prev: any) => ({
                                                                                            ...prev,
                                                                                            accessibleServices: prev.accessibleServices?.map((s: any) =>
                                                                                                s.serviceId === service.id ? { ...s, canView: !!c } : s
                                                                                            )
                                                                                        }));
                                                                                    }}
                                                                                />
                                                                                <span className="text-xs font-medium">Voir</span>
                                                                            </label>
                                                                            <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-background/80 transition-colors">
                                                                                <Checkbox
                                                                                    id={`process-${service.id}`}
                                                                                    checked={access?.canProcess}
                                                                                    onCheckedChange={(c) => {
                                                                                        setFormData((prev: any) => ({
                                                                                            ...prev,
                                                                                            accessibleServices: prev.accessibleServices?.map((s: any) =>
                                                                                                s.serviceId === service.id ? { ...s, canProcess: !!c } : s
                                                                                            )
                                                                                        }));
                                                                                    }}
                                                                                />
                                                                                <span className="text-xs font-medium">Traiter</span>
                                                                            </label>
                                                                            <label className="flex items-center space-x-2 cursor-pointer p-1.5 rounded hover:bg-background/80 transition-colors">
                                                                                <Checkbox
                                                                                    id={`validate-${service.id}`}
                                                                                    checked={access?.canValidate}
                                                                                    onCheckedChange={(c) => {
                                                                                        setFormData((prev: any) => ({
                                                                                            ...prev,
                                                                                            accessibleServices: prev.accessibleServices?.map((s: any) =>
                                                                                                s.serviceId === service.id ? { ...s, canValidate: !!c } : s
                                                                                            )
                                                                                        }));
                                                                                    }}
                                                                                />
                                                                                <span className="text-xs font-medium">Valider</span>
                                                                            </label>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {services.filter(s => searchQuery &&
                                            ((s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                                ((s as any).description?.toLowerCase().includes(searchQuery.toLowerCase())))
                                        ).length === 0 && searchQuery && (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    <div className="flex justify-center mb-2">
                                                        <Search className="w-8 h-8 opacity-20" />
                                                    </div>
                                                    <p>Aucun service trouvé pour "{searchQuery}"</p>
                                                </div>
                                            )}
                                    </div>
                                </TabsContent>
                            </div>
                        </ScrollArea>
                    </Tabs>

                    <DialogFooter className="mt-4 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                        <Button type="submit" disabled={loading} className="neu-raised">
                            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
