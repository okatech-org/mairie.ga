import { supabase } from "@/integrations/supabase/client";

/**
 * Records a login attempt in the database and triggers security alert if needed
 */
export async function recordLoginAttempt(
  email: string,
  success: boolean,
  ipAddress?: string
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("login_attempts").insert({
      email,
      success,
      ip_address: ipAddress || null,
    });

    if (error) console.error("Failed to record login attempt:", error);
  } catch (err) {
    // Don't throw - logging should not break the login flow
    console.error("Error recording login attempt:", err);
  }
}

/**
 * Gets the client's IP address (best effort)
 */
export async function getClientIP(): Promise<string | undefined> {
  return undefined;
}
