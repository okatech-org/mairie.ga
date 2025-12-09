import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDemo } from "@/contexts/DemoContext";
import { DemoUser } from "@/types/roles";
import { MunicipalRole, MUNICIPAL_ROLE_MAPPING } from "@/types/municipal-roles";
import { getEntityById } from "@/data/mock-entities";
import { getMairieById } from "@/data/mock-mairies-network";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { loginDemoUser, getDemoCredentials } from "@/services/demoAuthService";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  [MunicipalRole.CITOYEN]: 'bg-sky-600',
  [MunicipalRole.CITOYEN_AUTRE_COMMUNE]: 'bg-cyan-500',
  [MunicipalRole.ETRANGER_RESIDENT]: 'bg-indigo-500',
  [MunicipalRole.PERSONNE_MORALE]: 'bg-amber-600',
};

export function DemoUserCard({ user }: DemoUserCardProps) {
  const navigate = useNavigate();
  const { simulateUser } = useDemo();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Essayer d'abord les mairies puis les anciennes entités
  const mairie = user.entityId ? getMairieById(user.entityId) : null;
  const entity = !mairie && user.entityId ? getEntityById(user.entityId) : null;
  const entityInfo = mairie || entity;

  const credentials = getDemoCredentials(user.id);

  const getTargetRoute = () => {
    if (user.role === 'ADMIN') {
      return "/dashboard/super-admin";
    } else if (user.role === MunicipalRole.CITOYEN || user.role === MunicipalRole.CITOYEN_AUTRE_COMMUNE) {
      return "/dashboard/citizen";
    } else if (user.role === MunicipalRole.ETRANGER_RESIDENT) {
      return "/dashboard/foreigner";
    } else if (user.role === MunicipalRole.PERSONNE_MORALE) {
      return "/dashboard/citizen";
    } else if (user.role === MunicipalRole.MAIRE || user.role === MunicipalRole.MAIRE_ADJOINT) {
      return "/dashboard/maire";
    } else if (user.role === MunicipalRole.SECRETAIRE_GENERAL) {
      return "/dashboard/sg";
    } else if (user.role === MunicipalRole.CHEF_SERVICE || user.role === MunicipalRole.CHEF_BUREAU) {
      return "/dashboard/chef-service";
    } else {
      return "/dashboard/agent";
    }
  };

  const handleOneClickLogin = async () => {
    setLoading(true);
    
    try {
      // First, set the simulation context
      simulateUser(user.id);

      // Then, authenticate with Supabase
      const result = await loginDemoUser(user);
      
      if (result.success) {
        toast.success(`Bienvenue ${user.name} !`, {
          description: "Connexion réussie avec votre compte démo"
        });
        navigate(getTargetRoute());
      } else {
        // If auth fails, still allow simulation mode
        toast.warning("Mode simulation activé", {
          description: result.error || "Authentification Supabase non disponible"
        });
        navigate(getTargetRoute());
      }
    } catch (error) {
      console.error('Demo login error:', error);
      // Fallback to simulation mode
      toast.info("Mode simulation activé");
      navigate(getTargetRoute());
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = async () => {
    const text = `Email: ${credentials.email}\nMot de passe: ${credentials.password}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Identifiants copiés !");
    setTimeout(() => setCopied(false), 2000);
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={copyCredentials}
              >
                {copied ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3 text-muted-foreground" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p className="font-mono text-[10px]">{credentials.email}</p>
              <p className="text-muted-foreground text-[10px]">Cliquer pour copier</p>
            </TooltipContent>
          </Tooltip>
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
          onClick={handleOneClickLogin}
          className="w-full h-8 text-xs"
          variant="default"
          size="sm"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Connexion...
            </>
          ) : (
            "Se connecter"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}