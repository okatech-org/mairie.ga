import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    organization_id?: string;
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Get service role key for admin operations
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        // Verify the request is from an authenticated admin
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("Missing authorization header");
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !caller) {
            throw new Error("Unauthorized");
        }

        // Check if caller is super_admin
        const { data: roleData } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", caller.id)
            .single();

        if (roleData?.role !== "super_admin") {
            throw new Error("Only super admins can create users");
        }

        // Parse request body
        const body: CreateUserRequest = await req.json();
        const { email, first_name, last_name, role, organization_id } = body;

        if (!email || !first_name || !last_name || !role) {
            throw new Error("Missing required fields: email, first_name, last_name, role");
        }

        // Generate a temporary password
        const tempPassword = crypto.randomUUID().slice(0, 12);

        // Create user via Supabase Admin API
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                first_name,
                last_name,
            },
        });

        if (createError) {
            throw new Error(`Failed to create user: ${createError.message}`);
        }

        const userId = newUser.user.id;

        // Create profile
        const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .insert({
                user_id: userId,
                email,
                first_name,
                last_name,
                employer: organization_id,
            });

        if (profileError) {
            console.error("Profile creation error:", profileError);
            // Don't fail completely, user is created
        }

        // Assign role
        const { error: roleError } = await supabaseAdmin
            .from("user_roles")
            .insert({
                user_id: userId,
                role,
            });

        if (roleError) {
            console.error("Role assignment error:", roleError);
        }

        // TODO: Send invitation email with password reset link
        // For now, return the temp password (in production, use magic link instead)

        return new Response(
            JSON.stringify({
                id: userId,
                user_id: userId,
                email,
                first_name,
                last_name,
                role,
                organization_id,
                message: `Utilisateur créé. Mot de passe temporaire: ${tempPassword}`,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );

    } catch (error: any) {
        console.error("Error in create-user function:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: error.message === "Unauthorized" ? 401 : 400,
            }
        );
    }
});
