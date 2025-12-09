// @ts-ignore - Deno imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

// Deno type declarations for Edge Functions
declare const Deno: {
    env: {
        get(key: string): string | undefined;
    };
};

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AttachmentData {
    url: string;
    name: string;
}

interface EmailRequest {
    to: string;
    subject: string;
    body: string;
    attachments?: AttachmentData[];
    replyTo?: string;
    cc?: string[];
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // SECURITY: Verify user is authenticated and has permission
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ success: false, error: 'Non autorisé - authentification requise' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        // Extract the JWT token from the Authorization header
        const token = authHeader.replace('Bearer ', '').trim()
        
        console.log('🔐 Token received, length:', token.length)
        console.log('🔐 Token prefix:', token.substring(0, 20) + '...')
        
        // Create admin client with service role key
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // Verify the user's JWT token using admin privileges
        console.log('🔍 Verifying user token...')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
        if (authError || !user) {
            console.error('Auth error:', authError)
            return new Response(JSON.stringify({ success: false, error: 'Non autorisé - session invalide' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Check user roles with the same admin client
        const { data: roles, error: rolesError } = await supabaseAdmin
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .in('role', ['admin', 'agent', 'super_admin'])

        if (rolesError || !roles?.length) {
            console.error('Permission check failed:', rolesError)
            return new Response(JSON.stringify({ success: false, error: 'Permissions insuffisantes pour envoyer des emails' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        console.log(`✅ User ${user.id} authorized with role: ${roles[0].role}`)

        const { to, subject, body, attachments, replyTo, cc } = await req.json() as EmailRequest

        // Validate required fields
        if (!to || !subject) {
            throw new Error('Les champs "to" et "subject" sont requis')
        }

        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

        if (!RESEND_API_KEY) {
            console.error('RESEND_API_KEY not configured')
            throw new Error('Service d\'email non configuré. Veuillez contacter l\'administrateur.')
        }

        // Build email payload
        // Note: Using Resend's test domain. For production, verify your domain at https://resend.com/domains
        const emailPayload: Record<string, any> = {
            from: 'Mairie de Libreville <onboarding@resend.dev>',
            to: [to],
            subject: subject,
            html: `
                <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="border-bottom: 3px solid #009E60; padding-bottom: 15px; margin-bottom: 20px;">
                        <h2 style="color: #009E60; margin: 0;">République Gabonaise</h2>
                        <p style="color: #666; margin: 5px 0; font-size: 12px;">Union - Travail - Justice</p>
                    </div>
                    
                    <div style="line-height: 1.6; color: #333;">
                        ${body.replace(/\n/g, '<br>')}
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                        <p>Ce courrier a été envoyé de manière sécurisée depuis le système de correspondance officielle de la Mairie.</p>
                        <p>Pour toute question, veuillez contacter le secrétariat général.</p>
                    </div>
                </div>
            `,
            text: body, // Plain text fallback
        }

        // Add optional fields
        if (replyTo) {
            emailPayload.reply_to = replyTo
        }

        if (cc && cc.length > 0) {
            emailPayload.cc = cc
        }

        // Handle multiple attachments
        if (attachments && attachments.length > 0) {
            const emailAttachments: { filename: string; content: string }[] = []

            for (const attachment of attachments) {
                try {
                    console.log(`📎 Downloading attachment: ${attachment.name}`)
                    const attachmentResponse = await fetch(attachment.url)

                    if (attachmentResponse.ok) {
                        const attachmentBuffer = await attachmentResponse.arrayBuffer()
                        const base64Content = btoa(String.fromCharCode(...new Uint8Array(attachmentBuffer)))

                        emailAttachments.push({
                            filename: attachment.name,
                            content: base64Content,
                        })
                        console.log(`✅ Attachment ready: ${attachment.name}`)
                    } else {
                        console.warn(`⚠️ Could not download attachment: ${attachment.name}`)
                    }
                } catch (attachError) {
                    console.warn(`⚠️ Error processing attachment ${attachment.name}:`, attachError)
                    // Continue with other attachments
                }
            }

            if (emailAttachments.length > 0) {
                emailPayload.attachments = emailAttachments
            }
        }

        // Send email via Resend
        console.log(`📧 Sending email to ${to}: ${subject} (${emailPayload.attachments?.length || 0} attachments)`)

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload),
        })

        const result = await response.json()

        if (!response.ok) {
            console.error('Resend API error:', result)
            throw new Error(result.message || 'Erreur lors de l\'envoi de l\'email')
        }

        console.log(`✅ Email sent successfully: ${result.id}`)

        return new Response(JSON.stringify({
            success: true,
            messageId: result.id,
            sentAt: new Date().toISOString(),
            attachmentsCount: emailPayload.attachments?.length || 0,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
        console.error('❌ Email sending failed:', errorMessage)

        return new Response(JSON.stringify({
            success: false,
            error: errorMessage
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
