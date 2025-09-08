import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'customer' | 'barber';
  phone?: string;
  created_at: string;
  updated_at: string;
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
      console.error('Error updating user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}
