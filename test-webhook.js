// Test script to verify webhook endpoint is working
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWebhook() {
  try {
    console.log('Testing webhook endpoint...');
    
    // Test the webhook endpoint directly
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        type: 'test',
        data: { object: { id: 'test' } }
      })
    });

    console.log('Webhook response status:', response.status);
    const result = await response.text();
    console.log('Webhook response:', result);
    
  } catch (error) {
    console.error('Error testing webhook:', error);
  }
}

testWebhook();

