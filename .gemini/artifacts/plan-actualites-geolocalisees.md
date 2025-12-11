# 📊 Plan d'Implémentation : Actualités Géolocalisées & Rôle Communication

## 🎯 Objectif
Personnaliser l'affichage des actualités et informations municipales en fonction de :
- **Non connecté** : Municipalité la plus proche (géolocalisation)
- **Connecté** : Municipalité d'inscription du citoyen

Créer un rôle **"Chargé de Communication"** dans chaque mairie pour gérer le contenu local.

---

## 📐 Architecture Globale

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                             │
├─────────────────────────────────────────────────────────────────────┤
│  useMunicipalityContext()                                           │
│  ├── Géolocalisation (navigator.geolocation)                        │
│  ├── Calcul distance → mairie la plus proche                        │
│  └── Auth user → municipality_id du profil                          │
├─────────────────────────────────────────────────────────────────────┤
│                        SUPABASE (Backend)                           │
├─────────────────────────────────────────────────────────────────────┤
│  Tables:                                                            │
│  ├── municipal_news (actualités par mairie)                         │
│  ├── municipal_events (événements par mairie)                       │
│  ├── municipal_announcements (annonces urgentes)                    │
│  └── user_roles (nouveau rôle COMMUNICATION)                        │
├─────────────────────────────────────────────────────────────────────┤
│  RLS Policies:                                                      │
│  ├── Lecture publique filtrée par organization_id                   │
│  └── Écriture réservée au rôle COMMUNICATION de l'org               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🗃️ Phase 1 : Base de Données

### 1.1 Nouvelles Tables

```sql
-- Table des actualités municipales
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

-- Table des événements municipaux
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

-- Table des annonces urgentes (alertes)
CREATE TABLE municipal_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Type d'alerte
  type TEXT NOT NULL CHECK (type IN (
    'info', 'warning', 'danger', 'success'
  )),
  
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

-- Index pour performances
CREATE INDEX idx_municipal_news_org ON municipal_news(organization_id);
CREATE INDEX idx_municipal_news_status ON municipal_news(status, published_at DESC);
CREATE INDEX idx_municipal_events_org ON municipal_events(organization_id);
CREATE INDEX idx_municipal_events_date ON municipal_events(start_date);
CREATE INDEX idx_municipal_announcements_org ON municipal_announcements(organization_id);
```

### 1.2 Nouveau Rôle "COMMUNICATION"

```sql
-- Ajouter le rôle dans l'enum existant (si enum)
-- Ou simplement l'utiliser comme string dans user_roles

-- Vérifier la structure actuelle de user_roles
-- Puis ajouter la possibilité d'avoir role = 'COMMUNICATION'

-- Permissions du rôle COMMUNICATION :
-- ✅ Créer/modifier/supprimer les actualités de SON organisation
-- ✅ Créer/modifier/supprimer les événements de SON organisation  
-- ✅ Créer/modifier/supprimer les annonces de SON organisation
-- ❌ Pas d'accès aux demandes citoyennes
-- ❌ Pas d'accès à l'administration de l'organisation
```

### 1.3 RLS Policies

```sql
-- Lecture publique des actualités publiées
CREATE POLICY "Public can read published news"
ON municipal_news FOR SELECT
USING (status = 'published' AND (expires_at IS NULL OR expires_at > now()));

-- Écriture par les chargés de com de l'org
CREATE POLICY "Communication can manage org news"
ON municipal_news FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.organization_id = municipal_news.organization_id
    AND ur.role IN ('COMMUNICATION', 'ADMIN', 'SUPER_ADMIN')
  )
);

-- Similaire pour events et announcements...
```

---

## 🎨 Phase 2 : Frontend - Context de Municipalité

### 2.1 Nouveau Context : `MunicipalityContext`

