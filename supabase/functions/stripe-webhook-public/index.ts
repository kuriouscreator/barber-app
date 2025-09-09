import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.9.0'

// Custom webhook signature verification using Deno's crypto
async function verifyStripeWebhook(
  payload: string,
  signature: string,
  secret: string
): Promise<Stripe.Event> {
  const elements = signature.split(',')
  let timestamp: string | null = null
  let v1: string | null = null

  for (const element of elements) {
    const [key, value] = element.split('=')
    if (key === 't') {
      timestamp = value
    } else if (key === 'v1') {
      v1 = value
    }
  }

  if (!timestamp || !v1) {
    throw new Error('Invalid signature format')
  }

  // Check timestamp (should be within 5 minutes)
  const currentTime = Math.floor(Date.now() / 1000)
  const eventTime = parseInt(timestamp)
  if (Math.abs(currentTime - eventTime) > 300) {
    throw new Error('Timestamp too old')
  }

  // Create the signed payload
  const signedPayload = `${timestamp}.${payload}`

  // Create HMAC signature
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Compare signatures
  if (computedSignature !== v1) {
    throw new Error('Signature verification failed')
  }

  // Parse and return the event
  return JSON.parse(payload) as Stripe.Event
}

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

    // Debug: Log all headers
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))
    
    // Get the webhook signature
    const signature = req.headers.get('stripe-signature')
    console.log('Stripe signature:', signature)
    
    if (!signature) {
      console.error('No stripe signature found in headers')
      throw new Error('No stripe signature')
    }

    // Get the raw body
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!webhookSecret) {
      throw new Error('No webhook secret configured')
    }

    // Verify the webhook signature using Deno's built-in crypto
    let event: Stripe.Event
    try {
      event = await verifyStripeWebhook(body, signature, webhookSecret)
      console.log('Webhook signature verified successfully')
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
          await handleSubscriptionChange(supabaseClient, subscription, stripe)
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
          await handleInvoicePaid(supabaseClient, invoice, stripe)
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

async function handleSubscriptionChange(supabaseClient: any, subscription: Stripe.Subscription, stripe: Stripe) {
  try {
    console.log('Starting subscription change handling for:', subscription.id)
    console.log('Subscription object keys:', Object.keys(subscription))
    console.log('Subscription current_period_start:', subscription.current_period_start, typeof subscription.current_period_start)
    console.log('Subscription current_period_end:', subscription.current_period_end, typeof subscription.current_period_end)
    
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

  // Debug timestamps
  console.log('Subscription timestamps:', {
    current_period_start: subscription.current_period_start,
    current_period_end: subscription.current_period_end,
    start_type: typeof subscription.current_period_start,
    end_type: typeof subscription.current_period_end
  })

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

  // Convert timestamps safely - check subscription items for period dates
  let periodStart: Date
  let periodEnd: Date
  
  try {
    // Get period dates from subscription items (they contain the actual period info)
    const subscriptionItem = subscription.items.data[0]
    if (!subscriptionItem) {
      throw new Error('No subscription items found')
    }
    
    const startTimestamp = subscriptionItem.current_period_start
    const endTimestamp = subscriptionItem.current_period_end
    
    console.log('Using subscription item timestamps:', {
      start: startTimestamp,
      end: endTimestamp
    })
    
    if (!startTimestamp || !endTimestamp) {
      throw new Error('Missing period timestamps in subscription item')
    }
    
    periodStart = new Date(startTimestamp * 1000)
    periodEnd = new Date(endTimestamp * 1000)
    
    console.log('Converted dates:', {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString()
    })
  } catch (dateError) {
    console.error('Error converting timestamps:', dateError)
    console.error('Raw timestamps:', {
      start: subscription.current_period_start,
      end: subscription.current_period_end
    })
    throw dateError
  }

  // Determine if this is a new period (reset cuts_used)
  const isNewPeriod = !existingSub || 
    periodStart.getTime() !== new Date(existingSub.current_period_start).getTime()

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
    current_period_start: periodStart.toISOString(),
    current_period_end: periodEnd.toISOString(),
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

async function handleInvoicePaid(supabaseClient: any, invoice: Stripe.Invoice, stripe: Stripe) {
  // This ensures current_period_end is synced for proration cases
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
    await handleSubscriptionChange(supabaseClient, subscription, stripe)
  }
}
