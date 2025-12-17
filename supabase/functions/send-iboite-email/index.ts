
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
    correspondenceId: string;
}

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("Missing Authorization header");
        }

        const { correspondenceId } = await req.json() as SendEmailRequest;
        if (!correspondenceId) {
            throw new Error("Missing correspondenceId");
        }

        // Initialize Supabase Admin Client
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        // Get correspondence details
        const { data: correspondence, error: fetchError } = await supabaseAdmin
            .from("iboite_external_correspondence")
            .select("*")
            .eq("id", correspondenceId)
            .single();

        if (fetchError || !correspondence) {
            throw new Error(`Correspondence not found: ${fetchError?.message}`);
        }

        if (correspondence.status === "SENT") {
            return new Response(JSON.stringify({ success: true, message: "Already sent" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Prepare Email
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        if (!RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY not configured");
        }

        const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
        const RESEND_FROM_NAME = Deno.env.get("RESEND_FROM_NAME") || "Mairie - iBoîte";

        // Build Payload
        const emailPayload: any = {
            from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
            to: [correspondence.external_email],
            subject: correspondence.subject,
            html: `<div style="font-family: sans-serif; padding: 20px;">
        <h2>${correspondence.subject}</h2>
        <div style="white-space: pre-wrap;">${correspondence.content}</div>
        <hr />
        <p style="font-size: 12px; color: #666;">
          Envoyé via iBoîte par ${correspondence.sender_id}
        </p>
      </div>`,
        };

        // Attachments (TODO: Handle attachments properly using storage signed URLs)
        // For now, we skip attachments logic to keep it simple and focused on sending the text.

        console.log(`Sending email to ${correspondence.external_email}`);

        // Send via Resend
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(emailPayload),
        });

        const data = await res.json();
        let newStatus = "SENT";
        let errorMessage = null;

        if (!res.ok) {
            console.error("Resend Error:", data);
            newStatus = "FAILED";

            // Handle specific Resend errors
            if (data.message?.includes("verify a domain")) {
                errorMessage = "Domaine non vérifié (Mode Test Resend). Veuillez vérifier votre domaine sur resend.com.";
            } else if (data.message?.includes("onboarding")) {
                errorMessage = "Mode Test Resend: Envoi limité à l'email du propriétaire.";
            } else {
                errorMessage = data.message || "Erreur inconnue Resend";
            }
        }

        // Update status
        const { error: updateError } = await supabaseAdmin
            .from("iboite_external_correspondence")
            .update({
                status: newStatus,
                sent_at: newStatus === "SENT" ? new Date().toISOString() : null,
                error_message: errorMessage
            })
            .eq("id", correspondenceId);

        if (updateError) {
            console.error("Update Error:", updateError);
        }

        return new Response(JSON.stringify({
            success: newStatus === "SENT",
            status: newStatus,
            error: errorMessage
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