```typescript
// src/contexts/MunicipalityContext.tsx

interface MunicipalityContextValue {
  // Municipalité active
  currentMunicipality: Organization | null;
  
  // Source de la détection
  detectionSource: 'geolocation' | 'user_profile' | 'manual' | 'default';
  
  // État
  isLoading: boolean;
  error: string | null;
  
  // Position utilisateur
  userLocation: { lat: number; lng: number } | null;
  
  // Distance à la mairie
  distanceToMunicipality: number | null; // en km
  
  // Actions
  changeMunicipality: (orgId: string) => void;
  refreshLocation: () => void;
}

// Logique de détection :
// 1. User connecté → municipality depuis son profil
// 2. User non connecté + géoloc → mairie la plus proche
// 3. Fallback → Libreville (capitale)
```

### 2.2 Hook `useMunicipalNews`

```typescript
// src/hooks/useMunicipalNews.ts

interface UseMunicipalNewsOptions {
  category?: string;
  limit?: number;
  featured?: boolean;
}

function useMunicipalNews(options?: UseMunicipalNewsOptions) {
  const { currentMunicipality } = useMunicipality();
  
  // Fetch les actualités de currentMunicipality.id
  // Avec cache et pagination
  
  return {
    news: MunicipalNews[],
    events: MunicipalEvent[],
    announcements: MunicipalAnnouncement[],
    isLoading: boolean,
    error: Error | null,
    refetch: () => void
  };
}
```

---

## 👤 Phase 3 : Rôle Chargé de Communication

### 3.1 Interface Dashboard Communication

```
/dashboard/communication/
├── /actualites          # Liste + création d'actualités
├── /actualites/new      # Nouvelle actualité (éditeur riche)
├── /actualites/:id      # Édition d'une actualité
├── /evenements          # Liste + création d'événements
├── /evenements/new      # Nouvel événement
├── /annonces            # Gestion des annonces/alertes
├── /statistiques        # Vues, engagement, etc.
└── /media               # Bibliothèque média (images)
```

### 3.2 Écran de Création d'Actualité

```
┌─────────────────────────────────────────────────────────────┐
│  📝 Nouvelle Actualité                                      │
├─────────────────────────────────────────────────────────────┤
│  Titre: [________________________________]                   │
│                                                             │
│  Catégorie: [Services ▼]  □ À la une  □ Urgent             │
│                                                             │
│  Image de couverture: [Glisser ou cliquer]                 │
│                                                             │
│  Résumé:                                                    │
│  [________________________________________________]        │
│                                                             │
│  Contenu (éditeur riche):                                  │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ B I U | 📷 🔗 📋 | H1 H2 | • ○ |                      │ │
│  │                                                       │ │
│  │ Tapez votre contenu ici...                            │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Tags: [tag1] [tag2] [+ Ajouter]                           │
│                                                             │
│  Publication:                                               │
│  ○ Brouillon  ● Publier maintenant  ○ Planifier            │
│                                                             │
│  Expire le: [__/__/____] (optionnel)                       │
│                                                             │
│  [Annuler]                    [Aperçu] [💾 Enregistrer]    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Phase 4 : Affichage Côté Public

### 4.1 Modification de la Page "Vie Citoyenne"

```typescript
// Avant : Données statiques mockées
// Après : Données dynamiques depuis municipal_news

function VieCitoyenne() {
  const { currentMunicipality, detectionSource } = useMunicipality();
  const { news, events, announcements, isLoading } = useMunicipalNews();
  
  return (
    <div>
      {/* Indicateur de localisation */}
      <MunicipalityIndicator 
        municipality={currentMunicipality}
        source={detectionSource}
        onChangeClick={openMunicipalitySelector}
      />
      
      {/* Annonces urgentes (bannière) */}
      {announcements.filter(a => a.show_as_banner).map(a => (
        <AlertBanner key={a.id} announcement={a} />
      ))}
      
      {/* Contenu de la page... */}
    </div>
  );
}
```

### 4.2 Indicateur de Municipalité

```
┌────────────────────────────────────────────────┐
│ 📍 Mairie de Libreville                        │
│ Basé sur votre position • 2.3 km    [Changer] │
└────────────────────────────────────────────────┘

ou si connecté:

