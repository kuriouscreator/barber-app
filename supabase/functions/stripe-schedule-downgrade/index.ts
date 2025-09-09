import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.9.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
})

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { newPriceId } = await req.json()
    
    if (!newPriceId) {
      return new Response(
        JSON.stringify({ error: 'newPriceId is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get current user from JWT
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

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get current user's subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('stripe_subscription_id, stripe_price_id')
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

    // Check if already scheduled for the same plan
    if (subscription.stripe_price_id === newPriceId) {
      return new Response(
        JSON.stringify({ error: 'Already subscribed to this plan' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Retrieve current subscription from Stripe
    const currentSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    )

    // Get new plan details
    const newPrice = await stripe.prices.retrieve(newPriceId, {
      expand: ['product']
    })
    const newProduct = newPrice.product as Stripe.Product

    // Create subscription schedule
    const schedule = await stripe.subscriptionSchedules.create({
      customer: currentSubscription.customer,
      start_date: currentSubscription.current_period_end, // Start at end of current period
      end_behavior: 'release', // Continue as normal after schedule ends
      phases: [
        {
          items: [{ price: newPriceId }], // New plan
          billing_cycle_anchor: 'unchanged', // Keep same billing cycle
          proration_behavior: 'none', // No proration
        },
      ],
    })

    // Update database with scheduled change info
    const { error: updateError } = await supabaseClient
      .from('user_subscriptions')
      .update({
        scheduled_plan_name: newProduct.name,
        scheduled_price_id: newPriceId,
        scheduled_effective_date: new Date(currentSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating scheduled change:', updateError)
      // Don't fail the request, but log the error
    }

    console.log('Downgrade scheduled successfully:', schedule.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        scheduleId: schedule.id,
        effectiveDate: new Date(currentSubscription.current_period_end * 1000).toISOString(),
        newPlanName: newProduct.name
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error scheduling downgrade:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
