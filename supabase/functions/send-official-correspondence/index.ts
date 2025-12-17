// @ts-ignore - Deno imports
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore - Deno imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

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

interface CorrespondenceRequest {
    recipient_org: string;
    recipient_name: string;
    recipient_email?: string;
    subject: string;
    content: string;
    document_ids: string[];
    is_urgent: boolean;
    folder_id?: string;
}

interface AttachmentData {
    url: string;
    name: string;
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // SECURITY: Verify user is authenticated and has permission
        const authHeader = req.headers.get('Authorization')
        console.log('📨 Official correspondence request received')
        
        if (!authHeader) {
            console.error('❌ No authorization header')
            return new Response(JSON.stringify({ success: false, error: 'Non autorisé - authentification requise' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        // Extract the JWT token from the Authorization header
        const token = authHeader.replace('Bearer ', '').trim()
        
        // Create admin client with service role key
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // Verify the user's JWT token using admin privileges
        console.log('🔍 Verifying user token...')
        const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)
        
        if (authError || !userData?.user) {
            console.error('❌ Auth error:', authError?.message || 'No user found')
            return new Response(JSON.stringify({ success: false, error: 'Non autorisé - session invalide' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }
        
        const user = userData.user

        // Check user roles
        const { data: roles, error: rolesError } = await supabaseAdmin
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .in('role', ['admin', 'agent', 'super_admin'])

        if (rolesError || !roles?.length) {
            console.error('Permission check failed:', rolesError)
            return new Response(JSON.stringify({ success: false, error: 'Permissions insuffisantes pour envoyer des correspondances' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        console.log(`✅ User ${user.id} authorized with role: ${roles[0].role}`)

        const { 
            recipient_org, 
            recipient_name, 
            recipient_email, 
            subject, 
            content, 
            document_ids, 
            is_urgent,
            folder_id 
        } = await req.json() as CorrespondenceRequest

        // Validate required fields
        if (!subject || !recipient_org) {
            throw new Error('Les champs "subject" et "recipient_org" sont requis')
        }

        // Step 1: Create correspondence log entry with PENDING status
        console.log('📝 Creating correspondence log entry...')
        const { data: correspondence, error: insertError } = await supabaseAdmin
            .from('correspondence_logs')
            .insert({
                sender_id: user.id,
                recipient_org,
                recipient_name: recipient_name || null,
                recipient_email: recipient_email || null,
                subject,
                content,
                document_ids: document_ids || [],
                is_urgent: is_urgent || false,
                folder_id: folder_id || null,
                status: 'PENDING',
                metadata: {
                    user_agent: req.headers.get('user-agent'),
                    created_by_role: roles[0].role
                }
            })
            .select('id')
            .single()

        if (insertError) {
            console.error('❌ Failed to create correspondence log:', insertError)
            throw new Error('Erreur lors de la création de l\'entrée de correspondance')
        }

        const correspondenceId = correspondence.id
        console.log(`✅ Correspondence log created: ${correspondenceId}`)

        // Step 2: If email is provided, send email notification
        let emailSent = false
        let emailError: string | null = null

        if (recipient_email) {
            const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

            if (!RESEND_API_KEY) {
                console.warn('⚠️ RESEND_API_KEY not configured, skipping email')
                emailError = 'Service email non configuré'
            } else {
                try {
                    // Fetch document attachments if any
                    const attachments: { filename: string; content: string }[] = []
                    
                    if (document_ids && document_ids.length > 0) {
                        console.log(`📎 Processing ${document_ids.length} document attachments...`)
                        
                        // Get document URLs from storage
                        for (const docId of document_ids) {
                            try {
                                const { data: doc } = await supabaseAdmin
                                    .from('documents')
                                    .select('name, file_path')
                                    .eq('id', docId)
                                    .single()
                                
                                if (doc?.file_path) {
                                    const { data: signedUrl } = await supabaseAdmin.storage
                                        .from('documents')
                                        .createSignedUrl(doc.file_path, 300) // 5 min validity
                                    
                                    if (signedUrl?.signedUrl) {
                                        const response = await fetch(signedUrl.signedUrl)
                                        if (response.ok) {
                                            const buffer = await response.arrayBuffer()
                                            const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
                                            attachments.push({
                                                filename: doc.name,
                                                content: base64
                                            })
                                            console.log(`✅ Attachment ready: ${doc.name}`)
                                        }
                                    }
                                }
                            } catch (docError) {
                                console.warn(`⚠️ Could not process document ${docId}:`, docError)
                            }
                        }
                    }

                    // Build email HTML
                    const urgentBadge = is_urgent 
                        ? '<span style="background: #dc2626; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 10px;">URGENT</span>' 
                        : ''

                    const emailHtml = `
                        <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="border-bottom: 3px solid #009E60; padding-bottom: 15px; margin-bottom: 20px;">
                                <h2 style="color: #009E60; margin: 0;">République Gabonaise${urgentBadge}</h2>
                                <p style="color: #666; margin: 5px 0; font-size: 12px;">Union - Travail - Justice</p>
                                <p style="color: #009E60; margin: 5px 0; font-size: 14px; font-weight: bold;">Correspondance Officielle</p>
                            </div>
                            
                            <div style="margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                                <p style="margin: 0; font-size: 12px; color: #666;">
                                    <strong>À:</strong> ${recipient_name || recipient_org}<br>
                                    <strong>Organisation:</strong> ${recipient_org}<br>
                                    <strong>Objet:</strong> ${subject}
                                </p>
                            </div>
                            
                            <div style="line-height: 1.6; color: #333;">
                                ${content.replace(/\n/g, '<br>')}
                            </div>
                            
                            ${attachments.length > 0 ? `
                                <div style="margin-top: 20px; padding: 10px; background: #e8f5e9; border-radius: 4px;">
                                    <p style="margin: 0; font-size: 12px; color: #2e7d32;">
                                        📎 ${attachments.length} pièce(s) jointe(s)
                                    </p>
                                </div>
                            ` : ''}
                            
                            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                                <p>Ce courrier a été envoyé de manière sécurisée depuis le système de correspondance officielle.</p>
                                <p>Référence: ${correspondenceId}</p>
                            </div>
                        </div>
                    `

                    // Get configured from address or use default
                    const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'onboarding@resend.dev'
                    const RESEND_FROM_NAME = Deno.env.get('RESEND_FROM_NAME') || 'Mairie de Libreville'

                    // Send email via Resend
                    const emailPayload: Record<string, any> = {
                        from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
                        to: [recipient_email],
                        subject: is_urgent ? `[URGENT] ${subject}` : subject,
                        html: emailHtml,
                        text: content,
                    }

                    if (attachments.length > 0) {
                        emailPayload.attachments = attachments
                    }

                    console.log(`📧 Sending email to ${recipient_email} from ${RESEND_FROM_EMAIL}...`)
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
                        console.error('❌ Resend API error:', result)
                        // Check if it's a domain verification issue
                        if (result.message?.includes('verify a domain')) {
                            emailError = 'Domaine email non vérifié. Veuillez configurer un domaine vérifié sur resend.com/domains'
                        } else if (result.message?.includes('testing emails')) {
                            emailError = 'Mode test Resend: envoi limité à l\'email du propriétaire. Vérifiez un domaine pour envoyer à tous.'
                        } else {
                            emailError = result.message || 'Erreur envoi email'
                        }
                    } else {
                        emailSent = true
                        console.log(`✅ Email sent successfully: ${result.id}`)
                    }
                } catch (sendError) {
                    console.error('❌ Email sending error:', sendError)
                    emailError = sendError instanceof Error ? sendError.message : 'Erreur inconnue'
                }
            }
        }

        // Step 3: Update correspondence status
        const newStatus = emailSent ? 'SENT' : (recipient_email ? 'FAILED' : 'PENDING')
        const updateData: Record<string, any> = {
            status: newStatus,
            sent_at: emailSent ? new Date().toISOString() : null,
        }

        if (emailError) {
            updateData.error_message = emailError
        }

        const { error: updateError } = await supabaseAdmin
            .from('correspondence_logs')
            .update(updateData)
            .eq('id', correspondenceId)

        if (updateError) {
            console.error('⚠️ Failed to update correspondence status:', updateError)
        }

        console.log(`✅ Correspondence ${correspondenceId} - Status: ${newStatus}`)

        // Return success response
        return new Response(JSON.stringify({
            success: true,
            correspondence_id: correspondenceId,
            email_sent: emailSent,
            status: newStatus,
            message: emailSent 
                ? 'Correspondance envoyée avec succès' 
                : (recipient_email ? 'Correspondance créée mais email non envoyé' : 'Correspondance enregistrée')
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
        console.error('❌ Correspondence failed:', errorMessage)

        return new Response(JSON.stringify({
            success: false,
            error: errorMessage
        }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
