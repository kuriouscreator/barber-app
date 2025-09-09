#!/usr/bin/env node

/**
 * Debug script to investigate subscription plan changes
 * This will help identify why a user's plan is reverting from Premium to VIP
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

async function debugSubscriptionIssue() {
  console.log('🔍 Debugging subscription plan changes...\n');

  try {
    // Get all users with their subscription data
    console.log('📊 Fetching all user subscriptions...');
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (subError) {
      console.error('❌ Error fetching subscriptions:', subError);
      return;
    }

    console.log(`✅ Found ${subscriptions.length} subscription records\n`);

    // Display each subscription with details
    subscriptions.forEach((sub, index) => {
      console.log(`--- Subscription ${index + 1} ---`);
      console.log(`👤 User ID: ${sub.user_id}`);
      console.log(`📋 Plan: ${sub.plan_name}`);
      console.log(`💰 Price ID: ${sub.stripe_price_id}`);
      console.log(`📊 Status: ${sub.status}`);
      console.log(`📅 Current Period: ${sub.current_period_start} to ${sub.current_period_end}`);
      console.log(`✂️  Cuts: ${sub.cuts_used}/${sub.cuts_included}`);
      
      // Check for scheduled changes
      if (sub.scheduled_plan_name) {
        console.log(`⏰ SCHEDULED CHANGE:`);
        console.log(`   📋 New Plan: ${sub.scheduled_plan_name}`);
        console.log(`   💰 New Price ID: ${sub.scheduled_price_id}`);
        console.log(`   📅 Effective Date: ${sub.scheduled_effective_date}`);
      } else {
        console.log(`⏰ No scheduled changes`);
      }
      
      console.log(`🕒 Last Updated: ${sub.updated_at}`);
      console.log('');
    });

    // Check for any subscription schedules in Stripe (if we have webhook logs)
    console.log('🔍 Checking for recent webhook activity...');
    const { data: webhookLogs, error: webhookError } = await supabase
      .from('webhook_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!webhookError && webhookLogs && webhookLogs.length > 0) {
      console.log(`📝 Recent webhook activity (last 10 events):`);
      webhookLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.event_type} - ${log.created_at}`);
        if (log.event_type.includes('subscription')) {
          console.log(`      Data: ${JSON.stringify(log.data, null, 2).substring(0, 200)}...`);
        }
      });
    } else {
      console.log('📝 No webhook logs found (this is normal if webhook logging is not set up)');
    }

    // Check for any duplicate subscriptions for the same user
    console.log('\n🔍 Checking for duplicate subscriptions...');
    const userCounts = {};
    subscriptions.forEach(sub => {
      userCounts[sub.user_id] = (userCounts[sub.user_id] || 0) + 1;
    });

    const duplicates = Object.entries(userCounts).filter(([userId, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log('⚠️  Found users with multiple subscriptions:');
      duplicates.forEach(([userId, count]) => {
        console.log(`   User ${userId}: ${count} subscriptions`);
      });
    } else {
      console.log('✅ No duplicate subscriptions found');
    }

    // Check for any subscriptions with scheduled changes that might be causing issues
    console.log('\n🔍 Checking for problematic scheduled changes...');
    const scheduledChanges = subscriptions.filter(sub => sub.scheduled_plan_name);
    if (scheduledChanges.length > 0) {
      console.log(`⚠️  Found ${scheduledChanges.length} subscriptions with scheduled changes:`);
      scheduledChanges.forEach(sub => {
        const effectiveDate = new Date(sub.scheduled_effective_date);
        const now = new Date();
        const isPastDue = effectiveDate < now;
        
        console.log(`   👤 ${sub.user?.email || 'Unknown'}:`);
        console.log(`      Current: ${sub.plan_name}`);
        console.log(`      Scheduled: ${sub.scheduled_plan_name}`);
        console.log(`      Effective: ${sub.scheduled_effective_date} ${isPastDue ? '(PAST DUE!)' : ''}`);
      });
    } else {
      console.log('✅ No scheduled changes found');
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
}

// Run the debug function
debugSubscriptionIssue().then(() => {
  console.log('\n🏁 Debug complete!');
  console.log('\n💡 Next steps:');
  console.log('   1. Look for users with multiple subscriptions');
  console.log('   2. Check for scheduled changes that are past due');
  console.log('   3. Verify that webhook events are being processed correctly');
  console.log('   4. Check Stripe dashboard for any subscription schedule issues');
}).catch(console.error);
