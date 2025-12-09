import { useState, useEffect } from 'react';
import { Monitor, Smartphone, Tablet, Clock, MapPin, Trash2, LogOut, RefreshCw, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  ActiveSession, 
  getAllSessions, 
  getUserSessions, 
  terminateSession, 
  terminateOtherSessions 
} from '@/services/sessionService';
import { useAuth } from '@/hooks/useAuth';

interface ActiveSessionsManagerProps {
  isAdmin?: boolean;
}

export function ActiveSessionsManager({ isAdmin = false }: ActiveSessionsManagerProps) {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, session } = useAuth();

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const data = isAdmin 
        ? await getAllSessions()
        : user ? await getUserSessions(user.id) : [];
      setSessions(data);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user, isAdmin]);

  const handleTerminateSession = async (sessionId: string, isCurrent: boolean) => {
    if (isCurrent) {
      toast.error("Impossible de terminer la session actuelle");
      return;
    }

    const success = await terminateSession(sessionId);
    if (success) {
      toast.success("Session terminée avec succès");
      fetchSessions();
    } else {
      toast.error("Erreur lors de la terminaison de la session");
    }
  };

  const handleTerminateOtherSessions = async () => {
    if (!user || !session?.access_token) return;
    
    const success = await terminateOtherSessions(user.id, session.access_token);
    if (success) {
      toast.success("Toutes les autres sessions ont été terminées");
      fetchSessions();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Aucune session active</p>
        <p className="text-sm">Les sessions apparaîtront ici après connexion.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {sessions.length} session{sessions.length > 1 ? 's' : ''} active{sessions.length > 1 ? 's' : ''}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSessions}>
            <RefreshCw className="w-4 h-4 mr-2" />
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
                      Dernière activité: {formatDistanceToNow(new Date(sessionItem.last_activity), { addSuffix: true, locale: fr })}
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
    </div>
  );
}
