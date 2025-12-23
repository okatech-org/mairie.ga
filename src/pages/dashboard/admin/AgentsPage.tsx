import { useState, useMemo } from "react";
import { useDemo } from "@/contexts/DemoContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, Filter, MoreHorizontal, Mail, MapPin, Shield, Users, UserCheck, Clock, AlertTriangle, Building2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MunicipalRole, MUNICIPAL_ROLE_MAPPING } from "@/types/municipal-roles";
import { getStaffByMairie } from "@/data/mock-users";

// Get role label in French
const getRoleLabel = (role: string): string => {
    const mapping = MUNICIPAL_ROLE_MAPPING[role as MunicipalRole];
    return mapping?.label || role.replace(/_/g, ' ');
};

// Get role badge color
const getRoleBadgeColor = (role: string): string => {
    switch (role) {
        case MunicipalRole.MAIRE:
            return "bg-amber-100 text-amber-800 border-amber-200";
        case MunicipalRole.MAIRE_ADJOINT:
            return "bg-orange-100 text-orange-800 border-orange-200";
        case MunicipalRole.SECRETAIRE_GENERAL:
            return "bg-blue-100 text-blue-800 border-blue-200";
        case MunicipalRole.CHEF_SERVICE:
        case MunicipalRole.CHEF_BUREAU:
            return "bg-purple-100 text-purple-800 border-purple-200";
        case MunicipalRole.AGENT_ETAT_CIVIL:
            return "bg-green-100 text-green-800 border-green-200";
        case MunicipalRole.AGENT_MUNICIPAL:
        case MunicipalRole.AGENT_TECHNIQUE:
            return "bg-teal-100 text-teal-800 border-teal-200";
        case MunicipalRole.AGENT_ACCUEIL:
            return "bg-cyan-100 text-cyan-800 border-cyan-200";
        case MunicipalRole.STAGIAIRE:
            return "bg-gray-100 text-gray-800 border-gray-200";
        default:
            return "bg-slate-100 text-slate-800 border-slate-200";
    }
};

// Mock Agent Data with more details
interface Agent {
    id: string;
    name: string;
    role: string;
    email: string;
    phone?: string;
    avatar?: string;
    status: 'active' | 'inactive' | 'leave';
    department: string;
    location: string;
    hireDate: string;
    entityId: string; // Added to filter by mairie
}

