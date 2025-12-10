import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Mail,
  MessageSquare,
  Users,
  TrendingUp,
  FileText,
  AlertTriangle,
  Loader2,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface NotificationPreference {
  id: string;
  user_id: string;
  email_arretes: boolean;
  email_deliberations: boolean;
  email_services: boolean;
  email_urgences: boolean;
  sms_enabled: boolean;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface SubscriptionStats {
  total: number;
  arretes: number;
  deliberations: number;
  services: number;
  urgences: number;
  sms: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(142, 76%, 36%)', 'hsl(221, 83%, 53%)', 'hsl(38, 92%, 50%)', 'hsl(262, 83%, 58%)'];

export default function NotificationPreferencesAdmin() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<SubscriptionStats>({
    total: 0,
    arretes: 0,
    deliberations: 0,
    services: 0,
    urgences: 0,
    sms: 0
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      // Fetch notification preferences
      const { data: prefsData, error: prefsError } = await supabase
        .from('notification_preferences')
        .select('*')
        .order('updated_at', { ascending: false });

      if (prefsError) throw prefsError;

      // Fetch profile data for each user
      const prefsWithProfiles: NotificationPreference[] = [];
      for (const pref of prefsData || []) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('user_id', pref.user_id)
          .maybeSingle();

        prefsWithProfiles.push({
          ...pref,
          profile: profileData || undefined
        });
      }

      setPreferences(prefsWithProfiles);

      // Calculate stats
      const statsData: SubscriptionStats = {
        total: prefsWithProfiles.length,
        arretes: prefsWithProfiles.filter(p => p.email_arretes).length,
        deliberations: prefsWithProfiles.filter(p => p.email_deliberations).length,
        services: prefsWithProfiles.filter(p => p.email_services).length,
        urgences: prefsWithProfiles.filter(p => p.email_urgences).length,
        sms: prefsWithProfiles.filter(p => p.sms_enabled).length
      };
      setStats(statsData);

    } catch (err) {
      console.error('Error loading preferences:', err);
      toast.error("Erreur lors du chargement des préférences");
    }
    setLoading(false);
  };

  const chartData = [
    { name: 'Arrêtés', value: stats.arretes, percentage: stats.total > 0 ? Math.round((stats.arretes / stats.total) * 100) : 0 },
    { name: 'Délibérations', value: stats.deliberations, percentage: stats.total > 0 ? Math.round((stats.deliberations / stats.total) * 100) : 0 },
    { name: 'Services', value: stats.services, percentage: stats.total > 0 ? Math.round((stats.services / stats.total) * 100) : 0 },
    { name: 'Urgences', value: stats.urgences, percentage: stats.total > 0 ? Math.round((stats.urgences / stats.total) * 100) : 0 },
    { name: 'SMS', value: stats.sms, percentage: stats.total > 0 ? Math.round((stats.sms / stats.total) * 100) : 0 }
  ];

  const pieData = chartData.filter(d => d.value > 0);

  const filteredPreferences = preferences.filter(p => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.profile?.first_name?.toLowerCase().includes(query) ||
      p.profile?.last_name?.toLowerCase().includes(query) ||
      p.profile?.email?.toLowerCase().includes(query)
    );
  });

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
            Préférences de Notification
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestion des abonnements aux notifications des citoyens
          </p>
        </div>
        <Button variant="outline" onClick={loadPreferences} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="neu-card border-none">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 rounded-xl bg-primary/10 mb-2">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total inscrits</p>
            </div>
          </CardContent>
        </Card>

        <Card className="neu-card border-none">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 rounded-xl bg-blue-500/10 mb-2">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{stats.arretes}</p>
              <p className="text-xs text-muted-foreground">Arrêtés</p>
            </div>
          </CardContent>
        </Card>

        <Card className="neu-card border-none">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 rounded-xl bg-green-500/10 mb-2">
                <FileText className="h-6 w-6 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{stats.deliberations}</p>
              <p className="text-xs text-muted-foreground">Délibérations</p>
            </div>
          </CardContent>
        </Card>

        <Card className="neu-card border-none">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 rounded-xl bg-purple-500/10 mb-2">
                <Bell className="h-6 w-6 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">{stats.services}</p>
              <p className="text-xs text-muted-foreground">Services</p>
            </div>
          </CardContent>
        </Card>

        <Card className="neu-card border-none">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 rounded-xl bg-orange-500/10 mb-2">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
              <p className="text-2xl font-bold">{stats.urgences}</p>
              <p className="text-xs text-muted-foreground">Urgences</p>
            </div>
          </CardContent>
        </Card>

        <Card className="neu-card border-none">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 rounded-xl bg-pink-500/10 mb-2">
                <MessageSquare className="h-6 w-6 text-pink-500" />
              </div>
              <p className="text-2xl font-bold">{stats.sms}</p>
              <p className="text-xs text-muted-foreground">SMS activé</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stats" className="space-y-6">
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistiques
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <Card className="neu-card border-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Abonnements par type
                </CardTitle>
                <CardDescription>
                  Nombre d'utilisateurs abonnés à chaque type de notification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number, name: string) => [`${value} (${chartData.find(d => d.name === name)?.percentage || 0}%)`, 'Abonnés']}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card className="neu-card border-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Répartition des abonnements
                </CardTitle>
                <CardDescription>
                  Distribution des préférences de notification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percentage }) => `${name}: ${percentage}%`}
                        >
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            borderColor: 'hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Aucune donnée disponible
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscription Rates */}
          <Card className="neu-card border-none">
            <CardHeader>
              <CardTitle className="text-lg">Taux d'abonnement</CardTitle>
              <CardDescription>
                Pourcentage d'utilisateurs abonnés à chaque type de notification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {chartData.map((item, index) => (
                  <div key={item.name} className="p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-2xl font-bold" style={{ color: COLORS[index] }}>
                        {item.percentage}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: COLORS[index]
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.value} sur {stats.total} utilisateurs
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Users List */}
          <Card className="neu-card border-none">
            <CardHeader>
              <CardTitle className="text-lg">Préférences des utilisateurs</CardTitle>
              <CardDescription>
                {filteredPreferences.length} utilisateur(s) trouvé(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {filteredPreferences.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun utilisateur avec des préférences configurées</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredPreferences.map((pref) => (
                      <div
                        key={pref.id}
                        className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {pref.profile?.first_name} {pref.profile?.last_name}
                            </h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {pref.profile?.email || 'Email non disponible'}
                            </p>
                            {pref.phone_number && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <MessageSquare className="h-3 w-3" />
                                {pref.phone_number}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 max-w-[300px] justify-end">
                            <Badge
                              variant={pref.email_arretes ? "default" : "outline"}
                              className={pref.email_arretes ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "opacity-50"}
                            >
                              {pref.email_arretes ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                              Arrêtés
                            </Badge>
                            <Badge
                              variant={pref.email_deliberations ? "default" : "outline"}
                              className={pref.email_deliberations ? "bg-green-500/10 text-green-600 border-green-500/20" : "opacity-50"}
                            >
                              {pref.email_deliberations ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                              Délibérations
                            </Badge>
                            <Badge
                              variant={pref.email_services ? "default" : "outline"}
                              className={pref.email_services ? "bg-purple-500/10 text-purple-600 border-purple-500/20" : "opacity-50"}
                            >
                              {pref.email_services ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                              Services
                            </Badge>
                            <Badge
                              variant={pref.email_urgences ? "default" : "outline"}
                              className={pref.email_urgences ? "bg-orange-500/10 text-orange-600 border-orange-500/20" : "opacity-50"}
                            >
                              {pref.email_urgences ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                              Urgences
                            </Badge>
                            <Badge
                              variant={pref.sms_enabled ? "default" : "outline"}
                              className={pref.sms_enabled ? "bg-pink-500/10 text-pink-600 border-pink-500/20" : "opacity-50"}
                            >
                              {pref.sms_enabled ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                              SMS
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Mis à jour le {new Date(pref.updated_at || pref.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
