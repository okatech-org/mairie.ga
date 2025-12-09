/**
 * LIMBIC SYSTEM - Supabase Profile Adapter
 * 
 * Implements IProfileRepository using Supabase.
 */

import { supabase } from '@/integrations/supabase/client';
import { IProfileRepository, Profile, ProfileIdentity, ProfilePersonalInfo, ProfileEmployment } from '../../Cortex/ports/IProfileRepository';
import { MunicipalRole } from '../../Cortex/entities/MunicipalRole';

export class SupabaseProfileAdapter implements IProfileRepository {

    async findAll(organizationId?: string): Promise<Profile[]> {
        let query = supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (organizationId) {
            query = query.eq('employer', organizationId);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        // Enrich with roles
        const { data: roles } = await supabase
            .from('user_roles')
            .select('user_id, role');

        const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

        return (data || []).map(row => this.toDomain(row, roleMap.get(row.user_id) as MunicipalRole));
    }

    async findById(id: string): Promise<Profile | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;

        const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', data.user_id)
            .single();

        return this.toDomain(data, roleData?.role as MunicipalRole);
    }

    async findByUserId(userId: string): Promise<Profile | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) return null;

        const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .single();

        return this.toDomain(data, roleData?.role as MunicipalRole);
    }

    async save(profile: Profile): Promise<Profile> {
        const updates = {
            first_name: profile.personalInfo.firstName,
            last_name: profile.personalInfo.lastName,
            phone: profile.personalInfo.phone,
            date_of_birth: profile.personalInfo.dateOfBirth,
            nationality: profile.personalInfo.nationality,
            lieu_naissance: profile.personalInfo.placeOfBirth,
            profession: profile.employment.profession,
            employer: profile.employment.employer,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', profile.identity.id)
            .select()
            .single();

        if (error) throw new Error(error.message);

        // Update role if changed (map MunicipalRole to database app_role)
        if (profile.role) {
            const roleStr = String(profile.role);
            const isAdmin = roleStr === 'MAIRE' || roleStr === 'SECRETAIRE_GENERAL';
            const isAgent = roleStr.includes('AGENT') || roleStr === 'CHEF_SERVICE' || roleStr === 'CHEF_BUREAU' || roleStr === 'MAIRE_ADJOINT';
            const dbRole: 'super_admin' | 'admin' | 'agent' | 'citizen' = isAdmin ? 'admin' : isAgent ? 'agent' : 'citizen';
            await supabase
                .from('user_roles')
                .upsert([{ user_id: profile.identity.userId, role: dbRole }]);
        }

        return this.toDomain(data, profile.role);
    }

    async exists(userId: string): Promise<boolean> {
        const { count, error } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (error) return false;
        return (count ?? 0) > 0;
    }

    private toDomain(row: any, role?: MunicipalRole): Profile {
        const identity: ProfileIdentity = {
            id: row.id,
            userId: row.user_id,
            email: row.email || ''
        };

        const personalInfo: ProfilePersonalInfo = {
            firstName: row.first_name || '',
            lastName: row.last_name || '',
            dateOfBirth: row.date_of_birth,
            phone: row.phone,
            nationality: row.nationality,
            placeOfBirth: row.lieu_naissance
        };

        const employment: ProfileEmployment = {
            employer: row.employer,
            profession: row.profession,
            organizationId: row.employer
        };

        return {
            identity,
            personalInfo,
            employment,
            role: role || MunicipalRole.CITOYEN,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }
}

export const supabaseProfileAdapter = new SupabaseProfileAdapter();
