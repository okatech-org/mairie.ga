import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDemo } from '@/contexts/DemoContext';
import DocumentPreview from '@/components/admin/DocumentPreview';
import { generateOfficialPDF } from '@/utils/generateOfficialPDF';
import { 
  FileText, 
  Settings, 
  Plus, 
  Pencil, 
  Trash2, 
  Save, 
  RefreshCw,
  Building2,
  Palette,
  Image,
  Mail,
  MapPin,
  Eye,
  History,
  Building,
  Filter,
  Clock,
  Copy,
  ArrowRight
} from 'lucide-react';

interface DocumentSettings {
  id: string;
  service_role: string;
  organization_id: string | null;
  province: string;
  commune: string;
  cabinet: string;
  republic: string;
  motto: string;
  signature_title: string;
  footer_address: string;
  footer_email: string;
  logo_url: string;
  primary_color: string;
  created_at: string;
  updated_at: string;
  organization?: { id: string; name: string } | null;
}

interface AuditEntry {
  id: string;
  settings_id: string;
  organization_id: string | null;
  user_id: string;
  user_email: string | null;
  user_name: string | null;
  action: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  changes: any;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
}

const PREDEFINED_ROLES = [
  { value: 'maire', label: 'Maire' },
  { value: 'secretaire_general', label: 'Secrétaire Général' },
  { value: 'chef_service', label: 'Chef de Service' },
  { value: 'directeur', label: 'Directeur' },
  { value: 'agent', label: 'Agent' },
];

const DEFAULT_VALUES: Omit<DocumentSettings, 'id' | 'created_at' | 'updated_at' | 'organization'> = {
  service_role: '',
  organization_id: null,
  province: "Province de l'Estuaire",
  commune: 'Commune de Libreville',
  cabinet: 'CABINET DU MAIRE',
  republic: 'RÉPUBLIQUE GABONAISE',
  motto: 'Union - Travail - Justice',
  signature_title: 'Le Maire de la Commune de Libreville',
  footer_address: 'BP : 44 Boulevard Triomphal/LBV',
  footer_email: 'E-mail : libreville@mairie.ga',
  logo_url: '/assets/logo_libreville.png',
  primary_color: '#1e3a8a',
};

