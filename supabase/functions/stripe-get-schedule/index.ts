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

    // Get current user's subscription with scheduled change info
    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('stripe_subscription_id, scheduled_plan_name, scheduled_price_id, scheduled_effective_date')
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

    // If there's a scheduled change, get the schedule details from Stripe
    let scheduleDetails = null
    if (subscription.scheduled_price_id) {
      try {
        // Get the customer's subscription schedules
        const schedules = await stripe.subscriptionSchedules.list({
          customer: (await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)).customer as string,
          limit: 1
        })

        if (schedules.data.length > 0) {
          const schedule = schedules.data[0]
          scheduleDetails = {
            id: schedule.id,
            status: schedule.status,
            currentPhase: schedule.current_phase,
            phases: schedule.phases,
            startDate: schedule.start_date,
            endDate: schedule.end_date
          }
        }
      } catch (stripeError) {
        console.error('Error fetching schedule from Stripe:', stripeError)
        // Continue without schedule details
      }
    }

    const result = {
      hasScheduledChange: !!subscription.scheduled_price_id,
      scheduledPlanName: subscription.scheduled_plan_name,
      scheduledPriceId: subscription.scheduled_price_id,
      scheduledEffectiveDate: subscription.scheduled_effective_date,
      scheduleDetails
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error getting subscription schedule:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
