/**
 * Service iBoîte - Messagerie Interne
 * 
 * Gère les conversations internes (sans email) et externes (avec email).
 * Les utilisateurs dans l'écosystème communiquent par nom/service.
 * Les emails sont réservés aux communications externes.
 */

import { supabase } from '@/integrations/supabase/client';
import {
    UserEnvironment,
    IBoiteConversation,
    IBoiteMessage,
    IBoiteParticipant,
    IBoiteContact,
    IBoiteService,
    IBoiteUserSearchResult,
    IBoiteServiceSearchResult,
    IBoiteExternalCorrespondence,
    ConversationType,
    IBoiteAttachment
} from '@/types/environments';

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

class IBoiteService {
    private static instance: IBoiteService;

    private constructor() {
        console.log('📬 [iBoîte] Service initialisé');
    }

    public static getInstance(): IBoiteService {
        if (!IBoiteService.instance) {
            IBoiteService.instance = new IBoiteService();
        }
        return IBoiteService.instance;
    }

    // ========================================================
    // RECHERCHE D'UTILISATEURS (INTERNE)
    // ========================================================

    /**
     * Rechercher des utilisateurs par nom (sans email)
     * La visibilité dépend de l'environnement de l'utilisateur
     */
    async searchUsers(params: SearchParams): Promise<IBoiteUserSearchResult[]> {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) {
                console.warn('[iBoîte] No authenticated user');
                return [];
            }

