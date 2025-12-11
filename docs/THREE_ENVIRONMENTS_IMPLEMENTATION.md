# Architecture à 3 Environnements Utilisateurs - Résumé d'Implémentation

## ✅ Fichiers Créés

### 1. Migration SQL
**Fichier:** `supabase/migrations/20251211062600_three_environments_architecture.sql`

- **Enums créés:**
  - `user_environment` (BACK_OFFICE, MUNICIPAL_STAFF, PUBLIC_USER)
  - `backoffice_role` (SUPER_ADMIN, TECH_ADMIN, SUPPORT_AGENT, AUDITOR)
  - `municipal_staff_role` (MAIRE, MAIRE_ADJOINT, etc.)
  - `public_user_role` (CITOYEN, ETRANGER_RESIDENT, etc.)

- **Tables créées:**
  - `user_environments` - Assignation utilisateur <-> environnement
  - `iboite_contacts` - Carnet d'adresses
  - `iboite_service_directory` - Annuaire des services municipaux
  - `iboite_conversations` - Conversations
  - `iboite_conversation_participants` - Participants
  - `iboite_messages` - Messages
  - `iboite_message_reads` - Accusés de lecture
  - `iboite_external_correspondence` - Courrier externe (email)

- **Fonctions RLS:**
  - `is_backoffice_user()` - Vérifie si l'utilisateur est Back Office
  - `is_super_admin()` - Vérifie si Super Admin
  - `get_user_organizations()` - Organisations accessibles
  - `same_organization()` - Même organisation que l'autre utilisateur
  - `search_iboite_users()` - Recherche d'utilisateurs
  - `search_iboite_services()` - Recherche de services

### 2. Types TypeScript
**Fichier:** `src/types/environments.ts`

- Enums: `UserEnvironment`, `BackOfficeRole`, `MunicipalStaffRole`, `PublicUserRole`
- Interfaces: `UserEnvironmentAssignment`, `IBoiteContact`, `IBoiteConversation`, `IBoiteMessage`, etc.
- Fonctions utilitaires: `getEnvironmentLabel()`, `getRoleLabel()`, `getEnvironmentPermissions()`

### 3. Services
**Fichier:** `src/services/user-environment-service.ts`
- Gestion des environnements utilisateurs
- Vérification des permissions
- Support legacy (table `user_roles`)
- Cache pour les performances

**Fichier:** `src/services/iboite-service.ts`
- Messagerie interne (sans email)
- Recherche de destinataires par nom/service
- Carnet d'adresses
- Correspondance externe (avec email)
- Abonnements Realtime

### 4. Hook React
**Fichier:** `src/hooks/useUserEnvironment.ts`
- Accès facile à l'environnement et permissions
- Helpers: `isSuperAdmin`, `isMaire`, `isAgent`, etc.
- Méthodes: `getDashboardRoute()`, `canViewOrganization()`

### 5. Composants UI
**Fichier:** `src/components/iboite/IBoiteRecipientSearch.tsx`
- Recherche de destinataires par nom (pas d'email)
- Onglets: Recherche, Contacts, Services
- Support des favoris et contacts récents

**Fichier:** `src/components/iboite/IBoiteComposeMessage.tsx`
- Composition de message
- Bascule interne (iBoîte) / externe (email)
- Support des pièces jointes
- Messages officiels avec référence

### 6. Documentation
**Fichier:** `.agent/workflows/three-environments-architecture.md`
- Guide complet de l'architecture
- Exemples d'utilisation

---

## 📋 Prochaines Étapes

1. **Appliquer les migrations** à la base de données Supabase (incluant la migration des données utilisateurs) :
   ```bash
   npx supabase db push
   ```
   *Cela créera les tables ET migrera automatiquement vos utilisateurs existants vers la nouvelle structure.*

2. **Vérification** :
   Une fois la commande terminée, les utilisateurs auront automatiquement leur environnement défini dans la table `user_environments`.

3. **Intégration UI** :
   L'interface iBoîte est déjà connectée via `IBoitePage.tsx`. Vous pouvez la tester en naviguant vers `/iboite`.

---

## 🔐 Résumé de la Sécurité

| Qui peut voir quoi ? | BACK_OFFICE | MUNICIPAL_STAFF | PUBLIC_USER |
|---------------------|-------------|-----------------|-------------|
| Toutes les organisations | ✅ | ❌ | ❌ |
| Données de son organisation | ✅ | ✅ | ❌ |
| Ses propres données | ✅ | ✅ | ✅ |
| Audit logs | ✅ | Élus seulement | ❌ |
| Envoyer email externe | ✅ | ✅ | ❌ |

---

## 📬 Logique de Communication iBoîte

```
┌─────────────────────────────────────────────────────────────────┐
│                        iBoîte Messaging                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐       INTERNE        ┌─────────────┐            │
│  │  Personnel  │ ◄──────────────────► │  Personnel  │            │
│  │  Municipal  │    (par nom/service) │  Municipal  │            │
│  └─────────────┘                       └─────────────┘            │
│         │                                     │                   │
│         ▼                                     ▼                   │
│  ┌─────────────┐                       ┌─────────────┐            │
│  │   Citoyen   │ ◄─────────────────────►   Services  │            │
│  │             │    (par nom/service)  │             │            │
│  └─────────────┘                       └─────────────┘            │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐       EXTERNE        ┌─────────────┐            │
│  │  Personnel  │ ──────────────────► │  Préfecture  │            │
│  │  Municipal  │     (par email)      │  / Externe   │            │
│  └─────────────┘                       └─────────────┘            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```
