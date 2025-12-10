/**
 * Correspondence Log Service - Historique des correspondances officielles
 */

import { supabase } from '@/integrations/supabase/client';

export type CorrespondenceStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED';

export interface CorrespondenceLog {
  id: string;
  senderId: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  content?: string;
  templateUsed?: string;
  status: CorrespondenceStatus;
  sentAt?: string;
  deliveredAt?: string;
  errorMessage?: string;
  attachments: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
}

const correspondenceTable = () => (supabase as any).from('correspondence_logs');

class CorrespondenceLogService {
  /**
   * Get correspondence logs for current user
   */
  async getMyCorrespondence(): Promise<CorrespondenceLog[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await correspondenceTable()
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map((row: any) => this.mapFromDatabase(row));
    } catch (err) {
      console.error('[CorrespondenceLogService] Error fetching correspondence:', err);
      return [];
    }
  }

  /**
   * Get all correspondence (admin)
   */
  async getAll(filters?: { status?: CorrespondenceStatus; startDate?: string; endDate?: string }): Promise<CorrespondenceLog[]> {
    try {
      let query = correspondenceTable().select('*');
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map((row: any) => this.mapFromDatabase(row));
    } catch (err) {
      console.error('[CorrespondenceLogService] Error fetching correspondence:', err);
      return [];
    }
  }

  /**
   * Log a new correspondence
   */
  async log(params: {
    recipientEmail: string;
    recipientName?: string;
    subject: string;
    content?: string;
    templateUsed?: string;
    attachments?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<CorrespondenceLog> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await correspondenceTable()
        .insert({
          sender_id: user.id,
          recipient_email: params.recipientEmail,
          recipient_name: params.recipientName,
          subject: params.subject,
          content: params.content,
          template_used: params.templateUsed,
          status: 'PENDING',
          attachments: params.attachments || [],
          metadata: params.metadata || {}
        })
        .select()
        .single();
      
      if (error) throw error;
      return this.mapFromDatabase(data);
    } catch (err) {
      console.error('[CorrespondenceLogService] Error logging correspondence:', err);
      throw err;
    }
  }

  /**
   * Update status after sending
   */
  async updateStatus(id: string, status: CorrespondenceStatus, errorMessage?: string): Promise<void> {
    try {
      const updates: Record<string, unknown> = { status };
      
      if (status === 'SENT') {
        updates.sent_at = new Date().toISOString();
      } else if (status === 'DELIVERED') {
        updates.delivered_at = new Date().toISOString();
      } else if (status === 'FAILED' || status === 'BOUNCED') {
        updates.error_message = errorMessage;
      }

      const { error } = await correspondenceTable()
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    } catch (err) {
      console.error('[CorrespondenceLogService] Error updating status:', err);
      throw err;
    }
  }

  /**
   * Get correspondence by ID
   */
  async getById(id: string): Promise<CorrespondenceLog | null> {
    try {
      const { data, error } = await correspondenceTable()
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return this.mapFromDatabase(data);
    } catch (err) {
      console.error('[CorrespondenceLogService] Error fetching correspondence:', err);
      return null;
    }
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { total: 0, sent: 0, delivered: 0, failed: 0, pending: 0 };

      const { data, error } = await correspondenceTable()
        .select('status')
        .eq('sender_id', user.id);
      
      if (error) throw error;

      const logs = data || [];
      return {
        total: logs.length,
        sent: logs.filter((l: any) => l.status === 'SENT').length,
        delivered: logs.filter((l: any) => l.status === 'DELIVERED').length,
        failed: logs.filter((l: any) => ['FAILED', 'BOUNCED'].includes(l.status)).length,
        pending: logs.filter((l: any) => l.status === 'PENDING').length
      };
    } catch (err) {
      console.error('[CorrespondenceLogService] Error getting stats:', err);
      return { total: 0, sent: 0, delivered: 0, failed: 0, pending: 0 };
    }
  }

  private mapFromDatabase(row: Record<string, unknown>): CorrespondenceLog {
    return {
      id: row.id as string,
      senderId: row.sender_id as string,
      recipientEmail: row.recipient_email as string,
      recipientName: row.recipient_name as string,
      subject: row.subject as string,
      content: row.content as string,
      templateUsed: row.template_used as string,
      status: row.status as CorrespondenceStatus,
      sentAt: row.sent_at as string,
      deliveredAt: row.delivered_at as string,
      errorMessage: row.error_message as string,
      attachments: (row.attachments as string[]) || [],
      metadata: (row.metadata as Record<string, unknown>) || {},
      createdAt: row.created_at as string
    };
  }
}

export const correspondenceLogService = new CorrespondenceLogService();
