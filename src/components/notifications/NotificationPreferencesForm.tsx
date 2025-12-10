import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MessageSquare, AlertTriangle, Building, FileText, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NotificationPreferences {
  id?: string;
  user_id: string;
  email_arretes: boolean;
  email_deliberations: boolean;
  email_services: boolean;
  email_urgences: boolean;
  sms_enabled: boolean;
  phone_number: string | null;
}

export function NotificationPreferencesForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    user_id: '',
    email_arretes: true,
    email_deliberations: true,
    email_services: false,
    email_urgences: true,
    sms_enabled: false,
    phone_number: null
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences(data as NotificationPreferences);
      } else {
        setPreferences(prev => ({ ...prev, user_id: user.id }));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Vous devez être connecté');
        return;
      }

      const prefData = {
        user_id: user.id,
        email_arretes: preferences.email_arretes,
        email_deliberations: preferences.email_deliberations,
        email_services: preferences.email_services,
        email_urgences: preferences.email_urgences,
        sms_enabled: preferences.sms_enabled,
        phone_number: preferences.phone_number
      };

      if (preferences.id) {
        const { error } = await supabase
          .from('notification_preferences')
          .update(prefData)
          .eq('id', preferences.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_preferences')
          .insert(prefData);
        if (error) throw error;
      }

      toast.success('Préférences de notification enregistrées');
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean | string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Préférences de notification
        </CardTitle>
        <CardDescription>
          Choisissez les types de notifications que vous souhaitez recevoir
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section Email */}
        <div className="space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Notifications par email
          </h3>
          
          <div className="space-y-4 pl-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_arretes" className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Arrêtés municipaux
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir les nouveaux arrêtés publiés
                </p>
              </div>
              <Switch
                id="email_arretes"
                checked={preferences.email_arretes}
                onCheckedChange={(checked) => updatePreference('email_arretes', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_deliberations" className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-green-600" />
                  Délibérations
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir les comptes-rendus des conseils municipaux
                </p>
              </div>
              <Switch
                id="email_deliberations"
                checked={preferences.email_deliberations}
                onCheckedChange={(checked) => updatePreference('email_deliberations', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_services" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                  Services municipaux
                </Label>
                <p className="text-sm text-muted-foreground">
                  Nouveautés et informations sur les services
                </p>
              </div>
              <Switch
                id="email_services"
                checked={preferences.email_services}
                onCheckedChange={(checked) => updatePreference('email_services', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_urgences" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Alertes urgentes
                </Label>
                <p className="text-sm text-muted-foreground">
                  Communications importantes et urgentes
                </p>
              </div>
              <Switch
                id="email_urgences"
                checked={preferences.email_urgences}
                onCheckedChange={(checked) => updatePreference('email_urgences', checked)}
              />
            </div>
          </div>
        </div>

        {/* Section SMS */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Notifications SMS
              </h3>
              <p className="text-sm text-muted-foreground">
                Recevoir les alertes urgentes par SMS
              </p>
            </div>
            <Switch
              id="sms_enabled"
              checked={preferences.sms_enabled}
              onCheckedChange={(checked) => updatePreference('sms_enabled', checked)}
            />
          </div>

          {preferences.sms_enabled && (
            <div className="pl-6">
              <Label htmlFor="phone_number">Numéro de téléphone</Label>
              <Input
                id="phone_number"
                type="tel"
                placeholder="+241 XX XX XX XX"
                value={preferences.phone_number || ''}
                onChange={(e) => updatePreference('phone_number', e.target.value)}
                className="mt-1.5"
              />
            </div>
          )}
        </div>

        {/* Bouton de sauvegarde */}
        <div className="pt-4">
          <Button onClick={savePreferences} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les préférences
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