export default function DocumentSettingsAdmin() {
  const [settings, setSettings] = useState<DocumentSettings[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [editingSettings, setEditingSettings] = useState<Partial<DocumentSettings> | null>(null);
  const [settingToCopy, setSettingToCopy] = useState<DocumentSettings | null>(null);
  const [targetOrganization, setTargetOrganization] = useState<string>('');
  const [copying, setCopying] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');
  const [selectedOrganization, setSelectedOrganization] = useState<string>('all');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  const { currentUser } = useDemo();
  const isSuperAdmin = currentUser?.role === 'ADMIN' && currentUser?.id === 'admin-system';
  const isMaire = currentUser?.role === 'MAIRE' || currentUser?.role === 'MAIRE_ADJOINT';

  useEffect(() => {
    fetchSettings();
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (settings.length > 0) {
      fetchAuditLogs();
    }
  }, [settings]);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_document_settings')
        .select(`
          *,
          organization:organizations(id, name)
        `)
        .order('service_role');

      if (error) throw error;
      
      setSettings(data || []);
      if (data && data.length > 0 && !activeTab) {
        setActiveTab(data[0].id);
      }
    } catch (error: any) {
      toast.error('Erreur lors du chargement des paramètres');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('document_settings_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditLogs((data || []) as AuditEntry[]);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const logAuditEntry = async (
    settingsId: string, 
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    oldData?: Partial<DocumentSettings>,
    newData?: Partial<DocumentSettings>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const changes: Record<string, { old: string; new: string }> = {};
      
      if (action === 'UPDATE' && oldData && newData) {
        const fields = ['province', 'commune', 'cabinet', 'republic', 'motto', 
                       'signature_title', 'footer_address', 'footer_email', 'logo_url', 'primary_color'];
        fields.forEach(field => {
          const oldVal = (oldData as any)[field];
          const newVal = (newData as any)[field];
          if (oldVal !== newVal) {
            changes[field] = { old: oldVal || '', new: newVal || '' };
          }
        });
      }

      await supabase.from('document_settings_audit').insert({
        settings_id: settingsId,
        organization_id: newData?.organization_id || oldData?.organization_id || null,
        user_id: user.id,
        user_email: user.email,
        user_name: currentUser?.name || user.email,
        action,
        changes: Object.keys(changes).length > 0 ? changes : null,
      });
    } catch (error) {
      console.error('Error logging audit entry:', error);
    }
  };

  const handleSave = async (settingsData: Partial<DocumentSettings>) => {
    setSaving(true);
    try {
      if (settingsData.id) {
        // Get old data for audit
        const oldSetting = settings.find(s => s.id === settingsData.id);
        
        // Update existing
        const { error } = await supabase
          .from('service_document_settings')
          .update({
            organization_id: settingsData.organization_id,
            province: settingsData.province,
            commune: settingsData.commune,
            cabinet: settingsData.cabinet,
            republic: settingsData.republic,
            motto: settingsData.motto,
            signature_title: settingsData.signature_title,
            footer_address: settingsData.footer_address,
            footer_email: settingsData.footer_email,
            logo_url: settingsData.logo_url,
            primary_color: settingsData.primary_color,
          })
          .eq('id', settingsData.id);

        if (error) throw error;
        
        // Log audit
        await logAuditEntry(settingsData.id, 'UPDATE', oldSetting, settingsData);
        
        toast.success('Paramètres mis à jour avec succès');
      } else {
        // Insert new
        const { data: newData, error } = await supabase
          .from('service_document_settings')
          .insert({
            service_role: settingsData.service_role,
            organization_id: settingsData.organization_id,
            province: settingsData.province,
            commune: settingsData.commune,
            cabinet: settingsData.cabinet,
            republic: settingsData.republic,
            motto: settingsData.motto,
            signature_title: settingsData.signature_title,
            footer_address: settingsData.footer_address,
            footer_email: settingsData.footer_email,
            logo_url: settingsData.logo_url,
            primary_color: settingsData.primary_color,
          })
          .select()
          .single();

        if (error) throw error;
        
        // Log audit
        if (newData) {
          await logAuditEntry(newData.id, 'CREATE', undefined, settingsData);
        }
        
        toast.success('Nouveau service ajouté avec succès');
      }

      setDialogOpen(false);
      setEditingSettings(null);
      fetchSettings();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, role: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer les paramètres pour "${role}" ?`)) return;

    try {
      const deletedSetting = settings.find(s => s.id === id);
      
      const { error } = await supabase
        .from('service_document_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Log audit
      if (deletedSetting) {
        await logAuditEntry(id, 'DELETE', deletedSetting);
      }
      
      toast.success('Paramètres supprimés');
      fetchSettings();
    } catch (error: any) {
      toast.error('Erreur lors de la suppression');
      console.error('Error:', error);
    }
  };

  const getFilteredSettings = () => {
    if (selectedOrganization === 'all') return settings;
    if (selectedOrganization === 'none') return settings.filter(s => !s.organization_id);
    return settings.filter(s => s.organization_id === selectedOrganization);
  };

  const getOrganizationName = (orgId: string | null) => {
    if (!orgId) return 'Global (toutes les organisations)';
    const org = organizations.find(o => o.id === orgId);
    return org ? org.name : 'Organisation inconnue';
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE': return 'Création';
      case 'UPDATE': return 'Modification';
      case 'DELETE': return 'Suppression';
      default: return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'UPDATE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const openEditDialog = (setting?: DocumentSettings) => {
    if (setting) {
      setEditingSettings(setting);
    } else {
      setEditingSettings({ ...DEFAULT_VALUES });
    }
    setDialogOpen(true);
  };

  const openCopyDialog = (setting: DocumentSettings) => {
    setSettingToCopy(setting);
    setTargetOrganization('');
    setCopyDialogOpen(true);
  };

  const handleCopySettings = async () => {
    if (!settingToCopy || !targetOrganization) return;
    
    setCopying(true);
    try {
      // Check if settings already exist for target organization + service role
      const { data: existing } = await supabase
        .from('service_document_settings')
        .select('id')
        .eq('service_role', settingToCopy.service_role)
        .eq('organization_id', targetOrganization === 'global' ? null : targetOrganization)
        .maybeSingle();

      if (existing) {
        const confirmed = confirm(
          `Des paramètres existent déjà pour ce service et cette organisation. Voulez-vous les remplacer ?`
        );
        if (!confirmed) {
          setCopying(false);
          return;
        }
        
        // Update existing
        const { error } = await supabase
          .from('service_document_settings')
          .update({
            province: settingToCopy.province,
            commune: settingToCopy.commune,
            cabinet: settingToCopy.cabinet,
            republic: settingToCopy.republic,
            motto: settingToCopy.motto,
            signature_title: settingToCopy.signature_title,
            footer_address: settingToCopy.footer_address,
            footer_email: settingToCopy.footer_email,
            logo_url: settingToCopy.logo_url,
            primary_color: settingToCopy.primary_color,
          })
          .eq('id', existing.id);

        if (error) throw error;
        
        await logAuditEntry(existing.id, 'UPDATE', undefined, {
          ...settingToCopy,
          organization_id: targetOrganization === 'global' ? null : targetOrganization
        });
      } else {
        // Insert new
        const { data: newData, error } = await supabase
          .from('service_document_settings')
          .insert({
            service_role: settingToCopy.service_role,
            organization_id: targetOrganization === 'global' ? null : targetOrganization,
            province: settingToCopy.province,
            commune: settingToCopy.commune,
            cabinet: settingToCopy.cabinet,
            republic: settingToCopy.republic,
            motto: settingToCopy.motto,
            signature_title: settingToCopy.signature_title,
            footer_address: settingToCopy.footer_address,
            footer_email: settingToCopy.footer_email,
            logo_url: settingToCopy.logo_url,
            primary_color: settingToCopy.primary_color,
          })
          .select()
          .single();

        if (error) throw error;
        
        if (newData) {
          await logAuditEntry(newData.id, 'CREATE', undefined, {
            ...settingToCopy,
            organization_id: targetOrganization === 'global' ? null : targetOrganization
          });
        }
      }

      const targetName = targetOrganization === 'global' 
        ? 'Global' 
        : organizations.find(o => o.id === targetOrganization)?.name || 'Organisation';
      
      toast.success(`Paramètres copiés vers ${targetName}`);
      setCopyDialogOpen(false);
      setSettingToCopy(null);
      setTargetOrganization('');
      fetchSettings();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la copie');
      console.error('Error:', error);
    } finally {
      setCopying(false);
    }
  };

  const getAvailableTargetOrganizations = () => {
    if (!settingToCopy) return [];
    
    // Filter out the source organization
    const availableOrgs = organizations.filter(org => org.id !== settingToCopy.organization_id);
    
    // Add global option if source is not global
    const options: { id: string; name: string }[] = [];
    if (settingToCopy.organization_id !== null) {
      options.push({ id: 'global', name: 'Global (toutes les organisations)' });
    }
    
    return [...options, ...availableOrgs];
  };

  const getRoleLabel = (role: string) => {
    const found = PREDEFINED_ROLES.find(r => r.value === role);
    return found ? found.label : role;
  };

  const handleGenerateTestPDF = async (setting: DocumentSettings) => {
    setGeneratingPDF(true);
    try {
      const blob = await generateOfficialPDF({
        type: 'lettre',
        subject: 'Document de test - Aperçu des paramètres',
        recipient: 'Monsieur le Directeur',
        recipientOrg: 'Direction Générale des Services',
        content_points: [
          "Ceci est un document de test généré automatiquement pour prévisualiser les paramètres de mise en page.",
          "Vous pouvez vérifier l'apparence de l'en-tête, du pied de page et de la signature.",
        ],
        signature_authority: setting.signature_title,
        signature_name: 'M. LE MAIRE',
        serviceContext: setting.service_role,
      });
      
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      toast.success('PDF de test généré avec succès');
    } catch (error: any) {
      toast.error('Erreur lors de la génération du PDF');
      console.error('Error:', error);
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Paramètres des Documents Officiels
          </h1>
          <p className="text-muted-foreground">
            Configurez la mise en page des documents PDF par service
          </p>
        </div>
        {isSuperAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openEditDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un service
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSettings?.id ? 'Modifier les paramètres' : 'Nouveau service'}
              </DialogTitle>
              <DialogDescription>
                Configurez les paramètres de mise en page des documents pour ce service
              </DialogDescription>
            </DialogHeader>
            
            {editingSettings && (
              <div className="grid gap-4 py-4">
                {/* Service Role & Organization */}
                {!editingSettings.id && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="service_role">Rôle du service *</Label>
                      <Select
                        value={editingSettings.service_role}
                        onValueChange={(v) => setEditingSettings({ ...editingSettings, service_role: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          {PREDEFINED_ROLES.map(role => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Organization selector */}
                <div className="space-y-2">
                  <Label htmlFor="organization_id">Organisation</Label>
                  <Select
                    value={editingSettings.organization_id || 'global'}
                    onValueChange={(v) => setEditingSettings({ 
                      ...editingSettings, 
                      organization_id: v === 'global' ? null : v 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une organisation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">
                        <span className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Global (toutes les organisations)
                        </span>
                      </SelectItem>
                      {organizations.map(org => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Laissez "Global" pour appliquer ces paramètres à toutes les organisations
                  </p>
                </div>

                {/* Header Section */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2 text-sm border-b pb-2">
                    <Building2 className="h-4 w-4" />
                    En-tête du document
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="province">Province</Label>
                      <Input
                        id="province"
                        value={editingSettings.province || ''}
                        onChange={(e) => setEditingSettings({ ...editingSettings, province: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commune">Commune</Label>
                      <Input
                        id="commune"
                        value={editingSettings.commune || ''}
                        onChange={(e) => setEditingSettings({ ...editingSettings, commune: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cabinet">Cabinet/Direction</Label>
                      <Input
                        id="cabinet"
                        value={editingSettings.cabinet || ''}
                        onChange={(e) => setEditingSettings({ ...editingSettings, cabinet: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="republic">République</Label>
                      <Input
                        id="republic"
                        value={editingSettings.republic || ''}
                        onChange={(e) => setEditingSettings({ ...editingSettings, republic: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motto">Devise</Label>
                    <Input
                      id="motto"
                      value={editingSettings.motto || ''}
                      onChange={(e) => setEditingSettings({ ...editingSettings, motto: e.target.value })}
                    />
                  </div>
                </div>

                {/* Signature Section */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2 text-sm border-b pb-2">
                    <Pencil className="h-4 w-4" />
                    Signature
                  </h4>
                  <div className="space-y-2">
                    <Label htmlFor="signature_title">Titre de signature</Label>
                    <Input
                      id="signature_title"
                      value={editingSettings.signature_title || ''}
                      onChange={(e) => setEditingSettings({ ...editingSettings, signature_title: e.target.value })}
                      placeholder="Le Maire de la Commune de Libreville"
                    />
                  </div>
                </div>

                {/* Footer Section */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2 text-sm border-b pb-2">
                    <MapPin className="h-4 w-4" />
                    Pied de page
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="footer_address">Adresse</Label>
                      <Input
                        id="footer_address"
                        value={editingSettings.footer_address || ''}
                        onChange={(e) => setEditingSettings({ ...editingSettings, footer_address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footer_email">Email</Label>
                      <Input
                        id="footer_email"
                        value={editingSettings.footer_email || ''}
                        onChange={(e) => setEditingSettings({ ...editingSettings, footer_email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Branding Section */}
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2 text-sm border-b pb-2">
                    <Image className="h-4 w-4" />
                    Identité visuelle
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="logo_url">URL du logo</Label>
                      <Input
                        id="logo_url"
                        value={editingSettings.logo_url || ''}
                        onChange={(e) => setEditingSettings({ ...editingSettings, logo_url: e.target.value })}
                        placeholder="/assets/logo.png"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="primary_color">Couleur principale</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primary_color"
                          type="color"
                          value={editingSettings.primary_color || '#1e3a8a'}
                          onChange={(e) => setEditingSettings({ ...editingSettings, primary_color: e.target.value })}
                          className="w-14 h-10 p-1"
                        />
                        <Input
                          value={editingSettings.primary_color || '#1e3a8a'}
                          onChange={(e) => setEditingSettings({ ...editingSettings, primary_color: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={() => editingSettings && handleSave(editingSettings)}
                disabled={saving || (!editingSettings?.id && !editingSettings?.service_role)}
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Filters and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Services configurés</CardDescription>
            <CardTitle className="text-3xl">{settings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Organisations</CardDescription>
            <CardTitle className="text-3xl">{organizations.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Dernière modification</CardDescription>
            <CardTitle className="text-lg">
              {auditLogs.length > 0 
                ? new Date(auditLogs[0].created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                : '-'
              }
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setHistoryDialogOpen(true)}>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historique
            </CardDescription>
            <CardTitle className="text-lg flex items-center gap-2">
              {auditLogs.length} modifications
              <Badge variant="outline" className="text-xs">Voir</Badge>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Organization Filter */}
      {isSuperAdmin && organizations.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm">Filtrer par organisation:</Label>
          </div>
          <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
            <SelectTrigger className="w-[280px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les organisations</SelectItem>
              <SelectItem value="none">Global uniquement</SelectItem>
              {organizations.map(org => (
                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique des modifications
            </DialogTitle>
            <DialogDescription>
              Dernières modifications apportées aux paramètres de documents
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {auditLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucune modification enregistrée</p>
            ) : (
              auditLogs.map(log => (
                <div key={log.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getActionColor(log.action)}>
                        {getActionLabel(log.action)}
                      </Badge>
                      <span className="text-sm font-medium">{log.user_name || log.user_email}</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.created_at).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  
                  {log.changes && Object.keys(log.changes).length > 0 && (
                    <div className="bg-muted/50 rounded p-3 text-sm space-y-1">
                      {Object.entries(log.changes).map(([field, values]: [string, any]) => (
                        <div key={field} className="flex items-start gap-2">
                          <span className="font-medium min-w-[120px]">{field}:</span>
                          <span className="text-red-600 dark:text-red-400 line-through">{values.old || '(vide)'}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-green-600 dark:text-green-400">{values.new || '(vide)'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Copy Settings Dialog */}
      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5" />
              Copier les paramètres
            </DialogTitle>
            <DialogDescription>
              Copiez les paramètres de "{settingToCopy ? getRoleLabel(settingToCopy.service_role) : ''}" 
              vers une autre organisation
            </DialogDescription>
          </DialogHeader>
          
          {settingToCopy && (
            <div className="space-y-4">
              {/* Source info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="text-sm font-medium">Source:</div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{getRoleLabel(settingToCopy.service_role)}</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {settingToCopy.organization 
                      ? settingToCopy.organization.name 
                      : 'Global'}
                  </span>
                </div>
              </div>

              {/* Target selection */}
              <div className="space-y-2">
                <Label>Organisation cible</Label>
                <Select value={targetOrganization} onValueChange={setTargetOrganization}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une organisation cible" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTargetOrganizations().map(org => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Les paramètres seront copiés pour le rôle "{getRoleLabel(settingToCopy.service_role)}" 
                  vers l'organisation sélectionnée
                </p>
              </div>

              {/* What will be copied */}
              <div className="bg-muted/30 rounded-lg p-3 text-sm">
                <div className="font-medium mb-2">Paramètres à copier:</div>
                <ul className="grid grid-cols-2 gap-1 text-muted-foreground text-xs">
                  <li>• Province</li>
                  <li>• Commune</li>
                  <li>• Cabinet</li>
                  <li>• République</li>
                  <li>• Devise</li>
                  <li>• Signature</li>
                  <li>• Adresse pied de page</li>
                  <li>• Email pied de page</li>
                  <li>• Logo</li>
                  <li>• Couleur principale</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleCopySettings}
              disabled={copying || !targetOrganization}
            >
              {copying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Copie en cours...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copier
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings by Service */}
      {getFilteredSettings().length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Aucun paramètre configuré</h3>
            <p className="text-muted-foreground text-center mb-4">
              {selectedOrganization !== 'all' 
                ? 'Aucun paramètre pour cette organisation'
                : 'Commencez par ajouter les paramètres de mise en page pour un service'}
            </p>
            {isSuperAdmin && (
              <Button onClick={() => openEditDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un service
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto">
            {getFilteredSettings().map(setting => (
              <TabsTrigger key={setting.id} value={setting.id}>
                <span className="flex items-center gap-2">
                  {getRoleLabel(setting.service_role)}
                  {setting.organization && (
                    <Badge variant="secondary" className="text-[10px] px-1">
                      {setting.organization.name.substring(0, 15)}
                    </Badge>
                  )}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {getFilteredSettings().map(setting => (
            <TabsContent key={setting.id} value={setting.id}>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Settings Card */}
                <Card className="xl:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getRoleLabel(setting.service_role)}
                        <Badge variant="outline" className="font-mono text-xs">
                          {setting.service_role}
                        </Badge>
                        {setting.organization && (
                          <Badge variant="secondary" className="text-xs">
                            <Building className="h-3 w-3 mr-1" />
                            {setting.organization.name}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {setting.organization_id 
                          ? `Organisation: ${getOrganizationName(setting.organization_id)}`
                          : 'Paramètres globaux (toutes organisations)'}
                        {' • '}Mis à jour le {new Date(setting.updated_at).toLocaleDateString('fr-FR')}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleGenerateTestPDF(setting)}
                        disabled={generatingPDF}
                      >
                        {generatingPDF ? (
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4 mr-1" />
                        )}
                        PDF Test
                      </Button>
                      {isSuperAdmin && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openCopyDialog(setting)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copier vers
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(setting)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      {isSuperAdmin && (
                        <Button
                          variant="outline" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(setting.id, setting.service_role)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Header Info */}
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4" />
                          En-tête
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Province:</span>
                            <span className="font-medium">{setting.province}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Commune:</span>
                            <span className="font-medium">{setting.commune}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cabinet:</span>
                            <span className="font-medium">{setting.cabinet}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">République:</span>
                            <span className="font-medium">{setting.republic}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Devise:</span>
                            <span className="font-medium">{setting.motto}</span>
                          </div>
                        </div>
                      </div>

                      {/* Signature & Footer */}
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4" />
                          Signature & Pied de page
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Titre de signature:</span>
                            <p className="font-medium">{setting.signature_title}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Adresse:</span>
                            <p className="font-medium">{setting.footer_address}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Email:</span>
                            <p className="font-medium">{setting.footer_email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Branding */}
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center gap-2 text-sm">
                          <Palette className="h-4 w-4" />
                          Identité visuelle
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded border"
                              style={{ backgroundColor: setting.primary_color }}
                            />
                            <div>
                              <span className="text-sm text-muted-foreground">Couleur principale</span>
                              <p className="font-mono text-sm">{setting.primary_color}</p>
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Logo:</span>
                            <p className="font-mono text-xs truncate">{setting.logo_url}</p>
                            {setting.logo_url && (
                              <img 
                                src={setting.logo_url} 
                                alt="Logo" 
                                className="h-12 mt-2 object-contain"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Preview Panel */}
                <div className="xl:col-span-1">
                  <DocumentPreview 
                    settings={setting} 
                    onGeneratePDF={() => handleGenerateTestPDF(setting)}
                  />
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
