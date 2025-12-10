import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DeliberationNotificationRequest {
  deliberationId: string;
  deliberationNumero: string;
  deliberationTitle: string;
  sessionDate: string;
  resultat?: string;
  votesPour?: number;
  votesContre?: number;
  abstentions?: number;
  recipientEmails?: string[];
  notifyAllCitizens?: boolean;
}

const resultLabels: Record<string, string> = {
  'ADOPTED': 'Adoptée',
  'REJECTED': 'Rejetée',
  'POSTPONED': 'Reportée',
  'WITHDRAWN': 'Retirée'
};

const resultColors: Record<string, string> = {
  'ADOPTED': '#16a34a',
  'REJECTED': '#dc2626',
  'POSTPONED': '#f59e0b',
  'WITHDRAWN': '#6b7280'
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      deliberationId,
      deliberationNumero,
      deliberationTitle,
      sessionDate,
      resultat,
      votesPour,
      votesContre,
      abstentions,
      recipientEmails,
      notifyAllCitizens
    }: DeliberationNotificationRequest = await req.json();

    console.log(`Processing notification for deliberation: ${deliberationNumero}`);

    let emailList: string[] = recipientEmails || [];

    if (notifyAllCitizens) {
      // Get users who have email_deliberations enabled
      const { data: prefsWithDelibs, error: prefsError } = await supabase
        .from('notification_preferences')
        .select('user_id')
        .eq('email_deliberations', true);

      if (prefsError) {
        console.error('Error fetching notification preferences:', prefsError);
      }

      const userIdsWithPrefs = prefsWithDelibs?.map(p => p.user_id) || [];
      console.log(`Found ${userIdsWithPrefs.length} users with email_deliberations enabled`);

      if (userIdsWithPrefs.length > 0) {
        const { data: profilesWithPrefs, error: profilesError } = await supabase
          .from('profiles')
          .select('email')
          .in('user_id', userIdsWithPrefs)
          .not('email', 'is', null);

        if (profilesError) {
          console.error('Error fetching profiles with prefs:', profilesError);
        } else if (profilesWithPrefs) {
          emailList = [...emailList, ...profilesWithPrefs.map(p => p.email).filter(Boolean)];
        }
      }

      // Get users without preferences (default to receiving)
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('user_id, email')
        .not('email', 'is', null);

      if (!allProfilesError && allProfiles) {
        const { data: allPrefs } = await supabase
          .from('notification_preferences')
          .select('user_id');
        
        const usersWithPrefs = new Set((allPrefs || []).map(p => p.user_id));
        const defaultUsers = allProfiles.filter(p => !usersWithPrefs.has(p.user_id));
        console.log(`Found ${defaultUsers.length} users with default preferences`);
        
        emailList = [...emailList, ...defaultUsers.map(p => p.email).filter(Boolean)];
      }
    }

    emailList = [...new Set(emailList)];
    console.log(`Total recipients: ${emailList.length}`);

    if (emailList.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Aucun destinataire trouvé" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const formattedDate = new Date(sessionDate).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < emailList.length; i += batchSize) {
      batches.push(emailList.slice(i, i + batchSize));
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const batch of batches) {
      try {
        await resend.emails.send({
          from: "Mairie de Libreville <notifications@mairie.libreville.ga>",
          to: batch,
          subject: `Nouvelle Délibération : ${deliberationTitle}`,
          html: `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="https://mairie.libreville.ga/assets/logo_libreville.png" alt="Mairie de Libreville" style="height: 80px;" />
              </div>
              
              <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 24px;">Délibération du Conseil Municipal</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Séance du ${formattedDate}</p>
              </div>
              
              <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 25px;">
                <h2 style="margin: 0 0 15px 0; color: #1e3a8a; font-size: 20px;">
                  ${deliberationTitle}
                </h2>
                <p style="margin: 0 0 15px 0; font-family: monospace; color: #64748b;">${deliberationNumero}</p>
                
                ${resultat ? `
                <div style="text-align: center; padding: 15px; background: ${resultColors[resultat]}15; border: 2px solid ${resultColors[resultat]}; border-radius: 8px; margin-bottom: 15px;">
                  <p style="margin: 0; font-size: 18px; font-weight: bold; color: ${resultColors[resultat]};">
                    Délibération ${resultLabels[resultat] || resultat}
                  </p>
                </div>
                ` : ''}
                
                ${(votesPour !== undefined || votesContre !== undefined) ? `
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                  <tr>
                    <td style="padding: 10px; text-align: center; background: #dcfce7; border-radius: 8px 0 0 8px;">
                      <p style="margin: 0; color: #16a34a; font-weight: bold; font-size: 24px;">${votesPour || 0}</p>
                      <p style="margin: 5px 0 0 0; color: #16a34a; font-size: 12px;">POUR</p>
                    </td>
                    <td style="padding: 10px; text-align: center; background: #fee2e2;">
                      <p style="margin: 0; color: #dc2626; font-weight: bold; font-size: 24px;">${votesContre || 0}</p>
                      <p style="margin: 5px 0 0 0; color: #dc2626; font-size: 12px;">CONTRE</p>
                    </td>
                    <td style="padding: 10px; text-align: center; background: #fef3c7; border-radius: 0 8px 8px 0;">
                      <p style="margin: 0; color: #d97706; font-weight: bold; font-size: 24px;">${abstentions || 0}</p>
                      <p style="margin: 5px 0 0 0; color: #d97706; font-size: 12px;">ABSTENTIONS</p>
                    </td>
                  </tr>
                </table>
                ` : ''}
              </div>
              
              <div style="text-align: center; margin-bottom: 25px;">
                <a href="https://mairie.libreville.ga/deliberations" style="display: inline-block; background: #059669; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  Consulter la délibération
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              
              <footer style="text-align: center; color: #94a3b8; font-size: 12px;">
                <p style="margin: 0;">Mairie de Libreville - Conseil Municipal</p>
                <p style="margin: 5px 0;">BP : 44 Boulevard Triomphal/LBV</p>
                <p style="margin: 15px 0 0 0; font-size: 11px;">
                  Vous recevez cet email car vous avez activé les notifications pour les délibérations.
                </p>
              </footer>
            </body>
            </html>
          `,
        });
        successCount += batch.length;
      } catch (batchError: any) {
        console.error("Error sending batch:", batchError);
        errorCount += batch.length;
        errors.push(batchError.message || 'Unknown error');
      }
    }

    // Log notification
    try {
      await supabase.from('correspondence_logs').insert({
        sender_id: '00000000-0000-0000-0000-000000000000',
        recipient_email: `${emailList.length} destinataires`,
        recipient_name: `Notification délibération - ${successCount} réussies`,
        subject: `Notification délibération: ${deliberationTitle}`,
        content: `Notification de la délibération ${deliberationNumero}`,
        status: errorCount === 0 ? 'SENT' : (successCount > 0 ? 'DELIVERED' : 'FAILED'),
        sent_at: new Date().toISOString(),
        metadata: { 
          deliberationId,
          deliberationNumero,
          resultat,
          successCount, 
          errorCount,
          totalRecipients: emailList.length,
          notificationType: 'DELIBERATION'
        }
      });
    } catch (logError) {
      console.error('Error logging notification:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: successCount > 0, 
        message: `Notification envoyée à ${successCount} destinataires`,
        successCount,
        errorCount,
        totalRecipients: emailList.length
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-deliberation-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
