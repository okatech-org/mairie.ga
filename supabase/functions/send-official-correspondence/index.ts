import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
    to: string;
    subject: string;
    body: string;
    attachmentUrl?: string;
    attachmentName?: string;
    replyTo?: string;
    cc?: string[];
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { to, subject, body, attachmentUrl, attachmentName, replyTo, cc } = await req.json() as EmailRequest

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
        const emailPayload: Record<string, any> = {
            from: 'Mairie de Libreville <noreply@mairie.ga>',
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

        // Handle attachment if provided
        if (attachmentUrl && attachmentName) {
            try {
                const attachmentResponse = await fetch(attachmentUrl)
                if (attachmentResponse.ok) {
                    const attachmentBuffer = await attachmentResponse.arrayBuffer()
                    const base64Content = btoa(String.fromCharCode(...new Uint8Array(attachmentBuffer)))

                    emailPayload.attachments = [{
                        filename: attachmentName,
                        content: base64Content,
                    }]
                }
            } catch (attachError) {
                console.warn('Could not attach file:', attachError)
                // Continue without attachment
            }
        }

        // Send email via Resend
        console.log(`📧 Sending email to ${to}: ${subject}`)

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
