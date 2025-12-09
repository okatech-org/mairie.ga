import { supabase } from "@/integrations/supabase/client";

/**
 * Records a login attempt in the database
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
  } catch (err) {
    // Don't throw - logging should not break the login flow
    console.error("Error recording login attempt:", err);
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
