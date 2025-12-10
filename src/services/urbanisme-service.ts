/**
 * Urbanisme Service - Gestion des dossiers d'urbanisme
 */

import { supabase } from '@/integrations/supabase/client';

export type UrbanismeType = 'PERMIS_CONSTRUIRE' | 'DECLARATION_TRAVAUX' | 'PERMIS_DEMOLIR' | 'PERMIS_AMENAGER' | 'CERTIFICAT_URBANISME';
export type UrbanismeStatus = 'SUBMITTED' | 'IN_REVIEW' | 'ADDITIONAL_INFO' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

export interface UrbanismeDossier {
  id: string;
  numero: string;
  demandeurId: string;
  organizationId?: string;
  type: UrbanismeType;
  status: UrbanismeStatus;
  title: string;
  description?: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    coordinates?: { lat: number; lng: number };
  };
  surfaceTerrain?: number;
  surfaceConstruction?: number;
  dateDepot: string;
  dateDecision?: string;
  motifDecision?: string;
  assignedTo?: string;
  documents: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

const urbanismeTable = () => (supabase as any).from('urbanisme_dossiers');

export interface CreateUrbanismeDossierInput {
  type: UrbanismeType;
  title: string;
  description?: string;
  address?: { street?: string; city?: string; postalCode?: string };
  surfaceTerrain?: number;
  surfaceConstruction?: number;
  organizationId?: string;
  status?: UrbanismeStatus;
  documents?: string[];
  metadata?: Record<string, unknown>;
}

class UrbanismeService {
  /**
   * List all dossiers (admin/agent view)
   */
  async list(filters?: { status?: UrbanismeStatus; type?: UrbanismeType }): Promise<UrbanismeDossier[]> {
    try {
      let query = urbanismeTable().select('*');
      
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
      console.error('[UrbanismeService] Error listing dossiers:', err);
      return [];
    }
  }

  /**
   * Get all dossiers for current user
   */
  async getMyDossiers(): Promise<UrbanismeDossier[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await urbanismeTable()
        .select('*')
        .eq('demandeur_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map((row: any) => this.mapFromDatabase(row));
    } catch (err) {
      console.error('[UrbanismeService] Error fetching dossiers:', err);
      return [];
    }
  }

  /**
   * Get all dossiers (admin/agent)
   */
  async getAll(filters?: { organizationId?: string; status?: UrbanismeStatus; type?: UrbanismeType }): Promise<UrbanismeDossier[]> {
    try {
      let query = urbanismeTable().select('*');
      
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
      console.error('[UrbanismeService] Error fetching dossiers:', err);
      return [];
    }
  }

  /**
   * Get dossier by ID
   */
  async getById(id: string): Promise<UrbanismeDossier | null> {
    try {
      const { data, error } = await urbanismeTable()
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return this.mapFromDatabase(data);
    } catch (err) {
      console.error('[UrbanismeService] Error fetching dossier:', err);
      return null;
    }
  }

  /**
   * Create a new dossier
   */
  async create(dossier: CreateUrbanismeDossierInput): Promise<UrbanismeDossier> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const numero = `URB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

      const { data, error } = await urbanismeTable()
        .insert({
          numero,
          demandeur_id: user.id,
          organization_id: dossier.organizationId,
          type: dossier.type,
          status: dossier.status || 'SUBMITTED',
          title: dossier.title,
          description: dossier.description,
          address: dossier.address,
          surface_terrain: dossier.surfaceTerrain,
          surface_construction: dossier.surfaceConstruction,
          documents: dossier.documents || [],
          metadata: dossier.metadata || {}
        })
        .select()
        .single();
      
      if (error) throw error;
      return this.mapFromDatabase(data);
    } catch (err) {
      console.error('[UrbanismeService] Error creating dossier:', err);
      throw err;
    }
  }

  /**
   * Update dossier status (admin/agent)
   */
  async updateStatus(id: string, status: UrbanismeStatus, motif?: string): Promise<UrbanismeDossier> {
    try {
      const updates: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString()
      };

      if (['APPROVED', 'REJECTED'].includes(status)) {
        updates.date_decision = new Date().toISOString().split('T')[0];
        if (motif) updates.motif_decision = motif;
      }

      const { data, error } = await urbanismeTable()
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return this.mapFromDatabase(data);
    } catch (err) {
      console.error('[UrbanismeService] Error updating status:', err);
      throw err;
    }
  }

  /**
   * Assign dossier to agent
   */
  async assign(id: string, agentId: string): Promise<UrbanismeDossier> {
    try {
      const { data, error } = await urbanismeTable()
        .update({
          assigned_to: agentId,
          status: 'IN_REVIEW',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return this.mapFromDatabase(data);
    } catch (err) {
      console.error('[UrbanismeService] Error assigning dossier:', err);
      throw err;
    }
  }

  private mapFromDatabase(row: Record<string, unknown>): UrbanismeDossier {
    return {
      id: row.id as string,
      numero: row.numero as string,
      demandeurId: row.demandeur_id as string,
      organizationId: row.organization_id as string,
      type: row.type as UrbanismeType,
      status: row.status as UrbanismeStatus,
      title: row.title as string,
      description: row.description as string,
      address: row.address as UrbanismeDossier['address'],
      surfaceTerrain: row.surface_terrain as number,
      surfaceConstruction: row.surface_construction as number,
      dateDepot: row.date_depot as string,
      dateDecision: row.date_decision as string,
      motifDecision: row.motif_decision as string,
      assignedTo: row.assigned_to as string,
      documents: (row.documents as string[]) || [],
      metadata: (row.metadata as Record<string, unknown>) || {},
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    };
  }
}

export const urbanismeService = new UrbanismeService();
