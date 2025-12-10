import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  BarChart3,
  Calendar,
  Gavel,
  FileCheck,
  Send
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, subWeeks, subMonths, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

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
    deliberationId?: string;
    deliberationNumero?: string;
    notificationType?: string;
    successCount?: number;
    errorCount?: number;
    totalRecipients?: number;
  } | null;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function CommunicationsDashboard() {
  const [logs, setLogs] = useState<CorrespondenceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month' | '3months'>('month');

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
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      
      const typedData = (data || []).map(log => ({
        ...log,
        metadata: log.metadata as CorrespondenceLog['metadata']
      }));
      
      setLogs(typedData);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter logs by period
  const filteredLogs = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'week':
        startDate = subWeeks(now, 1);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
      case '3months':
        startDate = subMonths(now, 3);
        break;
      default:
        startDate = subMonths(now, 1);
    }

    return logs.filter(log => {
      const logDate = new Date(log.created_at || log.sent_at || '');
      return logDate >= startDate;
    });
  }, [logs, period]);

  // Calculate stats
  const stats = useMemo(() => {
    const arretes = filteredLogs.filter(l => l.metadata?.arreteNumero || l.subject.includes('arrêté'));
    const deliberations = filteredLogs.filter(l => l.metadata?.deliberationNumero || l.metadata?.notificationType === 'DELIBERATION');
    const totalRecipients = filteredLogs.reduce((sum, l) => sum + (l.metadata?.totalRecipients || 0), 0);
    const successCount = filteredLogs.reduce((sum, l) => sum + (l.metadata?.successCount || 0), 0);
    const errorCount = filteredLogs.reduce((sum, l) => sum + (l.metadata?.errorCount || 0), 0);

    return {
      total: filteredLogs.length,
      arretes: arretes.length,
      deliberations: deliberations.length,
      totalRecipients,
      successCount,
      errorCount,
      successRate: totalRecipients > 0 ? Math.round((successCount / totalRecipients) * 100) : 0
    };
  }, [filteredLogs]);

  // Chart data - Daily trend
  const trendData = useMemo(() => {
    const now = new Date();
    let days: Date[];
    
    switch (period) {
      case 'week':
        days = eachDayOfInterval({ start: subDays(now, 7), end: now });
        break;
      case 'month':
        days = eachDayOfInterval({ start: subDays(now, 30), end: now });
        break;
      case '3months':
        days = eachWeekOfInterval({ start: subMonths(now, 3), end: now });
        break;
      default:
        days = eachDayOfInterval({ start: subDays(now, 30), end: now });
    }

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayLogs = filteredLogs.filter(log => {
        const logDate = format(new Date(log.created_at || ''), 'yyyy-MM-dd');
        if (period === '3months') {
          const weekStart = format(startOfWeek(new Date(log.created_at || '')), 'yyyy-MM-dd');
          return weekStart === dayStr;
        }
        return logDate === dayStr;
      });

      return {
        date: period === '3months' 
          ? format(day, 'd MMM', { locale: fr })
          : format(day, period === 'week' ? 'EEE' : 'd MMM', { locale: fr }),
        envois: dayLogs.length,
        destinataires: dayLogs.reduce((sum, l) => sum + (l.metadata?.totalRecipients || 0), 0),
        reussis: dayLogs.reduce((sum, l) => sum + (l.metadata?.successCount || 0), 0)
      };
    });
  }, [filteredLogs, period]);

  // Type distribution data
  const typeData = useMemo(() => {
    const arretes = filteredLogs.filter(l => l.metadata?.arreteNumero).length;
    const deliberations = filteredLogs.filter(l => l.metadata?.notificationType === 'DELIBERATION').length;
    const autres = filteredLogs.length - arretes - deliberations;

    return [
      { name: 'Arrêtés', value: arretes, color: '#3b82f6' },
      { name: 'Délibérations', value: deliberations, color: '#10b981' },
      { name: 'Autres', value: autres, color: '#6b7280' }
    ].filter(d => d.value > 0);
  }, [filteredLogs]);

  // Status distribution
  const statusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    filteredLogs.forEach(log => {
      const status = log.status || 'UNKNOWN';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [filteredLogs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Tableau de Bord Communications
          </h1>
          <p className="text-muted-foreground mt-1">
            Suivi des notifications et correspondances
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">7 jours</SelectItem>
              <SelectItem value="month">30 jours</SelectItem>
              <SelectItem value="3months">3 mois</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => loadLogs(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="col-span-1">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Send className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Campagnes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Gavel className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.arretes}</p>
                <p className="text-xs text-muted-foreground">Arrêtés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <FileCheck className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.deliberations}</p>
                <p className="text-xs text-muted-foreground">Délibérations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalRecipients.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Destinataires</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.successCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Réussis</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.errorCount}</p>
                <p className="text-xs text-muted-foreground">Échecs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.successRate}%</p>
                <p className="text-xs text-muted-foreground">Taux réussite</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Tendance des envois
            </CardTitle>
            <CardDescription>
              Évolution du nombre d'envois et de destinataires
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorEnvois" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDest" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="envois" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorEnvois)"
                    name="Campagnes"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="reussis" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorDest)"
                    name="Emails réussis"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Répartition par type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {typeData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activité récente
          </CardTitle>
          <CardDescription>
            Dernières notifications envoyées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[350px]">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucune notification sur cette période</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.slice(0, 20).map((log) => {
                  const isArrete = log.metadata?.arreteNumero;
                  const isDelib = log.metadata?.notificationType === 'DELIBERATION';
                  
                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${isArrete ? 'bg-blue-500/10' : isDelib ? 'bg-green-500/10' : 'bg-gray-500/10'}`}>
                        {isArrete ? (
                          <Gavel className="h-4 w-4 text-blue-500" />
                        ) : isDelib ? (
                          <FileCheck className="h-4 w-4 text-green-500" />
                        ) : (
                          <Mail className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {log.metadata?.arreteNumero || log.metadata?.deliberationNumero || log.subject}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {log.sent_at 
                            ? format(new Date(log.sent_at), "d MMM yyyy 'à' HH:mm", { locale: fr })
                            : format(new Date(log.created_at || ''), "d MMM yyyy 'à' HH:mm", { locale: fr })
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>{log.metadata?.successCount || 0}</span>
                        </div>
                        {(log.metadata?.errorCount || 0) > 0 && (
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-3.5 w-3.5" />
                            <span>{log.metadata?.errorCount}</span>
                          </div>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {log.metadata?.totalRecipients || 0} dest.
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
