/**
 * Correspondance Service
 * Manages official correspondence for municipal staff (Maire, Adjoint, SG)
 */

import { supabase } from "@/integrations/supabase/client";
import { documentGenerationService, DOCUMENT_TEMPLATES } from "./documentGenerationService";

// Types
export interface CorrespondanceFolder {
    id: string;
    name: string;
    sender: {
        name: string;
        organization: string;
        email?: string;
    };
    date: string;
    comment: string;
    documents: CorrespondanceDocument[];
    isUrgent?: boolean;
    isRead: boolean;
}

export interface CorrespondanceDocument {
    id: string;
    name: string;
    type: 'pdf' | 'doc' | 'image' | 'other';
    size: string;
    date: string;
    content?: string;
    filePath?: string;
}

export interface CreateCorrespondanceParams {
    recipient: string;
    recipientOrg: string;
    recipientEmail?: string;
    subject: string;
    contentPoints: string[];
    template?: keyof typeof DOCUMENT_TEMPLATES;
    signatureAuthority?: string;
}

export interface SendCorrespondanceParams {
    folderId?: string;
    documentId?: string;
    recipientEmail: string;
    subject?: string;
    body?: string;
    attachmentPath?: string;
}

// Authorized roles for CORRESPONDANCE features (inter-administration mail)
// Only municipal staff can use this - NOT citizens/foreigners/visitors
export const CORRESPONDANCE_AUTHORIZED_ROLES = [
    'MAIRE',
    'maire',
    'MAIRE_ADJOINT',
    'maire_adjoint',
    'SECRETAIRE_GENERAL',
    'secretaire_general',
    'CHEF_SERVICE',
    'chef_service',
    'AGENT',
    'agent',
    'SUPER_ADMIN',
    'super_admin',
    'admin',
];

class CorrespondanceService {

    /**
     * Check if user has access to correspondance features
     */
    hasAccess(userRole: string): boolean {
        return CORRESPONDANCE_AUTHORIZED_ROLES.includes(userRole);
    }

    /**
     * Read a correspondence folder - returns content for voice reading
     */
    async readCorrespondance(folderId: string): Promise<{
        folderName: string;
        sender: string;
        organization: string;
        date: string;
        comment: string;
        documentCount: number;
        documentNames: string[];
        summary: string;
    }> {
        // In production, fetch from Supabase
        // For now, use mock data simulation
        const mockFolders = await this.getMockFolders();
        const folder = mockFolders.find(f => f.id === folderId);

        if (!folder) {
            throw new Error(`Dossier de correspondance non trouvé: ${folderId}`);
        }

        // Mark as read
        await this.markAsRead(folderId);

        // Generate summary for voice reading
        const summary = `
            Dossier: ${folder.name}.
            Envoyé par ${folder.sender.name} de ${folder.sender.organization}, le ${new Date(folder.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.
            ${folder.isUrgent ? 'Ce dossier est marqué comme urgent.' : ''}
            Commentaire: ${folder.comment}
            Ce dossier contient ${folder.documents.length} document${folder.documents.length > 1 ? 's' : ''}: ${folder.documents.map(d => d.name).join(', ')}.
        `.trim().replace(/\s+/g, ' ');

        return {
            folderName: folder.name,
            sender: folder.sender.name,
            organization: folder.sender.organization,
            date: folder.date,
            comment: folder.comment,
            documentCount: folder.documents.length,
            documentNames: folder.documents.map(d => d.name),
            summary
        };
    }

    /**
     * File a correspondence to user's Documents folder
     */
    async fileToDocuments(folderId: string): Promise<{
        success: boolean;
        destinationPath: string;
        documentIds: string[];
    }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Utilisateur non authentifié");

        const mockFolders = await this.getMockFolders();
        const folder = mockFolders.find(f => f.id === folderId);

        if (!folder) {
            throw new Error(`Dossier non trouvé: ${folderId}`);
        }

        const documentIds: string[] = [];
        const destinationPath = `correspondance/${folder.name.replace(/[^a-zA-Z0-9]/g, '_')}`;

        // In production: copy files to user's documents storage
        // For now, create entries in documents table
        for (const doc of folder.documents) {
            const { data, error } = await supabase
                .from('documents')
                .insert({
                    user_id: user.id,
                    name: doc.name,
                    file_path: `${destinationPath}/${doc.name}`,
                    file_type: doc.type === 'pdf' ? 'application/pdf' : 'application/octet-stream',
                    file_size: parseInt(doc.size) || 0,
                    category: 'correspondance',
                })
                .select('id')
                .single();

            if (data) {
                documentIds.push(data.id);
            }
        }

