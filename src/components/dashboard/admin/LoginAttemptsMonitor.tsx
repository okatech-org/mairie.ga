import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle2, XCircle, Shield, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  ip_address: string | null;
  created_at: string;
}

interface LoginStats {
  total: number;
  successful: number;
  failed: number;
  uniqueEmails: number;
}

export function LoginAttemptsMonitor() {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [stats, setStats] = useState<LoginStats>({ total: 0, successful: 0, failed: 0, uniqueEmails: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttempts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from("login_attempts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (fetchError) {
        throw fetchError;
      }

      setAttempts(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const successful = data?.filter(a => a.success).length || 0;
      const failed = total - successful;
      const uniqueEmails = new Set(data?.map(a => a.email)).size;

      setStats({ total, successful, failed, uniqueEmails });
    } catch (err: any) {
      console.error("Error fetching login attempts:", err);
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, []);

  const getTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
  };

  const failureRate = stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Monitoring Connexions</CardTitle>
              <CardDescription>Tentatives de connexion récentes</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchAttempts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-xl font-bold">{stats.total}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Total</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-green-500/10">
            <div className="text-xl font-bold text-green-600">{stats.successful}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Réussies</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-500/10">
            <div className="text-xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Échouées</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-orange-500/10">
            <div className="text-xl font-bold text-orange-600">{failureRate}%</div>
            <div className="text-[10px] text-muted-foreground uppercase">Échec</div>
          </div>
        </div>

        {/* Alert if high failure rate */}
        {failureRate > 30 && stats.total > 5 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Taux d'échec élevé - Vérifiez les tentatives suspectes</span>
          </div>
        )}

        {/* Attempts List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <p>{error}</p>
            <Button variant="link" size="sm" onClick={fetchAttempts}>
              Réessayer
            </Button>
          </div>
        ) : attempts.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Aucune tentative de connexion enregistrée
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className={`flex items-center justify-between p-2 rounded-lg border ${
                    attempt.success 
                      ? 'border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10' 
                      : 'border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {attempt.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{attempt.email}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{getTimeAgo(attempt.created_at)}</span>
                        {attempt.ip_address && (
                          <>
                            <span>•</span>
                            <span className="font-mono">{attempt.ip_address}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant={attempt.success ? "default" : "destructive"} className="text-[10px] flex-shrink-0">
                    {attempt.success ? "OK" : "Échec"}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
