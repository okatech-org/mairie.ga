
-- 1. CV Data table
CREATE TABLE public.cv_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    personal_info JSONB DEFAULT '{}'::jsonb,
    experiences JSONB DEFAULT '[]'::jsonb,
    education JSONB DEFAULT '[]'::jsonb,
    skills JSONB DEFAULT '[]'::jsonb,
    languages JSONB DEFAULT '[]'::jsonb,
    certifications JSONB DEFAULT '[]'::jsonb,
    cv_references JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_cv_data_user_id ON public.cv_data(user_id);

ALTER TABLE public.cv_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own CV" ON public.cv_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own CV" ON public.cv_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own CV" ON public.cv_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own CV" ON public.cv_data FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all CVs" ON public.cv_data FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'super_admin'));

-- 2. Companies table
CREATE TYPE public.entity_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    legal_form TEXT,
    registration_number TEXT,
    tax_id TEXT,
    address JSONB,
    contact_email TEXT,
    contact_phone TEXT,
    sector TEXT,
    description TEXT,
    capital NUMERIC,
    employees_count INTEGER,
    status entity_status DEFAULT 'PENDING',
    documents JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_companies_owner_id ON public.companies(owner_id);
CREATE INDEX idx_companies_status ON public.companies(status);
CREATE INDEX idx_companies_name ON public.companies(name);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own companies" ON public.companies FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own companies" ON public.companies FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own companies" ON public.companies FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own companies" ON public.companies FOR DELETE USING (auth.uid() = owner_id);
CREATE POLICY "Admins can manage all companies" ON public.companies FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'super_admin'));

-- 3. Associations table
CREATE TABLE public.associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    type TEXT,
    registration_number TEXT,
    address JSONB,
    contact_email TEXT,
    contact_phone TEXT,
    president_name TEXT,
    secretary_name TEXT,
    treasurer_name TEXT,
    description TEXT,
    members_count INTEGER,
    status entity_status DEFAULT 'PENDING',
    documents JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_associations_owner_id ON public.associations(owner_id);
CREATE INDEX idx_associations_status ON public.associations(status);
CREATE INDEX idx_associations_name ON public.associations(name);

ALTER TABLE public.associations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own associations" ON public.associations FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own associations" ON public.associations FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own associations" ON public.associations FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own associations" ON public.associations FOR DELETE USING (auth.uid() = owner_id);
CREATE POLICY "Admins can manage all associations" ON public.associations FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'super_admin'));

-- 4. Deliberations table
CREATE TYPE public.deliberation_result AS ENUM ('ADOPTED', 'REJECTED', 'POSTPONED', 'WITHDRAWN');

CREATE TABLE public.deliberations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT UNIQUE NOT NULL,
    organization_id UUID REFERENCES public.organizations(id),
    title TEXT NOT NULL,
    content TEXT,
    session_date DATE NOT NULL,
    resultat deliberation_result,
    votes_pour INTEGER DEFAULT 0,
    votes_contre INTEGER DEFAULT 0,
    abstentions INTEGER DEFAULT 0,
    rapporteur TEXT,
    documents JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_deliberations_numero ON public.deliberations(numero);
CREATE INDEX idx_deliberations_organization ON public.deliberations(organization_id);
CREATE INDEX idx_deliberations_session_date ON public.deliberations(session_date);

ALTER TABLE public.deliberations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view deliberations" ON public.deliberations FOR SELECT USING (true);
CREATE POLICY "Admins can manage deliberations" ON public.deliberations FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- 5. Arretes table
CREATE TYPE public.arrete_type AS ENUM ('MUNICIPAL', 'INDIVIDUEL', 'REGLEMENTAIRE', 'TEMPORAIRE');
CREATE TYPE public.arrete_status AS ENUM ('DRAFT', 'SIGNED', 'PUBLISHED', 'ABROGATED');

CREATE TABLE public.arretes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT UNIQUE NOT NULL,
    organization_id UUID REFERENCES public.organizations(id),
    type arrete_type NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    status arrete_status DEFAULT 'DRAFT',
    date_signature DATE,
    date_publication DATE,
    date_effet DATE,
    date_fin DATE,
    signataire TEXT,
    documents JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_arretes_numero ON public.arretes(numero);
CREATE INDEX idx_arretes_organization ON public.arretes(organization_id);
CREATE INDEX idx_arretes_status ON public.arretes(status);
CREATE INDEX idx_arretes_type ON public.arretes(type);

