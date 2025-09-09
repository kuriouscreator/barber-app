import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.9.0'

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

    if (!webhookSecret) {
      throw new Error('No webhook secret configured')
    }

    // Verify the webhook signature
    let event: Stripe.Event
    try {
      // Use the Node.js compatible version
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
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
          await handleSubscriptionChange(supabaseClient, subscription)
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
          await handleInvoicePaid(supabaseClient, invoice)
          break
        }
        case 'subscription_schedule.created':
        case 'subscription_schedule.updated': {
          const schedule = event.data.object as Stripe.SubscriptionSchedule
          console.log('Handling subscription schedule change:', schedule.id, 'Status:', schedule.status)
          await handleSubscriptionScheduleChange(supabaseClient, schedule)
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

async function handleSubscriptionChange(supabaseClient: any, subscription: Stripe.Subscription) {
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
    .select('stripe_subscription_id, current_period_start, cuts_used, plan_name, stripe_price_id')
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
  const subscriptionData = {
    user_id: customerData.user_id,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    plan_name: planName,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cuts_included: cutsIncluded,
    cuts_used: cutsUsed,
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

async function handleInvoicePaid(supabaseClient: any, invoice: Stripe.Invoice) {
  // This ensures current_period_end is synced for proration cases
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    await handleSubscriptionChange(supabaseClient, subscription)
  }
}

async function handleSubscriptionScheduleChange(supabaseClient: any, schedule: Stripe.SubscriptionSchedule) {
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
