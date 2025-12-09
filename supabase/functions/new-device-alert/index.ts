import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeviceAlertRequest {
  user_id: string;
  user_email: string;
  device_info: string;
  browser: string;
  os: string;
  ip_address: string;
  location?: string;
}

// Get geolocation from IP using free API
async function getLocationFromIP(ip: string): Promise<{ city: string; country: string; region: string } | null> {
  try {
    // Skip for local/private IPs
    if (ip === 'Unknown' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '127.0.0.1') {
      console.log("Private or unknown IP, skipping geolocation");
      return null;
    }

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city`);
    const data = await response.json();
    
    console.log("IP-API response:", data);
    
    if (data.status === 'success') {
      return {
        city: data.city || 'Unknown',
        country: data.country || 'Unknown',
        region: data.regionName || ''
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching geolocation:", error);
    return null;
  }
}

// Send new device alert email
async function sendNewDeviceEmail(
  userEmail: string,
  deviceInfo: string,
  browser: string,
  os: string,
  ipAddress: string,
  location: string
): Promise<boolean> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    return false;
  }

  const loginDate = new Date().toLocaleString('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Africa/Libreville'
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #009639, #007a2f); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🔐 Nouvelle connexion détectée</h1>
      </div>
      
      <div style="background: #f0fdf4; padding: 20px; border: 1px solid #bbf7d0;">
        <p style="color: #166534; font-size: 16px; margin-top: 0;">
          Bonjour,<br><br>
          Nous avons détecté une nouvelle connexion à votre compte depuis un appareil non reconnu.
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden;">
          <tr style="background: #dcfce7;">
            <td style="padding: 12px; font-weight: bold; color: #166534; width: 140px;">📱 Appareil</td>
            <td style="padding: 12px; color: #15803d;">${deviceInfo}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; color: #166534;">🌐 Navigateur</td>
            <td style="padding: 12px; color: #15803d;">${browser}</td>
          </tr>
          <tr style="background: #dcfce7;">
            <td style="padding: 12px; font-weight: bold; color: #166534;">💻 Système</td>
            <td style="padding: 12px; color: #15803d;">${os}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; color: #166534;">📍 Localisation</td>
            <td style="padding: 12px; color: #15803d;">${location || 'Non disponible'}</td>
          </tr>
          <tr style="background: #dcfce7;">
            <td style="padding: 12px; font-weight: bold; color: #166534;">🔢 Adresse IP</td>
            <td style="padding: 12px; color: #15803d;">${ipAddress}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; color: #166534;">📅 Date/Heure</td>
            <td style="padding: 12px; color: #15803d;">${loginDate}</td>
          </tr>
        </table>
        
        <div style="background: #fef9c3; padding: 15px; border-radius: 6px; border-left: 4px solid #eab308;">
          <strong style="color: #854d0e;">⚠️ Ce n'était pas vous ?</strong>
          <p style="color: #713f12; margin: 10px 0 0 0; font-size: 14px;">
            Si vous ne reconnaissez pas cette activité, nous vous recommandons de :
          </p>
          <ul style="color: #713f12; margin: 10px 0 0 0; padding-left: 20px; font-size: 14px;">
            <li>Changer votre mot de passe immédiatement</li>
            <li>Vérifier vos sessions actives dans les paramètres</li>
            <li>Déconnecter tous les autres appareils</li>
            <li>Contacter notre support si nécessaire</li>
          </ul>
        </div>
      </div>
      
      <div style="background: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6b7280;">
        <p style="margin: 0;">Cet email a été envoyé automatiquement par le système de sécurité</p>
        <p style="margin: 5px 0 0 0;">Si vous avez des questions, contactez notre support.</p>
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
        from: "Sécurité <onboarding@resend.dev>",
        to: [userEmail],
        subject: "🔐 Nouvelle connexion depuis un nouvel appareil",
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { 
      user_id, 
      user_email, 
      device_info, 
      browser, 
      os, 
      ip_address 
    }: DeviceAlertRequest = await req.json();
    
    console.log(`Checking for new device for user: ${user_id}, device: ${device_info}, browser: ${browser}`);
    
    // Get geolocation from IP
    const geoData = await getLocationFromIP(ip_address);
    const location = geoData 
      ? `${geoData.city}, ${geoData.region ? geoData.region + ', ' : ''}${geoData.country}`
      : null;
    
    console.log(`Location resolved: ${location}`);

    // Check if this device/browser combination has been used before
    const { data: existingSessions, error: queryError } = await supabase
      .from("active_sessions")
      .select("id, device_info, browser, os, ip_address")
      .eq("user_id", user_id);
    
    if (queryError) {
      console.error("Error querying sessions:", queryError);
      throw queryError;
    }

    // Check if this is a new device
    const isNewDevice = !existingSessions?.some(session => 
      session.device_info === device_info && 
      session.browser === browser && 
      session.os === os
    );

    console.log(`Is new device: ${isNewDevice}, existing sessions count: ${existingSessions?.length || 0}`);

    // If it's a new device and user has existing sessions, send alert
    if (isNewDevice && existingSessions && existingSessions.length > 0) {
      console.log("New device detected with existing sessions, sending alert...");
      
      const emailSent = await sendNewDeviceEmail(
        user_email,
        device_info,
        browser,
        os,
        ip_address,
        location || 'Non disponible'
      );

      return new Response(
        JSON.stringify({
          is_new_device: true,
          alert_sent: emailSent,
          location: location,
          message: emailSent ? "Alerte nouvel appareil envoyée" : "Échec de l'envoi de l'alerte"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({
        is_new_device: isNewDevice,
        alert_sent: false,
        location: location,
        message: isNewDevice ? "Premier appareil, pas d'alerte" : "Appareil déjà connu"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in new-device-alert function:", error);
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
