import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  RefreshCw, 
  Filter, 
  Clock, 
  User, 
  Activity, 
  FileText, 
  Eye,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { auditService, AuditLog, AuditAction } from '@/services/audit-service';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const ACTION_COLORS: Record<string, string> = {
  'CREATE': 'bg-green-500/10 text-green-600 border-green-500/20',
  'UPDATE': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'DELETE': 'bg-red-500/10 text-red-600 border-red-500/20',
  'VIEW': 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  'LOGIN': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  'LOGOUT': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  'LOGIN_FAILED': 'bg-red-500/10 text-red-600 border-red-500/20',
  'STATUS_CHANGE': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'ASSIGN': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  'APPROVE': 'bg-green-500/10 text-green-600 border-green-500/20',
  'REJECT': 'bg-red-500/10 text-red-600 border-red-500/20',
  'EXPORT': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  'IMPORT': 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  'DOWNLOAD': 'bg-sky-500/10 text-sky-600 border-sky-500/20',
};

const ACTION_LABELS: Record<string, string> = {
  'CREATE': 'Création',
  'UPDATE': 'Modification',
  'DELETE': 'Suppression',
  'VIEW': 'Consultation',
  'LOGIN': 'Connexion',
  'LOGOUT': 'Déconnexion',
  'LOGIN_FAILED': 'Échec connexion',
  'STATUS_CHANGE': 'Changement statut',
  'ASSIGN': 'Attribution',
  'APPROVE': 'Approbation',
  'REJECT': 'Rejet',
  'EXPORT': 'Export',
  'IMPORT': 'Import',
  'DOWNLOAD': 'Téléchargement',
};

const RESOURCE_LABELS: Record<string, string> = {
  'request': 'Demande',
  'profile': 'Profil',
  'auth': 'Authentification',
  'organization': 'Organisation',
  'service': 'Service',
  'document': 'Document',
  'appointment': 'Rendez-vous',
  'arrete': 'Arrêté',
  'deliberation': 'Délibération',
  'association': 'Association',
  'company': 'Entreprise',
};

const SuperAdminAuditLogs: React.FC = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const loadLogs = async () => {
    setLoading(true);
    try {
      const filters: any = { limit: pageSize };
      
      if (actionFilter !== 'all') filters.action = actionFilter;
      if (resourceFilter !== 'all') filters.resourceType = resourceFilter;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      
      const data = await auditService.getLogs(filters);
      setLogs(data);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les logs d'audit.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter, resourceFilter, startDate, endDate]);

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      log.resourceType.toLowerCase().includes(query) ||
      log.resourceId?.toLowerCase().includes(query) ||
      log.userId?.toLowerCase().includes(query)
    );
  });

  const handleExport = () => {
    const csv = [
      ['Date', 'Action', 'Type', 'ID Ressource', 'Utilisateur', 'IP'].join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss'),
        log.action,
        log.resourceType,
        log.resourceId || '',
        log.userId || '',
        log.ipAddress || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export réussi",
      description: `${filteredLogs.length} entrées exportées.`
    });
  };

  const getActionBadge = (action: string) => {
    const colorClass = ACTION_COLORS[action] || 'bg-gray-500/10 text-gray-600';
    const label = ACTION_LABELS[action] || action;
    return (
      <Badge variant="outline" className={colorClass}>
        {label}
      </Badge>
    );
  };

  const getResourceLabel = (resourceType: string) => {
    return RESOURCE_LABELS[resourceType] || resourceType;
  };

  const uniqueActions = [...new Set(logs.map(l => l.action))];
  const uniqueResources = [...new Set(logs.map(l => l.resourceType))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Journal d'audit</h1>
          <p className="text-muted-foreground">
            Suivi des actions utilisateur et modifications système
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total actions</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Créations</p>
                <p className="text-2xl font-bold">
                  {logs.filter(l => l.action === 'CREATE').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Connexions</p>
                <p className="text-2xl font-bold">
                  {logs.filter(l => l.action === 'LOGIN').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dernière action</p>
                <p className="text-sm font-medium">
                  {logs[0] ? format(new Date(logs[0].createdAt), 'HH:mm', { locale: fr }) : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>
                    {ACTION_LABELS[action] || action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type de ressource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {uniqueResources.map(resource => (
                  <SelectItem key={resource} value={resource}>
                    {RESOURCE_LABELS[resource] || resource}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">→</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>ID Ressource</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="w-[80px]">Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Chargement...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Aucun log trouvé</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <span className="text-sm">{getResourceLabel(log.resourceType)}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.resourceId ? log.resourceId.slice(0, 8) + '...' : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.ipAddress || '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredLogs.length} entrée(s) affichée(s)
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={filteredLogs.length < pageSize}
            onClick={() => setPage(p => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Log Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Activity className="h-5 w-5" />
              Détail de l'action
            </DialogTitle>
            <DialogDescription>
              {selectedLog && format(new Date(selectedLog.createdAt), 'dd MMMM yyyy à HH:mm:ss', { locale: fr })}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Action</p>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type de ressource</p>
                  <p className="font-medium">{getResourceLabel(selectedLog.resourceType)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ID Ressource</p>
                  <p className="font-mono text-sm">{selectedLog.resourceId || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ID Utilisateur</p>
                  <p className="font-mono text-sm">{selectedLog.userId || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Adresse IP</p>
                  <p className="font-mono text-sm">{selectedLog.ipAddress || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User Agent</p>
                  <p className="font-mono text-xs truncate" title={selectedLog.userAgent}>
                    {selectedLog.userAgent || '-'}
                  </p>
                </div>
              </div>

              <Separator />

              {selectedLog.oldData && Object.keys(selectedLog.oldData).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Données avant</p>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.oldData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newData && Object.keys(selectedLog.newData).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Données après</p>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.newData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Métadonnées</p>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminAuditLogs;
