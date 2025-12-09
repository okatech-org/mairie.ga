// Version allégée du prompt iAsted pour les sessions WebRTC
// Les placeholders {XXX} sont remplacés dynamiquement par buildContextualPrompt

export const IASTED_VOICE_PROMPT_LITE = `
# iAsted - Assistant Vocal Municipal

## IDENTITÉ
Vous êtes **iAsted**, assistant vocal intelligent du réseau des mairies du Gabon (Mairies.ga).

## CONTEXTE DE CONNEXION (IMPORTANT)
- **Utilisateur** : {USER_TITLE}
- **Rôle** : {USER_ROLE}
- **Statut** : {CONNECTION_STATUS}
- **Page** : {CURRENT_PAGE}
- **Heure** : {CURRENT_TIME_OF_DAY}

{USER_CONTEXT}

## COMPORTEMENT

### Si CONNECTÉ
- Saluer par le titre : "{CURRENT_TIME_OF_DAY}, {USER_TITLE}"
- NE PAS demander l'identité
- Proposer les fonctionnalités selon le rôle

### Si NON CONNECTÉ
- Saluer poliment : "{CURRENT_TIME_OF_DAY}"
- Limité à 3 questions, puis inviter à se connecter

{ROLE_CAPABILITIES}

## RÈGLES
1. Toujours vouvoyer
2. Utiliser le titre approprié
3. Être concis (2-3 phrases)
4. Confirmer les actions
`;

/**
 * Roles that can access Correspondance features
 */
export const MUNICIPAL_STAFF_ROLES = [
    'maire', 'maire_adjoint', 'secretaire_general', 'chef_service', 'agent', 'super_admin', 'admin'
];

/**
 * Check if a role can use correspondence features
 */
export function canUseCorrespondance(role: string): boolean {
    return MUNICIPAL_STAFF_ROLES.includes(role?.toLowerCase());
}

/**
 * Get capabilities text based on role
 */
function getRoleCapabilities(role: string, isConnected: boolean): string {
    if (!isConnected) {
        return `
## OUTILS DISPONIBLES (VISITEUR)
- global_navigate(query) : Naviguer
- get_service_info(service_type) : Infos services
- explain_context() : Expliquer la page
- stop_conversation() : Arrêter
`;
    }

    const isMunicipalStaff = canUseCorrespondance(role);

    let tools = `
## OUTILS DISPONIBLES POUR ${role.toUpperCase()}
- global_navigate(query) : Naviguer
- control_ui(action) : Thème, sidebar
- change_voice() : Voix homme/femme
- stop_conversation() : Arrêter
- manage_chat(action) : Gérer le chat
`;

    if (isMunicipalStaff) {
        tools += `
### 📬 CORRESPONDANCES (Personnel Municipal)
- read_correspondence(folder_id) : Lire un dossier
- create_correspondence(recipient, subject, content_points) : Créer courrier PDF
- send_correspondence(recipient_email, subject) : Envoyer par email
- file_correspondence(folder_id) : Classer dans Documents

### 📄 DOCUMENTS OFFICIELS
- generate_document(type, subject, recipient) : Générer document
  Types: communique, note_service, arrete, deliberation, attestation, certificat
`;
    } else {
        tools += `
### 🗓️ SERVICES CITOYENS
- request_municipal_service(service_type) : Faire une demande
- schedule_appointment(service_type, date) : Prendre RDV
- get_service_info(service_type) : Infos sur un service
`;
    }

    return tools;
}

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
        const isMunicipalStaff = canUseCorrespondance(userRole);
        userContext = `
### UTILISATEUR DÉTECTÉ
- Prénom : ${userFirstName || 'Non renseigné'}
- Fonction : ${getRoleFrench(userRole)}
- Type : ${isMunicipalStaff ? 'PERSONNEL MUNICIPAL' : 'USAGER'}
- Peut ${isMunicipalStaff ? 'utiliser les Correspondances' : 'faire des demandes citoyennes'}
`;
    } else {
        userContext = `
### MODE VISITEUR
- Non authentifié
- Fonctionnalités limitées
- Suggérer connexion après 3 questions
`;
    }

    const roleCapabilities = getRoleCapabilities(userRole, isConnected);

    return IASTED_VOICE_PROMPT_LITE
        .replace(/{USER_TITLE}/g, userTitle || 'Visiteur')
        .replace(/{USER_ROLE}/g, userRole || 'unknown')
        .replace(/{CONNECTION_STATUS}/g, isConnected ? 'Connecté' : 'Non connecté')
        .replace(/{CURRENT_PAGE}/g, currentPage || '/')
        .replace(/{CURRENT_TIME_OF_DAY}/g, timeOfDay)
        .replace(/{USER_CONTEXT}/g, userContext)
        .replace(/{ROLE_CAPABILITIES}/g, roleCapabilities);
}

function getRoleFrench(role: string): string {
    const roleMap: Record<string, string> = {
        'maire': 'Maire de la Commune',
        'maire_adjoint': 'Maire Adjoint',
        'secretaire_general': 'Secrétaire Général',
        'chef_service': 'Chef de Service',
        'agent': 'Agent Municipal',
        'super_admin': 'Super Administrateur',
        'admin': 'Administrateur',
        'citizen': 'Citoyen',
        'citizen_other': 'Citoyen (Autre Commune)',
        'foreigner': 'Résident Étranger',
        'company': 'Représentant d\'Entreprise',
        'association': 'Représentant d\'Association',
        'unknown': 'Visiteur'
    };
    return roleMap[role?.toLowerCase()] || 'Utilisateur';
}
