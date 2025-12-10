/**
 * Association Service avec support Supabase et Fallback Mock
 * 
 * Ce service gère les associations enregistrées par les citoyens.
 * En mode démo ou si la table n'existe pas, utilise les données mockées.
 * En production avec Supabase, utilise la table associations.
 */

import { Association, AssociationType, AssociationRole } from '@/types/association';
import { EntityStatus } from '@/types/company';
import { MOCK_ASSOCIATIONS } from '@/data/mock-associations';
import { supabase } from '@/integrations/supabase/client';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Type assertion helper for tables not yet in generated types
const associationsTable = () => (supabase as any).from('associations');

class AssociationService {
    private useSupabase = false;
    private mockAssociations: Association[] = [...MOCK_ASSOCIATIONS];

    constructor() {
        this.checkSupabaseTable();
    }

    /**
     * Check if Supabase table exists and is accessible
     */
    private async checkSupabaseTable(): Promise<void> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                console.log('[AssociationService] No session, using mock data');
                return;
            }

            const { error } = await associationsTable()
                .select('id')
                .limit(1);

            if (error) {
                console.log('[AssociationService] associations table not available, using mock data:', error.message);
                this.useSupabase = false;
            } else {
                console.log('[AssociationService] Connected to Supabase associations table');
                this.useSupabase = true;
            }
        } catch (err) {
            console.log('[AssociationService] Error checking table, using mock data:', err);
            this.useSupabase = false;
        }
    }

    /**
     * Get all associations, optionally filtered by status
     */
    async getAll(status?: EntityStatus): Promise<Association[]> {
        if (!this.useSupabase) {
            await delay(500);
            if (status) {
                return this.mockAssociations.filter(a => a.status === status);
            }
            return this.mockAssociations;
        }

        try {
            let query = associationsTable().select('*');

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []).map((row: any) => this.mapFromDatabase(row));
        } catch (err) {
            console.error('[AssociationService] Error fetching associations:', err);
            return status ? this.mockAssociations.filter(a => a.status === status) : this.mockAssociations;
        }
    }

    /**
     * Get associations for current user
     */
    async getMyAssociations(): Promise<Association[]> {
        if (!this.useSupabase) {
            await delay(500);
            return this.mockAssociations.slice(0, 2); // Return first 2 as user's associations
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await associationsTable()
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []).map((row: any) => this.mapFromDatabase(row));
        } catch (err) {
            console.error('[AssociationService] Error fetching user associations:', err);
            return [];
        }
    }

    /**
     * Get an association by ID
     */
    async getById(id: string): Promise<Association | undefined> {
        if (!this.useSupabase) {
            await delay(300);
            return this.mockAssociations.find(a => a.id === id);
        }

        try {
            const { data, error } = await associationsTable()
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            return this.mapFromDatabase(data);
        } catch (err) {
            console.error('[AssociationService] Error fetching association:', err);
            return this.mockAssociations.find(a => a.id === id);
        }
    }

    /**
     * Create a new association
     */
    async create(association: Omit<Association, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Association> {
        if (!this.useSupabase) {
            await delay(800);
            const newAssociation: Association = {
                ...association,
                id: `asso-${Date.now()}`,
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.mockAssociations.push(newAssociation);
            return newAssociation;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const dbData = this.mapToDatabase(association);

            const { data, error } = await associationsTable()
                .insert({
                    ...dbData,
                    owner_id: user.id,
                    status: 'PENDING',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            return this.mapFromDatabase(data);
        } catch (err) {
            console.error('[AssociationService] Error creating association:', err);
            // Fallback to mock
            const newAssociation: Association = {
                ...association,
                id: `asso-${Date.now()}`,
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.mockAssociations.push(newAssociation);
            return newAssociation;
        }
    }

    /**
     * Update an association
     */
    async update(id: string, data: Partial<Association>): Promise<Association> {
        if (!this.useSupabase) {
            await delay(500);
            const index = this.mockAssociations.findIndex(a => a.id === id);
            if (index === -1) throw new Error('Association not found');

            this.mockAssociations[index] = {
                ...this.mockAssociations[index],
                ...data,
                updatedAt: new Date().toISOString()
            };
            return this.mockAssociations[index];
        }

        try {
            const dbData = this.mapToDatabase(data);

            const { data: result, error } = await associationsTable()
                .update({
                    ...dbData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return this.mapFromDatabase(result);
        } catch (err) {
            console.error('[AssociationService] Error updating association:', err);
            throw err;
        }
    }

    /**
     * Validate an association (admin/agent action)
     */
    async validate(id: string, validatorId: string): Promise<Association> {
        return this.update(id, {
            status: 'APPROVED',
            validatedAt: new Date().toISOString(),
            validatedById: validatorId
        });
    }

    /**
     * Reject an association (admin/agent action)
     */
    async reject(id: string, validatorId: string, reason: string): Promise<Association> {
        return this.update(id, {
            status: 'REJECTED',
            rejectionReason: reason,
            validatedAt: new Date().toISOString(),
            validatedById: validatorId
        });
    }

    /**
     * Map database row to Association type
     */
    private mapFromDatabase(row: Record<string, unknown>): Association {
        return {
            id: row.id as string,
            name: row.name as string,
            legalName: row.legal_name as string,
            associationType: row.association_type as AssociationType,
            registrationNumber: row.registration_number as string,
            creationDate: row.creation_date as string,
            status: row.status as EntityStatus,
            validatedAt: row.validated_at as string,
            validatedById: row.validated_by_id as string,
            rejectionReason: row.rejection_reason as string,
            email: row.email as string,
            phone: row.phone as string,
            website: row.website as string,
            facebook: row.facebook as string,
            instagram: row.instagram as string,
            linkedin: row.linkedin as string,
            description: row.description as string,
            shortDescription: row.short_description as string,
            objectives: row.objectives as string,
            memberCount: row.member_count as number,
            foundingYear: row.founding_year as number,
            logoUrl: row.logo_url as string,
            address: {
                street: row.address_street as string,
                city: row.address_city as string,
                postalCode: row.address_postal_code as string,
                country: row.address_country as string || 'Gabon'
            },
            ownerId: row.owner_id as string,
            ownerRole: row.owner_role as AssociationRole,
            createdAt: row.created_at as string,
            updatedAt: row.updated_at as string
        };
    }

    /**
     * Map Association type to database columns
     */
    private mapToDatabase(association: Partial<Association>): Record<string, unknown> {
        const result: Record<string, unknown> = {};

        if (association.name) result.name = association.name;
        if (association.legalName) result.legal_name = association.legalName;
        if (association.associationType) result.association_type = association.associationType;
        if (association.registrationNumber) result.registration_number = association.registrationNumber;
        if (association.creationDate) result.creation_date = association.creationDate;
        if (association.status) result.status = association.status;
        if (association.validatedAt) result.validated_at = association.validatedAt;
        if (association.validatedById) result.validated_by_id = association.validatedById;
        if (association.rejectionReason) result.rejection_reason = association.rejectionReason;
        if (association.email) result.email = association.email;
        if (association.phone) result.phone = association.phone;
        if (association.website) result.website = association.website;
        if (association.facebook) result.facebook = association.facebook;
        if (association.instagram) result.instagram = association.instagram;
        if (association.linkedin) result.linkedin = association.linkedin;
        if (association.description) result.description = association.description;
        if (association.shortDescription) result.short_description = association.shortDescription;
        if (association.objectives) result.objectives = association.objectives;
        if (association.memberCount !== undefined) result.member_count = association.memberCount;
        if (association.foundingYear !== undefined) result.founding_year = association.foundingYear;
        if (association.logoUrl) result.logo_url = association.logoUrl;
        if (association.address) {
            result.address_street = association.address.street;
            result.address_city = association.address.city;
            result.address_postal_code = association.address.postalCode;
            result.address_country = association.address.country;
        }
        if (association.ownerId) result.owner_id = association.ownerId;
        if (association.ownerRole) result.owner_role = association.ownerRole;

        return result;
    }
}

export const associationService = new AssociationService();
