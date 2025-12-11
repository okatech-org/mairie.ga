import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  RefreshCw,
  History,
  Filter,
  Calendar,
  Search,
  Download,
  XCircle,
  Mail,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { auditService } from "@/services/audit-service";
import { AlertTrendsChart } from "@/components/dashboard/admin/AlertTrendsChart";
import { WeeklyReportConfig } from "@/components/dashboard/admin/WeeklyReportConfig";

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

interface AlertHistoryItem {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: string;
  triggeredAt: string;
  count: number;
  threshold: number;
  userId?: string;
  resolved: boolean;
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
  const [activeTab, setActiveTab] = useState("rules");
  
  // Alert History State
  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("7");
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    // Load rules from localStorage or use defaults
    const savedRules = localStorage.getItem('security_rules');
    if (savedRules) {
      setRules(JSON.parse(savedRules));
    } else {
      setRules(DEFAULT_RULES);
    }
    
    // Load alert history from localStorage
    const savedAlerts = localStorage.getItem('security_alert_history');
    if (savedAlerts) {
      setAlertHistory(JSON.parse(savedAlerts));
    } else {
      // Generate mock history for demo
      generateMockAlertHistory();
    }
  }, []);

  const generateMockAlertHistory = () => {
    const mockAlerts: AlertHistoryItem[] = [
      {
        id: '1',
        ruleId: 'mass_deletion',
        ruleName: 'Suppression massive',
        severity: 'critical',
        triggeredAt: subDays(new Date(), 1).toISOString(),
        count: 15,
        threshold: 10,
        resolved: true
      },
      {
        id: '2',
        ruleId: 'rapid_login_failures',
        ruleName: 'Échecs de connexion rapides',
        severity: 'high',
        triggeredAt: subDays(new Date(), 2).toISOString(),
        count: 8,
        threshold: 5,
        resolved: true
      },
      {
        id: '3',
        ruleId: 'mass_updates',
        ruleName: 'Modifications massives',
        severity: 'high',
        triggeredAt: subDays(new Date(), 3).toISOString(),
        count: 120,
        threshold: 100,
        resolved: false
      },
      {
        id: '4',
        ruleId: 'rapid_login_failures',
        ruleName: 'Échecs de connexion rapides',
        severity: 'high',
        triggeredAt: subDays(new Date(), 5).toISOString(),
        count: 7,
        threshold: 5,
        resolved: true
      },
      {
        id: '5',
        ruleId: 'mass_export',
        ruleName: 'Export massif de données',
        severity: 'high',
        triggeredAt: subDays(new Date(), 7).toISOString(),
        count: 25,
        threshold: 20,
        resolved: true
      },
      {
        id: '6',
        ruleId: 'rapid_status_changes',
        ruleName: 'Changements de statut rapides',
        severity: 'medium',
        triggeredAt: subDays(new Date(), 10).toISOString(),
        count: 60,
        threshold: 50,
        resolved: true
      },
      {
        id: '7',
        ruleId: 'mass_deletion',
        ruleName: 'Suppression massive',
        severity: 'critical',
        triggeredAt: subDays(new Date(), 14).toISOString(),
        count: 12,
        threshold: 10,
        resolved: true
      },
      {
        id: '8',
        ruleId: 'mass_updates',
        ruleName: 'Modifications massives',
        severity: 'high',
        triggeredAt: subDays(new Date(), 20).toISOString(),
        count: 150,
        threshold: 100,
        resolved: true
      }
    ];
    setAlertHistory(mockAlerts);
    localStorage.setItem('security_alert_history', JSON.stringify(mockAlerts));
  };

  const filteredAlerts = useMemo(() => {
    const days = parseInt(dateFilter);
    const cutoffDate = subDays(new Date(), days);
    
    return alertHistory.filter(alert => {
      // Date filter
      const alertDate = new Date(alert.triggeredAt);
      if (alertDate < cutoffDate) return false;
      
      // Severity filter
      if (severityFilter !== "all" && alert.severity !== severityFilter) return false;
      
      // Search filter
      if (searchFilter) {
        const search = searchFilter.toLowerCase();
        if (!alert.ruleName.toLowerCase().includes(search)) return false;
      }
      
      return true;
    });
  }, [alertHistory, dateFilter, severityFilter, searchFilter]);

  const alertStats = useMemo(() => {
    return {
      total: filteredAlerts.length,
      critical: filteredAlerts.filter(a => a.severity === 'critical').length,
      high: filteredAlerts.filter(a => a.severity === 'high').length,
      medium: filteredAlerts.filter(a => a.severity === 'medium').length,
      low: filteredAlerts.filter(a => a.severity === 'low').length,
      unresolved: filteredAlerts.filter(a => !a.resolved).length
    };
  }, [filteredAlerts]);

  const handleResolveAlert = (alertId: string) => {
    const updated = alertHistory.map(a => 
      a.id === alertId ? { ...a, resolved: true } : a
    );
    setAlertHistory(updated);
    localStorage.setItem('security_alert_history', JSON.stringify(updated));
    toast.success("Alerte marquée comme résolue");
  };

  const handleExportAlerts = () => {
    const csvContent = [
      ['ID', 'Règle', 'Sévérité', 'Date', 'Occurrences', 'Seuil', 'Statut'].join(','),
      ...filteredAlerts.map(a => [
        a.id,
        a.ruleName,
        a.severity,
        format(new Date(a.triggeredAt), 'dd/MM/yyyy HH:mm'),
        a.count,
        a.threshold,
        a.resolved ? 'Résolu' : 'Non résolu'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alertes-securite-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success("Export téléchargé");
  };

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
              Gérez les règles de détection et consultez l'historique des alertes
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Règles ({rules.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historique ({alertStats.total})
              {alertStats.unresolved > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {alertStats.unresolved}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Rapports
            </TabsTrigger>
          </TabsList>

          {/* Rules Tab */}
          <TabsContent value="rules" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleResetToDefaults}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
              <Button onClick={handleNewRule}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Règle
              </Button>
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
          </TabsContent>

          {/* Alert History Tab */}
          <TabsContent value="history" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="neu-raised">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{alertStats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </CardContent>
              </Card>
              <Card className="neu-raised border-red-200 dark:border-red-800">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{alertStats.critical}</div>
                  <div className="text-xs text-muted-foreground">Critiques</div>
                </CardContent>
              </Card>
              <Card className="neu-raised border-orange-200 dark:border-orange-800">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">{alertStats.high}</div>
                  <div className="text-xs text-muted-foreground">Hautes</div>
                </CardContent>
              </Card>
              <Card className="neu-raised border-yellow-200 dark:border-yellow-800">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{alertStats.medium}</div>
                  <div className="text-xs text-muted-foreground">Moyennes</div>
                </CardContent>
              </Card>
              <Card className="neu-raised border-destructive/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-destructive">{alertStats.unresolved}</div>
                  <div className="text-xs text-muted-foreground">Non résolues</div>
                </CardContent>
              </Card>
            </div>

            {/* Trend Charts */}
            <AlertTrendsChart alerts={filteredAlerts} dateFilter={dateFilter} />

            <Card className="neu-raised">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filtres:</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-40 h-8"
                    />
                  </div>
                  
                  <Select value={severityFilter} onValueChange={setSeverityFilter}>
                    <SelectTrigger className="w-36 h-8">
                      <SelectValue placeholder="Sévérité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="critical">Critique</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="low">Basse</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-40 h-8">
                      <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 derniers jours</SelectItem>
                      <SelectItem value="14">14 derniers jours</SelectItem>
                      <SelectItem value="30">30 derniers jours</SelectItem>
                      <SelectItem value="90">90 derniers jours</SelectItem>
                      <SelectItem value="365">1 an</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex-1" />
                  
                  <Button variant="outline" size="sm" onClick={handleExportAlerts}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Alert List */}
            <Card className="neu-raised">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Historique des Alertes ({filteredAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {filteredAlerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>Aucune alerte trouvée pour cette période</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`p-4 rounded-lg border ${
                            alert.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                            alert.severity === 'high' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
                            alert.severity === 'medium' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                            'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-full ${
                                alert.severity === 'critical' ? 'bg-red-100 dark:bg-red-800' :
                                alert.severity === 'high' ? 'bg-orange-100 dark:bg-orange-800' :
                                alert.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-800' :
                                'bg-blue-100 dark:bg-blue-800'
                              }`}>
                                <AlertTriangle className={`h-4 w-4 ${
                                  alert.severity === 'critical' ? 'text-red-600' :
                                  alert.severity === 'high' ? 'text-orange-600' :
                                  alert.severity === 'medium' ? 'text-yellow-600' :
                                  'text-blue-600'
                                }`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{alert.ruleName}</span>
                                  {getSeverityBadge(alert.severity)}
                                  {!alert.resolved && (
                                    <Badge variant="destructive" className="text-[10px]">Non résolu</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {alert.count} occurrences détectées (seuil: {alert.threshold})
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(alert.triggeredAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                                </p>
                              </div>
                            </div>
                            
                            {!alert.resolved && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolveAlert(alert.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Résoudre
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <WeeklyReportConfig />
          </TabsContent>
        </Tabs>

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
