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

    // Get or create Stripe customer
    let customerId: string
    const { data: existingCustomer } = await supabaseClient
      .from('billing_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (existingCustomer) {
      customerId = existingCustomer.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })

      customerId = customer.id

      // Store customer ID in database
      await supabaseClient
        .from('billing_customers')
        .insert({
          user_id: user.id,
          stripe_customer_id: customerId,
        })
    }

    // Create ephemeral key for CustomerSheet
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2023-10-16' }
    )

    // Create SetupIntent for adding new payment methods
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    })

    // Get customer's default payment method
    const customer = await stripe.customers.retrieve(customerId)
    let defaultPaymentMethod = null

    if (customer && !customer.deleted) {
      let defaultPaymentMethodId = customer.invoice_settings?.default_payment_method

      // If no default payment method is set, try to get the first payment method
      if (!defaultPaymentMethodId) {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: customerId,
          type: 'card',
          limit: 1,
        })

        if (paymentMethods.data.length > 0) {
          defaultPaymentMethodId = paymentMethods.data[0].id
        }
      }

      if (defaultPaymentMethodId && typeof defaultPaymentMethodId === 'string') {
        const paymentMethod = await stripe.paymentMethods.retrieve(defaultPaymentMethodId)

        if (paymentMethod.card) {
          defaultPaymentMethod = {
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            expMonth: paymentMethod.card.exp_month,
            expYear: paymentMethod.card.exp_year,
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        customerId: customerId,
        ephemeralKeySecret: ephemeralKey.secret,
        setupIntentClientSecret: setupIntent.client_secret,
        publishableKey: Deno.env.get('STRIPE_PUBLISHABLE_KEY'),
        defaultPaymentMethod,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error creating customer sheet config:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
