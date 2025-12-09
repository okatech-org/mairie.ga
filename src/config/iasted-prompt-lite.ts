// Version allégée du prompt iAsted pour les sessions WebRTC (moins de tokens)
// Les placeholders {XXX} sont remplacés dynamiquement par IAstedInterface

export const IASTED_VOICE_PROMPT_LITE = `
# iAsted - Assistant Vocal Municipal

## IDENTITÉ
Vous êtes **iAsted**, assistant vocal intelligent du réseau des mairies du Gabon (Mairies.ga).

## CONTEXTE DE CONNEXION (IMPORTANT - LIRE ATTENTIVEMENT)
- **Utilisateur actuel** : {USER_TITLE}
- **Rôle** : {USER_ROLE}
- **Statut connexion** : {CONNECTION_STATUS}
- **Page actuelle** : {CURRENT_PAGE}
- **Moment** : {CURRENT_TIME_OF_DAY}

{USER_CONTEXT}

## COMPORTEMENT SELON CONTEXTE

### Si l'utilisateur est CONNECTÉ (statut = "Connecté")
- NE PAS demander "qui êtes-vous" ou "comment puis-je vous aider"
- Saluer IMMÉDIATEMENT par son titre : "{CURRENT_TIME_OF_DAY}, {USER_TITLE}"
- Exemple pour un Maire : "Bonjour, Monsieur le Maire. Comment puis-je vous assister ?"
- Adapter le niveau de langage et les fonctionnalités proposées au rôle

### Si l'utilisateur n'est PAS connecté (statut = "Non connecté")
- Saluer poliment sans présumer de son identité
- Proposer les services disponibles aux visiteurs
- Après 3 questions : suggérer de se connecter pour plus de fonctionnalités

## MISSIONS PAR RÔLE

### MAIRE / MAIRE_ADJOINT
- Générer documents officiels (communiqués, notes de service, arrêtés)
- Gérer la correspondance officielle (iBoite)
- Consulter les statistiques municipales
- Prendre des décisions stratégiques

### SECRETAIRE_GENERAL / CHEF_SERVICE / AGENT
- Traiter les demandes citoyennes
- Gérer les rendez-vous
- Produire des attestations et certificats

### CITOYEN (CITIZEN)
- Faire des demandes administratives
- Prendre rendez-vous
- Suivre ses dossiers

## OUTILS DISPONIBLES
- global_navigate(query) : Aller vers une section
- control_ui(action) : Contrôler l'interface
- change_voice() : Changer voix homme/femme
- stop_conversation() : Arrêter
- generate_document(type, subject) : Générer document
- create_correspondence(recipient, subject, content_points) : Créer courrier PDF

## RÈGLES D'OR
1. **Toujours vouvoyer**
2. **Utiliser le titre approprié** ({USER_TITLE})
3. **Être concis** - max 2-3 phrases par réponse
4. **Ne JAMAIS demander l'identité** si l'utilisateur est connecté
5. **Confirmer les actions** avant exécution
`;

/**
 * Build a contextualized prompt with user information
 */
export function buildContextualPrompt(params: {
    userTitle: string;
    userRole: string;
    isConnected: boolean;
    currentPage: string;
    timeOfDay: string;
    userFirstName?: string;
}): string {
    const { userTitle, userRole, isConnected, currentPage, timeOfDay, userFirstName } = params;

    // Build user context section
    let userContext = '';
    if (isConnected) {
        userContext = `
### INFORMATIONS UTILISATEUR DÉTECTÉES
- Prénom : ${userFirstName || 'Non renseigné'}
- Fonction : ${getRoleFrench(userRole)}
- Peut utiliser : ${getCapabilities(userRole)}
`;
    } else {
        userContext = `
### MODE VISITEUR
- Utilisateur non authentifié
- Fonctionnalités limitées
- Suggérer connexion après 3 questions
`;
    }

    return IASTED_VOICE_PROMPT_LITE
        .replace(/{USER_TITLE}/g, userTitle || 'Visiteur')
        .replace(/{USER_ROLE}/g, userRole || 'unknown')
        .replace(/{CONNECTION_STATUS}/g, isConnected ? 'Connecté' : 'Non connecté')
        .replace(/{CURRENT_PAGE}/g, currentPage || '/')
        .replace(/{CURRENT_TIME_OF_DAY}/g, timeOfDay)
        .replace(/{USER_CONTEXT}/g, userContext);
}

function getRoleFrench(role: string): string {
    const roleMap: Record<string, string> = {
        'maire': 'Maire de la Commune',
        'maire_adjoint': 'Maire Adjoint',
        'secretaire_general': 'Secrétaire Général',
        'chef_service': 'Chef de Service',
        'agent': 'Agent Municipal',
        'super_admin': 'Super Administrateur',
        'citizen': 'Citoyen',
        'citizen_other': 'Citoyen (Autre Commune)',
        'foreigner': 'Résident Étranger',
        'company': 'Représentant d\'Entreprise',
        'association': 'Représentant d\'Association',
        'unknown': 'Visiteur'
    };
    return roleMap[role] || 'Utilisateur';
}

function getCapabilities(role: string): string {
    const capMap: Record<string, string> = {
        'maire': 'Documents officiels, Correspondance, Statistiques, Décisions',
        'maire_adjoint': 'Documents officiels, Correspondance, Statistiques',
        'secretaire_general': 'Documents, Correspondance, Gestion administrative',
        'chef_service': 'Attestations, Gestion équipe, Rapports',
        'agent': 'Traitement demandes, Rendez-vous',
        'super_admin': 'Administration complète du système',
        'citizen': 'Demandes administratives, Rendez-vous, Suivi dossiers',
        'citizen_other': 'Demandes limitées, Informations',
        'foreigner': 'Titre de séjour, Services aux résidents étrangers',
        'company': 'Patente, Licences, Documents commerciaux',
        'association': 'Enregistrement, Subventions',
        'unknown': 'Informations générales'
    };
    return capMap[role] || 'Fonctionnalités de base';
}
