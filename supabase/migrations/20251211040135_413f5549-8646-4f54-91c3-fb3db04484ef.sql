-- Ajout d'index pour améliorer les performances de recherche sur audit_logs
-- Note: la colonne resource_type existe déjà et sert de entity_type

-- Index sur user_id pour filtrer par utilisateur
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);

-- Index sur action pour filtrer par type d'action
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- Index composite sur resource_type et resource_id pour recherche d'entités
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- Index sur created_at DESC pour les requêtes chronologiques
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Index composite pour les requêtes combinées fréquentes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON public.audit_logs(user_id, action, created_at DESC);