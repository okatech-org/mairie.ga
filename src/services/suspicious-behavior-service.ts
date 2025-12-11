/**
 * Suspicious Behavior Detection Service
 * Monitors audit logs for suspicious patterns and triggers alerts
 */

import { supabase } from '@/integrations/supabase/client';
import { securityAlertService } from './security-alert-service';

interface SuspiciousRule {
  id: string;
  name: string;
  description: string;
  action: string;
  threshold: number;
  windowMinutes: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface DetectionResult {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  count: number;
  threshold: number;
  severity: string;
  userId?: string;
  details?: Record<string, unknown>;
}

// Default rules for suspicious behavior detection
const DEFAULT_RULES: SuspiciousRule[] = [
  {
    id: 'mass_deletion',
    name: 'Suppression massive',
    description: 'Plus de 10 suppressions en 1 heure',
    action: 'DELETE',
    threshold: 10,
    windowMinutes: 60,
    severity: 'critical'
  },
  {
    id: 'rapid_login_failures',
    name: 'Échecs de connexion rapides',
    description: 'Plus de 5 échecs de connexion en 15 minutes',
    action: 'LOGIN_FAILED',
    threshold: 5,
    windowMinutes: 15,
    severity: 'high'
  },
  {
    id: 'mass_export',
    name: 'Export massif de données',
    description: 'Plus de 20 exports en 1 heure',
    action: 'EXPORT',
    threshold: 20,
    windowMinutes: 60,
    severity: 'high'
  },
  {
    id: 'rapid_status_changes',
    name: 'Changements de statut rapides',
    description: 'Plus de 50 changements de statut en 30 minutes',
    action: 'STATUS_CHANGE',
    threshold: 50,
    windowMinutes: 30,
    severity: 'medium'
  },
  {
    id: 'off_hours_activity',
    name: 'Activité hors heures',
    description: 'Plus de 100 actions entre 22h et 6h',
    action: '*', // Any action
    threshold: 100,
    windowMinutes: 480, // 8 hours
    severity: 'medium'
  },
  {
    id: 'mass_updates',
    name: 'Modifications massives',
    description: 'Plus de 100 modifications en 30 minutes',
    action: 'UPDATE',
    threshold: 100,
    windowMinutes: 30,
    severity: 'high'
  }
];

const auditLogsTable = () => (supabase as any).from('audit_logs');

class SuspiciousBehaviorService {
  private rules: SuspiciousRule[] = DEFAULT_RULES;

  /**
   * Check all rules and return any that are triggered
   */
  async checkAllRules(userId?: string): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];

    for (const rule of this.rules) {
      const result = await this.checkRule(rule, userId);
      results.push(result);
    }

    return results;
  }

  /**
   * Check a specific rule
   */
  async checkRule(rule: SuspiciousRule, userId?: string): Promise<DetectionResult> {
    try {
      const windowStart = new Date();
      windowStart.setMinutes(windowStart.getMinutes() - rule.windowMinutes);

      let query = auditLogsTable()
        .select('id, user_id', { count: 'exact' })
        .gte('created_at', windowStart.toISOString());

      if (rule.action !== '*') {
        query = query.eq('action', rule.action);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { count, error } = await query;

      if (error) {
        console.error(`[SuspiciousBehaviorService] Error checking rule ${rule.id}:`, error);
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          triggered: false,
          count: 0,
          threshold: rule.threshold,
          severity: rule.severity
        };
      }

      const triggered = (count || 0) >= rule.threshold;

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        triggered,
        count: count || 0,
        threshold: rule.threshold,
        severity: rule.severity,
        userId,
        details: {
          windowMinutes: rule.windowMinutes,
          description: rule.description
        }
      };
    } catch (err) {
      console.error(`[SuspiciousBehaviorService] Error in checkRule:`, err);
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        triggered: false,
        count: 0,
        threshold: rule.threshold,
        severity: rule.severity
      };
    }
  }

  /**
   * Run detection and send alerts for triggered rules
   */
  async runDetectionAndAlert(): Promise<DetectionResult[]> {
    const results = await this.checkAllRules();
    const triggeredRules = results.filter(r => r.triggered);

    for (const result of triggeredRules) {
      await securityAlertService.alertSuspiciousActivity(
        `Règle "${result.ruleName}" déclenchée: ${result.count} occurrences (seuil: ${result.threshold})`,
        result.userId,
        undefined,
        undefined,
        {
          ruleId: result.ruleId,
          severity: result.severity,
          ...result.details
        }
      );
    }

    return triggeredRules;
  }

  /**
   * Get summary of current suspicious activity status
   */
  async getSuspiciousActivitySummary(): Promise<{
    totalTriggered: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    triggeredRules: DetectionResult[];
  }> {
    const results = await this.checkAllRules();
    const triggered = results.filter(r => r.triggered);

    return {
      totalTriggered: triggered.length,
      criticalCount: triggered.filter(r => r.severity === 'critical').length,
      highCount: triggered.filter(r => r.severity === 'high').length,
      mediumCount: triggered.filter(r => r.severity === 'medium').length,
      lowCount: triggered.filter(r => r.severity === 'low').length,
      triggeredRules: triggered
    };
  }

  /**
   * Get the current rules
   */
  getRules(): SuspiciousRule[] {
    return [...this.rules];
  }

  /**
   * Add a custom rule
   */
  addRule(rule: SuspiciousRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove a rule by ID
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  /**
   * Update a rule
   */
  updateRule(ruleId: string, updates: Partial<SuspiciousRule>): void {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates };
    }
  }
}

export const suspiciousBehaviorService = new SuspiciousBehaviorService();
