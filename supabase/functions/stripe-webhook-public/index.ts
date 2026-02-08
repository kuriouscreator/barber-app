import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.18.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
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

    // Get the webhook signature
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      throw new Error('No stripe signature')
    }

    // Get the raw body
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    console.log('DEBUG: Webhook secret exists?', !!webhookSecret)
    console.log('DEBUG: Webhook secret prefix:', webhookSecret?.substring(0, 10))
    console.log('DEBUG: Signature header:', signature?.substring(0, 20))

    if (!webhookSecret) {
      console.error('ERROR: No webhook secret configured in environment')
      throw new Error('No webhook secret configured')
    }

    // Verify the webhook signature manually (Deno-compatible)
    let event: Stripe.Event
    try {
      // Parse signature header
      const sigElements = signature.split(',').reduce((acc: any, element: string) => {
        const [key, value] = element.split('=')
        if (key === 't') acc.timestamp = value
        if (key === 'v1') acc.signature = value
        return acc
      }, {})

      if (!sigElements.timestamp || !sigElements.signature) {
        throw new Error('Invalid signature header format')
      }

      // Create the signed payload
      const signedPayload = `${sigElements.timestamp}.${body}`

      // Compute HMAC using Deno's crypto (async-friendly)
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(webhookSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )

      const signatureBytes = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(signedPayload)
      )

      // Convert to hex
      const computedSignature = Array.from(new Uint8Array(signatureBytes))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      // Compare signatures
      if (computedSignature !== sigElements.signature) {
        throw new Error('Signature mismatch')
      }

      // Check timestamp (prevent replay attacks - must be within 5 minutes)
      const timestampAge = Math.abs(Date.now() / 1000 - parseInt(sigElements.timestamp))
      if (timestampAge > 300) {
        throw new Error('Timestamp too old')
      }

      // Parse the event
      event = JSON.parse(body) as Stripe.Event
      console.log('✅ Webhook signature verified successfully')
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      console.error('Error details:', err.message)
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    console.log('Processing webhook event:', event.type, 'ID:', event.id)

    // Handle the event
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription
          console.log('Handling subscription change:', subscription.id, 'Status:', subscription.status)
          await handleSubscriptionChange(supabaseClient, stripe, subscription)
          break
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription
          console.log('Handling subscription deletion:', subscription.id)
          await handleSubscriptionDeleted(supabaseClient, subscription)
          break
        }
        case 'invoice.paid': {
          const invoice = event.data.object as Stripe.Invoice
          console.log('Handling invoice paid:', invoice.id)
          await handleInvoicePaid(supabaseClient, stripe, invoice)
          break
        }
        case 'subscription_schedule.created':
        case 'subscription_schedule.updated': {
          const schedule = event.data.object as Stripe.SubscriptionSchedule
          console.log('Handling subscription schedule change:', schedule.id, 'Status:', schedule.status)
          await handleSubscriptionScheduleChange(supabaseClient, stripe, schedule)
          break
        }
        case 'subscription_schedule.completed': {
          const schedule = event.data.object as Stripe.SubscriptionSchedule
          console.log('Handling subscription schedule completed:', schedule.id)
          await handleSubscriptionScheduleCompleted(supabaseClient, schedule)
          break
        }
        case 'subscription_schedule.canceled': {
          const schedule = event.data.object as Stripe.SubscriptionSchedule
          console.log('Handling subscription schedule canceled:', schedule.id)
          await handleSubscriptionScheduleCanceled(supabaseClient, schedule)
          break
        }
        default:
          console.log(`Unhandled event type: ${event.type}`)
      }
    } catch (eventError) {
      console.error('Error processing webhook event:', eventError)
      throw eventError
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

async function handleSubscriptionChange(supabaseClient: any, stripe: Stripe, subscription: Stripe.Subscription) {
  try {
    console.log('Starting subscription change handling for:', subscription.id)

    const customerId = subscription.customer as string
    const priceId = subscription.items.data[0]?.price.id

    console.log('Customer ID:', customerId, 'Price ID:', priceId)

    if (!priceId) {
      console.error('No price ID found in subscription')
      return
    }

    // Get user ID from billing_customers table
    const { data: customerData, error: customerError } = await supabaseClient
      .from('billing_customers')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (customerError) {
      console.error('Error fetching customer data:', customerError)
      return
    }

    if (!customerData) {
      console.error('No user found for customer:', customerId)
      return
    }

    console.log('Found user ID:', customerData.user_id)
    const userId = customerData.user_id

  // Get plan details from Stripe (source of truth)
  const price = await stripe.prices.retrieve(priceId, {
    expand: ['product']
  })
  
  const product = price.product as Stripe.Product
  const cutsIncluded = parseInt(product.metadata.cuts_included || '0')
  const planName = product.name

  if (!cutsIncluded || cutsIncluded <= 0) {
    console.error('Invalid cuts_included metadata for product:', product.id)
    return
  }

  // Check if this is a new subscription or an update to existing one
  const { data: existingSub } = await supabaseClient
    .from('user_subscriptions')
    .select('stripe_subscription_id, current_period_start, cuts_used, plan_name, stripe_price_id, cuts_included')
    .eq('user_id', customerData.user_id)
    .single()

  // If this is a completely new subscription (different subscription ID), 
  // it means the user created a new subscription, so we should replace the old one
  const isNewSubscription = !existingSub || existingSub.stripe_subscription_id !== subscription.id
  
  // If this is the same subscription but different plan, it's a plan change
  const isPlanChange = existingSub && 
    existingSub.stripe_subscription_id === subscription.id && 
    existingSub.stripe_price_id !== priceId

  console.log('Subscription analysis:', {
    isNewSubscription,
    isPlanChange,
    existingSubId: existingSub?.stripe_subscription_id,
    newSubId: subscription.id,
    existingPlan: existingSub?.plan_name,
    newPlan: planName
  })

  // Determine if this is a new period (reset cuts_used)
  const isNewPeriod = !existingSub || 
    new Date(subscription.current_period_start * 1000).getTime() !== 
    new Date(existingSub.current_period_start).getTime()

  // For new subscriptions, reset cuts_used to 0
  // For existing subscriptions, preserve cuts_used unless it's a new period
  const cutsUsed = isNewSubscription ? 0 : (isNewPeriod ? 0 : (existingSub?.cuts_used || 0))

  // Upsert subscription
  // Handle incomplete subscriptions where period dates might be null/0
  const periodStart = subscription.current_period_start
    ? new Date(subscription.current_period_start * 1000).toISOString()
    : new Date().toISOString()

  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Default to 30 days from now

  const subscriptionData = {
    user_id: customerData.user_id,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    plan_name: planName,
    status: subscription.status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    cuts_included: cutsIncluded,
    cuts_used: cutsUsed,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    price_amount: price.unit_amount || 0,
    updated_at: new Date().toISOString(),
  }

    const { error: upsertError } = await supabaseClient
      .from('user_subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' })

    if (upsertError) {
      console.error('Error upserting subscription:', upsertError)
      throw upsertError
    }

    console.log('Subscription updated successfully:', subscription.id)

    // Handle rewards points for new subscriptions
    if (isNewSubscription) {
      console.log('New subscription detected, awarding signup bonus and setting subscription start date')

      // Award signup bonus (100 points)
      await awardRewardsPoints(supabaseClient, userId, 100, 'signup_bonus', 'Welcome bonus for joining!')

      // Set subscription_start_date if not already set
      const { data: profileData } = await supabaseClient
        .from('profiles')
        .select('subscription_start_date')
        .eq('id', userId)
        .single()

      if (!profileData?.subscription_start_date) {
        await supabaseClient
          .from('profiles')
          .update({ subscription_start_date: new Date().toISOString() })
          .eq('id', userId)
        console.log('Set subscription_start_date for user:', userId)
      }

      // Check if this subscription came from a referral
      await processReferralCompletion(supabaseClient, userId)
    }

    // Award upgrade bonus for plan changes
    if (isPlanChange && existingSub) {
      console.log('Plan change detected, checking if it\'s an upgrade')
      await handlePlanUpgrade(supabaseClient, userId, existingSub.plan_name, planName, cutsIncluded, existingSub.cuts_included, subscription.id)
    }

    // Award monthly loyalty bonus on period renewal
    if (isNewPeriod && !isNewSubscription) {
      console.log('New billing period detected, awarding monthly loyalty bonus')
      await awardMonthlyLoyaltyPoints(supabaseClient, userId, planName, subscription.id)

      // Log membership renewed activity
      const expiryDate = new Date(subscription.current_period_end * 1000)
        .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

      await logActivityToDatabase(supabaseClient, userId, 'membership_renewed', {
        tierName: planName,
        expiryDate,
        subscriptionId: subscription.id,
      })
    }

    // Check for anniversary milestones
    await checkAnniversaryMilestones(supabaseClient, userId)
  } catch (error) {
    console.error('Error in handleSubscriptionChange:', error)
    throw error
  }
}

