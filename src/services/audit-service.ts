/**
 * Audit Service - Gestion des logs d'audit
 */

import { supabase } from '@/integrations/supabase/client';

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export type AuditAction = 
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW'
  | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED'
  | 'STATUS_CHANGE' | 'ASSIGN' | 'APPROVE' | 'REJECT'
  | 'EXPORT' | 'IMPORT' | 'DOWNLOAD';

const auditLogsTable = () => (supabase as any).from('audit_logs');

class AuditService {
  /**
   * Log an action
   */
  async log(params: {
    action: AuditAction | string;
    resourceType: string;
    resourceId?: string;
    oldData?: Record<string, unknown>;
    newData?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await auditLogsTable().insert({
        user_id: user?.id,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        old_data: params.oldData,
        new_data: params.newData,
        metadata: params.metadata || {},
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent
      });
    } catch (err) {
      console.error('[AuditService] Error logging action:', err);
      // Don't throw - audit logging shouldn't break the app
    }
  }

  /**
   * Get audit logs (super_admin only)
   */
  async getLogs(filters?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    try {
      let query = auditLogsTable().select('*');
      
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }
      if (filters?.resourceId) {
        query = query.eq('resource_id', filters.resourceId);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 100);
      
      if (error) throw error;
      return (data || []).map((row: any) => this.mapFromDatabase(row));
    } catch (err) {
      console.error('[AuditService] Error fetching logs:', err);
      return [];
    }
  }

  /**
   * Get logs for a specific resource
   */
  async getResourceHistory(resourceType: string, resourceId: string): Promise<AuditLog[]> {
    return this.getLogs({ resourceType, resourceId });
  }

  /**
   * Get user activity
   */
  async getUserActivity(userId: string, limit = 50): Promise<AuditLog[]> {
    return this.getLogs({ userId, limit });
  }

  /**
   * Helper methods for common actions
   */
  async logCreate(resourceType: string, resourceId: string, data: Record<string, unknown>): Promise<void> {
    await this.log({ action: 'CREATE', resourceType, resourceId, newData: data });
  }

  async logUpdate(resourceType: string, resourceId: string, oldData: Record<string, unknown>, newData: Record<string, unknown>): Promise<void> {
    await this.log({ action: 'UPDATE', resourceType, resourceId, oldData, newData });
  }

  async logDelete(resourceType: string, resourceId: string, data: Record<string, unknown>): Promise<void> {
    await this.log({ action: 'DELETE', resourceType, resourceId, oldData: data });
  }

  async logStatusChange(resourceType: string, resourceId: string, oldStatus: string, newStatus: string): Promise<void> {
    await this.log({
      action: 'STATUS_CHANGE',
      resourceType,
      resourceId,
      oldData: { status: oldStatus },
      newData: { status: newStatus }
    });
  }

  async logLogin(success: boolean, email?: string): Promise<void> {
    await this.log({
      action: success ? 'LOGIN' : 'LOGIN_FAILED',
      resourceType: 'auth',
      metadata: { email }
    });
  }

  async logLogout(): Promise<void> {
    await this.log({ action: 'LOGOUT', resourceType: 'auth' });
  }

  private async getClientIP(): Promise<string | undefined> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return undefined;
    }
  }

  private mapFromDatabase(row: Record<string, unknown>): AuditLog {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      action: row.action as string,
      resourceType: row.resource_type as string,
      resourceId: row.resource_id as string,
      oldData: row.old_data as Record<string, unknown>,
      newData: row.new_data as Record<string, unknown>,
      ipAddress: row.ip_address as string,
      userAgent: row.user_agent as string,
      metadata: (row.metadata as Record<string, unknown>) || {},
      createdAt: row.created_at as string
    };
  }
}

export const auditService = new AuditService();
