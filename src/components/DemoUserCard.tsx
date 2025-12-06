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
    <Card className="transition-all duration-200 hover:shadow-md border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between gap-2 mb-1">
          <Badge className={`${getRoleColor()} text-[10px] md:text-xs`}>
            <span className="mr-1">{user.badge}</span>
            <span className="hidden sm:inline">{getRoleDisplayLabel()}</span>
            <span className="sm:hidden">{getRoleDisplayLabel().split(' ')[0]}</span>
          </Badge>
          {entityInfo && (
            <span className="text-lg">🇬🇦</span>
          )}
        </div>
        <CardTitle className="text-sm md:text-base leading-tight">{user.name}</CardTitle>
        <CardDescription className="text-xs line-clamp-2">{user.description}</CardDescription>

        {entityInfo && (
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
            📍 {mairie?.city || (entity as any)?.city}
          </p>
        )}
      </CardHeader>

      <CardContent className="p-3 pt-0">
        <div>
          <h4 className="font-semibold text-[10px] md:text-xs mb-1 text-muted-foreground">PERMISSIONS :</h4>
          <ul className="space-y-0.5">
            {user.permissions.slice(0, 2).map((permission, index) => (
              <li key={index} className="text-[10px] md:text-xs flex items-start gap-1">
                <Check className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground line-clamp-1">{permission}</span>
              </li>
            ))}
            {user.permissions.length > 2 && (
              <li className="text-[10px] md:text-xs text-muted-foreground italic">
                +{user.permissions.length - 2} autres
              </li>
            )}
          </ul>
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0">
        <Button
          onClick={handleSimulate}
          className="w-full h-8 text-xs"
          variant="default"
          size="sm"
        >
          Simuler
        </Button>
      </CardFooter>
    </Card>
  );
}