import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  History, 
  AlertTriangle, 
  Activity, 
  FileText, 
  Users, 
  ArrowRight,
  Shield,
  TrendingUp,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { auditService, AuditLog } from "@/services/audit-service";
import { suspiciousBehaviorService } from "@/services/suspicious-behavior-service";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface AuditStats {
  totalToday: number;
  creations: number;
  updates: number;
  deletions: number;
  logins: number;
  recentLogs: AuditLog[];
}

interface SuspiciousSummary {
  totalTriggered: number;
  criticalCount: number;
  highCount: number;
  triggeredRules: Array<{
    ruleId: string;
    ruleName: string;
    count: number;
    severity: string;
  }>;
}

export function AuditSummaryWidget() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [suspicious, setSuspicious] = useState<SuspiciousSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [logs, suspiciousSummary] = await Promise.all([
          auditService.getLogs({ 
            startDate: today.toISOString(),
            limit: 500 
          }),
          suspiciousBehaviorService.getSuspiciousActivitySummary()
        ]);

        const recentLogs = logs.slice(0, 5);

        setStats({
          totalToday: logs.length,
          creations: logs.filter(l => l.action === 'CREATE').length,
          updates: logs.filter(l => l.action === 'UPDATE').length,
          deletions: logs.filter(l => l.action === 'DELETE').length,
          logins: logs.filter(l => l.action === 'LOGIN' || l.action === 'LOGIN_FAILED').length,
          recentLogs
        });

        setSuspicious(suspiciousSummary);
      } catch (error) {
        console.error("Error fetching audit data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE': return <FileText className="h-3 w-3 text-green-500" />;
      case 'UPDATE': return <Activity className="h-3 w-3 text-blue-500" />;
      case 'DELETE': return <AlertTriangle className="h-3 w-3 text-red-500" />;
      case 'LOGIN': return <Users className="h-3 w-3 text-purple-500" />;
      default: return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-blue-500 text-white';
    }
  };

  if (loading) {
    return (
      <Card className="neu-raised">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="neu-raised overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Journal d'Audit
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs"
            onClick={() => navigate('/dashboard/super-admin/audit-logs')}
          >
            Voir tout
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Suspicious Activity Alert */}
        {suspicious && suspicious.totalTriggered > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-red-600" />
              <span className="font-semibold text-red-700 dark:text-red-400 text-sm">
                {suspicious.totalTriggered} alerte{suspicious.totalTriggered > 1 ? 's' : ''} détectée{suspicious.totalTriggered > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {suspicious.triggeredRules.slice(0, 3).map((rule) => (
                <Badge 
                  key={rule.ruleId} 
                  className={`text-[10px] ${getSeverityColor(rule.severity)}`}
                >
                  {rule.ruleName}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-xl font-bold text-primary">{stats?.totalToday || 0}</div>
            <div className="text-[10px] text-muted-foreground">Aujourd'hui</div>
          </div>
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-xl font-bold text-green-600">{stats?.creations || 0}</div>
            <div className="text-[10px] text-muted-foreground">Créations</div>
          </div>
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-xl font-bold text-blue-600">{stats?.updates || 0}</div>
            <div className="text-[10px] text-muted-foreground">Mises à jour</div>
          </div>
          <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-xl font-bold text-red-600">{stats?.deletions || 0}</div>
            <div className="text-[10px] text-muted-foreground">Suppressions</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Activité récente</span>
          </div>
          
          {stats?.recentLogs.length === 0 ? (
            <div className="text-center text-muted-foreground text-xs py-4">
              Aucune activité récente
            </div>
          ) : (
            <div className="space-y-1">
              {stats?.recentLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-center gap-2 p-2 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors"
                >
                  {getActionIcon(log.action)}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">
                      {log.action} - {log.resourceType}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(log.createdAt), { 
                        addSuffix: true, 
                        locale: fr 
                      })}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] shrink-0">
                    {log.resourceType}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
