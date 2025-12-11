---
description: Architecture à 3 environnements utilisateurs avec isolation des données et messagerie iBoîte
---

# Architecture à 3 Environnements Utilisateurs

## Vue d'ensemble

L'application Mairie.ga est structurée autour de 3 environnements utilisateurs distincts avec isolation stricte des données.

### Les 3 Environnements

| # | Environnement | Description | Accès aux données |
|---|---------------|-------------|-------------------|
| 1 | **BACK_OFFICE** | Super Admin et collaborateurs système | Vision globale sur toutes les entités |
| 2 | **MUNICIPAL_STAFF** | Personnel des organismes municipaux | Limité à leur organisme d'appartenance |
| 3 | **PUBLIC_USER** | Citoyens, étrangers, associations, entreprises | Limité à leurs propres dossiers |

## Rôles par Environnement

### 1. Back Office (Administration Système)
- `SUPER_ADMIN` - Accès total, gestion globale
- `TECH_ADMIN` - Administration technique
- `SUPPORT_AGENT` - Support utilisateur
- `AUDITOR` - Auditeur (lecture seule)

### 2. Personnel Municipal
- `MAIRE`, `MAIRE_ADJOINT`, `CONSEILLER_MUNICIPAL` - Élus
- `SECRETAIRE_GENERAL`, `CHEF_SERVICE`, `CHEF_BUREAU` - Encadrement
- `AGENT_MUNICIPAL`, `AGENT_ETAT_CIVIL`, `AGENT_TECHNIQUE`, `AGENT_ACCUEIL` - Agents
- `STAGIAIRE` - Stagiaires

### 3. Usagers Publics
- `CITOYEN` - Citoyen de la commune
- `CITOYEN_AUTRE` - Citoyen d'une autre commune
- `ETRANGER_RESIDENT` - Étranger résident
- `ASSOCIATION` - Représentant d'association
- `ENTREPRISE` - Représentant d'entreprise

## Système de Messagerie iBoîte

### Communication Interne (Sans Email)
Tous les utilisateurs dans l'écosystème communiquent **sans adresse email** via iBoîte.

La recherche de destinataires se fait par :
- **Nom/Prénom** de l'utilisateur
- **Service/Département** (ex: "État Civil")
- **Fonction/Rôle** (ex: "Maire de Libreville")
- **Contacts récents** ou **favoris**

### Communication Externe (Avec Email)
Les emails sont utilisés **uniquement** pour communiquer avec :
- Des organismes externes (Préfecture, Ministères)
- Des personnes non inscrites sur Mairie.ga

**Seul le personnel municipal peut envoyer des emails externes.**

## Fichiers Clés

### Migration SQL
```
supabase/migrations/20251211062600_three_environments_architecture.sql
```
Contient :
- Tables `user_environments`, `iboite_contacts`, `iboite_conversations`, etc.
- Fonctions RLS pour l'isolation des données
- Fonctions de recherche `search_iboite_users` et `search_iboite_services`

### Types TypeScript
```
src/types/environments.ts
```
Enums et interfaces pour les environnements, rôles, et messagerie.

### Services
```
src/services/user-environment-service.ts  # Gestion des environnements
src/services/iboite-service.ts            # Messagerie iBoîte
```

### Hooks React
```
src/hooks/useUserEnvironment.ts
```
Hook pour accéder à l'environnement et permissions de l'utilisateur.

### Composants UI
```
src/components/iboite/IBoiteRecipientSearch.tsx  # Recherche de destinataires
src/components/iboite/IBoiteComposeMessage.tsx   # Composition de message
```

## Utilisation

### Vérifier l'environnement d'un utilisateur
```typescript
import { useUserEnvironment } from '@/hooks/useUserEnvironment';

function MyComponent() {
    const { 
        environment, 
        role, 
        isSuperAdmin,
        isMunicipalStaff,
        isPublicUser,
        canSendExternalEmail
    } = useUserEnvironment();
    
    if (isSuperAdmin) {
        // Afficher les options admin
    }
}
```

### Envoyer un message iBoîte
```typescript
import { iBoiteService } from '@/services/iboite-service';

// Créer une conversation
const conversation = await iBoiteService.createConversation({
    type: 'PRIVATE',
    participantIds: ['user-id-123'],
    initialMessage: 'Bonjour!'
});

// Envoyer un message
await iBoiteService.sendMessage({
    conversationId: conversation.id,
    content: 'Nouveau message'
});
```

### Rechercher un destinataire
```typescript
import { IBoiteRecipientSearch } from '@/components/iboite';

<IBoiteRecipientSearch
    onSelect={(recipients) => console.log(recipients)}
    multiple
    placeholder="Rechercher par nom..."
/>
```

## Appliquer la Migration

// turbo
```bash
cd /Users/okatech/mairie.ga && npx supabase db push
```

Ou via le dashboard Supabase si vous utilisez un projet hébergé.
