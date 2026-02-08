import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'customer' | 'barber';
  phone?: string;
  notify_push?: boolean;
  notify_email?: boolean;
  notify_sms?: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  notify_push: boolean;
  notify_email: boolean;
  notify_sms: boolean;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // If profile doesn't exist, create one (but only if we have an active session)
      if (error.code === 'PGRST116') {
        try {
          // Check if we have an active session before trying to create profile
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            console.log('Profile not found, creating new profile for user:', userId);
            return await createUserProfile(userId);
          } else {
            console.log('No active session, skipping profile creation');
            return null;
          }
        } catch (sessionError) {
          console.log('Error checking session, skipping profile creation:', sessionError);
          return null;
        }
      }
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

async function createUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    // Get user data from auth
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      console.error('Error getting user data:', userError);
      return null;
    }

    const user = userData.user;
    
    // Create profile
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: 'customer', // Default role
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    console.log('🔧 updateUserProfile called:', { userId, updates });

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating user profile:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return null;
    }

    console.log('✅ Profile updated successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Exception in updateUserProfile:', error);
    return null;
  }
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('notify_push, notify_email, notify_sms')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching notification preferences:', error);

      // If columns don't exist yet, return defaults
      if (error.code === '42703' || error.message?.includes('does not exist')) {
        console.warn('⚠️  Notification columns not found. Please run: add-notification-preferences.sql');
        return {
          notify_push: true,
          notify_email: true,
          notify_sms: false,
        };
      }

      return null;
    }

    return {
      notify_push: data.notify_push ?? true,
      notify_email: data.notify_email ?? true,
      notify_sms: data.notify_sms ?? false,
    };
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    // Return defaults as fallback
    return {
      notify_push: true,
      notify_email: true,
      notify_sms: false,
    };
  }
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences
): Promise<NotificationPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        notify_push: preferences.notify_push,
        notify_email: preferences.notify_email,
        notify_sms: preferences.notify_sms,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('notify_push, notify_email, notify_sms')
      .single();

    if (error) {
      console.error('Error updating notification preferences:', error);

      // If columns don't exist yet, throw helpful error
      if (error.code === 'PGRST204' || error.message?.includes('could not find')) {
        throw new Error(
          'Database migration required. Please run the SQL file: add-notification-preferences.sql in your Supabase SQL Editor.'
        );
      }

      return null;
    }

    return {
      notify_push: data.notify_push ?? true,
      notify_email: data.notify_email ?? true,
      notify_sms: data.notify_sms ?? false,
    };
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error; // Re-throw to show user-friendly message
  }
}
