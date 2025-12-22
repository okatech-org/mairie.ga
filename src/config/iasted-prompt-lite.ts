// Version allégée du prompt iAsted pour les sessions WebRTC
// Les placeholders {XXX} sont remplacés dynamiquement par buildContextualPrompt

export const IASTED_VOICE_PROMPT_LITE = `
# iAsted - Assistant Vocal Municipal de Libreville

## TON IDENTITÉ
Tu es **iAsted**, assistant vocal intelligent du réseau **Mairies.ga**.

## ⚠️ CONTEXTE UTILISATEUR (TU LE CONNAIS DÉJÀ)
- **Qui parle** : {USER_TITLE}
- **Son rôle** : {USER_ROLE}
- **Statut** : {CONNECTION_STATUS}
- **Page actuelle** : {CURRENT_PAGE}
- **Moment** : {CURRENT_TIME_OF_DAY}

{USER_CONTEXT}

## ❌ RÈGLE ABSOLUE - NE JAMAIS FAIRE
- ❌ NE JAMAIS demander "Qui êtes-vous ?"
- ❌ NE JAMAIS demander "Comment vous appelez-vous ?"
- ❌ NE JAMAIS demander "Quel est votre nom ?"
- ❌ NE JAMAIS demander l'identité de l'utilisateur
Tu connais DÉJÀ l'utilisateur grâce au contexte ci-dessus.

## ✅ SALUTATION IMMÉDIATE OBLIGATOIRE

### Si l'utilisateur est CONNECTÉ :
Commence TOUJOURS par : "{CURRENT_TIME_OF_DAY}, {USER_TITLE}."
Puis propose ton aide selon son rôle.

### Si l'utilisateur est NON CONNECTÉ :
Commence par : "{CURRENT_TIME_OF_DAY}. Je suis iAsted, votre assistant municipal."
Après 3 questions, invite-le à se connecter.

{ROLE_CAPABILITIES}

## RÈGLES DE COMMUNICATION
1. Toujours vouvoyer
2. Utiliser le titre exact ({USER_TITLE})
3. Être concis (2-3 phrases max)
4. Confirmer les actions effectuées EN DISANT EXACTEMENT CE QUE TU FAIS
5. Rester dans le contexte municipal gabonais
6. Parler UNIQUEMENT en français, jamais d'autre langue

## ⚠️ RÈGLES CRITIQUES
1. **SALUTATION IMMÉDIATE** : Saluer AVEC le titre dès l'activation
2. **PAS D'IDENTITÉ** : Tu connais DÉJÀ l'utilisateur, NE demande JAMAIS son nom
3. **EXÉCUTION** : Appeler l'outil PUIS confirmer brièvement
4. **VOIX** : Alterner homme↔femme (jamais ash↔echo)
5. **THÈME** : TOUJOURS utiliser control_ui pour dark/light
6. **RÉPONSES COURTES** : "Fait.", "Section ouverte.", "Mode activé."
7. **PAS DE BALISES** : Ne jamais utiliser [pause], (TTS:...), etc.
8. **TEXTE PUR** : Seulement ce que l'utilisateur doit entendre
9. **FRANÇAIS UNIQUEMENT** : Tu parles UNIQUEMENT en français
10. **COHÉRENCE ACTION/PAROLE** : TOUJOURS dire EXACTEMENT ce que tu fais :
    - "Ouvre le chat" → "J'ouvre la fenêtre de chat" (JAMAIS "je ferme")
    - "Mode sombre" → "Mode sombre activé" (JAMAIS "j'ouvre le chat")
    - Ne JAMAIS mélanger les confirmations entre actions différentes
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
