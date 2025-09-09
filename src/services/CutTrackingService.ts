import { supabase } from '../lib/supabase';

export interface CutStatus {
  remainingCuts: number;
  canBook: boolean;
  totalCuts: number;
  usedCuts: number;
  upcomingAppointments: number;
}

export class CutTrackingService {
  /**
   * Get comprehensive cut status for the current user
   */
  static async getCutStatus(): Promise<CutStatus> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get remaining cuts and booking eligibility
      const [remainingCutsResult, canBookResult, subscriptionResult] = await Promise.all([
        supabase.rpc('get_user_remaining_cuts', { p_user_id: user.id }),
        supabase.rpc('can_user_book_appointment', { p_user_id: user.id }),
        supabase
          .from('user_subscriptions')
          .select('cuts_included, cuts_used')
          .eq('user_id', user.id)
          .in('status', ['active', 'trialing'])
          .single()
      ]);

      const remainingCuts = remainingCutsResult.data || 0;
      const canBook = canBookResult.data || false;
      const subscription = subscriptionResult.data;

      // Calculate upcoming appointments
      const upcomingAppointments = subscription 
        ? subscription.cuts_included - subscription.cuts_used - remainingCuts
        : 0;

      return {
        remainingCuts,
        canBook,
        totalCuts: subscription?.cuts_included || 0,
        usedCuts: subscription?.cuts_used || 0,
        upcomingAppointments: Math.max(0, upcomingAppointments)
      };
    } catch (error) {
      console.error('Error getting cut status:', error);
      return {
        remainingCuts: 0,
        canBook: false,
        totalCuts: 0,
        usedCuts: 0,
        upcomingAppointments: 0
      };
    }
  }

  /**
   * Get just the remaining cuts count
   */
  static async getRemainingCuts(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: remainingCuts, error } = await supabase
        .rpc('get_user_remaining_cuts', { p_user_id: user.id });

      if (error) {
        console.error('Error getting remaining cuts:', error);
        return 0;
      }

      return remainingCuts || 0;
    } catch (error) {
      console.error('Error getting remaining cuts:', error);
      return 0;
    }
  }

  /**
   * Check if user can book an appointment
   */
  static async canBookAppointment(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: canBook, error } = await supabase
        .rpc('can_user_book_appointment', { p_user_id: user.id });

      if (error) {
        console.error('Error checking if user can book:', error);
        return false;
      }

      return canBook || false;
    } catch (error) {
      console.error('Error checking if user can book:', error);
      return false;
    }
  }

  /**
   * Get a user-friendly message about cut status
   */
  static getCutStatusMessage(cutStatus: CutStatus): string {
    if (cutStatus.remainingCuts === 0) {
      if (cutStatus.upcomingAppointments > 0) {
        return `You have ${cutStatus.upcomingAppointments} upcoming appointment${cutStatus.upcomingAppointments > 1 ? 's' : ''}. Cancel one to book a new appointment.`;
      } else {
        return 'No cuts remaining. Upgrade your plan to book more appointments.';
      }
    } else if (cutStatus.remainingCuts === 1) {
      return '1 cut remaining. Book your appointment now!';
    } else {
      return `${cutStatus.remainingCuts} cuts remaining.`;
    }
  }

  /**
   * Get cut status with formatted message
   */
  static async getCutStatusWithMessage(): Promise<{
    status: CutStatus;
    message: string;
  }> {
    const status = await this.getCutStatus();
    const message = this.getCutStatusMessage(status);
    
    return { status, message };
  }
}
