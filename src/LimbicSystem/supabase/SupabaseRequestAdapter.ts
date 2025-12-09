/**
 * LIMBIC SYSTEM - Supabase Request Adapter
 * 
 * Implements IRequestRepository using Supabase.
 */

import { supabase } from '@/integrations/supabase/client';
import { IRequestRepository, ServiceRequest, RequestStatistics } from '../../Cortex/ports/IRequestRepository';
import { RequestStatus, RequestType, RequestPriority } from '../../Cortex/entities/Request';

export class SupabaseRequestAdapter implements IRequestRepository {

    async findAll(citizenId?: string): Promise<ServiceRequest[]> {
        let query = supabase
            .from('requests')
            .select(`
                *,
                service:services(name, category),
                organization:organizations(name)
            `)
            .order('created_at', { ascending: false });

        if (citizenId) {
            query = query.eq('citizen_id', citizenId);
        }

        const { data, error } = await query;
        if (error) throw new Error(error.message);

        return (data || []).map(row => this.toDomain(row));
    }

    async findById(id: string): Promise<ServiceRequest | null> {
        const { data, error } = await supabase
            .from('requests')
            .select(`
                *,
                service:services(name, category),
                organization:organizations(name)
            `)
            .eq('id', id)
            .single();

        if (error) return null;
        return this.toDomain(data);
    }

    async create(request: Omit<ServiceRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceRequest> {
        const dbType = request.type as 'PASSPORT' | 'VISA' | 'CIVIL_REGISTRY' | 'LEGALIZATION' | 'CONSULAR_CARD' | 'ATTESTATION';
        const { data, error } = await supabase
            .from('requests')
            .insert([{
                citizen_id: request.citizenId,
                citizen_name: request.citizenId,
                citizen_email: 'citizen@demo.ga',
                service_id: request.serviceId,
                organization_id: request.organizationId,
                type: dbType,
                subject: request.subject || 'Nouvelle demande',
                status: request.status,
                priority: request.priority,
                description: request.notes
            }])
            .select()
            .single();

        if (error) throw new Error(error.message);
        return this.toDomain(data);
    }

    async updateStatus(id: string, status: RequestStatus): Promise<ServiceRequest> {
        const { data, error } = await supabase
            .from('requests')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return this.toDomain(data);
    }

    async update(id: string, updates: Partial<ServiceRequest>): Promise<ServiceRequest> {
        const dbUpdates: any = {};
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.priority) dbUpdates.priority = updates.priority;
        if (updates.notes) dbUpdates.notes = updates.notes;
        if (updates.data) dbUpdates.data = updates.data;
        if (updates.assignedTo) dbUpdates.assigned_to = updates.assignedTo;

        const { data, error } = await supabase
            .from('requests')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return this.toDomain(data);
    }

    async getStatistics(citizenId: string): Promise<RequestStatistics> {
        const { data, error } = await supabase
            .from('requests')
            .select('status, id')
            .eq('citizen_id', citizenId);

        if (error) throw new Error(error.message);

        const total = data?.length || 0;
        const pending = data?.filter(r => r.status === 'PENDING').length || 0;
        const inProgress = data?.filter(r => r.status === 'IN_PROGRESS').length || 0;
        const completed = data?.filter(r => r.status === 'COMPLETED' || r.status === 'VALIDATED').length || 0;
        const rejected = data?.filter(r => r.status === 'REJECTED').length || 0;

        return { total, pending, inProgress, completed, rejected };
    }

    private toDomain(row: any): ServiceRequest {
        return {
            id: row.id,
            citizenId: row.citizen_id,
            serviceId: row.service_id,
            organizationId: row.organization_id,
            type: row.type as RequestType,
            status: row.status as RequestStatus,
            priority: row.priority as RequestPriority,
            subject: row.subject || '',
            data: row.data,
            notes: row.notes,
            assignedTo: row.assigned_to,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }
}

export const supabaseRequestAdapter = new SupabaseRequestAdapter();
