import { supabase } from "@/integrations/supabase/client";
import { invokeWithDemoFallback } from "@/utils/demoMode";

/**
 * Records a login attempt in the database and triggers security alert if needed
 */
export async function recordLoginAttempt(
  email: string,
  success: boolean,
  ipAddress?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("login_attempts")
      .insert({
        email,
        success,
        ip_address: ipAddress || null,
      });

    if (error) {
      console.error("Failed to record login attempt:", error);
    }

    // If login failed, check for suspicious activity and trigger alert
    if (!success) {
      checkAndTriggerSecurityAlert(email, ipAddress);
    }
  } catch (err) {
    // Don't throw - logging should not break the login flow
    console.error("Error recording login attempt:", err);
  }
}

interface SecurityAlertResponse {
  alert_sent: boolean;
  message?: string;
}

/**
 * Checks for suspicious activity and triggers security alert if needed
 * This runs in the background and doesn't block the login flow
 */
async function checkAndTriggerSecurityAlert(email: string, ipAddress?: string): Promise<void> {
  try {
    const { data, error, isDemo } = await invokeWithDemoFallback<SecurityAlertResponse>(
      'security-alert-login',
      { email, ip_address: ipAddress }
    );

    if (error) {
      console.error("Error calling security alert function:", error);
      return;
    }

    if (isDemo) {
      console.log("[Security] Demo mode - alert simulated for email:", email);
      return;
    }

    if (data?.alert_sent) {
      console.log("Security alert sent for email:", email);
    }
  } catch (err) {
    console.error("Error triggering security alert:", err);
  }
}

/**
 * Gets the client's IP address (best effort)
 */
export async function getClientIP(): Promise<string | undefined> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch {
    return undefined;
  }
}
