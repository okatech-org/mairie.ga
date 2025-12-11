import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, AlertTriangle, Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface SecurityNotification {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface SecurityNotificationContextType {
  notifications: SecurityNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const SecurityNotificationContext = createContext<SecurityNotificationContextType | null>(null);

export const useSecurityNotifications = () => {
  const context = useContext(SecurityNotificationContext);
  if (!context) {
    throw new Error('useSecurityNotifications must be used within SecurityNotificationProvider');
  }
  return context;
};

interface Props {
  children: ReactNode;
}

export function SecurityNotificationProvider({ children }: Props) {
  const [notifications, setNotifications] = useState<SecurityNotification[]>([]);
  const [showBanner, setShowBanner] = useState(false);
  const [latestCritical, setLatestCritical] = useState<SecurityNotification | null>(null);

  useEffect(() => {
    // Subscribe to real-time audit logs for suspicious activity
    const channel = supabase
      .channel('security-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs'
        },
        (payload) => {
          checkForSuspiciousActivity(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkForSuspiciousActivity = async (newLog: any) => {
    // Check for critical actions
    const criticalActions = ['DELETE'];
    const highActions = ['LOGIN_FAILED'];

    if (criticalActions.includes(newLog.action)) {
      // Check for mass deletion pattern
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const { count } = await (supabase as any)
        .from('audit_logs')
        .select('id', { count: 'exact' })
        .eq('action', 'DELETE')
        .eq('user_id', newLog.user_id)
        .gte('created_at', oneHourAgo.toISOString());

      if (count && count >= 10) {
        addNotification({
          type: 'critical',
          title: 'Suppression massive détectée',
          message: `${count} suppressions effectuées en 1 heure par un utilisateur`
        });
      }
    }

    if (highActions.includes(newLog.action)) {
      // Check for rapid login failures
      const fifteenMinutesAgo = new Date();
      fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

      const { count } = await (supabase as any)
        .from('audit_logs')
        .select('id', { count: 'exact' })
        .eq('action', 'LOGIN_FAILED')
        .gte('created_at', fifteenMinutesAgo.toISOString());

      if (count && count >= 5) {
        addNotification({
          type: 'high',
          title: 'Tentatives de connexion suspectes',
          message: `${count} échecs de connexion en 15 minutes`
        });
      }
    }
  };

  const addNotification = (notification: Omit<SecurityNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: SecurityNotification = {
      ...notification,
      id: `notif_${Date.now()}`,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50));

    // Show toast for all notifications
    const icon = notification.type === 'critical' ? '🚨' : 
                 notification.type === 'high' ? '⚠️' : 
                 notification.type === 'medium' ? '📢' : 'ℹ️';

    toast(notification.title, {
      description: notification.message,
      icon,
      duration: notification.type === 'critical' ? 10000 : 5000
    });

    // Show banner for critical notifications
    if (notification.type === 'critical') {
      setLatestCritical(newNotification);
      setShowBanner(true);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SecurityNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications
      }}
    >
      {children}
      
      {/* Critical Alert Banner */}
      <AnimatePresence>
        {showBanner && latestCritical && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white p-3 shadow-lg"
          >
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 animate-pulse" />
                <div>
                  <span className="font-bold">{latestCritical.title}</span>
                  <span className="mx-2">—</span>
                  <span>{latestCritical.message}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setShowBanner(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SecurityNotificationContext.Provider>
  );
}
