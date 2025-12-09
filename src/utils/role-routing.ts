import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

/**
 * Returns the appropriate dashboard route based on user role
 */
export function getDashboardRouteByRole(role: AppRole | null): string {
  switch (role) {
    case "super_admin":
      return "/dashboard/super-admin";
    case "admin":
      return "/dashboard/maire";
    case "agent":
      return "/dashboard/agent";
    case "citizen":
    default:
      return "/dashboard/citizen";
  }
}

/**
 * Role labels for display
 */
export const roleLabels: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admin: "Administrateur",
  agent: "Agent",
  citizen: "Citoyen",
};
