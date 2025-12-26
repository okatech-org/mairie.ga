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
        const authHeader = req.headers.get('Authorization')
        console.log('Auth header present:', !!authHeader)
        
        if (!authHeader) {
            console.error('No authorization header provided')
            return new Response(JSON.stringify({ error: 'Unauthorized - No auth header' }), {
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
        
        if (authError) {
            console.error('Auth error:', authError.message)
            return new Response(JSON.stringify({ error: 'Unauthorized - Auth failed', details: authError.message }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }
        
        if (!user) {
            console.error('No user found in session')
            return new Response(JSON.stringify({ error: 'Unauthorized - No user' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
        if (!OPENAI_API_KEY) {
            console.error('OPENAI_API_KEY is not configured')
            throw new Error('OPENAI_API_KEY is not set')
        }

        console.log(`User requesting realtime token: ${user.id}`)

        const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-realtime-preview-2024-12-17',
                voice: 'alloy',
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('OpenAI API Error:', errorData)
            throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Unknown error'}`)
        }

        const data = await response.json()
        console.log('Ephemeral token created successfully for user:', user.id)

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('Error in get-realtime-token:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
