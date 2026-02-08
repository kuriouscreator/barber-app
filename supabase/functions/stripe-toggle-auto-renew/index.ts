import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.9.0'

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
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the request body
    const { autoRenew } = await req.json()

    if (typeof autoRenew !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'autoRenew must be a boolean' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get the current user from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get user's subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .single()

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: 'No active subscription found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Update the Stripe subscription
    if (autoRenew) {
      // Resume subscription (remove cancel_at_period_end)
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: false,
      })
    } else {
      // Cancel subscription at period end
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      })
    }

    // Get the updated subscription to return current status
    const updatedSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)

    // Update the database to match Stripe
    const { error: dbError } = await supabaseClient
      .from('user_subscriptions')
      .update({
        cancel_at_period_end: updatedSubscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (dbError) {
      console.error('Error updating database:', dbError)
      // Don't fail the request - Stripe is the source of truth
    }

    return new Response(
      JSON.stringify({
        success: true,
        autoRenew: !updatedSubscription.cancel_at_period_end,
        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
        currentPeriodEnd: updatedSubscription.current_period_end,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error toggling auto-renew:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
