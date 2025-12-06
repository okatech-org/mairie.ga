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
        <Card className={`transition-all duration-300 border-l-4 hover:shadow-lg ${isExpanded ? 'ring-2 ring-primary/50' : ''}`}
            style={{ borderLeftColor: '#009639' }}>
            <CardHeader className="cursor-pointer hover:bg-accent/5 transition-colors p-3 md:p-6" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                        <div className="flex items-center justify-center w-10 h-10 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-gradient-to-br from-green-600 to-green-700 text-white shadow-lg flex-shrink-0">
                            <Landmark className="h-5 w-5 md:h-7 md:w-7" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <CardTitle className="text-sm md:text-xl text-foreground flex flex-wrap items-center gap-1 md:gap-2">
                                <span className="truncate">{mairie.name}</span>
                                <Badge className={`text-[10px] md:text-xs ${TYPE_COLORS[mairie.type] || 'bg-gray-500'}`}>
                                    {TYPE_LABELS[mairie.type] || mairie.type}
                                </Badge>
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1 md:mt-2 text-xs md:text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate">{mairie.city}</span>
                                </span>
                                {mairie.population && (
                                    <span className="hidden sm:flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {mairie.population.toLocaleString()} hab.
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="flex-shrink-0 h-8 w-8 md:h-10 md:w-10">
                        {isExpanded ? <ChevronUp className="h-4 w-4 md:h-5 md:w-5" /> : <ChevronDown className="h-4 w-4 md:h-5 md:w-5" />}
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
                        <CardContent className="pt-0 pb-4 md:pb-6 px-3 md:px-6 space-y-4 md:space-y-6">
                            {/* Infos de contact */}
                            {(mairie.contact_email || mairie.contact_phone || mairie.website) && (
                                <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground bg-muted/30 p-2 md:p-3 rounded-lg">
                                    {mairie.contact_email && (
                                        <span className="flex items-center gap-1">
                                            <Mail className="h-3 w-3 md:h-4 md:w-4" />
                                            <span className="truncate">{mairie.contact_email}</span>
                                        </span>
                                    )}
                                    {mairie.contact_phone && (
                                        <span className="flex items-center gap-1">
                                            <Phone className="h-3 w-3 md:h-4 md:w-4" />
                                            {mairie.contact_phone}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Services activés */}
                            {mairie.enabled_services && mairie.enabled_services.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] md:text-xs font-semibold text-muted-foreground mb-2">SERVICES</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {mairie.enabled_services.slice(0, 6).map(service => (
                                            <Badge key={service} variant="secondary" className="text-[10px] md:text-xs">
                                                {service.replace(/_/g, ' ')}
                                            </Badge>
                                        ))}
                                        {mairie.enabled_services.length > 6 && (
                                            <Badge variant="outline" className="text-[10px] md:text-xs">
                                                +{mairie.enabled_services.length - 6}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Personnel Municipal */}
                            <div className="bg-green-50 dark:bg-green-950/30 p-3 md:p-4 rounded-lg border border-green-200 dark:border-green-900">
                                <h3 className="text-xs md:text-sm font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                                    <Briefcase className="h-3 w-3 md:h-4 md:w-4" />
                                    PERSONNEL MUNICIPAL
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                                    {staff.length > 0 ? (
                                        staff.map(agent => (
                                            <DemoUserCard key={agent.id} user={agent} />
                                        ))
                                    ) : (
                                        getMunicipalStaffAccounts(entityForDemo).slice(0, 4).map(agent => (
                                            <DemoUserCard key={agent.id} user={agent} />
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Comptes Usagers Démo */}
                            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 md:p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                                <h3 className="text-xs md:text-sm font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                                    <Users className="h-3 w-3 md:h-4 md:w-4" />
                                    COMPTES USAGERS
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
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