import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Debug: Log environment variables (remove in production)
console.log('🔧 Supabase Configuration:');
console.log('  URL:', SUPABASE_URL || '❌ UNDEFINED');
console.log('  Anon Key:', SUPABASE_ANON_KEY ? '✅ Loaded' : '❌ UNDEFINED');
console.log('  Key length:', SUPABASE_ANON_KEY?.length || 0);

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ CRITICAL: Supabase environment variables not loaded!');
  console.error('   Make sure .env file exists and contains:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  console.error('   - EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

// Persist session with AsyncStorage; detect deep-link redirects
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Expo handles redirects via scheme; we'll capture manually
  },
});
