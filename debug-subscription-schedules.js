// Debug script to check subscription schedule data
// Run this in your browser console or as a Node.js script

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSubscriptionSchedules() {
  console.log('🔍 Debugging subscription schedules...\n');

  try {
    // Check if the new fields exist in the database
    console.log('1. Checking database schema...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .limit(1);

    if (schemaError) {
      console.error('❌ Schema error:', schemaError);
      return;
    }

    if (schemaData && schemaData.length > 0) {
      const fields = Object.keys(schemaData[0]);
      console.log('✅ Available fields:', fields);
      
      const hasScheduledFields = fields.includes('scheduled_plan_name') && 
                                fields.includes('scheduled_price_id') && 
                                fields.includes('scheduled_effective_date');
      
      if (hasScheduledFields) {
        console.log('✅ Scheduled change fields are present');
      } else {
        console.log('❌ Scheduled change fields are missing');
        console.log('   Run the SQL migration: add-scheduled-change-fields.sql');
        return;
      }
    }

    // Check current subscription data
    console.log('\n2. Checking current subscription data...');
    const { data: subscriptionData, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .single();

    if (subError) {
      console.error('❌ Subscription error:', subError);
      return;
    }

    if (subscriptionData) {
      console.log('📊 Current subscription:');
      console.log('   Plan:', subscriptionData.plan_name);
      console.log('   Price ID:', subscriptionData.stripe_price_id);
      console.log('   Status:', subscriptionData.status);
      console.log('   Scheduled Plan:', subscriptionData.scheduled_plan_name || 'None');
      console.log('   Scheduled Price ID:', subscriptionData.scheduled_price_id || 'None');
      console.log('   Scheduled Date:', subscriptionData.scheduled_effective_date || 'None');
    } else {
      console.log('❌ No subscription found');
    }

    // Test the schedule function
    console.log('\n3. Testing schedule function...');
    try {
      const { data: scheduleData, error: scheduleError } = await supabase.functions.invoke('stripe-get-schedule');
      
      if (scheduleError) {
        console.log('❌ Schedule function error:', scheduleError);
      } else {
        console.log('✅ Schedule function response:', scheduleData);
      }
    } catch (funcError) {
      console.log('❌ Function call error:', funcError.message);
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug function
debugSubscriptionSchedules();