async function handleSubscriptionDeleted(supabaseClient: any, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  // Get user ID from billing_customers table
  const { data: customerData } = await supabaseClient
    .from('billing_customers')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!customerData) {
    console.error('No user found for customer:', customerId)
    return
  }

  // Update subscription status to canceled
  await supabaseClient
    .from('user_subscriptions')
    .update({ 
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', customerData.user_id)

  console.log('Subscription canceled:', subscription.id)
}

async function handleInvoicePaid(supabaseClient: any, stripe: Stripe, invoice: Stripe.Invoice) {
  // This ensures current_period_end is synced for proration cases
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    await handleSubscriptionChange(supabaseClient, stripe, subscription)

    // Log payment successful activity
    const customerId = invoice.customer as string
    const { data: customerData } = await supabaseClient
      .from('billing_customers')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (customerData && invoice.amount_paid) {
      // Get plan details
      const price = await stripe.prices.retrieve(subscription.items.data[0]?.price.id, {
        expand: ['product']
      })
      const product = price.product as Stripe.Product

      await logActivityToDatabase(supabaseClient, customerData.user_id, 'payment_successful', {
        amount: (invoice.amount_paid / 100).toFixed(2),
        tierName: product.name,
        invoiceId: invoice.id,
      })
    }
  }
}

