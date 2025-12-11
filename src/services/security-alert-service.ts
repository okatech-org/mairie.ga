/**
 * Security Alert Service
 * Monitors critical actions and triggers alerts
 */

import { supabase } from '@/integrations/supabase/client';

export type SecurityAlertType = 
  | 'LOGIN_FAILED_REPEATED' 
  | 'SENSITIVE_DELETE' 
  | 'UNAUTHORIZED_ACCESS' 
  | 'SUSPICIOUS_ACTIVITY';

interface SecurityAlert {
  alertType: SecurityAlertType;
  userId?: string;
  userEmail?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
}

class SecurityAlertService {
  private readonly FAILED_LOGIN_THRESHOLD = 5;
  private readonly FAILED_LOGIN_WINDOW_MINUTES = 15;

  /**
   * Send a security alert to admins
   */
  async sendAlert(alert: SecurityAlert): Promise<void> {
    try {
      console.log('[SecurityAlertService] Sending alert:', alert.alertType);
      
      const { error } = await supabase.functions.invoke('security-alert', {
        body: alert
      });

      if (error) {
        console.error('[SecurityAlertService] Failed to send alert:', error);
      } else {
        console.log('[SecurityAlertService] Alert sent successfully');
      }
    } catch (err) {
      console.error('[SecurityAlertService] Error sending alert:', err);
    }
  }

  /**
   * Check for repeated failed login attempts
   */
  async checkFailedLogins(email: string, ipAddress?: string): Promise<void> {
    try {
      const windowStart = new Date();
      windowStart.setMinutes(windowStart.getMinutes() - this.FAILED_LOGIN_WINDOW_MINUTES);

      const { data: attempts, error } = await supabase
        .from('login_attempts')
        .select('id')
        .eq('email', email)
        .eq('success', false)
        .gte('created_at', windowStart.toISOString());

      if (error) {
        console.error('[SecurityAlertService] Error checking login attempts:', error);
        return;
      }

      if (attempts && attempts.length >= this.FAILED_LOGIN_THRESHOLD) {
        await this.sendAlert({
          alertType: 'LOGIN_FAILED_REPEATED',
          userEmail: email,
          ipAddress,
          details: {
            attempts: attempts.length,
            period: `${this.FAILED_LOGIN_WINDOW_MINUTES} minutes`,
            threshold: this.FAILED_LOGIN_THRESHOLD
          }
        });
      }
    } catch (err) {
      console.error('[SecurityAlertService] Error in checkFailedLogins:', err);
    }
  }

  /**
   * Alert on sensitive data deletion
   */
  async alertSensitiveDelete(
    resourceType: string,
    resourceId: string,
    userId?: string,
    userEmail?: string
  ): Promise<void> {
    const sensitiveResources = ['profiles', 'organizations', 'user_roles', 'requests'];
    
    if (sensitiveResources.includes(resourceType)) {
      await this.sendAlert({
        alertType: 'SENSITIVE_DELETE',
        userId,
        userEmail,
        details: {
          resourceType,
          resourceId
        }
      });
    }
  }

  /**
   * Alert on unauthorized access attempt
   */
  async alertUnauthorizedAccess(
    targetResource: string,
    attemptedAction: string,
    userId?: string,
    userEmail?: string,
    ipAddress?: string
  ): Promise<void> {
    await this.sendAlert({
      alertType: 'UNAUTHORIZED_ACCESS',
      userId,
      userEmail,
      ipAddress,
      details: {
        targetResource,
        attemptedAction
      }
    });
  }

  /**
   * Alert on suspicious activity
   */
  async alertSuspiciousActivity(
    description: string,
    userId?: string,
    userEmail?: string,
    ipAddress?: string,
    additionalDetails?: Record<string, unknown>
  ): Promise<void> {
    await this.sendAlert({
      alertType: 'SUSPICIOUS_ACTIVITY',
      userId,
      userEmail,
      ipAddress,
      details: {
        description,
        ...additionalDetails
      }
    });
  }
}

export const securityAlertService = new SecurityAlertService();
