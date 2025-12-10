import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ArreteNotificationRequest {
  arreteId: string;
  arreteNumero: string;
  arreteTitle: string;
  arreteType: string;
  datePublication: string;
  signataire?: string;
  recipientEmails?: string[];
  notifyAllCitizens?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      arreteId,
      arreteNumero,
      arreteTitle,
      arreteType,
      datePublication,
      signataire,
      recipientEmails,
      notifyAllCitizens
    }: ArreteNotificationRequest = await req.json();

    console.log(`Processing notification for arrete: ${arreteNumero}`);

    let emailList: string[] = recipientEmails || [];

    // If notifyAllCitizens is true, fetch citizens who have email_arretes enabled
    if (notifyAllCitizens) {
      // First get users who have notification preferences with email_arretes = true
      const { data: prefsWithArretes, error: prefsError } = await supabase
        .from('notification_preferences')
        .select('user_id')
        .eq('email_arretes', true);

      if (prefsError) {
        console.error('Error fetching notification preferences:', prefsError);
      }

      const userIdsWithPrefs = prefsWithArretes?.map(p => p.user_id) || [];
      console.log(`Found ${userIdsWithPrefs.length} users with email_arretes enabled`);

      // Get emails for these users
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

      // Also get users who don't have preferences set (default to receiving arretes)
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('user_id, email')
        .not('email', 'is', null);

      if (allProfilesError) {
        console.error('Error fetching all profiles:', allProfilesError);
      } else if (allProfiles) {
        // Get user IDs who have explicitly set preferences
        const { data: allPrefs } = await supabase
          .from('notification_preferences')
          .select('user_id');
        
        const usersWithPrefs = new Set((allPrefs || []).map(p => p.user_id));
        
        // Add users who haven't set preferences (default behavior is to receive notifications)
        const defaultUsers = allProfiles.filter(p => !usersWithPrefs.has(p.user_id));
        console.log(`Found ${defaultUsers.length} users with default preferences (will receive)`);
        
        emailList = [...emailList, ...defaultUsers.map(p => p.email).filter(Boolean)];
      }
    }

    // Remove duplicates
    emailList = [...new Set(emailList)];
    console.log(`Total recipients after filtering: ${emailList.length}`);

    if (emailList.length === 0) {
      console.log('No recipients found after filtering');
      return new Response(
        JSON.stringify({ success: false, message: "Aucun destinataire trouvé avec les notifications arrêtés activées" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const typeLabels: Record<string, string> = {
      'MUNICIPAL': 'Arrêté Municipal',
      'INDIVIDUEL': 'Arrêté Individuel',
      'REGLEMENTAIRE': 'Arrêté Réglementaire',
      'TEMPORAIRE': 'Arrêté Temporaire'
    };

    const formattedDate = new Date(datePublication).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Send emails in batches of 50
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
        console.log(`Sending batch of ${batch.length} emails`);
        const emailResponse = await resend.emails.send({
          from: "Mairie de Libreville <notifications@mairie.libreville.ga>",
          to: batch,
          subject: `Nouvel Arrêté Publié : ${arreteTitle}`,
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
              
              <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 24px;">Publication d'un Nouvel Arrêté</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Mairie de Libreville</p>
              </div>
              
              <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 25px;">
                <p style="margin: 0 0 15px 0; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                  ${typeLabels[arreteType] || arreteType}
                </p>
                <h2 style="margin: 0 0 15px 0; color: #1e3a8a; font-size: 20px;">
                  ${arreteTitle}
                </h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Numéro :</td>
                    <td style="padding: 8px 0; font-weight: bold;">${arreteNumero}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Date de publication :</td>
                    <td style="padding: 8px 0; font-weight: bold;">${formattedDate}</td>
                  </tr>
                  ${signataire ? `
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">Signataire :</td>
                    <td style="padding: 8px 0; font-weight: bold;">${signataire}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              <div style="text-align: center; margin-bottom: 25px;">
                <a href="https://mairie.libreville.ga/arretes" style="display: inline-block; background: #1e3a8a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  Consulter l'arrêté
                </a>
              </div>
              
              <p style="color: #64748b; font-size: 14px; text-align: center;">
                Cet arrêté est consultable sur le portail de la Mairie de Libreville dans la rubrique "Arrêtés Municipaux".
              </p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              
              <footer style="text-align: center; color: #94a3b8; font-size: 12px;">
                <p style="margin: 0;">Mairie de Libreville</p>
                <p style="margin: 5px 0;">BP : 44 Boulevard Triomphal/LBV</p>
                <p style="margin: 5px 0;">Email : libreville@mairie.ga</p>
                <p style="margin: 15px 0 0 0; font-size: 11px;">
                  Vous recevez cet email car vous avez activé les notifications pour les arrêtés municipaux.
                  <br/>Pour modifier vos préférences, connectez-vous à votre espace citoyen.
                </p>
              </footer>
            </body>
            </html>
          `,
        });

        console.log("Batch emails sent:", emailResponse);
        successCount += batch.length;
      } catch (batchError: any) {
        console.error("Error sending batch:", batchError);
        errorCount += batch.length;
        errors.push(batchError.message || 'Unknown error');
      }
    }

    // Log the notification in correspondence_logs
    try {
      await supabase.from('correspondence_logs').insert({
        sender_id: '00000000-0000-0000-0000-000000000000', // System sender
        recipient_email: `${emailList.length} destinataires`,
        recipient_name: `Notification arrêté - ${successCount} réussies, ${errorCount} échecs`,
        subject: `Notification arrêté: ${arreteTitle}`,
        content: `Notification de publication de l'arrêté ${arreteNumero}`,
        status: errorCount === 0 ? 'SENT' : (successCount > 0 ? 'DELIVERED' : 'FAILED'),
        sent_at: new Date().toISOString(),
        metadata: { 
          arreteId, 
          arreteNumero, 
          arreteType,
          successCount, 
          errorCount,
          totalRecipients: emailList.length,
          errors: errors.slice(0, 5) // Keep first 5 errors
        }
      });
      console.log('Notification logged to correspondence_logs');
    } catch (logError) {
      console.error('Error logging notification:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: successCount > 0, 
        message: `Notification envoyée à ${successCount} destinataires${errorCount > 0 ? ` (${errorCount} échecs)` : ''}`,
        successCount,
        errorCount,
        totalRecipients: emailList.length
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-arrete-notification:", error);
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
