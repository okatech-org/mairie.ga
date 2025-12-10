import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AppointmentEmailRequest {
  to: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  organizationAddress?: string;
  organizationPhone?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      to,
      firstName,
      lastName,
      organizationName,
      serviceName,
      appointmentDate,
      appointmentTime,
      organizationAddress,
      organizationPhone,
    }: AppointmentEmailRequest = await req.json();

    console.log("Sending appointment confirmation to:", to);

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmation de rendez-vous</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
        <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <tr>
            <td>
              <!-- Header -->
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background: linear-gradient(135deg, #009e49 0%, #fcd116 100%); border-radius: 12px 12px 0 0; padding: 30px;">
                <tr>
                  <td align="center">
                    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">
                      🇬🇦 Mairies du Gabon
                    </h1>
                  </td>
                </tr>
              </table>

              <!-- Main Content -->
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: white; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td>
                    <h2 style="color: #18181b; margin: 0 0 10px 0; font-size: 20px;">
                      ✅ Rendez-vous confirmé
                    </h2>
                    <p style="color: #71717a; margin: 0 0 30px 0; font-size: 16px;">
                      Bonjour ${firstName} ${lastName},
                    </p>
                    <p style="color: #52525b; margin: 0 0 20px 0; font-size: 15px; line-height: 1.6;">
                      Votre rendez-vous a été enregistré avec succès. Voici les détails :
                    </p>

                    <!-- Appointment Details Box -->
                    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                      <tr>
                        <td>
                          <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
                            <tr>
                              <td style="padding: 8px 0;">
                                <span style="color: #71717a; font-size: 14px;">🏛️ Mairie</span><br>
                                <strong style="color: #18181b; font-size: 15px;">${organizationName}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0;">
                                <span style="color: #71717a; font-size: 14px;">📋 Service</span><br>
                                <strong style="color: #18181b; font-size: 15px;">${serviceName}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0;">
                                <span style="color: #71717a; font-size: 14px;">📅 Date</span><br>
                                <strong style="color: #18181b; font-size: 15px;">${appointmentDate}</strong>
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0;">
                                <span style="color: #71717a; font-size: 14px;">🕐 Heure</span><br>
                                <strong style="color: #18181b; font-size: 15px;">${appointmentTime}</strong>
                              </td>
                            </tr>
                            ${organizationAddress ? `
                            <tr>
                              <td style="padding: 8px 0;">
                                <span style="color: #71717a; font-size: 14px;">📍 Adresse</span><br>
                                <strong style="color: #18181b; font-size: 15px;">${organizationAddress}</strong>
                              </td>
                            </tr>
                            ` : ''}
                            ${organizationPhone ? `
                            <tr>
                              <td style="padding: 8px 0;">
                                <span style="color: #71717a; font-size: 14px;">📞 Téléphone</span><br>
                                <strong style="color: #18181b; font-size: 15px;">${organizationPhone}</strong>
                              </td>
                            </tr>
                            ` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Reminder -->
                    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="border-left: 4px solid #fcd116; padding-left: 15px; margin-bottom: 25px;">
                      <tr>
                        <td>
                          <p style="color: #52525b; margin: 0; font-size: 14px; line-height: 1.5;">
                            <strong>📝 Rappel :</strong> N'oubliez pas d'apporter vos documents d'identité et tout document nécessaire pour votre démarche.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <p style="color: #71717a; margin: 0; font-size: 14px; line-height: 1.6;">
                      Si vous avez des questions ou souhaitez modifier votre rendez-vous, veuillez contacter directement la mairie.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="padding: 20px;">
                <tr>
                  <td align="center">
                    <p style="color: #a1a1aa; margin: 0; font-size: 12px;">
                      Ce mail a été envoyé automatiquement par le système de gestion des rendez-vous des mairies du Gabon.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Mairies du Gabon <onboarding@resend.dev>",
        to: [to],
        subject: `✅ Confirmation de rendez-vous - ${organizationName}`,
        html: emailHtml,
      }),
    });

    const emailResponse = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", emailResponse);
      throw new Error(emailResponse.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-appointment-confirmation function:", error);
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