// Agents organized by mairie
const ALL_AGENTS: Agent[] = [
    // ====== MAIRIE DE LIBREVILLE ======
    {
        id: 'lbv-1',
        name: 'Jean-Pierre Mba',
        role: MunicipalRole.MAIRE,
        email: 'jp.mba@mairie-libreville.ga',
        phone: '+241 77 00 00 01',
        status: 'active',
        department: 'Direction',
        location: 'Libreville',
        hireDate: '2019-06-15',
        entityId: 'mairie-libreville-centrale',
    },
    {
        id: 'lbv-2',
        name: 'Sophie Nze',
        role: MunicipalRole.MAIRE_ADJOINT,
        email: 's.nze@mairie-libreville.ga',
        phone: '+241 77 00 00 02',
        status: 'active',
        department: 'Direction',
        location: 'Libreville',
        hireDate: '2019-06-15',
        entityId: 'mairie-libreville-centrale',
    },
    {
        id: 'lbv-3',
        name: 'Paul Obame',
        role: MunicipalRole.SECRETAIRE_GENERAL,
        email: 'p.obame@mairie-libreville.ga',
        phone: '+241 77 00 00 03',
        status: 'active',
        department: 'Administration',
        location: 'Libreville',
        hireDate: '2020-01-10',
        entityId: 'mairie-libreville-centrale',
    },
    {
        id: 'lbv-4',
        name: 'Marie Essono',
        role: MunicipalRole.CHEF_SERVICE,
        email: 'm.essono@mairie-libreville.ga',
        status: 'active',
        department: 'État Civil',
        location: 'Libreville',
        hireDate: '2018-03-20',
        entityId: 'mairie-libreville-centrale',
    },
    {
        id: 'lbv-5',
        name: 'Jean Nguema',
        role: MunicipalRole.CHEF_SERVICE,
        email: 'j.nguema@mairie-libreville.ga',
        status: 'active',
        department: 'Urbanisme',
        location: 'Libreville',
        hireDate: '2017-09-01',
        entityId: 'mairie-libreville-centrale',
    },
    {
        id: 'lbv-6',
        name: 'Léa Mboumba',
        role: MunicipalRole.AGENT_ETAT_CIVIL,
        email: 'l.mboumba@mairie-libreville.ga',
        status: 'active',
        department: 'État Civil',
        location: 'Libreville - Centre',
        hireDate: '2021-02-15',
        entityId: 'mairie-libreville-centrale',
    },
    {
        id: 'lbv-7',
        name: 'Marc Ondo',
        role: MunicipalRole.AGENT_ETAT_CIVIL,
        email: 'm.ondo@mairie-libreville.ga',
        status: 'leave',
        department: 'État Civil',
        location: 'Libreville - 1er Arr.',
        hireDate: '2020-06-01',
        entityId: 'mairie-libreville-centrale',
    },
    {
        id: 'lbv-8',
        name: 'Alice Koumba',
        role: MunicipalRole.AGENT_ACCUEIL,
        email: 'a.koumba@mairie-libreville.ga',
        status: 'active',
        department: 'Accueil',
        location: 'Libreville',
        hireDate: '2022-01-10',
        entityId: 'mairie-libreville-centrale',
    },
    {
        id: 'lbv-9',
        name: 'Pierre Ndong',
        role: MunicipalRole.AGENT_MUNICIPAL,
        email: 'p.ndong@mairie-libreville.ga',
        status: 'active',
        department: 'Urbanisme',
        location: 'Libreville',
        hireDate: '2021-09-01',
        entityId: 'mairie-libreville-centrale',
    },
    {
        id: 'lbv-10',
        name: 'Fatima Bongo',
        role: MunicipalRole.STAGIAIRE,
        email: 'f.bongo@mairie-libreville.ga',
        status: 'active',
        department: 'État Civil',
        location: 'Libreville',
        hireDate: '2024-09-01',
        entityId: 'mairie-libreville-centrale',
    },

    // ====== MAIRIE DE PORT-GENTIL ======
    {
        id: 'pg-1',
        name: 'François Ntoutoume',
        role: MunicipalRole.MAIRE,
        email: 'f.ntoutoume@mairie-portgentil.ga',
        phone: '+241 77 10 00 01',
        status: 'active',
        department: 'Direction',
        location: 'Port-Gentil',
        hireDate: '2019-07-01',
        entityId: 'ogoue-maritime-port-gentil',
    },
    {
        id: 'pg-2',
        name: 'Clarisse Ndong',
        role: MunicipalRole.MAIRE_ADJOINT,
        email: 'c.ndong@mairie-portgentil.ga',
        phone: '+241 77 10 00 02',
        status: 'active',
        department: 'Direction',
        location: 'Port-Gentil',
        hireDate: '2019-07-01',
        entityId: 'ogoue-maritime-port-gentil',
    },
    {
        id: 'pg-3',
        name: 'Robert Mboumba',
        role: MunicipalRole.SECRETAIRE_GENERAL,
        email: 'r.mboumba@mairie-portgentil.ga',
        phone: '+241 77 10 00 03',
        status: 'active',
        department: 'Administration',
        location: 'Port-Gentil',
        hireDate: '2020-02-15',
        entityId: 'ogoue-maritime-port-gentil',
    },
    {
        id: 'pg-4',
        name: 'Hélène Oyane',
        role: MunicipalRole.CHEF_SERVICE,
        email: 'h.oyane@mairie-portgentil.ga',
        status: 'active',
        department: 'État Civil',
        location: 'Port-Gentil',
        hireDate: '2018-05-10',
        entityId: 'ogoue-maritime-port-gentil',
    },
    {
        id: 'pg-5',
        name: 'André Moussavou',
        role: MunicipalRole.CHEF_SERVICE,
        email: 'a.moussavou@mairie-portgentil.ga',
        status: 'active',
        department: 'Urbanisme',
        location: 'Port-Gentil',
        hireDate: '2017-11-20',
        entityId: 'ogoue-maritime-port-gentil',
    },
    {
        id: 'pg-6',
        name: 'Jeanne Minko',
        role: MunicipalRole.AGENT_ETAT_CIVIL,
        email: 'j.minko@mairie-portgentil.ga',
        status: 'active',
        department: 'État Civil',
        location: 'Port-Gentil - Centre',
        hireDate: '2021-03-01',
        entityId: 'ogoue-maritime-port-gentil',
    },
    {
        id: 'pg-7',
        name: 'Patrick Nze',
        role: MunicipalRole.AGENT_ETAT_CIVIL,
        email: 'p.nze@mairie-portgentil.ga',
        status: 'leave',
        department: 'État Civil',
        location: 'Port-Gentil - Nord',
        hireDate: '2020-08-15',
        entityId: 'ogoue-maritime-port-gentil',
    },
    {
        id: 'pg-8',
        name: 'Christine Evouna',
        role: MunicipalRole.AGENT_ACCUEIL,
        email: 'c.evouna@mairie-portgentil.ga',
        status: 'active',
        department: 'Accueil',
        location: 'Port-Gentil',
        hireDate: '2022-02-20',
        entityId: 'ogoue-maritime-port-gentil',
    },
    {
        id: 'pg-9',
        name: 'Emmanuel Bibang',
        role: MunicipalRole.AGENT_MUNICIPAL,
        email: 'e.bibang@mairie-portgentil.ga',
        status: 'active',
        department: 'Urbanisme',
        location: 'Port-Gentil',
        hireDate: '2021-10-01',
        entityId: 'ogoue-maritime-port-gentil',
    },
    {
        id: 'pg-10',
        name: 'Sylvie Ogandaga',
        role: MunicipalRole.STAGIAIRE,
        email: 's.ogandaga@mairie-portgentil.ga',
        status: 'active',
        department: 'Administration',
        location: 'Port-Gentil',
        hireDate: '2024-10-01',
        entityId: 'ogoue-maritime-port-gentil',
    },
];

