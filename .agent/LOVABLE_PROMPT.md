# Prompt Lovable - Configuration Backend Mairie.ga

## Contexte
L'application Mairie.ga a été mise à jour pour supporter un mode hybride :
- **Mode Démo** : Utilise des données mockées quand les tables Supabase n'existent pas
- **Mode Production** : Utilise Supabase quand les tables sont disponibles

Les services frontend sont déjà configurés pour basculer automatiquement.

---

## 1. Tables Supabase à Créer

### 1.1 Table `cv_data` (CV des citoyens)

```sql
CREATE TABLE IF NOT EXISTS cv_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    summary TEXT,
    experiences JSONB DEFAULT '[]'::jsonb,
    education JSONB DEFAULT '[]'::jsonb,
    skills JSONB DEFAULT '[]'::jsonb,
    languages JSONB DEFAULT '[]'::jsonb,
    hobbies TEXT[],
    portfolio_url TEXT,
    linkedin_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide par user_id
CREATE INDEX IF NOT EXISTS idx_cv_data_user_id ON cv_data(user_id);

-- RLS Policies
ALTER TABLE cv_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own CV" ON cv_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own CV" ON cv_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own CV" ON cv_data
    FOR UPDATE USING (auth.uid() = user_id);
```

### 1.2 Table `companies` (Entreprises)

```sql
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    legal_name TEXT,
    company_type TEXT NOT NULL, -- SARL, SA, SAS, SASU, EURL, EI, AUTO_ENTREPRENEUR, OTHER
    activity_sector TEXT NOT NULL, -- TECHNOLOGY, COMMERCE, SERVICES, etc.
    siret TEXT,
    registration_number TEXT,
    status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    validated_at TIMESTAMPTZ,
    validated_by_id UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    website TEXT,
    description TEXT NOT NULL,
    short_description TEXT,
    logo_url TEXT,
    address_street TEXT,
    address_city TEXT,
    address_postal_code TEXT,
    address_country TEXT DEFAULT 'Gabon',
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    owner_role TEXT NOT NULL, -- CEO, OWNER, PRESIDENT, DIRECTOR, MANAGER
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

-- RLS Policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own companies" ON companies
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own companies" ON companies
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own companies" ON companies
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Admins can view all companies" ON companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role IN ('super_admin', 'admin', 'agent')
        )
    );

CREATE POLICY "Admins can update companies" ON companies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role IN ('super_admin', 'admin', 'agent')
        )
    );
```

### 1.3 Table `associations` (Associations)

```sql
CREATE TABLE IF NOT EXISTS associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    legal_name TEXT,
    association_type TEXT NOT NULL, -- CULTURAL, SPORTS, RELIGIOUS, etc.
    registration_number TEXT,
    creation_date DATE,
    status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    validated_at TIMESTAMPTZ,
    validated_by_id UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    website TEXT,
    facebook TEXT,
    instagram TEXT,
    linkedin TEXT,
    description TEXT NOT NULL,
    short_description TEXT,
    objectives TEXT,
    member_count INTEGER,
    founding_year INTEGER,
    logo_url TEXT,
    address_street TEXT,
    address_city TEXT,
    address_postal_code TEXT,
    address_country TEXT DEFAULT 'Gabon',
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    owner_role TEXT NOT NULL, -- PRESIDENT, MEMBER, VICE_PRESIDENT, SECRETARY, TREASURER
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_associations_owner_id ON associations(owner_id);
CREATE INDEX IF NOT EXISTS idx_associations_status ON associations(status);

-- RLS Policies
ALTER TABLE associations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own associations" ON associations
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own associations" ON associations
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own associations" ON associations
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Admins can view all associations" ON associations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role IN ('super_admin', 'admin', 'agent')
        )
    );

CREATE POLICY "Admins can update associations" ON associations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role IN ('super_admin', 'admin', 'agent')
        )
    );
```

### 1.4 Table `deliberations` (Délibérations municipales)

```sql
CREATE TABLE IF NOT EXISTS deliberations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT NOT NULL UNIQUE,
    titre TEXT NOT NULL,
    objet TEXT NOT NULL,
    date_seance DATE NOT NULL,
    resultat TEXT DEFAULT 'en_cours', -- adopté, rejeté, ajourné, en_cours
    vote_pour INTEGER,
    vote_contre INTEGER,
    abstention INTEGER,
    rapporteur TEXT,
    commission TEXT,
    document_url TEXT,
    organization_id UUID REFERENCES organizations(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE deliberations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view adopted deliberations" ON deliberations
    FOR SELECT USING (resultat = 'adopté');

CREATE POLICY "Staff can view all deliberations" ON deliberations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role IN ('super_admin', 'admin', 'agent')
        )
    );

CREATE POLICY "Staff can manage deliberations" ON deliberations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role IN ('super_admin', 'admin')
        )
    );
```

### 1.5 Table `arretes` (Arrêtés municipaux)

```sql
CREATE TABLE IF NOT EXISTS arretes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT NOT NULL UNIQUE,
    titre TEXT NOT NULL,
    objet TEXT NOT NULL,
    type TEXT NOT NULL, -- reglementaire, individuel, police, urbanisme
    status TEXT DEFAULT 'projet', -- projet, signé, publié, abrogé
    date_prise DATE,
    date_publication DATE,
    signataire TEXT,
    document_url TEXT,
    organization_id UUID REFERENCES organizations(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE arretes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published arretes" ON arretes
    FOR SELECT USING (status = 'publié');

CREATE POLICY "Staff can view all arretes" ON arretes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role IN ('super_admin', 'admin', 'agent')
        )
    );

CREATE POLICY "Staff can manage arretes" ON arretes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role IN ('super_admin', 'admin')
        )
    );
```

