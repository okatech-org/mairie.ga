/**
 * Service iBoîte - Messagerie Interne
 * 
 * Gère les conversations internes (sans email) et externes (avec email).
 * Les utilisateurs dans l'écosystème communiquent par nom/service.
 * Les emails sont réservés aux communications externes.
 * 
 * NOTE: Ce service utilise des tables iBoîte qui peuvent ne pas être encore
 * reflétées dans les types TypeScript générés. On utilise 'as any' temporairement.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
    UserEnvironment,
    IBoiteConversation,
    IBoiteMessage,
    IBoiteParticipant,
    IBoiteContact,
    IBoiteUserSearchResult,
    IBoiteServiceSearchResult,
    IBoiteExternalCorrespondence,
    ConversationType,
    IBoiteAttachment,
    GlobalRecipient,
    OrganizationRecipient,
    ServiceRecipient,
    ServiceMember,
    ContactDirectoryEntry
} from '@/types/environments';

// Re-export IBoiteService type from environments
export type { IBoiteService as IBoiteServiceType } from '@/types/environments';

// ============================================================
// TYPES INTERNES
// ============================================================

interface CreateConversationParams {
    type: ConversationType;
    subject?: string;
    participantIds: string[];
    serviceId?: string;
    organizationId?: string;
    initialMessage?: string;
}

interface SendMessageParams {
    conversationId: string;
    content: string;
    contentType?: 'TEXT' | 'HTML' | 'MARKDOWN';
    attachments?: IBoiteAttachment[];
    replyToId?: string;
    mentions?: string[];
    isOfficial?: boolean;
    officialReference?: string;
}

interface SearchParams {
    query: string;
    organizationId?: string;
    limit?: number;
}

// ============================================================
// SERVICE
// ============================================================

class IBoiteServiceClass {
    private static instance: IBoiteServiceClass;

    private constructor() {
        console.log('📬 [iBoîte] Service initialisé');
    }

    public static getInstance(): IBoiteServiceClass {
        if (!IBoiteServiceClass.instance) {
            IBoiteServiceClass.instance = new IBoiteServiceClass();
        }
        return IBoiteServiceClass.instance;
    }

    // ========================================================
    // RECHERCHE D'UTILISATEURS (INTERNE)
    // ========================================================

    async searchUsers(params: SearchParams): Promise<IBoiteUserSearchResult[]> {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) {
                console.warn('[iBoîte] No authenticated user');
                return [];
            }

            const { data, error } = await (supabase.rpc as any)('search_iboite_users', {
                search_query: params.query,
                searcher_id: session.session.user.id,
                limit_count: params.limit || 20
            });

            if (error) {
                console.error('[iBoîte] Search users error:', error);
                return [];
            }

            return (data || []).map((row: any) => ({
                userId: row.user_id,
                displayName: row.display_name,
                roleLabel: row.role_label,
                organizationName: row.organization_name,
                environment: row.environment as UserEnvironment,
                avatarUrl: row.avatar_url
            }));
        } catch (error) {
            console.error('[iBoîte] Search users error:', error);
            return [];
        }
    }

    async searchServices(params: SearchParams): Promise<IBoiteServiceSearchResult[]> {
        try {
            const { data, error } = await (supabase.rpc as any)('search_iboite_services', {
                search_query: params.query,
                organization_filter: params.organizationId || null,
                limit_count: params.limit || 20
            });

            if (error) {
                console.error('[iBoîte] Search services error:', error);
                return [];
            }

            return (data || []).map((row: any) => ({
                serviceId: row.service_id,
                serviceCode: row.service_code,
                serviceName: row.service_name,
                organizationId: row.organization_id,
                organizationName: row.organization_name,
                responsibleName: row.responsible_name
            }));
        } catch (error) {
            console.error('[iBoîte] Search services error:', error);
            return [];
        }
    }

    // ========================================================
    // RECHERCHE GLOBALE DE DESTINATAIRES
    // ========================================================

    /**
     * Recherche globale parmi utilisateurs, organisations et services
     */
    async searchGlobalRecipients(params: {
        query?: string;
        includeOrganizations?: boolean;
        includeServices?: boolean;
        includeUsers?: boolean;
        limit?: number;
    }): Promise<GlobalRecipient[]> {
        try {
            const { data: session } = await supabase.auth.getSession();
            const searcherId = session?.session?.user?.id || null;

            const { data, error } = await (supabase.rpc as any)('search_global_recipients', {
                search_query: params.query || '',
                searcher_id: searcherId,
                include_organizations: params.includeOrganizations ?? true,
                include_services: params.includeServices ?? true,
                include_users: params.includeUsers ?? true,
                limit_count: params.limit || 30
            });

            if (error) {
                console.error('[iBoîte] Search global recipients error:', error);
                return [];
            }

            return (data || []).map((row: any) => ({
                recipientType: row.recipient_type as GlobalRecipient['recipientType'],
                recipientId: row.recipient_id,
                displayName: row.display_name,
                subtitle: row.subtitle,
                email: row.email,
                avatarUrl: row.avatar_url,
                organizationId: row.organization_id,
                organizationName: row.organization_name
            }));
        } catch (error) {
            console.error('[iBoîte] Search global recipients error:', error);
            return [];
        }
    }

    /**
     * Récupère toutes les organisations disponibles
     */
    async getAllOrganizations(limit?: number): Promise<OrganizationRecipient[]> {
        try {
            const { data, error } = await (supabase.rpc as any)('get_all_organizations', {
                limit_count: limit || 100
            });

            if (error) {
                console.error('[iBoîte] Get all organizations error:', error);
                return [];
            }

            return (data || []).map((row: any) => ({
                id: row.id,
                name: row.name,
                city: row.city,
                departement: row.departement,
                contactEmail: row.contact_email,
                logoUrl: row.logo_url,
                type: row.type,
                maireName: row.maire_name
            }));
        } catch (error) {
            console.error('[iBoîte] Get all organizations error:', error);
            return [];
        }
    }

    /**
     * Récupère tous les services (optionnellement filtrés par organisation)
     */
    async getOrganizationServices(organizationId?: string, limit?: number): Promise<ServiceRecipient[]> {
        try {
            const { data, error } = await (supabase.rpc as any)('get_organization_services', {
                org_id: organizationId || null,
                limit_count: limit || 100
            });

            if (error) {
                console.error('[iBoîte] Get organization services error:', error);
                return [];
            }

            return (data || []).map((row: any) => ({
                id: row.id,
                name: row.name,
                description: row.description,
                category: row.category,
                organizationId: row.organization_id,
                organizationName: row.organization_name
            }));
        } catch (error) {
            console.error('[iBoîte] Get organization services error:', error);
            return [];
        }
    }

    // ========================================================
    // CARNET D'ADRESSES
    // ========================================================

    async getContacts(category?: string): Promise<IBoiteContact[]> {
        try {
            let query = (supabase.from as any)('iboite_contacts')
                .select('*')
                .order('is_favorite', { ascending: false })
                .order('last_contact_at', { ascending: false, nullsFirst: false });

            if (category && category !== 'ALL') {
                query = query.eq('category', category);
            }

            const { data, error } = await query;

            if (error) {
                console.error('[iBoîte] Get contacts error:', error);
                return [];
            }

            return this.mapContacts(data || []);
        } catch (error) {
            console.error('[iBoîte] Get contacts error:', error);
            return [];
        }
    }

    async addContact(contact: Partial<IBoiteContact>): Promise<IBoiteContact | null> {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) return null;

            const { data, error } = await (supabase.from as any)('iboite_contacts')
                .insert({
                    owner_id: session.session.user.id,
                    contact_user_id: contact.contactUserId,
                    contact_service_id: contact.contactServiceId,
                    display_name: contact.displayName,
                    display_role: contact.displayRole,
                    display_organization: contact.displayOrganization,
                    avatar_url: contact.avatarUrl,
                    category: contact.category || 'GENERAL',
                    is_favorite: contact.isFavorite || false
                })
                .select()
                .single();

            if (error) {
                console.error('[iBoîte] Add contact error:', error);
                return null;
            }

            return this.mapContact(data);
        } catch (error) {
            console.error('[iBoîte] Add contact error:', error);
            return null;
        }
    }

    async updateContact(contactId: string, updates: Partial<IBoiteContact>): Promise<boolean> {
        try {
            const { error } = await (supabase.from as any)('iboite_contacts')
                .update({
                    is_favorite: updates.isFavorite,
                    category: updates.category,
                    notes: updates.notes
                })
                .eq('id', contactId);

            return !error;
        } catch (error) {
            console.error('[iBoîte] Update contact error:', error);
            return false;
        }
    }

    // ========================================================
    // CONVERSATIONS
    // ========================================================

    async getConversations(options?: {
        archived?: boolean;
        type?: ConversationType;
        limit?: number;
    }): Promise<IBoiteConversation[]> {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) return [];

            let query = (supabase.from as any)('iboite_conversations')
                .select(`
                    *,
                    participants:iboite_conversation_participants!inner(
                        *,
                        user:profiles(first_name, last_name)
                    )
                `)
                .eq('iboite_conversation_participants.user_id', session.session.user.id)
                .eq('iboite_conversation_participants.is_active', true)
                .order('last_message_at', { ascending: false, nullsFirst: false });

            if (options?.archived !== undefined) {
                query = query.eq('is_archived', options.archived);
            }

            if (options?.type) {
                query = query.eq('conversation_type', options.type);
            }

            if (options?.limit) {
                query = query.limit(options.limit);
            }

            const { data, error } = await query;

            if (error) {
                console.error('[iBoîte] Get conversations error:', error);
                return [];
            }

            return this.mapConversations(data || [], session.session.user.id);
        } catch (error) {
            console.error('[iBoîte] Get conversations error:', error);
            return [];
        }
    }

    async createConversation(params: CreateConversationParams): Promise<IBoiteConversation | null> {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) return null;

            if (params.type === 'PRIVATE' && params.participantIds.length === 1) {
                const existing = await this.findPrivateConversation(params.participantIds[0]);
                if (existing) {
                    return existing;
                }
            }

            const { data: conversation, error: convError } = await (supabase.from as any)('iboite_conversations')
                .insert({
                    conversation_type: params.type,
                    subject: params.subject,
                    service_id: params.serviceId,
                    organization_id: params.organizationId,
                    is_external: false
                })
                .select()
                .single();

            if (convError || !conversation) {
                console.error('[iBoîte] Create conversation error:', convError);
                return null;
            }

            const allParticipants = [...new Set([session.session.user.id, ...params.participantIds])];
            const participantInserts = allParticipants.map((userId) => ({
                conversation_id: conversation.id,
                user_id: userId,
                participant_role: userId === session.session.user.id ? 'OWNER' : 'MEMBER'
            }));

            const { error: partError } = await (supabase.from as any)('iboite_conversation_participants')
                .insert(participantInserts);

            if (partError) {
                console.error('[iBoîte] Add participants error:', partError);
                await (supabase.from as any)('iboite_conversations').delete().eq('id', conversation.id);
                return null;
            }

            if (params.initialMessage) {
                await this.sendMessage({
                    conversationId: conversation.id,
                    content: params.initialMessage
                });
            }

            return this.mapConversation(conversation, []);
        } catch (error) {
            console.error('[iBoîte] Create conversation error:', error);
            return null;
        }
    }

    private async findPrivateConversation(otherUserId: string): Promise<IBoiteConversation | null> {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) return null;

            const { data } = await (supabase.from as any)('iboite_conversations')
                .select(`
                    *,
                    participants:iboite_conversation_participants!inner(user_id)
                `)
                .eq('conversation_type', 'PRIVATE')
                .contains('participants', [
                    { user_id: session.session.user.id },
                    { user_id: otherUserId }
                ]);

            const found = (data || []).find((conv: any) =>
                conv.participants?.length === 2
            );

            return found ? this.mapConversation(found, []) : null;
        } catch (error) {
            return null;
        }
    }

    // ========================================================
    // MESSAGES
    // ========================================================

    async getMessages(conversationId: string, options?: {
        limit?: number;
        before?: string;
    }): Promise<IBoiteMessage[]> {
        try {
            let query = (supabase.from as any)('iboite_messages')
                .select(`
                    *,
                    sender:profiles!iboite_messages_sender_id_fkey(
                        first_name, last_name
                    )
                `)
                .eq('conversation_id', conversationId)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false });

            if (options?.limit) {
                query = query.limit(options.limit);
            }

            if (options?.before) {
                query = query.lt('created_at', options.before);
            }

            const { data, error } = await query;

            if (error) {
                console.error('[iBoîte] Get messages error:', error);
                return [];
            }

            await this.markConversationAsRead(conversationId);

            return this.mapMessages(data || []);
        } catch (error) {
            console.error('[iBoîte] Get messages error:', error);
            return [];
        }
    }

    async sendMessage(params: SendMessageParams): Promise<IBoiteMessage | null> {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) return null;

            const { data, error } = await (supabase.from as any)('iboite_messages')
                .insert({
                    conversation_id: params.conversationId,
                    sender_id: session.session.user.id,
                    content: params.content,
                    content_type: params.contentType || 'TEXT',
                    attachments: params.attachments || [],
                    reply_to_id: params.replyToId,
                    mentions: params.mentions || [],
                    is_official: params.isOfficial || false,
                    official_reference: params.officialReference
                })
                .select(`
                    *,
                    sender:profiles!iboite_messages_sender_id_fkey(
                        first_name, last_name
                    )
                `)
                .single();

            if (error) {
                console.error('[iBoîte] Send message error:', error);
                return null;
            }

            return this.mapMessage(data);
        } catch (error) {
            console.error('[iBoîte] Send message error:', error);
            return null;
        }
    }

    async markConversationAsRead(conversationId: string): Promise<void> {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) return;

            await (supabase.from as any)('iboite_conversation_participants')
                .update({
                    last_read_at: new Date().toISOString(),
                    unread_count: 0
                })
                .eq('conversation_id', conversationId)
                .eq('user_id', session.session.user.id);
        } catch (error) {
            console.error('[iBoîte] Mark as read error:', error);
        }
    }

    // ========================================================
    // CORRESPONDANCE EXTERNE
    // ========================================================

    async createExternalCorrespondence(params: {
        externalEmail: string;
        externalName?: string;
        externalOrganization?: string;
        subject: string;
        content: string;
        attachments?: IBoiteAttachment[];
        organizationId?: string;
    }): Promise<IBoiteExternalCorrespondence | null> {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) return null;

            const { data, error } = await (supabase.from as any)('iboite_external_correspondence')
                .insert({
                    sender_id: session.session.user.id,
                    organization_id: params.organizationId,
                    direction: 'OUTBOUND',
                    external_email: params.externalEmail,
                    external_name: params.externalName,
                    external_organization: params.externalOrganization,
                    subject: params.subject,
                    content: params.content,
                    attachments: params.attachments || [],
                    status: 'DRAFT'
                })
                .select()
                .single();

            if (error) {
                console.error('[iBoîte] Create external correspondence error:', error);
                return null;
            }

            return this.mapExternalCorrespondence(data);
        } catch (error) {
            console.error('[iBoîte] Create external correspondence error:', error);
            return null;
        }
    }

    /**
     * Send external correspondence via edge function (actual email sending)
     */
    async sendExternalCorrespondence(params: {
        recipientEmail: string;
        recipientName?: string;
        recipientOrganization?: string;
        subject: string;
        body: string;
        attachments?: IBoiteAttachment[];
        organizationId?: string;
        asDraft?: boolean;
    }): Promise<IBoiteExternalCorrespondence | null> {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) return null;

            // 1. Create correspondence record with PENDING status (or DRAFT)
            const initialStatus = params.asDraft ? 'DRAFT' : 'PENDING';

            const { data, error } = await (supabase.from as any)('iboite_external_correspondence')
                .insert({
                    sender_id: session.session.user.id,
                    organization_id: params.organizationId,
                    direction: 'OUTBOUND',
                    external_email: params.recipientEmail,
                    external_name: params.recipientName,
                    external_organization: params.recipientOrganization,
                    subject: params.subject,
                    content: params.body,
                    attachments: params.attachments || [],
                    status: initialStatus
                })
                .select()
                .single();

            if (error) {
                console.error('[iBoîte] Create external correspondence error:', error);
                return null;
            }

            // 2. If not draft, invoke Edge Function to send email
            if (!params.asDraft && data) {
                console.log('[iBoîte] Invoking send-iboite-email for:', data.id);
                const { error: fnError } = await supabase.functions.invoke('send-iboite-email', {
                    body: { correspondenceId: data.id }
                });

                if (fnError) {
                    console.error('[iBoîte] Failed to invoke send-iboite-email:', fnError);
                    // We don't throw here, as the record is created. 
                    // The status will remain PENDING and can be retried later.
                }
            }

            return this.mapExternalCorrespondence(data);
        } catch (error) {
            console.error('[iBoîte] Send external correspondence error:', error);
            return null;
        }
    }


    /**
     * Get sent messages (external correspondence with status SENT)
     */
    async getSentMessages(limit?: number): Promise<IBoiteExternalCorrespondence[]> {
        return this.getExternalCorrespondence({
            direction: 'OUTBOUND',
            status: 'SENT',
            limit
        });
    }

    /**
     * Get draft messages
     */
    async getDrafts(limit?: number): Promise<IBoiteExternalCorrespondence[]> {
        return this.getExternalCorrespondence({
            status: 'DRAFT',
            limit
        });
    }

    /**
     * Get official correspondence (both sent and received)
     */
    async getOfficialCorrespondence(options?: {
        direction?: 'INBOUND' | 'OUTBOUND';
        limit?: number;
    }): Promise<IBoiteExternalCorrespondence[]> {
        try {
            let query = (supabase.from as any)('iboite_external_correspondence')
                .select('*')
                .in('status', ['SENT', 'DELIVERED'])
                .order('created_at', { ascending: false });

            if (options?.direction) {
                query = query.eq('direction', options.direction);
            }

            if (options?.limit) {
                query = query.limit(options.limit);
            }

            const { data, error } = await query;

            if (error) {
                console.error('[iBoîte] Get official correspondence error:', error);
                return [];
            }

            return (data || []).map((item: any) => this.mapExternalCorrespondence(item));
        } catch (error) {
            console.error('[iBoîte] Get official correspondence error:', error);
            return [];
        }
    }

    /**
     * Delete a draft
     */
    async deleteDraft(id: string): Promise<boolean> {
        try {
            const { error } = await (supabase.from as any)('iboite_external_correspondence')
                .delete()
                .eq('id', id)
                .eq('status', 'DRAFT');

            return !error;
        } catch (error) {
            console.error('[iBoîte] Delete draft error:', error);
            return false;
        }
    }

    /**
     * Update and send a draft
     */
    async sendDraft(id: string, updates?: {
        subject?: string;
        body?: string;
        recipientEmail?: string;
        recipientName?: string;
    }): Promise<IBoiteExternalCorrespondence | null> {
        try {
            // Get the draft first
            const { data: draft, error: fetchError } = await (supabase.from as any)('iboite_external_correspondence')
                .select('*')
                .eq('id', id)
                .eq('status', 'DRAFT')
                .single();

            if (fetchError || !draft) {
                console.error('[iBoîte] Draft not found:', fetchError);
                return null;
            }

            // Send it
            const result = await this.sendExternalCorrespondence({
                recipientEmail: updates?.recipientEmail || draft.external_email,
                recipientName: updates?.recipientName || draft.external_name,
                recipientOrganization: draft.external_organization,
                subject: updates?.subject || draft.subject,
                body: updates?.body || draft.content,
                organizationId: draft.organization_id
            });

            // Delete original draft if sent successfully
            if (result && result.status === 'SENT') {
                await (supabase.from as any)('iboite_external_correspondence')
                    .delete()
                    .eq('id', id);
            }

            return result;
        } catch (error) {
            console.error('[iBoîte] Send draft error:', error);
            return null;
        }
    }

    async getExternalCorrespondence(options?: {
        direction?: 'INBOUND' | 'OUTBOUND';
        status?: string;
        limit?: number;
    }): Promise<IBoiteExternalCorrespondence[]> {
        try {
            let query = (supabase.from as any)('iboite_external_correspondence')
                .select('*')
                .order('created_at', { ascending: false });

            if (options?.direction) {
                query = query.eq('direction', options.direction);
            }

            if (options?.status) {
                query = query.eq('status', options.status);
            }

            if (options?.limit) {
                query = query.limit(options.limit);
            }

            const { data, error } = await query;

            if (error) {
                console.error('[iBoîte] Get external correspondence error:', error);
                return [];
            }

            return (data || []).map((item: any) => this.mapExternalCorrespondence(item));
        } catch (error) {
            console.error('[iBoîte] Get external correspondence error:', error);
            return [];
        }
    }

    // ========================================================
    // STATISTIQUES
    // ========================================================

    async getUnreadCount(): Promise<number> {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) return 0;

            const { data, error } = await (supabase.from as any)('iboite_conversation_participants')
                .select('unread_count')
                .eq('user_id', session.session.user.id)
                .eq('is_active', true);

            if (error) {
                console.error('[iBoîte] Get unread count error:', error);
                return 0;
            }

            return (data || []).reduce((total: number, row: any) => total + (row.unread_count || 0), 0);
        } catch (error) {
            console.error('[iBoîte] Get unread count error:', error);
            return 0;
        }
    }

    // ========================================================
    // MAPPERS
    // ========================================================

    private mapContact(data: any): IBoiteContact {
        return {
            id: data.id,
            ownerId: data.owner_id,
            contactUserId: data.contact_user_id,
            contactServiceId: data.contact_service_id,
            displayName: data.display_name,
            displayRole: data.display_role,
            displayOrganization: data.display_organization,
            avatarUrl: data.avatar_url,
            category: data.category || 'GENERAL',
            isFavorite: data.is_favorite || false,
            notes: data.notes,
            lastContactAt: data.last_contact_at,
            contactCount: 0,
            createdAt: data.created_at,
            updatedAt: data.updated_at || data.created_at
        };
    }

    private mapContacts(data: any[]): IBoiteContact[] {
        return data.map(item => this.mapContact(item));
    }

    private mapConversation(data: any, participants: any[]): IBoiteConversation {
        // Calculer le displayName à partir des participants
        const otherParticipants = (participants || data.participants || []).filter(
            (p: any) => p.user
        );
        const firstOther = otherParticipants[0]?.user;
        const displayName = data.subject ||
            (firstOther ? `${firstOther.first_name || ''} ${firstOther.last_name || ''}`.trim() : 'Conversation');

        return {
            id: data.id,
            conversationType: data.conversation_type as ConversationType,
            subject: data.subject,
            participants: (participants || data.participants || []).map((p: any) => this.mapParticipant(p)),
            serviceId: data.service_id,
            organizationId: data.organization_id,
            isExternal: data.is_external || false,
            isArchived: data.is_archived || false,
            isResolved: data.is_locked || false,
            lastMessageAt: data.last_message_at,
            lastMessagePreview: data.last_message_preview,
            lastMessageSenderId: undefined,
            unreadCount: 0,
            createdAt: data.created_at,
            updatedAt: data.updated_at || data.created_at,
            displayName,
            avatarUrl: firstOther?.avatar_url
        };
    }

    private mapConversations(data: any[], currentUserId: string): IBoiteConversation[] {
        return data.map(item => {
            const myParticipation = (item.participants || []).find(
                (p: any) => p.user_id === currentUserId
            );
            const conv = this.mapConversation(item, item.participants || []);
            conv.unreadCount = myParticipation?.unread_count || 0;
            return conv;
        });
    }

    private mapParticipant(data: any): IBoiteParticipant {
        const user = data.user || {};
        return {
            id: data.id || '',
            conversationId: data.conversation_id || '',
            userId: data.user_id,
            participantRole: data.participant_role || 'MEMBER',
            isActive: data.is_active ?? true,
            isMuted: data.is_muted || false,
            isPinned: false,
            lastReadAt: data.last_read_at,
            unreadCount: data.unread_count || 0,
            joinedAt: data.joined_at || data.created_at,
            user: {
                displayName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Utilisateur',
                avatarUrl: user.avatar_url
            }
        };
    }

    private mapMessage(data: any): IBoiteMessage {
        const sender = data.sender || {};
        const senderName = `${sender.first_name || ''} ${sender.last_name || ''}`.trim() || 'Utilisateur';
        return {
            id: data.id,
            conversationId: data.conversation_id,
            senderId: data.sender_id,
            content: data.content,
            contentType: data.content_type || 'TEXT',
            attachments: data.attachments || [],
            replyToId: data.reply_to_id,
            mentions: data.mentions || [],
            isOfficial: data.is_official || false,
            officialReference: data.official_reference,
            isEdited: data.is_edited || false,
            isDeleted: data.is_deleted || false,
            editedAt: data.edited_at,
            createdAt: data.created_at,
            sender: {
                displayName: senderName,
                avatarUrl: sender.avatar_url
            },
            senderName
        };
    }

    private mapMessages(data: any[]): IBoiteMessage[] {
        return data.map(item => this.mapMessage(item));
    }

    // ========================================================
    // ANNUAIRE DES CONTACTS
    // ========================================================

    /**
     * Récupère l'annuaire des contacts selon le rôle de l'utilisateur
     * - Personnel/Services/Mairies: tous les contacts internes
     * - Visiteurs: seulement les contacts publics + services de leurs dossiers
     */
    async getContactsDirectory(options?: {
        includeServices?: boolean;
        limit?: number;
    }): Promise<ContactDirectoryEntry[]> {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) return [];

            const userId = session.session.user.id;
            const limit = options?.limit ?? 100;

            // Essayer d'abord la fonction SQL optimisée
            try {
                const { data, error } = await (supabase.rpc as any)('get_contacts_for_user', {
                    p_user_id: userId,
                    p_include_services: options?.includeServices ?? true,
                    p_limit: limit
                });

                if (!error && data && data.length > 0) {
                    return (data || []).map((row: any): ContactDirectoryEntry => ({
                        userId: row.user_id,
                        profileId: row.user_id,
                        displayName: row.display_name || 'Utilisateur',
                        firstName: '',
                        lastName: '',
                        phone: row.phone,
                        position: row.position,
                        servicePhone: row.service_phone,
                        isPublicContact: row.is_public_contact || false,
                        environment: row.environment,
                        role: row.role,
                        organizationId: row.organization_id,
                        organizationName: row.organization_name,
                        services: row.services || []
                    }));
                }
            } catch (rpcError) {
                console.warn('[iBoîte] RPC get_contacts_for_user not available, using fallback');
            }

            // FALLBACK: Charger directement depuis profiles + organizations
            console.log('[iBoîte] Using direct profile query fallback');

            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select(`
                    id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    role,
                    environment,
                    organization_id,
                    organizations:organization_id (
                        id,
                        name
                    )
                `)
                .neq('id', userId) // Exclure l'utilisateur actuel
                .limit(limit);

            if (profilesError) {
                console.error('[iBoîte] Fallback profiles query error:', profilesError);
                return [];
            }

            return (profiles || []).map((profile: any): ContactDirectoryEntry => ({
                userId: profile.id,
                profileId: profile.id,
                displayName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email || 'Utilisateur',
                firstName: profile.first_name || '',
                lastName: profile.last_name || '',
                phone: profile.phone,
                position: profile.role,
                servicePhone: null,
                isPublicContact: false,
                environment: profile.environment,
                role: profile.role,
                organizationId: profile.organization_id,
                organizationName: profile.organizations?.name || null,
                services: []
            }));
        } catch (error) {
            console.error('[iBoîte] Get contacts directory error:', error);
            return [];
        }
    }

    /**
     * Récupère les membres d'un service spécifique
     */
    async getServiceMembers(serviceId: string): Promise<ServiceMember[]> {
        try {
            // Note: Fonction définie dans la migration, pas encore dans les types générés
            const { data, error } = await (supabase.rpc as any)('get_service_members', {
                p_service_id: serviceId
            });

            if (error) {
                console.error('[iBoîte] Get service members error:', error);
                return [];
            }

            return (data || []).map((row: any): ServiceMember => ({
                id: row.id,
                serviceId: serviceId,
                userId: row.user_id,
                memberRole: row.member_role,
                canReceiveCorrespondence: row.can_receive_correspondence,
                canReceiveCalls: row.can_receive_calls,
                displayOrder: row.display_order,
                joinedAt: row.joined_at || new Date().toISOString(),
                user: {
                    displayName: row.display_name,
                    phone: row.phone,
                    position: row.position
                }
            }));
        } catch (error) {
            console.error('[iBoîte] Get service members error:', error);
            return [];
        }
    }

    /**
     * Envoie un message à tous les membres d'un service
     * Crée une conversation de type SERVICE et ajoute tous les membres comme participants
     */
    async sendToService(params: {
        serviceId: string;
        subject: string;
        content: string;
        attachments?: IBoiteAttachment[];
    }): Promise<IBoiteConversation | null> {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) return null;

            // 1. Récupérer les membres du service
            const members = await this.getServiceMembers(params.serviceId);
            if (members.length === 0) {
                console.error('[iBoîte] No members in service:', params.serviceId);
                return null;
            }

            // 2. Créer la conversation de type SERVICE
            const conversation = await this.createConversation({
                type: 'SERVICE',
                subject: params.subject,
                participantIds: members.map(m => m.userId),
                serviceId: params.serviceId,
                initialMessage: params.content
            });

            return conversation;
        } catch (error) {
            console.error('[iBoîte] Send to service error:', error);
            return null;
        }
    }

    /**
     * Réclame un élément de service (appel ou correspondance)
     * Premier arrivé, premier servi - retire l'élément des autres membres
     */
    async claimServiceItem(params: {
        itemType: 'CALL' | 'CORRESPONDENCE';
        itemId: string;
        serviceId: string;
    }): Promise<{ success: boolean; message?: string }> {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) {
                return { success: false, message: 'Non authentifié' };
            }

            // Vérifier que l'utilisateur est membre du service
            const members = await this.getServiceMembers(params.serviceId);
            const isMember = members.some(m => m.userId === session.session!.user.id);

            if (!isMember) {
                return { success: false, message: 'Vous n\'êtes pas membre de ce service' };
            }

            if (params.itemType === 'CORRESPONDENCE') {
                // Marquer la correspondance comme assignée à cet utilisateur
                const { error } = await (supabase.from as any)('requests')
                    .update({
                        assigned_to: session.session.user.id,
                        status: 'IN_PROGRESS'
                    })
                    .eq('id', params.itemId)
                    .is('assigned_to', null); // Seulement si pas encore assigné

                if (error) {
                    console.error('[iBoîte] Claim correspondence error:', error);
                    return { success: false, message: 'Correspondance déjà attribuée' };
                }
            }
            // Pour les appels, on pourrait implémenter une logique similaire

            console.log(`📬 [iBoîte] Item ${params.itemId} claimed by user ${session.session.user.id}`);
            return { success: true };
        } catch (error) {
            console.error('[iBoîte] Claim service item error:', error);
            return { success: false, message: 'Erreur lors de l\'attribution' };
        }
    }

    /**
     * Ajoute un membre à un service
     */
    async addServiceMember(params: {
        serviceId: string;
        userId: string;
        role?: 'LEADER' | 'MEMBER' | 'BACKUP';
    }): Promise<boolean> {
        try {
            const { error } = await (supabase.from as any)('service_members')
                .insert({
                    service_id: params.serviceId,
                    user_id: params.userId,
                    member_role: params.role || 'MEMBER'
                });

            if (error) {
                console.error('[iBoîte] Add service member error:', error);
                return false;
            }

            console.log(`📬 [iBoîte] User ${params.userId} added to service ${params.serviceId}`);
            return true;
        } catch (error) {
            console.error('[iBoîte] Add service member error:', error);
            return false;
        }
    }

    /**
     * Retire un membre d'un service
     */
    async removeServiceMember(params: {
        serviceId: string;
        userId: string;
    }): Promise<boolean> {
        try {
            const { error } = await (supabase.from as any)('service_members')
                .delete()
                .eq('service_id', params.serviceId)
                .eq('user_id', params.userId);

            if (error) {
                console.error('[iBoîte] Remove service member error:', error);
                return false;
            }

            console.log(`📬 [iBoîte] User ${params.userId} removed from service ${params.serviceId}`);
            return true;
        } catch (error) {
            console.error('[iBoîte] Remove service member error:', error);
            return false;
        }
    }

    private mapExternalCorrespondence(data: any): IBoiteExternalCorrespondence {
        return {
            id: data.id,
            senderId: data.sender_id,
            organizationId: data.organization_id || '',
            recipientEmail: data.external_email,
            recipientName: data.external_name,
            recipientOrganization: data.external_organization,
            subject: data.subject,
            body: data.content || '',
            attachments: data.attachments || [],
            status: data.status || 'DRAFT',
            sentAt: data.sent_at,
            deliveredAt: data.delivered_at,
            errorMessage: data.error_message,
            createdAt: data.created_at,
            updatedAt: data.updated_at || data.created_at
        };
    }
}

// Export singleton instance
export const iBoiteService = IBoiteServiceClass.getInstance();
