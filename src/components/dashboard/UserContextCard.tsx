import { useDemo } from "@/contexts/DemoContext";
import { MunicipalRole } from "@/types/municipal-roles";
import { Building2, Briefcase, User, MapPin } from "lucide-react";

/**
 * Displays user context information in the sidebar:
 * - For Staff: Organization, Service, Position, Name
 * - For Citizens: Organization, Name (simplified)
 */
export function UserContextCard() {
    const { currentUser, currentMairie, currentEntity } = useDemo();

    if (!currentUser) return null;

    // Detect if user is a public user (citizen, foreigner)
    // Note: PERSONNE_MORALE (entreprises) et Associations sont des volets dans les comptes citoyens
    const isPublicUser = [
        MunicipalRole.USAGER,
        'CITIZEN',
        'citizen',
        'USAGER'
    ].includes(currentUser.role as string);

    // Get organization name
    const organizationName = currentMairie?.name
        ? `Mairie de ${currentMairie.city || currentMairie.name}`
        : currentEntity?.name || 'Non assigné';

    // Map role to readable function/position title
    const getRoleTitle = (role: string): string => {
        switch (role) {
            case MunicipalRole.MAIRE:
                return 'Maire';
            case MunicipalRole.MAIRE_ADJOINT:
                return 'Maire Adjoint';
            case MunicipalRole.SECRETAIRE_GENERAL:
                return 'Secrétaire Général';
            case MunicipalRole.CHEF_SERVICE_ETAT_CIVIL:
            case MunicipalRole.CHEF_SERVICE_URBANISME:
                return 'Chef de Service';
            case MunicipalRole.OFFICIER_ETAT_CIVIL:
                return 'Officier d\'État Civil';
            case MunicipalRole.AGENT_MUNICIPAL:
                return 'Agent Municipal';
            case MunicipalRole.AGENT_ACCUEIL:
                return 'Agent d\'Accueil';
            case MunicipalRole.STAGIAIRE:
                return 'Stagiaire';
            case MunicipalRole.USAGER:
                return 'Usager';
            case 'ADMIN':
                return 'Super Administrateur';
            default:
                return role || 'Non défini';
        }
    };

    // Derive service/department from role or description
    const getServiceFromRole = (role: string, description?: string): string => {
        if (description) {
            if (description.includes('État Civil')) return 'État Civil';
            if (description.includes('Urbanisme')) return 'Urbanisme';
            if (description.includes('accueil')) return 'Accueil';
            if (description.includes('Coordination')) return 'Administration';
        }

        switch (role) {
            case MunicipalRole.MAIRE:
            case MunicipalRole.MAIRE_ADJOINT:
                return 'Direction';
            case MunicipalRole.SECRETAIRE_GENERAL:
                return 'Administration';
            case MunicipalRole.CHEF_SERVICE_ETAT_CIVIL:
            case MunicipalRole.OFFICIER_ETAT_CIVIL:
                return 'État Civil';
            case MunicipalRole.CHEF_SERVICE_URBANISME:
                return 'Urbanisme';
            case MunicipalRole.AGENT_MUNICIPAL:
                return 'Services Techniques';
            case MunicipalRole.AGENT_ACCUEIL:
                return 'Accueil';
            case MunicipalRole.STAGIAIRE:
                return 'Support';
            case 'ADMIN':
                return 'Système National';
            default:
                return 'Usager';
        }
    };

    const roleTitle = getRoleTitle(currentUser.role);
    const serviceName = getServiceFromRole(currentUser.role, currentUser.description);
    const displayName = currentUser.name?.replace(/\s*\([^)]*\)\s*$/, '').trim() || 'Utilisateur';

    // Simplified version for citizens/public users
    if (isPublicUser) {
        const prefix = currentUser.gender === 'F' ? 'Mme' : 'M.';
        const fullDisplayName = `${prefix} ${displayName}`;

        return (
            <div className="neu-inset rounded-xl p-3 mb-4 space-y-2">
                {/* Organization */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                    <Building2 className="w-3.5 h-3.5 text-primary/70 flex-shrink-0" />
                    <span className="truncate">{organizationName}</span>
                </div>
                {/* User Name with Gender Prefix */}
                <div className="flex items-center gap-2 text-xs pt-2 border-t border-border/40">
                    <User className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="font-semibold text-foreground truncate">{fullDisplayName}</span>
                </div>
            </div>
        );
    }

    // Full version for municipal staff
    return (
        <div className="neu-inset rounded-xl p-3 mb-4 space-y-2">
            <div className="flex items-center gap-2 text-xs">
                <Building2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="font-semibold text-foreground truncate">{organizationName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground truncate">{serviceName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
                <Briefcase className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground truncate">{roleTitle}</span>
            </div>
            <div className="flex items-center gap-2 text-xs pt-1 border-t border-border/50">
                <User className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="font-medium text-foreground truncate">{displayName}</span>
            </div>
        </div>
    );
}