async function handleSubscriptionScheduleChange(supabaseClient: any, stripe: Stripe, schedule: Stripe.SubscriptionSchedule) {
  try {
    console.log('Processing subscription schedule change:', schedule.id)
    
    // Get customer ID from the schedule
    const customerId = schedule.customer as string
    
    // Get user ID from billing_customers table
    const { data: customerData, error: customerError } = await supabaseClient
      .from('billing_customers')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (customerError || !customerData) {
      console.error('No user found for customer:', customerId)
      return
    }

    // Get the next phase (the scheduled change)
    const nextPhase = schedule.phases[1] // phases[0] is current, phases[1] is next
    if (!nextPhase) {
      console.log('No next phase found in schedule')
      return
    }

    // Get the new price ID from the next phase
    const newPriceId = nextPhase.items[0]?.price
    if (!newPriceId) {
      console.error('No price ID found in next phase')
      return
    }

    // Get plan details from Stripe
    const price = await stripe.prices.retrieve(newPriceId, {
      expand: ['product']
    })
    const product = price.product as Stripe.Product

    // Update the scheduled change info in the database
    const { error: updateError } = await supabaseClient
      .from('user_subscriptions')
      .update({
        scheduled_plan_name: product.name,
        scheduled_price_id: newPriceId,
        scheduled_effective_date: new Date(schedule.start_date * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', customerData.user_id)

    if (updateError) {
      console.error('Error updating scheduled change:', updateError)
      throw updateError
    }

    console.log('Scheduled change updated successfully:', schedule.id)
  } catch (error) {
    console.error('Error in handleSubscriptionScheduleChange:', error)
    throw error
  }
}

async function handleSubscriptionScheduleCompleted(supabaseClient: any, schedule: Stripe.SubscriptionSchedule) {
  try {
    console.log('Processing subscription schedule completed:', schedule.id)
    
    // Get customer ID from the schedule
    const customerId = schedule.customer as string
    
    // Get user ID from billing_customers table
    const { data: customerData, error: customerError } = await supabaseClient
      .from('billing_customers')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (customerError || !customerData) {
      console.error('No user found for customer:', customerId)
      return
    }

    // Clear the scheduled change info since it's now completed
    const { error: updateError } = await supabaseClient
      .from('user_subscriptions')
      .update({
        scheduled_plan_name: null,
        scheduled_price_id: null,
        scheduled_effective_date: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', customerData.user_id)

    if (updateError) {
      console.error('Error clearing scheduled change:', updateError)
      throw updateError
    }

    console.log('Scheduled change completed and cleared:', schedule.id)
  } catch (error) {
    console.error('Error in handleSubscriptionScheduleCompleted:', error)
    throw error
  }
}

async function handleSubscriptionScheduleCanceled(supabaseClient: any, schedule: Stripe.SubscriptionSchedule) {
  try {
    console.log('Processing subscription schedule canceled:', schedule.id)
    
    // Get customer ID from the schedule
    const customerId = schedule.customer as string
    
    // Get user ID from billing_customers table
    const { data: customerData, error: customerError } = await supabaseClient
      .from('billing_customers')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (customerError || !customerData) {
      console.error('No user found for customer:', customerId)
      return
    }

    // Clear the scheduled change info since it's been canceled
    const { error: updateError } = await supabaseClient
      .from('user_subscriptions')
      .update({
        scheduled_plan_name: null,
        scheduled_price_id: null,
        scheduled_effective_date: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', customerData.user_id)

    if (updateError) {
      console.error('Error clearing canceled scheduled change:', updateError)
      throw updateError
    }

    console.log('Canceled scheduled change cleared:', schedule.id)
  } catch (error) {
    console.error('Error in handleSubscriptionScheduleCanceled:', error)
    throw error
  }
}

// Rewards System Helper Functions

async function handlePlanUpgrade(
  supabaseClient: any,
  userId: string,
  oldPlanName: string,
  newPlanName: string,
  newCutsIncluded: number,
  oldCutsIncluded: number,
  subscriptionId: string
) {
  try {
    console.log('handlePlanUpgrade called with:', {
      userId,
      oldPlanName,
      newPlanName,
      oldCutsIncluded,
      newCutsIncluded,
      subscriptionId
    })

    // Check if this is an upgrade (more cuts = higher tier)
    if (newCutsIncluded <= oldCutsIncluded) {
      console.log('Plan change is not an upgrade (or same tier), skipping reward')
      console.log(`Comparison: new ${newCutsIncluded} <= old ${oldCutsIncluded}`)
      return
    }

    console.log(`✅ Plan upgraded from ${oldPlanName} (${oldCutsIncluded} cuts) to ${newPlanName} (${newCutsIncluded} cuts)`)

    // Calculate reward points based on tier jump
    // Base reward: 250 points
    // Additional 100 points per tier level jumped
    const tierDifference = Math.floor((newCutsIncluded - oldCutsIncluded) / 2) // Rough tier calculation
    const bonusPoints = 250 + (tierDifference * 100)

    console.log(`Calculated bonus: ${bonusPoints} points (tierDiff: ${tierDifference})`)

    // Award the upgrade bonus
    console.log('Awarding rewards points...')
    await awardRewardsPoints(
      supabaseClient,
      userId,
      bonusPoints,
      'plan_upgrade',
      `Upgraded from ${oldPlanName} to ${newPlanName}`
    )
    console.log('✅ Rewards points awarded')

    // Log tier upgrade activity
    console.log('Logging membership_upgraded activity...')
    await logActivityToDatabase(supabaseClient, userId, 'membership_upgraded', {
      oldTier: oldPlanName,
      newTier: newPlanName,
      points: bonusPoints,
      subscriptionId,
    })
    console.log('✅ Activity logged to database')

    console.log(`🎉 Successfully awarded ${bonusPoints} points for plan upgrade`)
  } catch (error) {
    console.error('❌ Error handling plan upgrade:', error)
    console.error('Error stack:', error.stack)
  }
}

async function awardRewardsPoints(
  supabaseClient: any,
  userId: string,
  points: number,
  source: string,
  description: string,
  referenceId?: string
) {
  try {
    console.log(`Awarding ${points} points to user ${userId} for ${source}`)

    // Insert reward points transaction
    const { error: insertError } = await supabaseClient
      .from('reward_points')
      .insert({
        user_id: userId,
        points: points,
        transaction_type: 'earned',
        source: source,
        description: description,
        reference_id: referenceId,
      })

    if (insertError) {
      console.error('Error inserting reward points:', insertError)
      return false
    }

    // Update total_points in profiles
    const { data: currentBalance } = await supabaseClient.rpc('get_user_points_balance', {
      p_user_id: userId,
    })

    await supabaseClient
      .from('profiles')
      .update({ total_points: currentBalance || points })
      .eq('id', userId)

    // Log activity
    await logActivityToDatabase(supabaseClient, userId, 'reward_earned', {
      points,
      reason: description,
      referenceId,
    })

    console.log(`Successfully awarded ${points} points to user ${userId}`)
    return true
  } catch (error) {
    console.error('Error awarding reward points:', error)
    return false
  }
}

async function awardMonthlyLoyaltyPoints(
  supabaseClient: any,
  userId: string,
  planName: string,
  subscriptionId: string
) {
  try {
    // Determine tier multiplier based on plan name
    let multiplier = 1.0
    const planLower = planName.toLowerCase()

    if (planLower.includes('premium') || planLower.includes('pro')) {
      multiplier = 2.0
    } else if (planLower.includes('vip') || planLower.includes('elite')) {
      multiplier = 3.0
    }

    const basePoints = 100
    const points = Math.floor(basePoints * multiplier)

    await awardRewardsPoints(
      supabaseClient,
      userId,
      points,
      'monthly_loyalty',
      `Monthly loyalty bonus - ${planName}`
    )
  } catch (error) {
    console.error('Error awarding monthly loyalty points:', error)
  }
}

async function checkAnniversaryMilestones(supabaseClient: any, userId: string) {
  try {
    // Get user profile with subscription start date
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('subscription_start_date, last_anniversary_reward')
      .eq('id', userId)
      .single()

    if (!profile?.subscription_start_date) {
      return
    }

    const subscriptionStart = new Date(profile.subscription_start_date)
    const now = new Date()
    const monthsDiff = getMonthsDifference(subscriptionStart, now)

    let points = 0
    let shouldAward = false
    let description = ''

    // Check 6-month milestone
    if (monthsDiff === 6 && !hasRewardedMilestone(profile.last_anniversary_reward, 6)) {
      points = 750
      shouldAward = true
      description = '6 month anniversary bonus'
    }
    // Check yearly milestones
    else if (monthsDiff >= 12) {
      const yearsSinceStart = Math.floor(monthsDiff / 12)
      const lastRewardMonths = profile.last_anniversary_reward
        ? getMonthsDifference(subscriptionStart, new Date(profile.last_anniversary_reward))
        : 0
      const lastRewardYears = Math.floor(lastRewardMonths / 12)

      if (yearsSinceStart > lastRewardYears) {
        points = yearsSinceStart === 1 ? 1500 : 2000
        shouldAward = true
        description = `${yearsSinceStart} year anniversary bonus`
      }
    }

    if (shouldAward) {
      await awardRewardsPoints(supabaseClient, userId, points, 'anniversary', description)

      await supabaseClient
        .from('profiles')
        .update({ last_anniversary_reward: now.toISOString() })
        .eq('id', userId)

      console.log(`Awarded ${points} anniversary points to user ${userId}`)
    }
  } catch (error) {
    console.error('Error checking anniversary milestones:', error)
  }
}

async function processReferralCompletion(supabaseClient: any, newUserId: string) {
  try {
    // Find pending referral for this user
    const { data: referral } = await supabaseClient
      .from('referrals')
      .select('*')
      .eq('referred_user_id', newUserId)
      .eq('status', 'pending')
      .single()

    if (!referral) {
      console.log('No pending referral found for user:', newUserId)
      return
    }

    // Get referred user's name
    const { data: referredUser } = await supabaseClient
      .from('profiles')
      .select('full_name')
      .eq('id', newUserId)
      .single()

    // Award points to referrer
    const referralBonus = 500
    await awardRewardsPoints(
      supabaseClient,
      referral.referrer_user_id,
      referralBonus,
      'referral',
      'Referral bonus',
      referral.id
    )

    // Update referral status
    await supabaseClient
      .from('referrals')
      .update({
        status: 'completed',
        points_awarded: referralBonus,
        completed_at: new Date().toISOString(),
      })
      .eq('id', referral.id)

    // Log referral completed activity
    await logActivityToDatabase(supabaseClient, referral.referrer_user_id, 'referral_completed', {
      referredName: referredUser?.full_name || 'New user',
      points: referralBonus,
      referralId: referral.id,
    })

    console.log(`Completed referral ${referral.id}, awarded ${referralBonus} points to ${referral.referrer_user_id}`)
  } catch (error) {
    console.error('Error processing referral completion:', error)
  }
}

function getMonthsDifference(date1: Date, date2: Date): number {
  return (
    (date2.getFullYear() - date1.getFullYear()) * 12 +
    (date2.getMonth() - date1.getMonth())
  )
}

function hasRewardedMilestone(lastReward: string | null, months: number): boolean {
  if (!lastReward) return false
  const lastRewardDate = new Date(lastReward)
  const now = new Date()
  const monthsSinceLastReward = getMonthsDifference(lastRewardDate, now)
  return monthsSinceLastReward < months
}

// Activity logging configurations
const ACTIVITY_CONFIGS: Record<string, any> = {
  reward_earned: {
    icon: 'gift',
    titleTemplate: 'Reward Earned',
    descriptionTemplate: '+{points} points for {reason}',
    badgeText: '+{points}',
    badgeColor: 'blue',
  },
  membership_renewed: {
    icon: 'sparkles',
    titleTemplate: 'Membership Renewed',
    descriptionTemplate: '{tierName} membership extended to {expiryDate}',
    badgeText: 'Auto',
    badgeColor: 'orange',
  },
  payment_successful: {
    icon: 'card',
    titleTemplate: 'Payment Processed',
    descriptionTemplate: '${amount} for {tierName} subscription',
    badgeText: null,
    badgeColor: null,
  },
  payment_failed: {
    icon: 'alert-circle',
    titleTemplate: 'Payment Failed',
    descriptionTemplate: 'Update payment method to continue service',
    badgeText: 'Action Required',
    badgeColor: 'red',
  },
  referral_completed: {
    icon: 'people',
    titleTemplate: 'Referral Bonus',
    descriptionTemplate: '{referredName} joined with your code',
    badgeText: '+{points}',
    badgeColor: 'green',
  },
  membership_upgraded: {
    icon: 'trending-up',
    titleTemplate: 'Plan Upgraded',
    descriptionTemplate: 'Upgraded from {oldTier} to {newTier}',
    badgeText: '+{points}',
    badgeColor: 'purple',
  },
}

function interpolateTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key]?.toString() || match
  })
}

async function logActivityToDatabase(
  supabaseClient: any,
  userId: string,
  activityType: string,
  metadata: Record<string, any> = {}
) {
  try {
    const config = ACTIVITY_CONFIGS[activityType]
    if (!config) {
      console.log(`No activity config for: ${activityType}`)
      return
    }

    const title = interpolateTemplate(config.titleTemplate, metadata)
    const description = interpolateTemplate(config.descriptionTemplate, metadata)
    const badgeText = config.badgeText ? interpolateTemplate(config.badgeText, metadata) : null

    await supabaseClient.from('user_activities').insert({
      user_id: userId,
      activity_type: activityType,
      title,
      description,
      metadata,
      icon_type: config.icon,
      badge_text: badgeText,
      badge_color: config.badgeColor,
    })

    console.log(`✅ Activity logged: ${activityType} for user ${userId}`)
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}
