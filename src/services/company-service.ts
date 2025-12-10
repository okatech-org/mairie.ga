/**
 * Company Service avec support Supabase et Fallback Mock
 * 
 * Ce service gère les entreprises enregistrées par les citoyens.
 * En mode démo ou si la table n'existe pas, utilise les données mockées.
 * En production avec Supabase, utilise la table companies.
 */

import { Company, EntityStatus, CompanyType, ActivitySector, CompanyRole } from '@/types/company';
import { MOCK_COMPANIES } from '@/data/mock-companies';
import { supabase } from '@/integrations/supabase/client';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Type assertion helper for tables not yet in generated types
const companiesTable = () => (supabase as any).from('companies');

class CompanyService {
    private useSupabase = false;
    private mockCompanies: Company[] = [...MOCK_COMPANIES];

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
                console.log('[CompanyService] No session, using mock data');
                return;
            }

            const { error } = await companiesTable()
                .select('id')
                .limit(1);

            if (error) {
                console.log('[CompanyService] companies table not available, using mock data:', error.message);
                this.useSupabase = false;
            } else {
                console.log('[CompanyService] Connected to Supabase companies table');
                this.useSupabase = true;
            }
        } catch (err) {
            console.log('[CompanyService] Error checking table, using mock data:', err);
            this.useSupabase = false;
        }
    }

    /**
     * Get all companies, optionally filtered by status
     */
    async getAll(status?: EntityStatus): Promise<Company[]> {
        if (!this.useSupabase) {
            await delay(500);
            if (status) {
                return this.mockCompanies.filter(c => c.status === status);
            }
            return this.mockCompanies;
        }

        try {
            let query = companiesTable().select('*');

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []).map((row: any) => this.mapFromDatabase(row));
        } catch (err) {
            console.error('[CompanyService] Error fetching companies:', err);
            return status ? this.mockCompanies.filter(c => c.status === status) : this.mockCompanies;
        }
    }

    /**
     * Get companies for current user
     */
    async getMyCompanies(): Promise<Company[]> {
        if (!this.useSupabase) {
            await delay(500);
            return this.mockCompanies.slice(0, 2); // Return first 2 as user's companies
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await companiesTable()
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []).map((row: any) => this.mapFromDatabase(row));
        } catch (err) {
            console.error('[CompanyService] Error fetching user companies:', err);
            return [];
        }
    }

    /**
     * Get a company by ID
     */
    async getById(id: string): Promise<Company | undefined> {
        if (!this.useSupabase) {
            await delay(300);
            return this.mockCompanies.find(c => c.id === id);
        }

        try {
            const { data, error } = await companiesTable()
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            return this.mapFromDatabase(data);
        } catch (err) {
            console.error('[CompanyService] Error fetching company:', err);
            return this.mockCompanies.find(c => c.id === id);
        }
    }

    /**
     * Create a new company
     */
    async create(company: Omit<Company, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Company> {
        if (!this.useSupabase) {
            await delay(800);
            const newCompany: Company = {
                ...company,
                id: `comp-${Date.now()}`,
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.mockCompanies.push(newCompany);
            return newCompany;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const dbData = this.mapToDatabase(company);

            const { data, error } = await companiesTable()
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
            console.error('[CompanyService] Error creating company:', err);
            // Fallback to mock
            const newCompany: Company = {
                ...company,
                id: `comp-${Date.now()}`,
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            this.mockCompanies.push(newCompany);
            return newCompany;
        }
    }

    /**
     * Update a company
     */
    async update(id: string, data: Partial<Company>): Promise<Company> {
        if (!this.useSupabase) {
            await delay(500);
            const index = this.mockCompanies.findIndex(c => c.id === id);
            if (index === -1) throw new Error('Company not found');

            this.mockCompanies[index] = {
                ...this.mockCompanies[index],
                ...data,
                updatedAt: new Date().toISOString()
            };
            return this.mockCompanies[index];
        }

        try {
            const dbData = this.mapToDatabase(data);

            const { data: result, error } = await companiesTable()
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
            console.error('[CompanyService] Error updating company:', err);
            throw err;
        }
    }

    /**
     * Validate a company (admin/agent action)
     */
    async validate(id: string, validatorId: string): Promise<Company> {
        return this.update(id, {
            status: 'APPROVED',
            validatedAt: new Date().toISOString(),
            validatedById: validatorId
        });
    }

    /**
     * Reject a company (admin/agent action)
     */
    async reject(id: string, validatorId: string, reason: string): Promise<Company> {
        return this.update(id, {
            status: 'REJECTED',
            rejectionReason: reason,
            validatedAt: new Date().toISOString(),
            validatedById: validatorId
        });
    }

    /**
     * Map database row to Company type
     */
    private mapFromDatabase(row: Record<string, unknown>): Company {
        return {
            id: row.id as string,
            name: row.name as string,
            legalName: row.legal_name as string,
            companyType: row.company_type as CompanyType,
            activitySector: row.activity_sector as ActivitySector,
            siret: row.siret as string,
            registrationNumber: row.registration_number as string,
            status: row.status as EntityStatus,
            validatedAt: row.validated_at as string,
            validatedById: row.validated_by_id as string,
            rejectionReason: row.rejection_reason as string,
            email: row.email as string,
            phone: row.phone as string,
            website: row.website as string,
            description: row.description as string,
            shortDescription: row.short_description as string,
            logoUrl: row.logo_url as string,
            address: {
                street: row.address_street as string,
                city: row.address_city as string,
                postalCode: row.address_postal_code as string,
                country: row.address_country as string || 'Gabon'
            },
            ownerId: row.owner_id as string,
            ownerRole: row.owner_role as CompanyRole,
            createdAt: row.created_at as string,
            updatedAt: row.updated_at as string
        };
    }

    /**
     * Map Company type to database columns
     */
    private mapToDatabase(company: Partial<Company>): Record<string, unknown> {
        const result: Record<string, unknown> = {};

        if (company.name) result.name = company.name;
        if (company.legalName) result.legal_name = company.legalName;
        if (company.companyType) result.company_type = company.companyType;
        if (company.activitySector) result.activity_sector = company.activitySector;
        if (company.siret) result.siret = company.siret;
        if (company.registrationNumber) result.registration_number = company.registrationNumber;
        if (company.status) result.status = company.status;
        if (company.validatedAt) result.validated_at = company.validatedAt;
        if (company.validatedById) result.validated_by_id = company.validatedById;
        if (company.rejectionReason) result.rejection_reason = company.rejectionReason;
        if (company.email) result.email = company.email;
        if (company.phone) result.phone = company.phone;
        if (company.website) result.website = company.website;
        if (company.description) result.description = company.description;
        if (company.shortDescription) result.short_description = company.shortDescription;
        if (company.logoUrl) result.logo_url = company.logoUrl;
        if (company.address) {
            result.address_street = company.address.street;
            result.address_city = company.address.city;
            result.address_postal_code = company.address.postalCode;
            result.address_country = company.address.country;
        }
        if (company.ownerId) result.owner_id = company.ownerId;
        if (company.ownerRole) result.owner_role = company.ownerRole;

        return result;
    }
}

export const companyService = new CompanyService();
