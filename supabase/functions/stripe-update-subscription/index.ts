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

    // Get user's current subscription
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

    // Check if already on this price
    if (subscription.stripe_price_id === newPriceId) {
      return new Response(
        JSON.stringify({ error: 'Already subscribed to this plan' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Retrieve the current subscription from Stripe
    console.log('Retrieving subscription from Stripe:', subscription.stripe_subscription_id)
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id)
    console.log('Current subscription price:', stripeSubscription.items.data[0].price.id)

    // Update the subscription with the new price
    // Use 'always_invoice' to immediately charge the prorated amount
    console.log('Updating subscription to new price:', newPriceId)
    const updatedSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      items: [{
        id: stripeSubscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'always_invoice', // Immediately invoice the prorated amount
      billing_cycle_anchor: 'unchanged', // Keep the same billing cycle
    })

    console.log('✅ Subscription updated successfully:', updatedSubscription.id)
    console.log('New price:', updatedSubscription.items.data[0].price.id)
    console.log('Status:', updatedSubscription.status)

    // Update the database immediately (don't wait for webhook)
    console.log('📝 Updating database directly...')

    // Get plan details from Stripe
    const price = await stripe.prices.retrieve(newPriceId, {
      expand: ['product']
    })
    const product = price.product as any
    const cutsIncluded = parseInt(product.metadata.cuts_included || '0')
    const planName = product.name
    const interval = price.recurring?.interval || 'month'

    // Check if this is an upgrade
    const { data: currentSub } = await supabaseClient
      .from('user_subscriptions')
      .select('plan_name, cuts_included')
      .eq('user_id', user.id)
      .single()

    console.log('🔍 Comparing plans:')
    console.log('  Current plan:', currentSub?.plan_name, '- Cuts:', currentSub?.cuts_included)
    console.log('  New plan:', planName, '- Cuts:', cutsIncluded)

    const isUpgrade = currentSub && cutsIncluded > currentSub.cuts_included
    console.log('  Is upgrade?', isUpgrade)

    // Update subscription in database
    const { error: updateError } = await supabaseClient
      .from('user_subscriptions')
      .update({
        stripe_price_id: newPriceId,
        plan_name: planName,
        cuts_included: cutsIncluded,
        price_amount: price.unit_amount || 0,
        interval: interval,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('❌ Error updating database:', updateError)
    } else {
      console.log('✅ Database updated successfully')
    }

    // Log activity for upgrade
    if (isUpgrade && currentSub) {
      console.log('📊 Logging upgrade activity...')

      const bonusPoints = 250

      try {
        // Log activity
        const { error: activityError } = await supabaseClient.from('user_activities').insert({
          user_id: user.id,
          activity_type: 'membership_upgraded',
          title: 'Plan Upgraded',
          description: `Upgraded from ${currentSub.plan_name} to ${planName}`,
          metadata: {
            oldTier: currentSub.plan_name,
            newTier: planName,
            points: bonusPoints,
            subscriptionId: updatedSubscription.id,
          },
          icon_type: 'trending-up',
          badge_text: `+${bonusPoints}`,
          badge_color: 'purple',
        })

        if (activityError) {
          console.error('❌ Error logging activity:', activityError)
          throw new Error(`Activity logging failed: ${activityError.message}`)
        } else {
          console.log('✅ Activity logged successfully')
        }

        // Award bonus points
        console.log('💰 Inserting reward points...')
        console.log('   User ID:', user.id)
        console.log('   Points:', bonusPoints)
        console.log('   Source: plan_upgrade')

        const { data: pointsData, error: pointsError } = await supabaseClient.from('reward_points').insert({
          user_id: user.id,
          points: bonusPoints,
          transaction_type: 'earned',
          source: 'plan_upgrade',
          description: `Upgraded from ${currentSub.plan_name} to ${planName}`,
          reference_id: null, // Stripe subscription ID is not a UUID, use null
        }).select()

        if (pointsError) {
          console.error('❌ Error awarding bonus points:', pointsError)
          console.error('   Error details:', JSON.stringify(pointsError, null, 2))
          throw new Error(`Points award failed: ${pointsError.message}`)
        } else {
          console.log('✅ Bonus points awarded successfully')
          console.log('   Points data:', pointsData)
        }

        console.log('✅ Activity and points logged')
      } catch (upgradeError) {
        console.error('❌ Critical error in upgrade rewards:', upgradeError)
        // Don't throw - we still want to return success for the subscription update
        // But log it prominently
        console.error('⚠️ SUBSCRIPTION UPDATED BUT REWARDS FAILED ⚠️')
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription updated successfully',
        subscriptionId: updatedSubscription.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error updating subscription:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