        return {
            success: true,
            destinationPath,
            documentIds
        };
    }

    /**
     * Create a new official correspondence as PDF
     */
    async createCorrespondance(params: CreateCorrespondanceParams): Promise<{
        blob: Blob;
        fileName: string;
        documentId: string;
        localUrl: string;
    }> {
        const { recipient, recipientOrg, subject, contentPoints, template = 'courrier', signatureAuthority } = params;

        // Map template names to document types
        const templateToType: Record<string, 'lettre' | 'communique' | 'note_service' | 'attestation'> = {
            'courrier': 'lettre',
            'lettre': 'lettre',
            'note': 'note_service',
            'note_service': 'note_service',
            'communique': 'communique',
            'attestation': 'attestation'
        };

        // Generate PDF using documentGenerationService
        const result = await documentGenerationService.generateDocument({
            title: subject,
            content: '', // Not used anymore, we use contentPoints
            template: (templateToType[template] || 'lettre') as any,
            format: 'pdf',
            recipient: recipient,
            recipientOrg: recipientOrg,
            contentPoints: contentPoints,
            signatureAuthority: signatureAuthority,
            onProgress: (progress, status) => {
                console.log(`[Correspondance] ${progress}% - ${status}`);
            }
        });

        // Create local URL for immediate download
        const localUrl = URL.createObjectURL(result.blob);

        return {
            blob: result.blob,
            fileName: result.fileName,
            documentId: result.documentId,
            localUrl
        };
    }

    /**
     * Send correspondence via email
     */
    async sendCorrespondance(params: SendCorrespondanceParams): Promise<{
        success: boolean;
        messageId?: string;
        sentAt: string;
    }> {
        const { recipientEmail, subject, body, attachmentPath } = params;

        // Call Edge Function to send email
        const { data, error } = await supabase.functions.invoke('send-official-correspondence', {
            body: {
                to: recipientEmail,
                subject: subject || 'Correspondance Officielle',
                body: body || 'Veuillez trouver ci-joint notre correspondance officielle.',
                attachmentPath: attachmentPath
            }
        });

        if (error) {
            console.error('Error sending correspondence:', error);
            throw new Error(`Erreur lors de l'envoi: ${error.message}`);
        }

        // Log the sent correspondence (TODO: create correspondence_logs table)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            console.log('[Correspondance] Email sent:', {
                user_id: user.id,
                recipient_email: recipientEmail,
                subject: subject,
                sent_at: new Date().toISOString(),
            });
        }

        return {
            success: true,
            messageId: data?.messageId,
            sentAt: new Date().toISOString()
        };
    }

    /**
     * Mark a folder as read
     */
    async markAsRead(folderId: string): Promise<void> {
        // In production: update Supabase
        console.log(`[Correspondance] Marked folder ${folderId} as read`);
    }

    /**
     * Get all correspondence folders (mock for now)
     */
    async getMockFolders(): Promise<CorrespondanceFolder[]> {
        return [
            {
                id: 'folder-1',
                name: 'Permis de construire - Zone Industrielle',
                sender: { name: 'M. Ndong', organization: 'Mairie de Port-Gentil', email: 'urbanisme@port-gentil.ga' },
                date: '2024-12-07',
                comment: 'Suite à notre entretien téléphonique, veuillez trouver ci-joint le dossier complet pour le permis de construire du lot 234.',
                isUrgent: true,
                isRead: false,
                documents: [
                    { id: 'd1', name: 'Demande_Permis.pdf', type: 'pdf', size: '2.4 MB', date: '2024-12-07' },
                    { id: 'd2', name: 'Plan_Masse.pdf', type: 'pdf', size: '5.1 MB', date: '2024-12-07' },
                ],
            },
            {
                id: 'folder-2',
                name: 'Délibération n°2024-456 - Budget Annexe',
                sender: { name: 'Secrétariat Général', organization: 'Préfecture de l\'Estuaire', email: 'sg@prefecture-estuaire.ga' },
                date: '2024-12-06',
                comment: 'Pour validation et signature avant le conseil municipal du 15 décembre.',
                isRead: false,
                documents: [
                    { id: 'd5', name: 'Deliberation_2024-456.pdf', type: 'pdf', size: '1.8 MB', date: '2024-12-06' },
                ],
            },
            {
                id: 'folder-3',
                name: 'Rapport Trimestriel État Civil Q4',
                sender: { name: 'Chef de Service', organization: 'État Civil - Libreville', email: 'etatcivil@libreville.ga' },
                date: '2024-12-05',
                comment: 'Rapport trimestriel des activités du service état civil pour le quatrième trimestre 2024.',
                isRead: true,
                documents: [
                    { id: 'd8', name: 'Rapport_Q4_2024.pdf', type: 'pdf', size: '4.5 MB', date: '2024-12-05' },
                ],
            },
        ];
    }

    /**
     * Get unread count
     */
    async getUnreadCount(): Promise<number> {
        const folders = await this.getMockFolders();
        return folders.filter(f => !f.isRead).length;
    }
}

export const correspondanceService = new CorrespondanceService();