export default function AgentsPage() {
    const { currentUser } = useDemo();
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [departmentFilter, setDepartmentFilter] = useState<string>("all");

    // Filter agents by current user's organization (mairie)
    const MAIRIE_AGENTS = useMemo(() => {
        const userEntityId = currentUser?.entityId;
        if (!userEntityId) {
            // Super admin sees all agents
            return ALL_AGENTS;
        }
        return ALL_AGENTS.filter(agent => agent.entityId === userEntityId);
    }, [currentUser?.entityId]);

    // Statistics (based on filtered agents for this mairie)
    const stats = useMemo(() => ({
        total: MAIRIE_AGENTS.length,
        active: MAIRIE_AGENTS.filter(a => a.status === 'active').length,
        onLeave: MAIRIE_AGENTS.filter(a => a.status === 'leave').length,
        inactive: MAIRIE_AGENTS.filter(a => a.status === 'inactive').length,
    }), [MAIRIE_AGENTS]);

    // Unique values for filters (from this mairie's agents)
    const departments = useMemo(() =>
        [...new Set(MAIRIE_AGENTS.map(a => a.department))],
        [MAIRIE_AGENTS]);

    const roles = useMemo(() =>
        [...new Set(MAIRIE_AGENTS.map(a => a.role))],
        [MAIRIE_AGENTS]);

    // Filtered agents (applying search and filters on mairie agents)
    const filteredAgents = useMemo(() =>
        MAIRIE_AGENTS.filter(agent => {
            const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                agent.department.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter === 'all' || agent.role === roleFilter;
            const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
            const matchesDepartment = departmentFilter === 'all' || agent.department === departmentFilter;
            return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
        }),
        [MAIRIE_AGENTS, searchTerm, roleFilter, statusFilter, departmentFilter]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-100 text-green-800 border-green-200">Actif</Badge>;
            case 'leave':
                return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">En congé</Badge>;
            case 'inactive':
                return <Badge className="bg-red-100 text-red-800 border-red-200">Inactif</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Gestion du Personnel</h1>
                    <p className="text-muted-foreground">
                        Gérez les agents municipaux, leurs rôles et affectations.
                    </p>
                </div>
                <Button className="neu-raised gap-2">
                    <Plus className="w-4 h-4" />
                    Ajouter un Agent
                </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="neu-raised">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total agents</p>
                            </div>
                            <div className="p-3 rounded-full bg-primary/10 text-primary">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-raised">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                                <p className="text-sm text-muted-foreground">Actifs</p>
                            </div>
                            <div className="p-3 rounded-full bg-green-100 text-green-600">
                                <UserCheck className="w-5 h-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-raised">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-yellow-600">{stats.onLeave}</p>
                                <p className="text-sm text-muted-foreground">En congé</p>
                            </div>
                            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-raised">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
                                <p className="text-sm text-muted-foreground">Inactifs</p>
                            </div>
                            <div className="p-3 rounded-full bg-red-100 text-red-600">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="neu-raised">
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Rechercher un agent..."
                                className="pl-9 neu-inset"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Role Filter */}
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-full lg:w-[200px] neu-inset">
                                <Shield className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Rôle" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les rôles</SelectItem>
                                {roles.map(role => (
                                    <SelectItem key={role} value={role}>
                                        {getRoleLabel(role)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Department Filter */}
                        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                            <SelectTrigger className="w-full lg:w-[180px] neu-inset">
                                <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Service" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les services</SelectItem>
                                {departments.map(dept => (
                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full lg:w-[150px] neu-inset">
                                <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous</SelectItem>
                                <SelectItem value="active">Actifs</SelectItem>
                                <SelectItem value="leave">En congé</SelectItem>
                                <SelectItem value="inactive">Inactifs</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
                {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''} trouvé{filteredAgents.length !== 1 ? 's' : ''}
            </div>

            {/* Agents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAgents.map((agent) => (
                    <Card key={agent.id} className="neu-raised hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                        <CardHeader className="flex flex-row items-start justify-between pb-3">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                                    <AvatarImage src={agent.avatar} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                        {agent.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-base font-bold">{agent.name}</CardTitle>
                                    <Badge variant="outline" className={`mt-1 text-[10px] ${getRoleBadgeColor(agent.role)}`}>
                                        {getRoleLabel(agent.role)}
                                    </Badge>
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem>Voir le profil</DropdownMenuItem>
                                    <DropdownMenuItem>Modifier les droits</DropdownMenuItem>
                                    <DropdownMenuItem>Envoyer un message</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive">Désactiver le compte</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{agent.email}</span>
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Building2 className="h-4 w-4 flex-shrink-0" />
                                <span>{agent.department}</span>
                            </div>

                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                <span>{agent.location}</span>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t">
                                {getStatusBadge(agent.status)}
                                <Button variant="ghost" size="sm" className="h-7 text-xs neu-raised">
                                    Détails
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Empty state */}
            {filteredAgents.length === 0 && (
                <Card className="neu-raised">
                    <CardContent className="py-12 text-center">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Aucun agent trouvé</h3>
                        <p className="text-muted-foreground">
                            Essayez de modifier vos critères de recherche.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