            const { data, error } = await supabase.rpc('search_iboite_users', {
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

    /**
     * Rechercher des services municipaux
     */
    async searchServices(params: SearchParams): Promise<IBoiteServiceSearchResult[]> {
        try {
            const { data, error } = await supabase.rpc('search_iboite_services', {
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
    // CARNET D'ADRESSES
    // ========================================================

    /**
     * Obtenir les contacts de l'utilisateur
     */
    async getContacts(category?: string): Promise<IBoiteContact[]> {
        try {
            let query = supabase
                .from('iboite_contacts')
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

    /**
     * Ajouter un contact
     */
    async addContact(contact: Partial<IBoiteContact>): Promise<IBoiteContact | null> {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) return null;

            const { data, error } = await supabase
                .from('iboite_contacts')
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

    /**
     * Mettre à jour un contact (favori, notes, etc.)
     */
    async updateContact(contactId: string, updates: Partial<IBoiteContact>): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('iboite_contacts')
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

    /**
     * Obtenir les conversations de l'utilisateur
     */
    async getConversations(options?: {
        archived?: boolean;
        type?: ConversationType;
        limit?: number;
    }): Promise<IBoiteConversation[]> {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) return [];

            // Get conversations where user is participant
            let query = supabase
                .from('iboite_conversations')
                .select(`
                    *,
                    participants:iboite_conversation_participants!inner(
                        *,
                        user:profiles(first_name, last_name, avatar_url)
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

    /**
     * Créer une nouvelle conversation
     */
    async createConversation(params: CreateConversationParams): Promise<IBoiteConversation | null> {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) return null;

            // For PRIVATE conversations, check if one already exists
            if (params.type === 'PRIVATE' && params.participantIds.length === 1) {
                const existing = await this.findPrivateConversation(params.participantIds[0]);
                if (existing) {
                    return existing;
                }
            }

            // Create conversation
            const { data: conversation, error: convError } = await supabase
                .from('iboite_conversations')
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

            // Add participants (including current user)
            const allParticipants = [...new Set([session.session.user.id, ...params.participantIds])];
            const participantInserts = allParticipants.map((userId, idx) => ({
                conversation_id: conversation.id,
                user_id: userId,
                participant_role: userId === session.session.user.id ? 'OWNER' : 'MEMBER'
            }));

            const { error: partError } = await supabase
                .from('iboite_conversation_participants')
                .insert(participantInserts);

            if (partError) {
                console.error('[iBoîte] Add participants error:', partError);
                // Rollback conversation
                await supabase.from('iboite_conversations').delete().eq('id', conversation.id);
                return null;
            }

            // Send initial message if provided
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

    /**
     * Trouver une conversation privée existante avec un utilisateur
     */
    private async findPrivateConversation(otherUserId: string): Promise<IBoiteConversation | null> {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) return null;

            // Find conversations where both users are participants
            const { data } = await supabase
                .from('iboite_conversations')
                .select(`
                    *,
                    participants:iboite_conversation_participants!inner(user_id)
                `)
                .eq('conversation_type', 'PRIVATE')
                .contains('participants', [
                    { user_id: session.session.user.id },
                    { user_id: otherUserId }
                ]);

            // Filter to find exact 2-person private conversation
            const found = (data || []).find(conv =>
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

    /**
     * Obtenir les messages d'une conversation
     */
    async getMessages(conversationId: string, options?: {
        limit?: number;
        before?: string;
    }): Promise<IBoiteMessage[]> {
        try {
            let query = supabase
                .from('iboite_messages')
                .select(`
                    *,
                    sender:profiles!iboite_messages_sender_id_fkey(
                        first_name, last_name, avatar_url
                    ),
                    reply_to:iboite_messages!iboite_messages_reply_to_id_fkey(
                        id, content, sender:profiles(first_name, last_name)
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

            // Mark as read
            await this.markConversationAsRead(conversationId);

            return this.mapMessages(data || []);
        } catch (error) {
            console.error('[iBoîte] Get messages error:', error);
            return [];
        }
    }

    /**
     * Envoyer un message
     */
    async sendMessage(params: SendMessageParams): Promise<IBoiteMessage | null> {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) return null;

            const { data, error } = await supabase
                .from('iboite_messages')
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
                        first_name, last_name, avatar_url
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

    /**
     * Marquer une conversation comme lue
     */
    async markConversationAsRead(conversationId: string): Promise<void> {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) return;

            await supabase
                .from('iboite_conversation_participants')
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
    // CORRESPONDANCE EXTERNE (AVEC EMAIL)
    // ========================================================

    /**
     * Envoyer une correspondance externe (email)
     * Réservé au personnel municipal
     */
    async sendExternalCorrespondence(params: {
        recipientEmail: string;
        recipientName?: string;
        recipientOrganization?: string;
        subject: string;
        body: string;
        attachments?: IBoiteAttachment[];
        organizationId: string;
    }): Promise<IBoiteExternalCorrespondence | null> {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) return null;

            const { data, error } = await supabase
                .from('iboite_external_correspondence')
                .insert({
                    sender_id: session.session.user.id,
                    organization_id: params.organizationId,
                    recipient_email: params.recipientEmail,
                    recipient_name: params.recipientName,
                    recipient_organization: params.recipientOrganization,
                    subject: params.subject,
                    body: params.body,
                    attachments: params.attachments || [],
                    status: 'PENDING'
                })
                .select()
                .single();

            if (error) {
                console.error('[iBoîte] Send external correspondence error:', error);
                return null;
            }

            return this.mapExternalCorrespondence(data);
        } catch (error) {
            console.error('[iBoîte] Send external correspondence error:', error);
            return null;
        }
    }

    /**
     * Obtenir la correspondance externe
     */
    async getExternalCorrespondence(options?: {
        status?: string;
        limit?: number;
    }): Promise<IBoiteExternalCorrespondence[]> {
        try {
            let query = supabase
                .from('iboite_external_correspondence')
                .select('*')
                .order('created_at', { ascending: false });

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

            return (data || []).map(this.mapExternalCorrespondence);
        } catch (error) {
            console.error('[iBoîte] Get external correspondence error:', error);
            return [];
        }
    }

    // ========================================================
    // REALTIME SUBSCRIPTIONS
    // ========================================================

    /**
     * S'abonner aux nouveaux messages d'une conversation
     */
    subscribeToConversation(
        conversationId: string,
        onMessage: (message: IBoiteMessage) => void
    ): () => void {
        const channel = supabase
            .channel(`iboite:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'iboite_messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    onMessage(this.mapMessage(payload.new as any));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

    /**
     * S'abonner aux nouvelles conversations
     */
    subscribeToNewConversations(
        onConversation: (conversation: IBoiteConversation) => void
    ): () => void {
        const channel = supabase
            .channel('iboite:conversations')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'iboite_conversation_participants'
                },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        // Fetch the full conversation
                        const { data } = await supabase
                            .from('iboite_conversations')
                            .select('*')
                            .eq('id', (payload.new as any).conversation_id)
                            .single();

                        if (data) {
                            onConversation(this.mapConversation(data, []));
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
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
            category: data.category,
            isFavorite: data.is_favorite,
            lastContactAt: data.last_contact_at,
            contactCount: data.contact_count,
            notes: data.notes,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }

    private mapContacts(data: any[]): IBoiteContact[] {
        return data.map(this.mapContact);
    }

    private mapConversation(data: any, participants: any[]): IBoiteConversation {
        return {
            id: data.id,
            conversationType: data.conversation_type,
            subject: data.subject,
            serviceId: data.service_id,
            organizationId: data.organization_id,
            externalEmail: data.external_email,
            isExternal: data.is_external,
            lastMessageAt: data.last_message_at,
            lastMessagePreview: data.last_message_preview,
            lastMessageSenderId: data.last_message_sender_id,
            isArchived: data.is_archived,
            isResolved: data.is_resolved,
            metadata: data.metadata,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            participants: participants.map(this.mapParticipant),
            unreadCount: participants.find(p => p.is_current)?.unread_count || 0
        };
    }

    private mapConversations(data: any[], currentUserId: string): IBoiteConversation[] {
        return data.map(conv => {
            const currentParticipant = conv.participants?.find(
                (p: any) => p.user_id === currentUserId
            );
            return {
                ...this.mapConversation(conv, conv.participants || []),
                unreadCount: currentParticipant?.unread_count || 0
            };
        });
    }

    private mapParticipant(data: any): IBoiteParticipant {
        return {
            id: data.id,
            conversationId: data.conversation_id,
            userId: data.user_id,
            participantRole: data.participant_role,
            lastReadAt: data.last_read_at,
            unreadCount: data.unread_count,
            isMuted: data.is_muted,
            isPinned: data.is_pinned,
            joinedAt: data.joined_at,
            leftAt: data.left_at,
            isActive: data.is_active,
            user: data.user ? {
                displayName: `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim(),
                avatarUrl: data.user.avatar_url
            } : undefined
        };
    }

    private mapMessage(data: any): IBoiteMessage {
        return {
            id: data.id,
            conversationId: data.conversation_id,
            senderId: data.sender_id,
            content: data.content,
            contentType: data.content_type,
            attachments: data.attachments || [],
            replyToId: data.reply_to_id,
            mentions: data.mentions || [],
            isOfficial: data.is_official,
            officialReference: data.official_reference,
            isEdited: data.is_edited,
            editedAt: data.edited_at,
            isDeleted: data.is_deleted,
            deletedAt: data.deleted_at,
            metadata: data.metadata,
            createdAt: data.created_at,
            sender: data.sender ? {
                displayName: `${data.sender.first_name || ''} ${data.sender.last_name || ''}`.trim(),
                avatarUrl: data.sender.avatar_url
            } : undefined,
            replyTo: data.reply_to ? this.mapMessage(data.reply_to) : undefined
        };
    }

    private mapMessages(data: any[]): IBoiteMessage[] {
        return data.map(this.mapMessage.bind(this));
    }

    private mapExternalCorrespondence(data: any): IBoiteExternalCorrespondence {
        return {
            id: data.id,
            senderId: data.sender_id,
            organizationId: data.organization_id,
            recipientEmail: data.recipient_email,
            recipientName: data.recipient_name,
            recipientOrganization: data.recipient_organization,
            subject: data.subject,
            body: data.body,
            attachments: data.attachments || [],
            referenceNumber: data.reference_number,
            linkedConversationId: data.linked_conversation_id,
            status: data.status,
            sentAt: data.sent_at,
            deliveredAt: data.delivered_at,
            errorMessage: data.error_message,
            metadata: data.metadata,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }
}

// Singleton export
export const iBoiteService = IBoiteService.getInstance();
export default iBoiteService;
