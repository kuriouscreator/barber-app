#!/usr/bin/env node

/**
 * Stripe Billing Setup Script
 * 
 * This script helps set up the Stripe billing integration by:
 * 1. Creating sample plan data in the database
 * 2. Validating environment variables
 * 3. Testing Edge Function connectivity
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupBilling() {
  console.log('🚀 Setting up Stripe Billing Integration...\n');

  try {
    // 1. Check if billing tables exist
    console.log('1. Checking database schema...');
    const { data: tables, error: tableError } = await supabase
      .from('plan_catalog')
      .select('count')
      .limit(1);

    if (tableError) {
      console.error('❌ Billing tables not found. Please run setup-billing-schema.sql first.');
      process.exit(1);
    }
    console.log('✅ Billing tables found\n');

    // 2. Insert sample plan data (replace with your actual Stripe IDs)
    console.log('2. Setting up sample plan data...');
    const samplePlans = [
      {
        stripe_product_id: 'prod_basic_sample',
        stripe_price_id: 'price_basic_monthly_sample',
        name: 'Basic Plan',
        cuts_included_per_period: 4,
        interval: 'month',
        active: true
      },
      {
        stripe_product_id: 'prod_premium_sample',
        stripe_price_id: 'price_premium_monthly_sample',
        name: 'Premium Plan',
        cuts_included_per_period: 8,
        interval: 'month',
        active: true
      },
      {
        stripe_product_id: 'prod_vip_sample',
        stripe_price_id: 'price_vip_monthly_sample',
        name: 'VIP Plan',
        cuts_included_per_period: 12,
        interval: 'month',
        active: true
      }
    ];

    const { error: insertError } = await supabase
      .from('plan_catalog')
      .upsert(samplePlans, { onConflict: 'stripe_price_id' });

    if (insertError) {
      console.error('❌ Error inserting sample plans:', insertError.message);
    } else {
      console.log('✅ Sample plan data inserted');
      console.log('   ⚠️  Remember to update with your actual Stripe Product/Price IDs\n');
    }

    // 3. Test Edge Function connectivity
    console.log('3. Testing Edge Function connectivity...');
    try {
      const { data, error } = await supabase.functions.invoke('stripe-create-checkout', {
        body: { priceId: 'test' }
      });
      
      if (error && error.message.includes('Invalid user')) {
        console.log('✅ Edge Function is deployed and responding');
      } else if (error) {
        console.log('⚠️  Edge Function deployed but may need configuration:', error.message);
      }
    } catch (funcError) {
      console.log('❌ Edge Function not accessible:', funcError.message);
      console.log('   Make sure to deploy Edge Functions first');
    }

    // 4. Check environment variables
    console.log('\n4. Checking environment variables...');
    const requiredEnvVars = [
      'EXPO_PUBLIC_SUPABASE_URL',
      'EXPO_PUBLIC_SUPABASE_ANON_KEY'
    ];

    const optionalEnvVars = [
      'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY'
    ];

    let allRequired = true;
    requiredEnvVars.forEach(envVar => {
      if (process.env[envVar]) {
        console.log(`✅ ${envVar}`);
      } else {
        console.log(`❌ ${envVar} - Required`);
        allRequired = false;
      }
    });

    optionalEnvVars.forEach(envVar => {
      if (process.env[envVar]) {
        console.log(`✅ ${envVar}`);
      } else {
        console.log(`⚠️  ${envVar} - Optional (for future PaymentSheet)`);
      }
    });

    if (!allRequired) {
      console.log('\n❌ Missing required environment variables');
      process.exit(1);
    }

    // 5. Summary
    console.log('\n🎉 Setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Create products and prices in Stripe Dashboard');
    console.log('2. Update plan_catalog with your actual Stripe IDs');
    console.log('3. Configure webhook endpoint in Stripe Dashboard');
    console.log('4. Add Stripe secrets to Supabase Edge Functions');
    console.log('5. Deploy Edge Functions to Supabase');
    console.log('6. Test the integration with test cards');
    console.log('\nSee STRIPE_BILLING_SETUP.md for detailed instructions.');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setupBilling();