┌────────────────────────────────────────────────┐
│ 🏛️ Mairie de Port-Gentil                       │
│ Votre commune d'inscription         [Changer] │
└────────────────────────────────────────────────┘
```

---

## 🔐 Phase 5 : Sécurité et Permissions

### 5.1 Matrice des Permissions

| Action | Public | Citoyen | Communication | Admin | Super Admin |
|--------|--------|---------|---------------|-------|-------------|
| Lire actualités publiées | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lire brouillons | ❌ | ❌ | ✅ (sa mairie) | ✅ | ✅ |
| Créer actualité | ❌ | ❌ | ✅ | ✅ | ✅ |
| Modifier actualité | ❌ | ❌ | ✅ (sa mairie) | ✅ | ✅ |
| Supprimer actualité | ❌ | ❌ | ✅ (sa mairie) | ✅ | ✅ |
| Voir stats | ❌ | ❌ | ✅ (sa mairie) | ✅ | ✅ |

### 5.2 Validation des Données

```typescript
// Schéma Zod pour création d'actualité
const createNewsSchema = z.object({
  title: z.string().min(10).max(200),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(50),
  category: z.enum(['services', 'evenements', ...]),
  tags: z.array(z.string()).max(5),
  is_featured: z.boolean().default(false),
  is_urgent: z.boolean().default(false),
  cover_image_url: z.string().url().optional(),
  expires_at: z.date().optional(),
});
```

---

## 📅 Phase 6 : Plan d'Implémentation

### Sprint 1 (Semaine 1-2) : Base de données + Backend
- [ ] Créer les tables SQL (municipal_news, events, announcements)
- [ ] Configurer les RLS policies
- [ ] Ajouter le rôle COMMUNICATION dans user_roles
- [ ] Créer les services Supabase (CRUD)

### Sprint 2 (Semaine 3-4) : Context + Hooks Frontend
- [ ] Implémenter MunicipalityContext
- [ ] Créer useMunicipalNews hook
- [ ] Intégrer la géolocalisation
- [ ] Créer le composant MunicipalityIndicator

### Sprint 3 (Semaine 5-6) : Dashboard Communication
- [ ] Créer le layout dashboard communication
- [ ] Implémenter l'éditeur d'actualités (TipTap ou similaire)
- [ ] Créer la gestion des événements
- [ ] Créer la gestion des annonces

### Sprint 4 (Semaine 7-8) : Intégration + Polish
- [ ] Modifier la page Vie Citoyenne pour utiliser les données dynamiques
- [ ] Ajouter les indicateurs de municipalité
- [ ] Implémenter les notifications push (optionnel)
- [ ] Tests et QA

---

## 📊 Estimation des Efforts

| Composant | Complexité | Temps estimé |
|-----------|------------|--------------|
| Tables SQL + RLS | Moyenne | 4h |
| Services backend | Moyenne | 6h |
| MunicipalityContext | Haute | 8h |
| Dashboard Communication | Haute | 20h |
| Modification pages publiques | Moyenne | 8h |
| Tests + Intégration | Moyenne | 8h |
| **TOTAL** | | **~54h (7-8 jours)** |

---

## 🎁 Bonus Futurs

1. **Notifications Push** : Alerter les citoyens des nouvelles de leur mairie
2. **Newsletter Automatique** : Email hebdomadaire avec le récap
3. **Analytics** : Tableau de bord des vues par article
4. **Commentaires** : Permettre les réactions citoyennes
5. **Partage Social** : Boutons de partage Facebook/WhatsApp
6. **Multi-langue** : Traduction des actualités

---

## ✅ Prochaines Étapes

Souhaitez-vous que je commence l'implémentation par :

1. **🗃️ Phase 1** : Créer les tables SQL et migrations Supabase
2. **🎨 Phase 2** : Implémenter le MunicipalityContext  
3. **👤 Phase 3** : Créer le dashboard Communication
4. **📱 Phase 4** : Modifier la page Vie Citoyenne

Dites-moi par quelle phase commencer !
