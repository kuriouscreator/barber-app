#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupEnvironment() {
  console.log('🔐 Supabase Environment Setup\n');
  console.log('This script will help you create a .env file with your Supabase credentials.\n');
  
  console.log('📋 First, get your credentials from Supabase:');
  console.log('1. Go to https://supabase.com');
  console.log('2. Sign in and create/select your project');
  console.log('3. Navigate to Settings > API');
  console.log('4. Copy your Project URL and anon/public key\n');

  const supabaseUrl = await question('Enter your Supabase Project URL: ');
  const supabaseKey = await question('Enter your Supabase anon/public key: ');

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Both URL and key are required. Exiting...');
    rl.close();
    return;
  }

  // Validate URL format
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.log('⚠️  Warning: URL should be in format: https://your-project-id.supabase.co');
  }

  // Validate key format (basic check)
  if (!supabaseKey.startsWith('eyJ')) {
    console.log('⚠️  Warning: Key should start with "eyJ" (JWT format)');
  }

  const envContent = `# Supabase Configuration
# Generated on ${new Date().toISOString()}

EXPO_PUBLIC_SUPABASE_URL=${supabaseUrl}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}

# Optional: For development/testing
# EXPO_PUBLIC_APP_ENV=development
`;

  const envPath = path.join(process.cwd(), '.env');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file created successfully!');
    console.log('🔒 Your credentials are now secure and won\'t be committed to git.');
    console.log('\n🚀 Next steps:');
    console.log('1. Run: npx expo start');
    console.log('2. Test the authentication flow');
    console.log('3. Check SUPABASE_SETUP.md for additional configuration');
  } catch (error) {
    console.log('❌ Error creating .env file:', error.message);
  }

  rl.close();
}

setupEnvironment().catch(console.error);
