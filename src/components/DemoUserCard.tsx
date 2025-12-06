import { useNavigate } from "react-router-dom";
import { useDemo } from "@/contexts/DemoContext";
import { DemoUser } from "@/types/roles";
import { MunicipalRole, MUNICIPAL_ROLE_MAPPING, getRoleLabel } from "@/types/municipal-roles";
import { getEntityById } from "@/data/mock-entities";
import { getMairieById } from "@/data/mock-mairies-network";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Briefcase } from "lucide-react";

interface DemoUserCardProps {
  user: DemoUser;
}

// Couleurs par rôle municipal
const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-600',
  [MunicipalRole.MAIRE]: 'bg-yellow-600',
  [MunicipalRole.MAIRE_ADJOINT]: 'bg-orange-500',
  [MunicipalRole.SECRETAIRE_GENERAL]: 'bg-slate-600',
  [MunicipalRole.CHEF_SERVICE]: 'bg-blue-600',
  [MunicipalRole.CHEF_BUREAU]: 'bg-blue-500',
  [MunicipalRole.AGENT_MUNICIPAL]: 'bg-green-600',
  [MunicipalRole.AGENT_ETAT_CIVIL]: 'bg-emerald-600',
  [MunicipalRole.AGENT_TECHNIQUE]: 'bg-cyan-600',
  [MunicipalRole.AGENT_ACCUEIL]: 'bg-teal-500',
  [MunicipalRole.STAGIAIRE]: 'bg-purple-500',
  [MunicipalRole.CITOYEN]: 'bg-gray-500',
  [MunicipalRole.ETRANGER_RESIDENT]: 'bg-indigo-500',
  [MunicipalRole.PERSONNE_MORALE]: 'bg-amber-600',
};

export function DemoUserCard({ user }: DemoUserCardProps) {
  const navigate = useNavigate();
  const { simulateUser } = useDemo();
  
  // Essayer d'abord les mairies puis les anciennes entités
  const mairie = user.entityId ? getMairieById(user.entityId) : null;
  const entity = !mairie && user.entityId ? getEntityById(user.entityId) : null;
  const entityInfo = mairie || entity;

  const handleSimulate = () => {
    simulateUser(user.id);

    // Navigation selon le rôle
    if (user.role === 'ADMIN') {
      navigate("/dashboard/super-admin");
    } else if (user.role === MunicipalRole.CITOYEN) {
      navigate("/dashboard/citizen");
    } else if (user.role === MunicipalRole.ETRANGER_RESIDENT) {
      navigate("/dashboard/foreigner");
    } else if (user.role === MunicipalRole.PERSONNE_MORALE) {
      navigate("/dashboard/citizen"); // Pour l'instant, même dashboard
    } else {
      // Tous les rôles municipaux staff (Maire, Agents, etc.)
      navigate("/dashboard/agent");
    }
  };

  const getRoleColor = () => {
    return ROLE_COLORS[user.role] || 'bg-gray-500';
  };

  const getRoleDisplayLabel = () => {
    if (user.role === 'ADMIN') return 'Super Admin';
    
    const roleMapping = MUNICIPAL_ROLE_MAPPING[user.role as MunicipalRole];
    if (roleMapping) {
      return roleMapping.label;
    }
    
    return user.role.replace(/_/g, ' ');
  };

  return (
    <Card className="hover-scale transition-all duration-300 border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-2 flex-wrap">
            <Badge className={getRoleColor()}>
              <span className="mr-1">{user.badge}</span>
              {getRoleDisplayLabel()}
            </Badge>
            {user.hierarchyLevel && (
              <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                Niveau {user.hierarchyLevel}
              </Badge>
            )}
          </div>
          {entityInfo && (
            <span className="text-2xl">🇬🇦</span>
          )}
        </div>
        <CardTitle className="text-lg">{user.name}</CardTitle>
        <CardDescription className="text-sm">{user.description}</CardDescription>

        {user.employmentStatus && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Briefcase className="h-3 w-3" />
            <span className="font-medium">{user.employmentStatus}</span>
          </div>
        )}

        {entityInfo && (
          <p className="text-xs text-muted-foreground mt-1">
            📍 {mairie?.city || (entity as any)?.city}, {mairie?.province || 'Gabon'}
          </p>
        )}
      </CardHeader>

      <CardContent className="py-2">
        <div>
          <h4 className="font-semibold text-xs mb-2 text-muted-foreground">PERMISSIONS :</h4>
          <ul className="space-y-1">
            {user.permissions.slice(0, 3).map((permission, index) => (
              <li key={index} className="text-xs flex items-start gap-2">
                <Check className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{permission}</span>
              </li>
            ))}
            {user.permissions.length > 3 && (
              <li className="text-xs text-muted-foreground italic">
                +{user.permissions.length - 3} autres permissions
              </li>
            )}
          </ul>
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <Button
          onClick={handleSimulate}
          className="w-full"
          variant="default"
          size="sm"
        >
          Simuler cet utilisateur
        </Button>
      </CardFooter>
    </Card>
  );
}