import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Activity, TrendingUp, Users, Building, MousePointerClick, Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const DATA_GROWTH = [
    { name: 'Jan', users: 400, orgs: 24 },
    { name: 'Feb', users: 800, orgs: 26 },
    { name: 'Mar', users: 1400, orgs: 28 },
    { name: 'Apr', users: 2100, orgs: 32 },
    { name: 'May', users: 2800, orgs: 38 },
    { name: 'Jun', users: 3500, orgs: 43 },
];

const DATA_SERVICES = [
    { name: 'Demandes Actes', value: 4500, color: '#3b82f6' },
    { name: 'Prises RDV', value: 2300, color: '#10b981' },
    { name: 'Visas', value: 1200, color: '#f59e0b' },
    { name: 'Signalements', value: 800, color: '#ef4444' },
];

const DATA_GEO = [
    { name: 'Gabon', value: 65 },
    { name: 'France', value: 20 },
    { name: 'USA', value: 10 },
    { name: 'Chine', value: 5 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function SuperAdminAnalytics() {
    const [period, setPeriod] = useState("6m");

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Analytique Avancée</h1>
                        <p className="text-muted-foreground">Vision globale de l'utilisation de la plateforme</p>
                    </div>
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Période" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">7 derniers jours</SelectItem>
                            <SelectItem value="30d">30 derniers jours</SelectItem>
                            <SelectItem value="6m">6 derniers mois</SelectItem>
                            <SelectItem value="1y">Cette année</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* KPI Cards */}
                <div className="grid md:grid-cols-4 gap-6">
                    <Card className="neu-raised border-l-4 border-l-blue-500">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Utilisateurs Totaux</p>
                                    <h3 className="text-2xl font-bold mt-2">12,450</h3>
                                </div>
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <Users className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex items-center gap-1 mt-4 text-xs text-green-600 font-medium">
                                <TrendingUp className="w-3 h-3" />
                                +12% depuis le mois dernier
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="neu-raised border-l-4 border-l-purple-500">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Organisations Actives</p>
                                    <h3 className="text-2xl font-bold mt-2">43</h3>
                                </div>
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                    <Building className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex items-center gap-1 mt-4 text-xs text-green-600 font-medium">
                                <TrendingUp className="w-3 h-3" />
                                +2 nouvelles entités
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="neu-raised border-l-4 border-l-green-500">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Demandes Traitées</p>
                                    <h3 className="text-2xl font-bold mt-2">8,920</h3>
                                </div>
                                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                    <MousePointerClick className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex items-center gap-1 mt-4 text-xs text-green-600 font-medium">
                                <TrendingUp className="w-3 h-3" />
                                +5% de productivité
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="neu-raised border-l-4 border-l-orange-500">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase">Trafic International</p>
                                    <h3 className="text-2xl font-bold mt-2">35%</h3>
                                </div>
                                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                    <Globe className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex items-center gap-1 mt-4 text-xs text-gray-500 font-medium">
                                Stable
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Growth Chart */}
                    <Card className="neu-raised">
                        <CardHeader>
                            <CardTitle>Croissance de la Plateforme</CardTitle>
                            <CardDescription>Évolution des utilisateurs et entités sur 6 mois</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={DATA_GROWTH} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorOrgs" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Area type="monotone" dataKey="users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" name="Utilisateurs" />
                                        <Area type="monotone" dataKey="orgs" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorOrgs)" name="Organisations" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Services Chart */}
                    <Card className="neu-raised">
                        <CardHeader>
                            <CardTitle>Distribution des Services</CardTitle>
                            <CardDescription>Services les plus sollicités</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={DATA_SERVICES} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={100} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {DATA_SERVICES.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
            </div>
        </div>
    );
}
