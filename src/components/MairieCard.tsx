import { useState } from "react";
import { Organization, OrganizationType } from "@/types/organization";
import { getStaffByMairie, MOCK_USERS } from "@/data/mock-users";
import { getDemoAccountsForEntity, getMunicipalStaffAccounts } from "@/utils/demo-accounts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Users, Briefcase, Landmark, MapPin, Phone, Mail, Globe } from "lucide-react";
import { DemoUserCard } from "./DemoUserCard";
import { motion, AnimatePresence } from "framer-motion";
import { Entity } from "@/types/entity";

interface MairieCardProps {
    mairie: Organization;
}

const TYPE_LABELS: Record<string, string> = {
    [OrganizationType.MAIRIE_CENTRALE]: 'Mairie Centrale',
    [OrganizationType.MAIRIE_ARRONDISSEMENT]: 'Arrondissement',
    [OrganizationType.MAIRIE_COMMUNE]: 'Commune',
    [OrganizationType.COMMUNAUTE_URBAINE]: 'Communauté Urbaine',
};

const TYPE_COLORS: Record<string, string> = {
    [OrganizationType.MAIRIE_CENTRALE]: 'bg-primary text-primary-foreground',
    [OrganizationType.MAIRIE_ARRONDISSEMENT]: 'bg-blue-500 text-white',
    [OrganizationType.MAIRIE_COMMUNE]: 'bg-green-600 text-white',
    [OrganizationType.COMMUNAUTE_URBAINE]: 'bg-purple-600 text-white',
};

export function MairieCard({ mairie }: MairieCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Récupérer le personnel de cette mairie
    const staff = getStaffByMairie(mairie.id);
    
    // Créer une entité factice pour les comptes démo usagers
    const entityForDemo = {
        id: mairie.id,
        name: mairie.name,
        type: mairie.type as any,
        countryCode: 'GA',
        enabledServices: mairie.enabled_services || [],
        metadata: {
            city: mairie.city || '',
            country: 'Gabon',
            countryCode: 'GA'
        }
    } as any;
    
    const demoUsagers = getDemoAccountsForEntity(entityForDemo);

    return (
        <Card className={`transition-all duration-300 border-l-4 hover:shadow-lg ${isExpanded ? 'ring-2 ring-primary' : ''}`} 
              style={{ borderLeftColor: '#009639' }}>
            <CardHeader className="cursor-pointer hover:bg-accent/5 transition-colors" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-green-600 to-green-700 text-white shadow-lg">
                            <Landmark className="h-7 w-7" />
                        </div>
                        <div>
                            <CardTitle className="text-xl text-foreground flex items-center gap-2">
                                {mairie.name}
                                <Badge className={`ml-2 text-xs ${TYPE_COLORS[mairie.type] || 'bg-gray-500'}`}>
                                    {TYPE_LABELS[mairie.type] || mairie.type}
                                </Badge>
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {mairie.city}, {mairie.province}
                                </span>
                                {mairie.population && (
                                    <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {mairie.population.toLocaleString()} hab.
                                    </span>
                                )}
                                {mairie.maire_name && (
                                    <Badge variant="outline" className="text-xs">
                                        {mairie.maire_name}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon">
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                </div>
            </CardHeader>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <CardContent className="pt-0 pb-6 space-y-6">
                            {/* Infos de contact */}
                            {(mairie.contact_email || mairie.contact_phone || mairie.website) && (
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                                    {mairie.contact_email && (
                                        <span className="flex items-center gap-1">
                                            <Mail className="h-4 w-4" />
                                            {mairie.contact_email}
                                        </span>
                                    )}
                                    {mairie.contact_phone && (
                                        <span className="flex items-center gap-1">
                                            <Phone className="h-4 w-4" />
                                            {mairie.contact_phone}
                                        </span>
                                    )}
                                    {mairie.website && (
                                        <span className="flex items-center gap-1">
                                            <Globe className="h-4 w-4" />
                                            {mairie.website}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Services activés */}
                            {mairie.enabled_services && mairie.enabled_services.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">SERVICES DISPONIBLES</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {mairie.enabled_services.map(service => (
                                            <Badge key={service} variant="secondary" className="text-xs">
                                                {service.replace(/_/g, ' ')}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Personnel Municipal */}
                            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-900">
                                <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                                    <Briefcase className="h-4 w-4" />
                                    PERSONNEL MUNICIPAL ({staff.length > 0 ? staff.length : 'Simulé'})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {staff.length > 0 ? (
                                        staff.slice(0, 6).map(agent => (
                                            <DemoUserCard key={agent.id} user={agent} />
                                        ))
                                    ) : (
                                        getMunicipalStaffAccounts(entityForDemo).map(agent => (
                                            <DemoUserCard key={agent.id} user={agent} />
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Comptes Usagers Démo */}
                            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                                <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    COMPTES USAGERS DÉMO ({demoUsagers.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {demoUsagers.map(account => (
                                        <DemoUserCard key={account.id} user={account} />
                                    ))}
                                </div>
                            </div>

                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}