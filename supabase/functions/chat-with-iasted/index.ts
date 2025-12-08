import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Verify user authentication
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            console.error('No authorization header provided')
            return new Response(JSON.stringify({ error: 'Unauthorized - No token provided' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
        
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        })

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            console.error('Authentication failed:', authError?.message)
            return new Response(JSON.stringify({ error: 'Unauthorized - Invalid token' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        console.log(`[chat-with-iasted] Authenticated user: ${user.id}`)

        const { message, conversationHistory, systemPrompt } = await req.json()
        
        // Use Lovable AI Gateway with gemini-2.5-pro (premium quality)
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
        if (!LOVABLE_API_KEY) {
            throw new Error('LOVABLE_API_KEY is not set')
        }

        const messages = [
            { role: 'system', content: systemPrompt || 'Tu es iAsted, assistant municipal intelligent.' },
            ...(conversationHistory || []),
            { role: 'user', content: message }
        ]

        console.log(`[chat-with-iasted] Sending request to Lovable AI (gemini-2.5-pro)`)

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.5-pro',
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('[chat-with-iasted] Lovable AI error:', response.status, errorText)
            
            if (response.status === 429) {
                throw new Error('Limite de requêtes atteinte, réessayez plus tard')
            }
            if (response.status === 402) {
                throw new Error('Crédits insuffisants')
            }
            throw new Error(`Erreur API: ${response.status}`)
        }

        const data = await response.json()
        const answer = data.choices[0].message.content

        console.log(`[chat-with-iasted] Response received successfully`)

        return new Response(JSON.stringify({ answer }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('[chat-with-iasted] Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
