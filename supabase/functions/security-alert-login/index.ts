import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Configuration
const FAILED_ATTEMPTS_THRESHOLD = 5; // Alert after 5 failed attempts
const TIME_WINDOW_MINUTES = 15; // Within 15 minutes
const ADMIN_EMAIL = "admin@mairie.ga"; // Admin email for alerts

interface AlertRequest {
  email: string;
  ip_address?: string;
}

// Send email using Resend API
async function sendAlertEmail(
  email: string,
  failedCount: number,
  ipAddress: string | undefined,
  uniqueIPs: string[]
): Promise<boolean> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return false;
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🚨 Alerte Sécurité</h1>
      </div>
      
      <div style="background: #fef2f2; padding: 20px; border: 1px solid #fecaca;">
        <h2 style="color: #991b1b; margin-top: 0;">Tentatives de connexion suspectes détectées</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #fecaca; font-weight: bold; color: #7f1d1d;">Email ciblé:</td>
            <td style="padding: 10px; border-bottom: 1px solid #fecaca;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #fecaca; font-weight: bold; color: #7f1d1d;">Tentatives échouées:</td>
            <td style="padding: 10px; border-bottom: 1px solid #fecaca;">${failedCount} en ${TIME_WINDOW_MINUTES} minutes</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #fecaca; font-weight: bold; color: #7f1d1d;">Dernière IP:</td>
            <td style="padding: 10px; border-bottom: 1px solid #fecaca;">${ipAddress || 'Non disponible'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #fecaca; font-weight: bold; color: #7f1d1d;">IPs uniques:</td>
            <td style="padding: 10px; border-bottom: 1px solid #fecaca;">${uniqueIPs.length > 0 ? uniqueIPs.join(', ') : 'Non disponible'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; color: #7f1d1d;">Date/Heure:</td>
            <td style="padding: 10px;">${new Date().toISOString()}</td>
          </tr>
        </table>
        
        <div style="background: #fee2e2; padding: 15px; border-radius: 6px; margin-top: 20px;">
          <strong style="color: #991b1b;">Actions recommandées:</strong>
          <ul style="color: #7f1d1d; margin: 10px 0 0 0; padding-left: 20px;">
            <li>Vérifier si le compte existe et est légitime</li>
            <li>Considérer le blocage temporaire de l'IP source</li>
            <li>Contacter le propriétaire du compte si nécessaire</li>
            <li>Vérifier les logs de sécurité pour d'autres anomalies</li>
          </ul>
        </div>
      </div>
      
      <div style="background: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6b7280;">
        <p style="margin: 0;">Cet email a été envoyé automatiquement par le système de sécurité MAIRIE.GA</p>
      </div>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Sécurité MAIRIE.GA <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: "🚨 Alerte Sécurité: Tentatives de connexion suspectes",
        html: htmlContent,
      }),
    });

    const result = await response.json();
    console.log("Resend API response:", result);
    return response.ok;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleError) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!roleData?.role || !["super_admin", "admin"].includes(roleData.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    
    const { email, ip_address }: AlertRequest = await req.json();
    
    console.log(`Checking failed attempts for email: ${email}`);
    
    // Calculate time window
    const timeWindowStart = new Date();
    timeWindowStart.setMinutes(timeWindowStart.getMinutes() - TIME_WINDOW_MINUTES);
    
    // Count failed attempts in the time window
    const { data: failedAttempts, error: countError } = await supabase
      .from("login_attempts")
      .select("id, created_at, ip_address")
      .eq("email", email)
      .eq("success", false)
      .gte("created_at", timeWindowStart.toISOString())
      .order("created_at", { ascending: false });
    
    if (countError) {
      console.error("Error counting failed attempts:", countError);
      throw countError;
    }
    
    const failedCount = failedAttempts?.length || 0;
    console.log(`Found ${failedCount} failed attempts in the last ${TIME_WINDOW_MINUTES} minutes`);
    
    // Check if threshold exceeded
    if (failedCount >= FAILED_ATTEMPTS_THRESHOLD) {
      console.log(`Threshold exceeded! Sending alert email...`);
      
      // Get unique IPs used
      const uniqueIPs = [...new Set(failedAttempts?.map(a => a.ip_address).filter(Boolean))] as string[];
      
      // Send alert email
      const emailSent = await sendAlertEmail(email, failedCount, ip_address, uniqueIPs);

      return new Response(
        JSON.stringify({ 
          alert_sent: emailSent, 
          failed_attempts: failedCount,
          message: emailSent ? "Alerte de sécurité envoyée" : "Échec de l'envoi de l'alerte"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        alert_sent: false, 
        failed_attempts: failedCount,
        threshold: FAILED_ATTEMPTS_THRESHOLD,
        message: "Pas d'alerte nécessaire" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in security-alert-login function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
