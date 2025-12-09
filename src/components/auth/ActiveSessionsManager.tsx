import { useState, useEffect } from 'react';
import { Monitor, Smartphone, Tablet, Clock, MapPin, Trash2, LogOut, RefreshCw, Shield, History, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  ActiveSession,
  SessionHistoryItem,
  getAllSessions,
  getUserSessions,
  getSessionHistory,
  terminateSession,
  terminateOtherSessions
} from '@/services/sessionService';
import { useAuth } from '@/hooks/useAuth';

interface ActiveSessionsManagerProps {
  isAdmin?: boolean;
}

export function ActiveSessionsManager({ isAdmin = false }: ActiveSessionsManagerProps) {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState("active");
  const { user, session } = useAuth();

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!user && !isAdmin) return;
      const userId = user?.id || '';

      if (currentTab === "active") {
        const data = isAdmin
          ? await getAllSessions()
          : await getUserSessions(userId);
        setSessions(data);
      } else {
        const data = await getSessionHistory(userId);
        setHistory(data);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, isAdmin, currentTab]);

  const handleTerminateSession = async (sessionId: string, isCurrent: boolean) => {
    if (isCurrent) {
      toast.error("Impossible de terminer la session actuelle");
      return;
    }

    const success = await terminateSession(sessionId);
    if (success) {
      toast.success("Session terminée avec succès");
      // Refresh both to show update in history if applicable
      fetchData();
    } else {
      toast.error("Erreur lors de la terminaison de la session");
    }
  };

  const handleTerminateOtherSessions = async () => {
    if (!user || !session?.access_token) return;

    const success = await terminateOtherSessions(user.id, session.access_token);
    if (success) {
      toast.success("Toutes les autres sessions ont été terminées");
      fetchData();
    } else {
      toast.error("Erreur lors de la terminaison des sessions");
    }
  };

  const getDeviceIcon = (deviceInfo: string | null) => {
    if (!deviceInfo) return <Monitor className="w-5 h-5" />;
    if (deviceInfo.toLowerCase().includes('mobile')) return <Smartphone className="w-5 h-5" />;
    if (deviceInfo.toLowerCase().includes('tablet')) return <Tablet className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  const getBrowserColor = (browser: string | null) => {
    switch (browser?.toLowerCase()) {
      case 'chrome': return 'bg-green-100 text-green-800 border-green-300';
      case 'firefox': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'safari': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'edge': return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="active" value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="active">Sessions Actives</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {/* Header with actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {sessions.length} session{sessions.length > 1 ? 's' : ''} active{sessions.length > 1 ? 's' : ''}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              {sessions.length > 1 && !isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <LogOut className="w-4 h-4 mr-2" />
                      Déconnecter les autres
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Déconnecter toutes les autres sessions ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cela terminera toutes vos sessions actives sauf la session actuelle.
                        Vous devrez vous reconnecter sur ces appareils.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={handleTerminateOtherSessions}>
                        Confirmer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          {/* Sessions list */}
          {loading && sessions.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Aucune session active</p>
              <p className="text-sm">Les sessions apparaîtront ici après connexion.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((sessionItem) => (
                <div
                  key={sessionItem.id}
                  className={`p-4 rounded-lg border ${sessionItem.is_current ? 'bg-primary/5 border-primary/30' : 'bg-muted/30 border-border'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${sessionItem.is_current ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {getDeviceIcon(sessionItem.device_info)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {sessionItem.device_info || 'Appareil inconnu'}
                          </span>
                          {sessionItem.is_current && (
                            <Badge variant="default" className="text-xs">
                              Session actuelle
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          {sessionItem.browser && (
                            <Badge variant="outline" className={getBrowserColor(sessionItem.browser)}>
                              {sessionItem.browser}
                            </Badge>
                          )}
                          {sessionItem.os && (
                            <Badge variant="outline">
                              {sessionItem.os}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {sessionItem.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-primary" />
                              <span className="font-medium">{sessionItem.location}</span>
                            </span>
                          )}
                          {sessionItem.ip_address && (
                            <span className="flex items-center gap-1">
                              IP: {sessionItem.ip_address}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Actif: {formatDistanceToNow(new Date(sessionItem.last_activity), { addSuffix: true, locale: fr })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!sessionItem.is_current && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Terminer cette session ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              L'utilisateur sera déconnecté de cet appareil et devra se reconnecter.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleTerminateSession(sessionItem.id, sessionItem.is_current)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Terminer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Historique des connexions</h3>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>

          {loading && history.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Aucun historique disponible</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="p-4 rounded-lg border bg-card text-card-foreground">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                        {getDeviceIcon(item.device_info)}
                      </div>
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2">
                          {item.device_info || 'Appareil inconnu'}
                          {item.logout_at && <Badge variant="secondary" className="text-[10px]">Terminée</Badge>}
                          {!item.logout_at && <Badge variant="default" className="text-[10px]">Active</Badge>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {item.browser} sur {item.os}
                          </span>
                          {item.location && <span>• {item.location}</span>}
                          {item.ip_address && <span>• {item.ip_address}</span>}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Début: {format(new Date(item.login_at), "d MMM yyyy HH:mm", { locale: fr })}
                          </span>
                          {item.logout_at && (
                            <span className="flex items-center gap-1">
                              <LogOut className="w-3 h-3" />
                              Fin: {format(new Date(item.logout_at), "HH:mm", { locale: fr })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
