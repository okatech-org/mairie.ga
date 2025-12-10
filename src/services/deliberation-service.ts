/**
 * Deliberation Service - Gestion des délibérations municipales
 */

import { supabase } from '@/integrations/supabase/client';

export type DeliberationResult = 'ADOPTED' | 'REJECTED' | 'POSTPONED' | 'WITHDRAWN';

export interface Deliberation {
  id: string;
  numero: string;
  organizationId?: string;
  title: string;
  content?: string;
  sessionDate: string;
  resultat?: DeliberationResult;
  votesPour: number;
  votesContre: number;
  abstentions: number;
  rapporteur?: string;
  documents: string[];
  metadata: Record<string, unknown>;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

const deliberationsTable = () => (supabase as any).from('deliberations');

class DeliberationService {
  /**
   * Get all deliberations
   */
  async getAll(organizationId?: string): Promise<Deliberation[]> {
    try {
      let query = deliberationsTable().select('*');
      
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      
      const { data, error } = await query.order('session_date', { ascending: false });
      
      if (error) throw error;
      return (data || []).map((row: any) => this.mapFromDatabase(row));
    } catch (err) {
      console.error('[DeliberationService] Error fetching deliberations:', err);
      return [];
    }
  }

  /**
   * Get deliberation by ID
   */
  async getById(id: string): Promise<Deliberation | null> {
    try {
      const { data, error } = await deliberationsTable()
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return this.mapFromDatabase(data);
    } catch (err) {
      console.error('[DeliberationService] Error fetching deliberation:', err);
      return null;
    }
  }

  /**
   * Create a new deliberation
   */
  async create(deliberation: Omit<Deliberation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deliberation> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await deliberationsTable()
        .insert({
          numero: deliberation.numero,
          organization_id: deliberation.organizationId,
          title: deliberation.title,
          content: deliberation.content,
          session_date: deliberation.sessionDate,
          resultat: deliberation.resultat,
          votes_pour: deliberation.votesPour || 0,
          votes_contre: deliberation.votesContre || 0,
          abstentions: deliberation.abstentions || 0,
          rapporteur: deliberation.rapporteur,
          documents: deliberation.documents || [],
          metadata: deliberation.metadata || {},
          created_by: user?.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return this.mapFromDatabase(data);
    } catch (err) {
      console.error('[DeliberationService] Error creating deliberation:', err);
      throw err;
    }
  }

  /**
   * Update a deliberation
   */
  async update(id: string, updates: Partial<Deliberation>): Promise<Deliberation> {
    try {
      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.sessionDate) dbUpdates.session_date = updates.sessionDate;
      if (updates.resultat) dbUpdates.resultat = updates.resultat;
      if (updates.votesPour !== undefined) dbUpdates.votes_pour = updates.votesPour;
      if (updates.votesContre !== undefined) dbUpdates.votes_contre = updates.votesContre;
      if (updates.abstentions !== undefined) dbUpdates.abstentions = updates.abstentions;
      if (updates.rapporteur !== undefined) dbUpdates.rapporteur = updates.rapporteur;
      if (updates.documents) dbUpdates.documents = updates.documents;
      
      const { data, error } = await deliberationsTable()
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return this.mapFromDatabase(data);
    } catch (err) {
      console.error('[DeliberationService] Error updating deliberation:', err);
      throw err;
    }
  }

  /**
   * Delete a deliberation
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await deliberationsTable().delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('[DeliberationService] Error deleting deliberation:', err);
      throw err;
    }
  }

  private mapFromDatabase(row: Record<string, unknown>): Deliberation {
    return {
      id: row.id as string,
      numero: row.numero as string,
      organizationId: row.organization_id as string,
      title: row.title as string,
      content: row.content as string,
      sessionDate: row.session_date as string,
      resultat: row.resultat as DeliberationResult,
      votesPour: row.votes_pour as number || 0,
      votesContre: row.votes_contre as number || 0,
      abstentions: row.abstentions as number || 0,
      rapporteur: row.rapporteur as string,
      documents: (row.documents as string[]) || [],
      metadata: (row.metadata as Record<string, unknown>) || {},
      createdBy: row.created_by as string,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    };
  }
}

export const deliberationService = new DeliberationService();
