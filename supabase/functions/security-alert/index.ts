import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SecurityAlertRequest {
  alertType: "LOGIN_FAILED_REPEATED" | "SENSITIVE_DELETE" | "UNAUTHORIZED_ACCESS" | "SUSPICIOUS_ACTIVITY";
  userId?: string;
  userEmail?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
}

const ALERT_TEMPLATES = {
  LOGIN_FAILED_REPEATED: {
    subject: "🚨 Alerte Sécurité: Tentatives de connexion répétées",
    getHtml: (data: SecurityAlertRequest) => `
      <h1 style="color: #dc2626;">Alerte de Sécurité</h1>
      <p><strong>Type:</strong> Tentatives de connexion répétées échouées</p>
      <p><strong>Email concerné:</strong> ${data.userEmail || 'N/A'}</p>
      <p><strong>Adresse IP:</strong> ${data.ipAddress || 'N/A'}</p>
      <p><strong>Nombre de tentatives:</strong> ${data.details?.attempts || 'N/A'}</p>
      <p><strong>Période:</strong> ${data.details?.period || 'N/A'}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
      <hr />
      <p style="color: #666;">Cette alerte a été générée automatiquement par le système de surveillance.</p>
    `
  },
  SENSITIVE_DELETE: {
    subject: "🚨 Alerte Sécurité: Suppression de données sensibles",
    getHtml: (data: SecurityAlertRequest) => `
      <h1 style="color: #dc2626;">Alerte de Sécurité</h1>
      <p><strong>Type:</strong> Suppression de données sensibles</p>
      <p><strong>Utilisateur:</strong> ${data.userEmail || data.userId || 'N/A'}</p>
      <p><strong>Ressource:</strong> ${data.details?.resourceType || 'N/A'}</p>
      <p><strong>ID Ressource:</strong> ${data.details?.resourceId || 'N/A'}</p>
      <p><strong>Adresse IP:</strong> ${data.ipAddress || 'N/A'}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
      <hr />
      <p style="color: #666;">Cette alerte a été générée automatiquement par le système de surveillance.</p>
    `
  },
  UNAUTHORIZED_ACCESS: {
    subject: "🚨 Alerte Sécurité: Tentative d'accès non autorisé",
    getHtml: (data: SecurityAlertRequest) => `
      <h1 style="color: #dc2626;">Alerte de Sécurité</h1>
      <p><strong>Type:</strong> Tentative d'accès non autorisé</p>
      <p><strong>Utilisateur:</strong> ${data.userEmail || data.userId || 'N/A'}</p>
      <p><strong>Ressource ciblée:</strong> ${data.details?.targetResource || 'N/A'}</p>
      <p><strong>Action tentée:</strong> ${data.details?.attemptedAction || 'N/A'}</p>
      <p><strong>Adresse IP:</strong> ${data.ipAddress || 'N/A'}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
      <hr />
      <p style="color: #666;">Cette alerte a été générée automatiquement par le système de surveillance.</p>
    `
  },
  SUSPICIOUS_ACTIVITY: {
    subject: "🚨 Alerte Sécurité: Activité suspecte détectée",
    getHtml: (data: SecurityAlertRequest) => `
      <h1 style="color: #dc2626;">Alerte de Sécurité</h1>
      <p><strong>Type:</strong> Activité suspecte</p>
      <p><strong>Utilisateur:</strong> ${data.userEmail || data.userId || 'N/A'}</p>
      <p><strong>Description:</strong> ${data.details?.description || 'N/A'}</p>
      <p><strong>Adresse IP:</strong> ${data.ipAddress || 'N/A'}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
      <hr />
      <p style="color: #666;">Cette alerte a été générée automatiquement par le système de surveillance.</p>
    `
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("[security-alert] Request received");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const alertData: SecurityAlertRequest = await req.json();
    console.log("[security-alert] Alert type:", alertData.alertType);

    // Get admin emails to notify
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "super_admin");

    if (!adminRoles || adminRoles.length === 0) {
      console.log("[security-alert] No super admins found");
      return new Response(
        JSON.stringify({ success: false, message: "No admins to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get admin emails from profiles
    const adminUserIds = adminRoles.map(r => r.user_id);
    const { data: adminProfiles } = await supabase
      .from("profiles")
      .select("email")
      .in("user_id", adminUserIds);

    const adminEmails = adminProfiles?.map(p => p.email).filter(Boolean) || [];
    
    if (adminEmails.length === 0) {
      console.log("[security-alert] No admin emails found");
      return new Response(
        JSON.stringify({ success: false, message: "No admin emails found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[security-alert] Sending to admins:", adminEmails);

    const template = ALERT_TEMPLATES[alertData.alertType];
    if (!template) {
      throw new Error(`Unknown alert type: ${alertData.alertType}`);
    }

    // Send email to all admins using fetch
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Sécurité Mairie <onboarding@resend.dev>",
        to: adminEmails,
        subject: template.subject,
        html: template.getHtml(alertData),
      }),
    });

    const emailResult = await emailResponse.json();

    console.log("[security-alert] Email sent:", emailResult);

    // Log the alert in audit_logs
    await supabase.from("audit_logs").insert({
      action: "SECURITY_ALERT",
      resource_type: "security",
      metadata: {
        alert_type: alertData.alertType,
        details: alertData.details,
        notified_admins: adminEmails,
      },
      ip_address: alertData.ipAddress,
      user_id: alertData.userId,
    });

    return new Response(
      JSON.stringify({ success: true, emailResult }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[security-alert] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
