#!/usr/bin/env node

/**
 * Debug script to monitor subscription data changes in real-time
 * This will help identify what's happening when the screen refreshes
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function monitorSubscriptionChanges() {
  console.log('🔍 Monitoring subscription changes in real-time...');
  console.log('   Press Ctrl+C to stop monitoring\n');

  // Get initial state
  const { data: initialSubscriptions, error: initialError } = await supabase
    .from('user_subscriptions')
    .select('*')
    .order('updated_at', { ascending: false });

  if (initialError) {
    console.error('❌ Error fetching initial subscriptions:', initialError);
    return;
  }

  console.log(`📊 Initial state: ${initialSubscriptions.length} subscriptions found\n`);

  // Set up real-time monitoring
  const channel = supabase
    .channel('subscription-monitor')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_subscriptions',
      },
      (payload) => {
        const timestamp = new Date().toISOString();
        console.log(`\n🔄 [${timestamp}] Subscription change detected:`);
        console.log(`   Event: ${payload.eventType}`);
        console.log(`   User ID: ${payload.new?.user_id || payload.old?.user_id}`);
        
        if (payload.eventType === 'UPDATE') {
          console.log('   Changes:');
          const oldData = payload.old;
          const newData = payload.new;
          
          // Check for plan name changes
          if (oldData.plan_name !== newData.plan_name) {
            console.log(`      📋 Plan: ${oldData.plan_name} → ${newData.plan_name}`);
          }
          
          // Check for price ID changes
          if (oldData.stripe_price_id !== newData.stripe_price_id) {
            console.log(`      💰 Price ID: ${oldData.stripe_price_id} → ${newData.stripe_price_id}`);
          }
          
          // Check for status changes
          if (oldData.status !== newData.status) {
            console.log(`      📊 Status: ${oldData.status} → ${newData.status}`);
          }
          
          // Check for scheduled changes
          if (oldData.scheduled_plan_name !== newData.scheduled_plan_name) {
            console.log(`      ⏰ Scheduled Plan: ${oldData.scheduled_plan_name || 'None'} → ${newData.scheduled_plan_name || 'None'}`);
          }
          
          // Check for cuts changes
          if (oldData.cuts_used !== newData.cuts_used) {
            console.log(`      ✂️  Cuts Used: ${oldData.cuts_used} → ${newData.cuts_used}`);
          }
          
          // Check for period changes
          if (oldData.current_period_start !== newData.current_period_start) {
            console.log(`      📅 Period Start: ${oldData.current_period_start} → ${newData.current_period_start}`);
          }
          
          if (oldData.current_period_end !== newData.current_period_end) {
            console.log(`      📅 Period End: ${oldData.current_period_end} → ${newData.current_period_end}`);
          }
        } else if (payload.eventType === 'INSERT') {
          console.log('   New subscription created:');
          console.log(`      📋 Plan: ${payload.new.plan_name}`);
          console.log(`      💰 Price ID: ${payload.new.stripe_price_id}`);
          console.log(`      📊 Status: ${payload.new.status}`);
        } else if (payload.eventType === 'DELETE') {
          console.log('   Subscription deleted');
        }
        
        console.log(`   Updated at: ${payload.new?.updated_at || payload.old?.updated_at}`);
      }
    )
    .subscribe();

  // Keep the script running
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping monitoring...');
    supabase.removeChannel(channel);
    process.exit(0);
  });

  // Keep the process alive
  setInterval(() => {
    // Just keep the process running
  }, 1000);
}

// Run the monitoring function
monitorSubscriptionChanges().catch(console.error);
