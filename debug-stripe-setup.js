// Debug script to check Stripe setup and webhook configuration
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables:');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugStripeSetup() {
  try {
    console.log('🔍 Debugging Stripe Setup...\n');

    // 1. Check if user_subscriptions table exists and has data
    console.log('1. Checking user_subscriptions table...');
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .limit(5);
    
    if (subError) {
      console.error('❌ Error querying user_subscriptions:', subError);
    } else {
      console.log('✅ user_subscriptions table accessible');
      console.log('📊 Current subscriptions:', subscriptions?.length || 0);
      if (subscriptions && subscriptions.length > 0) {
        console.log('📋 Sample subscription:', subscriptions[0]);
      }
    }

    // 2. Check if plan_catalog has data
    console.log('\n2. Checking plan_catalog table...');
    const { data: plans, error: planError } = await supabase
      .from('plan_catalog')
      .select('*')
      .limit(5);
    
    if (planError) {
      console.error('❌ Error querying plan_catalog:', planError);
    } else {
      console.log('✅ plan_catalog table accessible');
      console.log('📊 Current plans:', plans?.length || 0);
      if (plans && plans.length > 0) {
        console.log('📋 Sample plan:', plans[0]);
      }
    }

    // 3. Check if billing_customers has data
    console.log('\n3. Checking billing_customers table...');
    const { data: customers, error: customerError } = await supabase
      .from('billing_customers')
      .select('*')
      .limit(5);
    
    if (customerError) {
      console.error('❌ Error querying billing_customers:', customerError);
    } else {
      console.log('✅ billing_customers table accessible');
      console.log('📊 Current customers:', customers?.length || 0);
      if (customers && customers.length > 0) {
        console.log('📋 Sample customer:', customers[0]);
      }
    }

    // 4. Test Edge Function endpoints
    console.log('\n4. Testing Edge Function endpoints...');
    
    // Test sync-stripe-plans
    try {
      const { data: syncData, error: syncError } = await supabase.functions.invoke('sync-stripe-plans', {
        body: {}
      });
      if (syncError) {
        console.error('❌ sync-stripe-plans error:', syncError);
      } else {
        console.log('✅ sync-stripe-plans working');
      }
    } catch (error) {
      console.error('❌ sync-stripe-plans failed:', error.message);
    }

    console.log('\n🔧 Next Steps:');
    console.log('1. Check Stripe Dashboard -> Webhooks');
    console.log('2. Verify webhook endpoint URL is correct');
    console.log('3. Ensure webhook events include: customer.subscription.created, customer.subscription.updated, invoice.paid');
    console.log('4. Check webhook secret is set in Supabase secrets');
    console.log('5. Test webhook with Stripe CLI: stripe listen --forward-to your-webhook-url');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugStripeSetup();

