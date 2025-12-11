# 🗃️ Prompt Lovable - Phase 1 : Tables Supabase pour Actualités Municipales

## Contexte
Nous développons un système d'actualités géolocalisées pour les mairies gabonaises. Les citoyens verront les actualités de leur commune de proximité (géolocalisation) ou de leur commune d'inscription (si connectés).

## Tâches à Réaliser

### 1. Créer les Tables SQL

Crée les 3 tables suivantes dans Supabase avec les colonnes exactes spécifiées :

#### Table `municipal_news` (Actualités municipales)
```sql
CREATE TABLE municipal_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Contenu
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  
  -- Métadonnées
  category TEXT NOT NULL CHECK (category IN (
    'services', 'evenements', 'travaux', 'social', 
    'culture', 'sport', 'environnement', 'economie', 'urgence'
  )),
  tags TEXT[],
  is_featured BOOLEAN DEFAULT false,
  is_urgent BOOLEAN DEFAULT false,
  
  -- Publication
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Auteur
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  
  -- Stats
  views_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX idx_municipal_news_org ON municipal_news(organization_id);
CREATE INDEX idx_municipal_news_status ON municipal_news(status, published_at DESC);
CREATE INDEX idx_municipal_news_category ON municipal_news(category);
```

#### Table `municipal_events` (Événements municipaux)
```sql
CREATE TABLE municipal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  
  -- Dates
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  
  -- Lieu
  location_name TEXT,
  location_address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_online BOOLEAN DEFAULT false,
  online_url TEXT,
  
  -- Inscription
  requires_registration BOOLEAN DEFAULT false,
  max_participants INTEGER,
  current_registrations INTEGER DEFAULT 0,
  registration_deadline TIMESTAMPTZ,
  
  -- Catégorie
  category TEXT CHECK (category IN (
    'reunion_publique', 'ceremonie', 'sport', 'culture', 
    'formation', 'sensibilisation', 'marche', 'autre'
  )),
  
  -- Publication
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
  
  -- Auteur
  author_id UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX idx_municipal_events_org ON municipal_events(organization_id);
CREATE INDEX idx_municipal_events_date ON municipal_events(start_date);
CREATE INDEX idx_municipal_events_status ON municipal_events(status);
```

#### Table `municipal_announcements` (Annonces/Alertes)
```sql
CREATE TABLE municipal_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Type d'alerte
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'danger', 'success')),
  
  -- Affichage
  show_on_homepage BOOLEAN DEFAULT true,
  show_as_banner BOOLEAN DEFAULT false,
  
  -- Dates
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  
  -- Auteur
  author_id UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX idx_municipal_announcements_org ON municipal_announcements(organization_id);
CREATE INDEX idx_municipal_announcements_active ON municipal_announcements(starts_at, expires_at);
```

### 2. Configurer les RLS Policies

#### Pour `municipal_news`
```sql
-- Lecture publique des actualités publiées
ALTER TABLE municipal_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published news"
ON municipal_news FOR SELECT
USING (status = 'published' AND (expires_at IS NULL OR expires_at > now()));

-- Gestion par les roles autorisés (communication, admin, super_admin)
CREATE POLICY "Authorized users can manage org news"
ON municipal_news FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.organization_id = municipal_news.organization_id
    AND ur.role IN ('COMMUNICATION', 'ADMIN', 'SUPER_ADMIN', 'maire', 'secretaire_general')
  )
);
```

#### Pour `municipal_events`
```sql
ALTER TABLE municipal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published events"
ON municipal_events FOR SELECT
USING (status = 'published');

CREATE POLICY "Authorized users can manage org events"
ON municipal_events FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.organization_id = municipal_events.organization_id
    AND ur.role IN ('COMMUNICATION', 'ADMIN', 'SUPER_ADMIN', 'maire', 'secretaire_general')
  )
);
```

#### Pour `municipal_announcements`
```sql
ALTER TABLE municipal_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active announcements"
ON municipal_announcements FOR SELECT
USING (starts_at <= now() AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Authorized users can manage org announcements"
ON municipal_announcements FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.organization_id = municipal_announcements.organization_id
    AND ur.role IN ('COMMUNICATION', 'ADMIN', 'SUPER_ADMIN', 'maire', 'secretaire_general')
  )
);
```

### 3. Ajouter latitude/longitude à organizations (si pas déjà fait)
```sql
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Mettre à jour les coordonnées de Libreville comme exemple
UPDATE organizations 
SET latitude = 0.4162, longitude = 9.4673 
WHERE name ILIKE '%libreville%';
```

### 4. Créer une Edge Function pour incrémenter les vues
```typescript
// supabase/functions/increment-news-views/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { news_id } = await req.json()
    
    if (!news_id) {
      return new Response(
        JSON.stringify({ error: 'news_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error } = await supabaseClient.rpc('increment_news_views', { news_id })

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### 5. Créer la fonction RPC pour incrémenter les vues
```sql
CREATE OR REPLACE FUNCTION increment_news_views(news_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE municipal_news 
  SET views_count = views_count + 1 
  WHERE id = news_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6. Triggers pour updated_at
```sql
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_municipal_news_modtime
    BEFORE UPDATE ON municipal_news
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_municipal_events_modtime
    BEFORE UPDATE ON municipal_events
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
```

## Vérifications à Effectuer

1. ✅ Les 3 tables sont créées avec tous les champs
2. ✅ Les index sont en place pour les performances
3. ✅ Les RLS policies permettent :
   - Lecture publique du contenu publié
   - Gestion complète par les rôles autorisés
4. ✅ La table organizations a latitude/longitude
5. ✅ L'Edge Function increment-news-views est déployée
6. ✅ Les triggers updated_at fonctionnent

## Données de Test (Optionnel)

```sql
-- Insérer une actualité test
INSERT INTO municipal_news (
  organization_id, 
  title, 
  content, 
  category, 
  status,
  is_featured,
  published_at
) VALUES (
  (SELECT id FROM organizations WHERE name ILIKE '%libreville%' LIMIT 1),
  'Bienvenue sur le nouveau portail d''actualités',
  'La mairie de Libreville est heureuse de vous présenter son nouveau système d''actualités...',
  'services',
  'published',
  true,
  now()
);
```
