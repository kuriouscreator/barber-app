import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

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

    // Get all active products from Stripe
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price']
    })

    const plansToUpsert = []

    for (const product of products.data) {
      const defaultPrice = product.default_price as Stripe.Price
      
      if (!defaultPrice || defaultPrice.type !== 'recurring') {
        continue // Skip non-recurring products
      }

      // Get cuts_included from product metadata
      const cutsIncluded = parseInt(product.metadata.cuts_included || '0')
      const interval = defaultPrice.recurring?.interval || 'month'

      if (cutsIncluded <= 0) {
        console.warn(`Product ${product.id} missing or invalid cuts_included metadata`)
        continue
      }

      plansToUpsert.push({
        stripe_product_id: product.id,
        stripe_price_id: defaultPrice.id,
        name: product.name,
        cuts_included_per_period: cutsIncluded,
        interval: interval,
        active: true,
        price_amount: defaultPrice.unit_amount || 0,
        updated_at: new Date().toISOString(),
      })
    }

    // Upsert plans to database
    if (plansToUpsert.length > 0) {
      const { error } = await supabaseClient
        .from('plan_catalog')
        .upsert(plansToUpsert, { 
          onConflict: 'stripe_price_id',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error('Error upserting plans:', error)
        throw new Error(`Failed to sync plans: ${error.message}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        plansSynced: plansToUpsert.length,
        plans: plansToUpsert
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error syncing plans from Stripe:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

