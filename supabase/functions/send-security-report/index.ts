import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReportRequest {
  recipients: string[];
  isTest?: boolean;
  config?: {
    includeSummary?: boolean;
    includeCharts?: boolean;
    includeUnresolvedAlerts?: boolean;
  };
  alertData?: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    unresolved: number;
    topRules: Array<{ name: string; count: number }>;
    unresolvedAlerts: Array<{
      ruleName: string;
      severity: string;
      triggeredAt: string;
      count: number;
    }>;
  };
}

function generateEmailHtml(request: ReportRequest): string {
  const { isTest, config, alertData } = request;
  const reportDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Default mock data for test reports
  const data = alertData || {
    total: 12,
    critical: 2,
    high: 5,
    medium: 4,
    low: 1,
    unresolved: 3,
    topRules: [
      { name: "Suppression massive", count: 4 },
      { name: "Échecs de connexion rapides", count: 3 },
      { name: "Export massif de données", count: 2 }
    ],
    unresolvedAlerts: [
      { ruleName: "Modifications massives", severity: "high", triggeredAt: new Date().toISOString(), count: 120 },
      { ruleName: "Échecs de connexion rapides", severity: "high", triggeredAt: new Date().toISOString(), count: 8 },
      { ruleName: "Suppression massive", severity: "critical", triggeredAt: new Date().toISOString(), count: 15 }
    ]
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#ca8a04';
      case 'low': return '#2563eb';
      default: return '#6b7280';
    }
  };

  const getSeverityLabel = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'Critique';
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return severity;
    }
  };

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rapport de Sécurité Hebdomadaire</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🛡️ Rapport de Sécurité Hebdomadaire</h1>
          <p style="margin: 10px 0 0; opacity: 0.9; font-size: 14px;">${reportDate}</p>
          ${isTest ? '<div style="margin-top: 15px; background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block; font-size: 12px;">📧 Rapport de test</div>' : ''}
        </div>

        <!-- Content -->
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          ${config?.includeSummary !== false ? `
          <!-- Summary Stats -->
          <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            📊 Résumé des 7 derniers jours
          </h2>
          
          <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 30px;">
            <div style="flex: 1; min-width: 100px; background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0;">
              <div style="font-size: 28px; font-weight: bold; color: #1e40af;">${data.total}</div>
              <div style="font-size: 12px; color: #64748b;">Total alertes</div>
            </div>
            <div style="flex: 1; min-width: 100px; background: #fef2f2; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #fecaca;">
              <div style="font-size: 28px; font-weight: bold; color: #dc2626;">${data.critical}</div>
              <div style="font-size: 12px; color: #991b1b;">Critiques</div>
            </div>
            <div style="flex: 1; min-width: 100px; background: #fff7ed; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #fed7aa;">
              <div style="font-size: 28px; font-weight: bold; color: #ea580c;">${data.high}</div>
              <div style="font-size: 12px; color: #9a3412;">Hautes</div>
            </div>
            <div style="flex: 1; min-width: 100px; background: #fefce8; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #fef08a;">
              <div style="font-size: 28px; font-weight: bold; color: #ca8a04;">${data.medium}</div>
              <div style="font-size: 12px; color: #854d0e;">Moyennes</div>
            </div>
          </div>

          <!-- Top Rules -->
          <h3 style="color: #374151; font-size: 14px; margin: 0 0 12px;">Règles les plus déclenchées</h3>
          <div style="margin-bottom: 30px;">
            ${data.topRules.map((rule, index) => `
              <div style="display: flex; align-items: center; padding: 10px; background: ${index % 2 === 0 ? '#f9fafb' : 'white'}; border-radius: 6px; margin-bottom: 4px;">
                <div style="width: 24px; height: 24px; background: #3b82f6; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 12px;">${index + 1}</div>
                <div style="flex: 1; font-size: 14px; color: #374151;">${rule.name}</div>
                <div style="font-weight: bold; color: #1e40af;">${rule.count}</div>
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${config?.includeUnresolvedAlerts !== false && data.unresolved > 0 ? `
          <!-- Unresolved Alerts -->
          <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            ⚠️ Alertes non résolues (${data.unresolved})
          </h2>
          
          <div style="margin-bottom: 20px;">
            ${data.unresolvedAlerts.slice(0, 5).map(alert => `
              <div style="padding: 12px; border-left: 4px solid ${getSeverityColor(alert.severity)}; background: #f9fafb; margin-bottom: 8px; border-radius: 0 8px 8px 0;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                  <span style="font-weight: bold; color: #1f2937;">${alert.ruleName}</span>
                  <span style="background: ${getSeverityColor(alert.severity)}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${getSeverityLabel(alert.severity)}</span>
                </div>
                <div style="font-size: 12px; color: #6b7280;">
                  ${alert.count} occurrences détectées
                </div>
              </div>
            `).join('')}
          </div>
          ` : ''}

          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0 20px;">
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/dashboard/super-admin/security-rules" 
               style="display: inline-block; background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
              Voir le tableau de bord →
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p style="margin: 0;">Ce rapport est généré automatiquement par le système de sécurité.</p>
          <p style="margin: 5px 0 0;">Pour modifier les paramètres, accédez à la configuration des rapports.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: ReportRequest = await req.json();
    
    if (!request.recipients || request.recipients.length === 0) {
      throw new Error("Aucun destinataire spécifié");
    }

    console.log(`[send-security-report] Sending report to ${request.recipients.length} recipients`);
    console.log(`[send-security-report] Is test: ${request.isTest}`);

    const html = generateEmailHtml(request);
    const subject = request.isTest 
      ? "🧪 [TEST] Rapport de Sécurité Hebdomadaire" 
      : "🛡️ Rapport de Sécurité Hebdomadaire";

    const emailResponse = await resend.emails.send({
      from: "Sécurité <onboarding@resend.dev>",
      to: request.recipients,
      subject,
      html,
    });

    console.log("[send-security-report] Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("[send-security-report] Error:", error);
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
