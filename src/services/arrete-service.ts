/**
 * Arrete Service - Gestion des arrêtés municipaux
 */

import { supabase } from '@/integrations/supabase/client';

export type ArreteType = 'MUNICIPAL' | 'INDIVIDUEL' | 'REGLEMENTAIRE' | 'TEMPORAIRE';
export type ArreteStatus = 'DRAFT' | 'SIGNED' | 'PUBLISHED' | 'ABROGATED';

export interface Arrete {
  id: string;
  numero: string;
  organizationId?: string;
  type: ArreteType;
  title: string;
  content?: string;
  status: ArreteStatus;
  dateSignature?: string;
  datePublication?: string;
  dateEffet?: string;
  dateFin?: string;
  signataire?: string;
  documents: string[];
  metadata: Record<string, unknown>;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

const arretesTable = () => (supabase as any).from('arretes');

class ArreteService {
  /**
   * Get all arretes
   */
  async getAll(filters?: { organizationId?: string; status?: ArreteStatus; type?: ArreteType }): Promise<Arrete[]> {
    try {
      let query = arretesTable().select('*');
      
      if (filters?.organizationId) {
        query = query.eq('organization_id', filters.organizationId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map((row: any) => this.mapFromDatabase(row));
    } catch (err) {
      console.error('[ArreteService] Error fetching arretes:', err);
      return [];
    }
  }

  /**
   * Get published arretes (public access)
   */
  async getPublished(organizationId?: string): Promise<Arrete[]> {
    return this.getAll({ organizationId, status: 'PUBLISHED' });
  }

  /**
   * Get arrete by ID
   */
  async getById(id: string): Promise<Arrete | null> {
    try {
      const { data, error } = await arretesTable()
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return this.mapFromDatabase(data);
    } catch (err) {
      console.error('[ArreteService] Error fetching arrete:', err);
      return null;
    }
  }

  /**
   * Create a new arrete
   */
  async create(arrete: Omit<Arrete, 'id' | 'createdAt' | 'updatedAt'>): Promise<Arrete> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await arretesTable()
        .insert({
          numero: arrete.numero,
          organization_id: arrete.organizationId,
          type: arrete.type,
          title: arrete.title,
          content: arrete.content,
          status: arrete.status || 'DRAFT',
          date_signature: arrete.dateSignature,
          date_publication: arrete.datePublication,
          date_effet: arrete.dateEffet,
          date_fin: arrete.dateFin,
          signataire: arrete.signataire,
          documents: arrete.documents || [],
          metadata: arrete.metadata || {},
          created_by: user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return this.mapFromDatabase(data);
    } catch (err) {
      console.error('[ArreteService] Error creating arrete:', err);
      throw err;
    }
  }

  /**
   * Update an arrete
   */
  async update(id: string, updates: Partial<Arrete>): Promise<Arrete> {
    try {
      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.type) dbUpdates.type = updates.type;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.dateSignature !== undefined) dbUpdates.date_signature = updates.dateSignature;
      if (updates.datePublication !== undefined) dbUpdates.date_publication = updates.datePublication;
      if (updates.dateEffet !== undefined) dbUpdates.date_effet = updates.dateEffet;
      if (updates.dateFin !== undefined) dbUpdates.date_fin = updates.dateFin;
      if (updates.signataire !== undefined) dbUpdates.signataire = updates.signataire;
      if (updates.documents) dbUpdates.documents = updates.documents;
      
      const { data, error } = await arretesTable()
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return this.mapFromDatabase(data);
    } catch (err) {
      console.error('[ArreteService] Error updating arrete:', err);
      throw err;
    }
  }

  /**
   * Sign an arrete
   */
  async sign(id: string, signataire: string): Promise<Arrete> {
    return this.update(id, {
      status: 'SIGNED',
      dateSignature: new Date().toISOString().split('T')[0],
      signataire
    });
  }

  /**
   * Publish an arrete
   */
  async publish(id: string, dateEffet?: string): Promise<Arrete> {
    return this.update(id, {
      status: 'PUBLISHED',
      datePublication: new Date().toISOString().split('T')[0],
      dateEffet: dateEffet || new Date().toISOString().split('T')[0]
    });
  }

  /**
   * Abrogate an arrete
   */
  async abrogate(id: string): Promise<Arrete> {
    return this.update(id, {
      status: 'ABROGATED',
      dateFin: new Date().toISOString().split('T')[0]
    });
  }

  /**
   * Delete an arrete
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await arretesTable().delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[ArreteService] Error deleting arrete:', err);
      throw err;
    }
  }

  private mapFromDatabase(row: Record<string, unknown>): Arrete {
    return {
      id: row.id as string,
      numero: row.numero as string,
      organizationId: row.organization_id as string,
      type: row.type as ArreteType,
      title: row.title as string,
      content: row.content as string,
      status: row.status as ArreteStatus,
      dateSignature: row.date_signature as string,
      datePublication: row.date_publication as string,
      dateEffet: row.date_effet as string,
      dateFin: row.date_fin as string,
      signataire: row.signataire as string,
      documents: (row.documents as string[]) || [],
      metadata: (row.metadata as Record<string, unknown>) || {},
      createdBy: row.created_by as string,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    };
  }
}

export const arreteService = new ArreteService();
