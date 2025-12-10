import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Loader2,
  TrendingUp,
  Users,
  FileText,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CorrespondenceLog {
  id: string;
  subject: string;
  recipient_name: string | null;
  status: string | null;
  sent_at: string | null;
  created_at: string | null;
  metadata: {
    arreteId?: string;
    arreteNumero?: string;
    arreteType?: string;
    successCount?: number;
    errorCount?: number;
    totalRecipients?: number;
    errors?: string[];
  } | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  SENT: { label: 'Envoyé', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: <CheckCircle className="h-3 w-3" /> },
  DELIVERED: { label: 'Délivré', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: <CheckCircle className="h-3 w-3" /> },
  PENDING: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: <Clock className="h-3 w-3" /> },
  FAILED: { label: 'Échoué', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: <XCircle className="h-3 w-3" /> },
  BOUNCED: { label: 'Rebond', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: <AlertCircle className="h-3 w-3" /> }
};

export function NotificationHistoryPanel() {
  const [logs, setLogs] = useState<CorrespondenceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const { data, error } = await supabase
        .from('correspondence_logs')
        .select('*')
        .ilike('subject', '%arrêté%')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Cast the data to handle the metadata type
      const typedData = (data || []).map(log => ({
        ...log,
        metadata: log.metadata as CorrespondenceLog['metadata']
      }));
      
      setLogs(typedData);
    } catch (error) {
      console.error('Error loading notification logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate stats
  const stats = {
    total: logs.length,
    totalRecipients: logs.reduce((sum, log) => sum + (log.metadata?.totalRecipients || 0), 0),
    successRate: logs.length > 0 
      ? Math.round(
          (logs.reduce((sum, log) => sum + (log.metadata?.successCount || 0), 0) /
           logs.reduce((sum, log) => sum + (log.metadata?.totalRecipients || 1), 0)) * 100
        )
      : 0,
    failed: logs.filter(l => l.status === 'FAILED').length
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Historique des notifications
            </CardTitle>
            <CardDescription>
              Suivi des notifications envoyées aux citoyens
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadLogs(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <FileText className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Campagnes</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <p className="text-2xl font-bold">{stats.totalRecipients}</p>
            <p className="text-xs text-muted-foreground">Destinataires</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold">{stats.successRate}%</p>
            <p className="text-xs text-muted-foreground">Taux de réussite</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <XCircle className="h-5 w-5 mx-auto mb-1 text-red-600" />
            <p className="text-2xl font-bold">{stats.failed}</p>
            <p className="text-xs text-muted-foreground">Échecs</p>
          </div>
        </div>

        {/* Logs List */}
        <ScrollArea className="h-[400px]">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucune notification envoyée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const status = statusConfig[log.status || 'PENDING'];
                const metadata = log.metadata;
                
                return (
                  <div
                    key={log.id}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={status.color}>
                            {status.icon}
                            <span className="ml-1">{status.label}</span>
                          </Badge>
                          {metadata?.arreteType && (
                            <Badge variant="secondary" className="text-xs">
                              {metadata.arreteType}
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium text-sm truncate">
                          {metadata?.arreteNumero || log.subject}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {log.sent_at 
                            ? format(new Date(log.sent_at), "d MMM yyyy 'à' HH:mm", { locale: fr })
                            : format(new Date(log.created_at || ''), "d MMM yyyy 'à' HH:mm", { locale: fr })
                          }
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {metadata && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span className="text-green-600 font-medium">{metadata.successCount || 0}</span>
                            </div>
                            {(metadata.errorCount || 0) > 0 && (
                              <div className="flex items-center gap-1 text-xs">
                                <XCircle className="h-3 w-3 text-red-600" />
                                <span className="text-red-600 font-medium">{metadata.errorCount}</span>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              / {metadata.totalRecipients || 0} dest.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    {metadata?.errors && metadata.errors.length > 0 && (
                      <div className="mt-2 p-2 rounded bg-red-50 dark:bg-red-950/20 text-xs text-red-600">
                        {metadata.errors[0]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