### 1.6 Table `urbanisme_dossiers` (Dossiers d'urbanisme)

```sql
CREATE TABLE IF NOT EXISTS urbanisme_dossiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL, -- permis_construire, declaration_prealable, permis_amenager, permis_demolir
    demandeur TEXT NOT NULL,
    demandeur_id UUID REFERENCES auth.users(id),
    adresse TEXT NOT NULL,
    parcelle TEXT,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'déposé', -- déposé, instruction, attente_pieces, accordé, refusé, sans_suite
    date_depot DATE NOT NULL,
    date_decision DATE,
    surface NUMERIC,
    instructeur TEXT,
    instructeur_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_urbanisme_demandeur_id ON urbanisme_dossiers(demandeur_id);
CREATE INDEX IF NOT EXISTS idx_urbanisme_status ON urbanisme_dossiers(status);

-- RLS Policies
ALTER TABLE urbanisme_dossiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dossiers" ON urbanisme_dossiers
    FOR SELECT USING (auth.uid() = demandeur_id);

CREATE POLICY "Staff can view all dossiers" ON urbanisme_dossiers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role IN ('super_admin', 'admin', 'agent')
        )
    );

CREATE POLICY "Staff can manage dossiers" ON urbanisme_dossiers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role IN ('super_admin', 'admin', 'agent')
        )
    );
```

### 1.7 Table `audit_logs` (Logs d'audit)

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche chronologique
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- RLS Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only super admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'super_admin'
        )
    );

-- Fonction pour insérer automatiquement les logs
CREATE OR REPLACE FUNCTION log_audit_action()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, resource, resource_id, details)
    VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id::text ELSE NEW.id::text END,
        CASE 
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            ELSE to_jsonb(NEW)
        END
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 1.8 Table `knowledge_base` (Base de connaissances)

```sql
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[],
    author TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'draft', -- draft, published, archived
    views INTEGER DEFAULT 0,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche full-text
CREATE INDEX IF NOT EXISTS idx_knowledge_base_search 
    ON knowledge_base USING GIN (to_tsvector('french', title || ' ' || content));

-- RLS Policies
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view knowledge base" ON knowledge_base
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role IN ('super_admin', 'admin', 'agent')
        )
    );

CREATE POLICY "Admins can manage knowledge base" ON knowledge_base
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role IN ('super_admin', 'admin')
        )
    );
```

### 1.9 Table `correspondence_logs` (Historique correspondance)

```sql
CREATE TABLE IF NOT EXISTS correspondence_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id) NOT NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    document_type TEXT,
    document_url TEXT,
    status TEXT DEFAULT 'sent', -- draft, sent, delivered, failed
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    organization_id UUID REFERENCES organizations(id),
    metadata JSONB
);

-- Index
CREATE INDEX IF NOT EXISTS idx_correspondence_sender ON correspondence_logs(sender_id);

-- RLS Policies
ALTER TABLE correspondence_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their sent correspondence" ON correspondence_logs
    FOR SELECT USING (auth.uid() = sender_id);

CREATE POLICY "Staff can view all correspondence" ON correspondence_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role IN ('super_admin', 'admin', 'agent')
        )
    );
```

---

## 2. Edge Functions à Vérifier/Déployer

Les Edge Functions suivantes doivent être déployées et fonctionnelles :

| Fonction | Description | Variables d'environnement requises |
|----------|-------------|-----------------------------------|
| `document-ocr` | OCR de documents avec Gemini/OpenAI | `GOOGLE_AI_API_KEY` ou `OPENAI_API_KEY` |
| `transcribe-audio` | Transcription audio | `OPENAI_API_KEY` |
| `chat-with-iasted` | Chat avec l'assistant IA | `OPENAI_API_KEY` |
| `enrich-document-content` | Enrichissement IA du contenu | `OPENAI_API_KEY` |
| `send-official-correspondence` | Envoi d'emails officiels | `RESEND_API_KEY` |
| `get-mapbox-token` | Token Mapbox pour la carte | `MAPBOX_ACCESS_TOKEN` |
| `security-alert-login` | Alertes de sécurité | `RESEND_API_KEY` |
| `new-device-alert` | Alertes nouveau device | `RESEND_API_KEY` |
| `auth-pin-login` | Authentification par PIN | - |
| `create-user` | Création d'utilisateurs | - |

### Variables d'environnement Supabase à configurer :

```env
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=AIza...
RESEND_API_KEY=re_...
MAPBOX_ACCESS_TOKEN=pk.eyJ...
```

---

## 3. Ordre d'exécution recommandé

1. **Créer les tables** dans l'ordre ci-dessus (respecter les foreign keys)
2. **Configurer les RLS policies** pour chaque table
3. **Régénérer les types TypeScript** : `npx supabase gen types typescript`
4. **Vérifier les Edge Functions** et leurs variables d'environnement
5. **Tester** en mode production

---

## 4. Notes importantes

- Les services frontend sont configurés pour basculer automatiquement entre mock et Supabase
- En cas d'erreur de connexion aux tables, le système utilise les données mockées
- Les Edge Functions ont un fallback en mode démo (erreur 401 → réponse simulée)
- La carte Mapbox affichera un message d'erreur en mode démo si le token n'est pas configuré