ALTER TABLE public.arretes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view published arretes" ON public.arretes FOR SELECT USING (status = 'PUBLISHED' OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can manage arretes" ON public.arretes FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- 6. Urbanisme Dossiers table
CREATE TYPE public.urbanisme_type AS ENUM ('PERMIS_CONSTRUIRE', 'DECLARATION_TRAVAUX', 'PERMIS_DEMOLIR', 'PERMIS_AMENAGER', 'CERTIFICAT_URBANISME');
CREATE TYPE public.urbanisme_status AS ENUM ('SUBMITTED', 'IN_REVIEW', 'ADDITIONAL_INFO', 'APPROVED', 'REJECTED', 'WITHDRAWN');

CREATE TABLE public.urbanisme_dossiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT UNIQUE NOT NULL,
    demandeur_id UUID NOT NULL,
    organization_id UUID REFERENCES public.organizations(id),
    type urbanisme_type NOT NULL,
    status urbanisme_status DEFAULT 'SUBMITTED',
    title TEXT NOT NULL,
    description TEXT,
    address JSONB,
    surface_terrain NUMERIC,
    surface_construction NUMERIC,
    date_depot DATE DEFAULT CURRENT_DATE,
    date_decision DATE,
    motif_decision TEXT,
    assigned_to UUID,
    documents JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_urbanisme_numero ON public.urbanisme_dossiers(numero);
CREATE INDEX idx_urbanisme_demandeur ON public.urbanisme_dossiers(demandeur_id);
CREATE INDEX idx_urbanisme_status ON public.urbanisme_dossiers(status);
CREATE INDEX idx_urbanisme_organization ON public.urbanisme_dossiers(organization_id);

ALTER TABLE public.urbanisme_dossiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own urbanisme dossiers" ON public.urbanisme_dossiers FOR SELECT USING (auth.uid() = demandeur_id);
CREATE POLICY "Users can insert own urbanisme dossiers" ON public.urbanisme_dossiers FOR INSERT WITH CHECK (auth.uid() = demandeur_id);
CREATE POLICY "Admins can manage all urbanisme dossiers" ON public.urbanisme_dossiers FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent') OR has_role(auth.uid(), 'super_admin'));

-- 7. Audit Logs table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view audit logs" ON public.audit_logs FOR SELECT USING (has_role(auth.uid(), 'super_admin'));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- 8. Knowledge Base table
CREATE TYPE public.kb_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TABLE public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    tags TEXT[] DEFAULT '{}',
    status kb_status DEFAULT 'DRAFT',
    author_id UUID,
    organization_id UUID REFERENCES public.organizations(id),
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_kb_category ON public.knowledge_base(category);
CREATE INDEX idx_kb_status ON public.knowledge_base(status);
CREATE INDEX idx_kb_tags ON public.knowledge_base USING GIN(tags);
CREATE INDEX idx_kb_search ON public.knowledge_base USING GIN(to_tsvector('french', title || ' ' || content));

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view published KB articles" ON public.knowledge_base FOR SELECT USING (status = 'PUBLISHED' OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can manage KB" ON public.knowledge_base FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- 9. Correspondence Logs table
CREATE TYPE public.correspondence_status AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED');

CREATE TABLE public.correspondence_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    subject TEXT NOT NULL,
    content TEXT,
    template_used TEXT,
    status correspondence_status DEFAULT 'PENDING',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_correspondence_sender ON public.correspondence_logs(sender_id);
CREATE INDEX idx_correspondence_status ON public.correspondence_logs(status);
CREATE INDEX idx_correspondence_created ON public.correspondence_logs(created_at DESC);
CREATE INDEX idx_correspondence_recipient ON public.correspondence_logs(recipient_email);

ALTER TABLE public.correspondence_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own correspondence" ON public.correspondence_logs FOR SELECT USING (auth.uid() = sender_id);
CREATE POLICY "Users can insert correspondence" ON public.correspondence_logs FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Admins can view all correspondence" ON public.correspondence_logs FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Triggers for updated_at
CREATE TRIGGER update_cv_data_updated_at BEFORE UPDATE ON public.cv_data FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_associations_updated_at BEFORE UPDATE ON public.associations FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_deliberations_updated_at BEFORE UPDATE ON public.deliberations FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_arretes_updated_at BEFORE UPDATE ON public.arretes FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_urbanisme_updated_at BEFORE UPDATE ON public.urbanisme_dossiers FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_kb_updated_at BEFORE UPDATE ON public.knowledge_base FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
