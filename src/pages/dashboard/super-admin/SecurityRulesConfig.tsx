import { useState, useEffect } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Shield, 
  Plus, 
  Trash2, 
  Edit, 
  AlertTriangle,
  Clock,
  Activity,
  Save,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface SecurityRule {
  id: string;
  name: string;
  description: string;
  action: string;
  threshold: number;
  windowMinutes: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

const DEFAULT_RULES: SecurityRule[] = [
  {
    id: 'mass_deletion',
    name: 'Suppression massive',
    description: 'Plus de 10 suppressions en 1 heure',
    action: 'DELETE',
    threshold: 10,
    windowMinutes: 60,
    severity: 'critical',
    enabled: true
  },
  {
    id: 'rapid_login_failures',
    name: 'Échecs de connexion rapides',
    description: 'Plus de 5 échecs de connexion en 15 minutes',
    action: 'LOGIN_FAILED',
    threshold: 5,
    windowMinutes: 15,
    severity: 'high',
    enabled: true
  },
  {
    id: 'mass_export',
    name: 'Export massif de données',
    description: 'Plus de 20 exports en 1 heure',
    action: 'EXPORT',
    threshold: 20,
    windowMinutes: 60,
    severity: 'high',
    enabled: true
  },
  {
    id: 'rapid_status_changes',
    name: 'Changements de statut rapides',
    description: 'Plus de 50 changements de statut en 30 minutes',
    action: 'STATUS_CHANGE',
    threshold: 50,
    windowMinutes: 30,
    severity: 'medium',
    enabled: true
  },
  {
    id: 'mass_updates',
    name: 'Modifications massives',
    description: 'Plus de 100 modifications en 30 minutes',
    action: 'UPDATE',
    threshold: 100,
    windowMinutes: 30,
    severity: 'high',
    enabled: true
  }
];

const AVAILABLE_ACTIONS = [
  { value: 'DELETE', label: 'Suppression' },
  { value: 'CREATE', label: 'Création' },
  { value: 'UPDATE', label: 'Modification' },
  { value: 'LOGIN_FAILED', label: 'Échec de connexion' },
  { value: 'LOGIN', label: 'Connexion' },
  { value: 'EXPORT', label: 'Export' },
  { value: 'STATUS_CHANGE', label: 'Changement de statut' },
  { value: '*', label: 'Toute action' }
];

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Basse', color: 'bg-blue-500' },
  { value: 'medium', label: 'Moyenne', color: 'bg-yellow-500' },
  { value: 'high', label: 'Haute', color: 'bg-orange-500' },
  { value: 'critical', label: 'Critique', color: 'bg-red-500' }
];

export default function SecurityRulesConfig() {
  const [rules, setRules] = useState<SecurityRule[]>([]);
  const [editingRule, setEditingRule] = useState<SecurityRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewRule, setIsNewRule] = useState(false);

  useEffect(() => {
    // Load rules from localStorage or use defaults
    const savedRules = localStorage.getItem('security_rules');
    if (savedRules) {
      setRules(JSON.parse(savedRules));
    } else {
      setRules(DEFAULT_RULES);
    }
  }, []);

  const saveRules = (newRules: SecurityRule[]) => {
    setRules(newRules);
    localStorage.setItem('security_rules', JSON.stringify(newRules));
    toast.success("Règles sauvegardées");
  };

  const handleToggleRule = (ruleId: string) => {
    const newRules = rules.map(r => 
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    );
    saveRules(newRules);
  };

  const handleDeleteRule = (ruleId: string) => {
    const newRules = rules.filter(r => r.id !== ruleId);
    saveRules(newRules);
    toast.success("Règle supprimée");
  };

  const handleEditRule = (rule: SecurityRule) => {
    setEditingRule({ ...rule });
    setIsNewRule(false);
    setIsDialogOpen(true);
  };

  const handleNewRule = () => {
    setEditingRule({
      id: `custom_${Date.now()}`,
      name: '',
      description: '',
      action: 'DELETE',
      threshold: 10,
      windowMinutes: 60,
      severity: 'medium',
      enabled: true
    });
    setIsNewRule(true);
    setIsDialogOpen(true);
  };

  const handleSaveRule = () => {
    if (!editingRule || !editingRule.name.trim()) {
      toast.error("Le nom de la règle est requis");
      return;
    }

    let newRules: SecurityRule[];
    if (isNewRule) {
      newRules = [...rules, editingRule];
    } else {
      newRules = rules.map(r => r.id === editingRule.id ? editingRule : r);
    }
    
    saveRules(newRules);
    setIsDialogOpen(false);
    setEditingRule(null);
  };

  const handleResetToDefaults = () => {
    saveRules(DEFAULT_RULES);
    toast.success("Règles réinitialisées aux valeurs par défaut");
  };

  const getSeverityBadge = (severity: string) => {
    const config = SEVERITY_OPTIONS.find(s => s.value === severity);
    return (
      <Badge className={`${config?.color} text-white`}>
        {config?.label}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Configuration des Règles de Sécurité
            </h1>
            <p className="text-muted-foreground">
              Gérez les règles de détection des comportements suspects
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleResetToDefaults}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
            <Button onClick={handleNewRule}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Règle
            </Button>
          </div>
        </div>

        {/* Rules List */}
        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id} className={`neu-raised ${!rule.enabled ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={() => handleToggleRule(rule.id)}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{rule.name}</h3>
                        {getSeverityBadge(rule.severity)}
                      </div>
                      <p className="text-sm text-muted-foreground">{rule.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Activity className="h-3 w-3" />
                        Action
                      </div>
                      <Badge variant="outline">{rule.action}</Badge>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <AlertTriangle className="h-3 w-3" />
                        Seuil
                      </div>
                      <span className="font-bold">{rule.threshold}</span>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Fenêtre
                      </div>
                      <span className="font-bold">{rule.windowMinutes} min</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditRule(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit/Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isNewRule ? 'Nouvelle Règle' : 'Modifier la Règle'}
              </DialogTitle>
            </DialogHeader>
            
            {editingRule && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de la règle</Label>
                  <Input
                    id="name"
                    value={editingRule.name}
                    onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                    placeholder="Ex: Suppression massive"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={editingRule.description}
                    onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                    placeholder="Description de la règle"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Action surveillée</Label>
                    <Select
                      value={editingRule.action}
                      onValueChange={(value) => setEditingRule({ ...editingRule, action: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_ACTIONS.map((action) => (
                          <SelectItem key={action.value} value={action.value}>
                            {action.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Sévérité</Label>
                    <Select
                      value={editingRule.severity}
                      onValueChange={(value) => setEditingRule({ 
                        ...editingRule, 
                        severity: value as SecurityRule['severity'] 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SEVERITY_OPTIONS.map((severity) => (
                          <SelectItem key={severity.value} value={severity.value}>
                            {severity.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="threshold">Seuil (nombre d'actions)</Label>
                    <Input
                      id="threshold"
                      type="number"
                      min="1"
                      value={editingRule.threshold}
                      onChange={(e) => setEditingRule({ 
                        ...editingRule, 
                        threshold: parseInt(e.target.value) || 1 
                      })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="window">Fenêtre (minutes)</Label>
                    <Input
                      id="window"
                      type="number"
                      min="1"
                      value={editingRule.windowMinutes}
                      onChange={(e) => setEditingRule({ 
                        ...editingRule, 
                        windowMinutes: parseInt(e.target.value) || 1 
                      })}
                    />
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveRule}>
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
