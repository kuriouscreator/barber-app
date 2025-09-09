import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get user from JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid user')
    }

    // Parse request body
    const { appointmentId } = await req.json()

    if (!appointmentId) {
      throw new Error('appointmentId is required')
    }

    // Validate appointment belongs to user and is completed
    const { data: appointment, error: appointmentError } = await supabaseClient
      .from('appointments')
      .select('id, customer_id, status')
      .eq('id', appointmentId)
      .eq('customer_id', user.id)
      .eq('status', 'completed')
      .single()

    if (appointmentError || !appointment) {
      throw new Error('Appointment not found or not completed')
    }

    // Check if user has active subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .gte('current_period_end', new Date().toISOString())
      .single()

    if (subError || !subscription) {
      throw new Error('No active subscription found')
    }

    // Check if user has cuts remaining
    if (subscription.cuts_used >= subscription.cuts_included) {
      throw new Error('No cuts remaining in current period')
    }

    // Increment cuts_used
    const { error: updateError } = await supabaseClient
      .from('user_subscriptions')
      .update({ 
        cuts_used: subscription.cuts_used + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (updateError) {
      throw new Error('Failed to update cuts usage')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        cutsUsed: subscription.cuts_used + 1,
        cutsRemaining: subscription.cuts_included - (subscription.cuts_used + 1)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error adding cut usage:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
