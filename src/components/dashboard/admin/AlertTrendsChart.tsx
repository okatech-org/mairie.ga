import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from "recharts";
import { TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

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

interface AlertTrendsChartProps {
  alerts: AlertHistoryItem[];
  dateFilter: string;
}

const SEVERITY_COLORS = {
  critical: "hsl(0, 84%, 60%)",
  high: "hsl(25, 95%, 53%)",
  medium: "hsl(48, 96%, 53%)",
  low: "hsl(217, 91%, 60%)"
};

const RULE_COLORS = [
  "hsl(var(--primary))",
  "hsl(25, 95%, 53%)",
  "hsl(262, 83%, 58%)",
  "hsl(142, 71%, 45%)",
  "hsl(48, 96%, 53%)",
  "hsl(340, 82%, 52%)"
];

export function AlertTrendsChart({ alerts, dateFilter }: AlertTrendsChartProps) {
  const days = parseInt(dateFilter);

  // Données pour le graphique de tendance par jour
  const dailyTrendData = useMemo(() => {
    const interval = {
      start: subDays(new Date(), days),
      end: new Date()
    };
    
    const allDays = eachDayOfInterval(interval);
    
    return allDays.map(day => {
      const dayStart = startOfDay(day);
      const dayAlerts = alerts.filter(alert => {
        const alertDate = startOfDay(new Date(alert.triggeredAt));
        return alertDate.getTime() === dayStart.getTime();
      });

      return {
        date: format(day, "dd/MM", { locale: fr }),
        fullDate: format(day, "d MMMM", { locale: fr }),
        total: dayAlerts.length,
        critical: dayAlerts.filter(a => a.severity === "critical").length,
        high: dayAlerts.filter(a => a.severity === "high").length,
        medium: dayAlerts.filter(a => a.severity === "medium").length,
        low: dayAlerts.filter(a => a.severity === "low").length
      };
    });
  }, [alerts, days]);

  // Données pour le graphique par type de règle
  const ruleTypeData = useMemo(() => {
    const ruleCount: Record<string, number> = {};
    
    alerts.forEach(alert => {
      ruleCount[alert.ruleName] = (ruleCount[alert.ruleName] || 0) + 1;
    });

    return Object.entries(ruleCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [alerts]);

  // Données pour le graphique par sévérité
  const severityData = useMemo(() => {
    const severityCount = {
      critical: alerts.filter(a => a.severity === "critical").length,
      high: alerts.filter(a => a.severity === "high").length,
      medium: alerts.filter(a => a.severity === "medium").length,
      low: alerts.filter(a => a.severity === "low").length
    };

    return [
      { name: "Critique", value: severityCount.critical, color: SEVERITY_COLORS.critical },
      { name: "Haute", value: severityCount.high, color: SEVERITY_COLORS.high },
      { name: "Moyenne", value: severityCount.medium, color: SEVERITY_COLORS.medium },
      { name: "Basse", value: severityCount.low, color: SEVERITY_COLORS.low }
    ].filter(item => item.value > 0);
  }, [alerts]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-2">{payload[0]?.payload?.fullDate || label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Graphique de tendance par jour */}
      <Card className="neu-raised md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Tendance des alertes par jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SEVERITY_COLORS.critical} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={SEVERITY_COLORS.critical} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SEVERITY_COLORS.high} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={SEVERITY_COLORS.high} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SEVERITY_COLORS.medium} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={SEVERITY_COLORS.medium} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  className="text-muted-foreground"
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="critical"
                  name="Critique"
                  stackId="1"
                  stroke={SEVERITY_COLORS.critical}
                  fill="url(#colorCritical)"
                />
                <Area
                  type="monotone"
                  dataKey="high"
                  name="Haute"
                  stackId="1"
                  stroke={SEVERITY_COLORS.high}
                  fill="url(#colorHigh)"
                />
                <Area
                  type="monotone"
                  dataKey="medium"
                  name="Moyenne"
                  stackId="1"
                  stroke={SEVERITY_COLORS.medium}
                  fill="url(#colorMedium)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Graphique par sévérité */}
      <Card className="neu-raised">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-primary" />
            Répartition par sévérité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Graphique par type de règle */}
      <Card className="neu-raised md:col-span-2 lg:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Alertes par type de règle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            {ruleTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ruleTypeData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 11 }} 
                    width={150}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} alertes`, "Total"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[0, 4, 4, 0]}
                  >
                    {ruleTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RULE_COLORS[index % RULE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
