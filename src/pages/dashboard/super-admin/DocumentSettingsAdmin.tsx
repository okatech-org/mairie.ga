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
  MapPin
} from 'lucide-react';

interface DocumentSettings {
  id: string;
  service_role: string;
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
}

const PREDEFINED_ROLES = [
  { value: 'maire', label: 'Maire' },
  { value: 'secretaire_general', label: 'Secrétaire Général' },
  { value: 'chef_service', label: 'Chef de Service' },
  { value: 'directeur', label: 'Directeur' },
  { value: 'agent', label: 'Agent' },
];

const DEFAULT_VALUES: Omit<DocumentSettings, 'id' | 'created_at' | 'updated_at'> = {
  service_role: '',
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSettings, setEditingSettings] = useState<Partial<DocumentSettings> | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_document_settings')
        .select('*')
        .order('service_role');

      if (error) throw error;
      
      setSettings(data || []);
      if (data && data.length > 0 && !activeTab) {
        setActiveTab(data[0].service_role);
      }
    } catch (error: any) {
      toast.error('Erreur lors du chargement des paramètres');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (settingsData: Partial<DocumentSettings>) => {
    setSaving(true);
    try {
      if (settingsData.id) {
        // Update existing
        const { error } = await supabase
          .from('service_document_settings')
          .update({
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
        toast.success('Paramètres mis à jour avec succès');
      } else {
        // Insert new
        const { error } = await supabase
          .from('service_document_settings')
          .insert({
            service_role: settingsData.service_role,
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
          });

        if (error) throw error;
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
      const { error } = await supabase
        .from('service_document_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Paramètres supprimés');
      fetchSettings();
    } catch (error: any) {
      toast.error('Erreur lors de la suppression');
      console.error('Error:', error);
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

  const getRoleLabel = (role: string) => {
    const found = PREDEFINED_ROLES.find(r => r.value === role);
    return found ? found.label : role;
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
                {/* Service Role */}
                {!editingSettings.id && (
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
                        {PREDEFINED_ROLES.filter(r => !settings.some(s => s.service_role === r.value)).map(role => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Services configurés</CardDescription>
            <CardTitle className="text-3xl">{settings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Dernière mise à jour</CardDescription>
            <CardTitle className="text-lg">
              {settings.length > 0 
                ? new Date(Math.max(...settings.map(s => new Date(s.updated_at).getTime()))).toLocaleDateString('fr-FR')
                : '-'
              }
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Types de documents</CardDescription>
            <CardTitle className="text-3xl">12</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Settings by Service */}
      {settings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg mb-2">Aucun paramètre configuré</h3>
            <p className="text-muted-foreground text-center mb-4">
              Commencez par ajouter les paramètres de mise en page pour un service
            </p>
            <Button onClick={() => openEditDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto">
            {settings.map(setting => (
              <TabsTrigger key={setting.service_role} value={setting.service_role}>
                {getRoleLabel(setting.service_role)}
              </TabsTrigger>
            ))}
          </TabsList>

          {settings.map(setting => (
            <TabsContent key={setting.service_role} value={setting.service_role}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getRoleLabel(setting.service_role)}
                      <Badge variant="outline" className="font-mono text-xs">
                        {setting.service_role}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Mis à jour le {new Date(setting.updated_at).toLocaleDateString('fr-FR')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(setting)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(setting.id, setting.service_role)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
