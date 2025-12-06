import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PinLoginRequest {
  email: string;
  pinCode: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, pinCode }: PinLoginRequest = await req.json();

    console.log(`PIN login attempt for email: ${email}`);

    // Validate input
    if (!email || !pinCode) {
      return new Response(
        JSON.stringify({ error: "Email et code PIN requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (pinCode.length !== 6 || !/^\d{6}$/.test(pinCode)) {
      return new Response(
        JSON.stringify({ error: "Le code PIN doit contenir 6 chiffres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get profile with PIN
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, pin_code, pin_enabled, first_name, last_name, email")
      .eq("email", email.toLowerCase().trim())
      .eq("pin_enabled", true)
      .maybeSingle();

    if (profileError) {
      console.error("Profile query error:", profileError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la vérification" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile) {
      console.log(`No profile found for email: ${email}`);
      return new Response(
        JSON.stringify({ error: "Email non trouvé ou code PIN non activé" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify PIN code
    if (profile.pin_code !== pinCode) {
      console.log(`Invalid PIN for email: ${email}`);
      return new Response(
        JSON.stringify({ error: "Code PIN incorrect" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`PIN verified for user: ${profile.user_id}`);

    // Generate a magic link token for the user
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: email,
      options: {
        redirectTo: `${req.headers.get("origin") || supabaseUrl}/dashboard/citizen`,
      },
    });

    if (linkError) {
      console.error("Magic link generation error:", linkError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la génération du lien d'authentification" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract the token from the generated link
    const actionLink = linkData.properties?.action_link;
    if (!actionLink) {
      return new Response(
        JSON.stringify({ error: "Impossible de générer le lien d'authentification" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the token from the URL
    const url = new URL(actionLink);
    const token = url.searchParams.get("token");
    const tokenHash = url.hash?.replace("#", "") || url.searchParams.get("token_hash");

    console.log(`Magic link generated successfully for user: ${profile.user_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Authentification réussie",
        user: {
          id: profile.user_id,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
        },
        authLink: actionLink,
        token: token,
        tokenHash: tokenHash,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Unexpected error in auth-pin-login:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur inattendue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
