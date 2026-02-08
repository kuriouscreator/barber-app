import { supabase } from '../lib/supabase';

export type ActivityType =
  | 'appointment_completed'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'reward_earned'
  | 'reward_redeemed'
  | 'membership_renewed'
  | 'membership_upgraded'
  | 'membership_cancelled'
  | 'referral_completed'
  | 'points_expired'
  | 'payment_successful'
  | 'payment_failed'
  | 'profile_updated';

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  title: string;
  description: string;
  metadata: Record<string, any>;
  icon_type: string;
  badge_text?: string;
  badge_color?: string;
  created_at: string;
}

interface ActivityConfig {
  icon: string;
  iconColor: string;
  titleTemplate: string;
  descriptionTemplate: string;
  badgeText?: string;
  badgeColor?: string;
}

// Activity configuration for all types
const ACTIVITY_CONFIG: Record<ActivityType, ActivityConfig> = {
  appointment_completed: {
    icon: 'checkmark-circle',
    iconColor: 'green',
    titleTemplate: 'Appointment Completed',
    descriptionTemplate: '{serviceType} with {barberName}',
    badgeText: 'Review',
    badgeColor: 'purple',
  },

  reward_earned: {
    icon: 'gift',
    iconColor: 'blue',
    titleTemplate: 'Reward Earned',
    descriptionTemplate: '+{points} points for {reason}',
    badgeText: '+{points}',
    badgeColor: 'blue',
  },

  appointment_confirmed: {
    icon: 'calendar',
    iconColor: 'purple',
    titleTemplate: 'Booking Confirmed',
    descriptionTemplate: 'Your appointment for {date} is confirmed',
  },

  membership_renewed: {
    icon: 'sparkles',
    iconColor: 'orange',
    titleTemplate: 'Membership Renewed',
    descriptionTemplate: '{tierName} membership extended to {expiryDate}',
    badgeText: 'Auto',
    badgeColor: 'orange',
  },

  membership_upgraded: {
    icon: 'trending-up',
    iconColor: 'purple',
    titleTemplate: 'Plan Upgraded',
    descriptionTemplate: 'Upgraded from {oldTier} to {newTier}',
    badgeText: '+{points}',
    badgeColor: 'purple',
  },

  reward_redeemed: {
    icon: 'gift',
    iconColor: 'purple',
    titleTemplate: 'Reward Redeemed',
    descriptionTemplate: 'Redeemed {rewardName} for {points} points',
    badgeText: '-{points}',
    badgeColor: 'gray',
  },

  referral_completed: {
    icon: 'people',
    iconColor: 'green',
    titleTemplate: 'Referral Bonus',
    descriptionTemplate: '{referredName} joined with your code',
    badgeText: '+{points}',
    badgeColor: 'green',
  },

  appointment_cancelled: {
    icon: 'close-circle',
    iconColor: 'red',
    titleTemplate: 'Appointment Cancelled',
    descriptionTemplate: 'Appointment for {date} was cancelled',
  },

  appointment_rescheduled: {
    icon: 'calendar',
    iconColor: 'blue',
    titleTemplate: 'Appointment Rescheduled',
    descriptionTemplate: 'Rescheduled to {newDate} at {newTime}',
  },

  membership_cancelled: {
    icon: 'alert-circle',
    iconColor: 'orange',
    titleTemplate: 'Membership Cancelled',
    descriptionTemplate: 'Your {tierName} membership has been cancelled',
  },

  payment_successful: {
    icon: 'card',
    iconColor: 'green',
    titleTemplate: 'Payment Processed',
    descriptionTemplate: '${amount} for {tierName} subscription',
  },

  payment_failed: {
    icon: 'alert-circle',
    iconColor: 'red',
    titleTemplate: 'Payment Failed',
    descriptionTemplate: 'Update payment method to continue service',
    badgeText: 'Action Required',
    badgeColor: 'red',
  },

  points_expired: {
    icon: 'time',
    iconColor: 'gray',
    titleTemplate: 'Points Expired',
    descriptionTemplate: '{points} points expired due to inactivity',
    badgeText: '-{points}',
    badgeColor: 'gray',
  },

  profile_updated: {
    icon: 'person',
    iconColor: 'blue',
    titleTemplate: 'Profile Updated',
    descriptionTemplate: 'Personal information updated successfully',
  },
};

/**
 * Interpolate template string with data
 */
function interpolateTemplate(template: string, data: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key]?.toString() || match;
  });
}

/**
 * Core activity logging function
 */
async function logActivity(
  userId: string,
  activityType: ActivityType,
  metadata: Record<string, any> = {}
): Promise<boolean> {
  try {
    const config = ACTIVITY_CONFIG[activityType];

    if (!config) {
      console.error(`Unknown activity type: ${activityType}`);
      return false;
    }

    // Generate title and description from templates
    const title = interpolateTemplate(config.titleTemplate, metadata);
    const description = interpolateTemplate(config.descriptionTemplate, metadata);
    const badgeText = config.badgeText
      ? interpolateTemplate(config.badgeText, metadata)
      : null;

    // Insert activity
    const { error } = await supabase.from('user_activities').insert({
      user_id: userId,
      activity_type: activityType,
      title,
      description,
      metadata,
      icon_type: config.icon,
      badge_text: badgeText,
      badge_color: config.badgeColor,
    });

    if (error) {
      console.error('Error logging activity:', error);
      return false;
    }

    console.log(`✅ Activity logged: ${activityType} for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error in logActivity:', error);
    return false;
  }
}

/**
 * Get recent activities for a user
 */
async function getRecentActivities(
  userId: string,
  limit: number = 5
): Promise<UserActivity[]> {
  try {
    const { data, error } = await supabase.rpc('get_recent_activities', {
      p_user_id: userId,
      p_limit: limit,
    });

    if (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRecentActivities:', error);
    return [];
  }
}

/**
 * Get all activities for a user with pagination
 */
async function getAllActivities(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ activities: UserActivity[]; total: number }> {
  try {
    // Get activities
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
      return { activities: [], total: 0 };
    }

    // Get total count
    const { data: countData, error: countError } = await supabase.rpc(
      'get_activity_count',
      { p_user_id: userId }
    );

    if (countError) {
      console.error('Error fetching activity count:', countError);
    }

    return {
      activities: activities || [],
      total: countData || 0,
    };
  } catch (error) {
    console.error('Error in getAllActivities:', error);
    return { activities: [], total: 0 };
  }
}

// Specific logging helper functions

export const ActivityLogger = {
  /**
   * Log appointment completed
   */
  logAppointmentCompleted: async (
    userId: string,
    appointmentId: string,
    barberName: string,
    serviceType: string
  ) => {
    return logActivity(userId, 'appointment_completed', {
      appointmentId,
      barberName,
      serviceType,
    });
  },

  /**
   * Log appointment confirmed
   */
  logAppointmentConfirmed: async (
    userId: string,
    appointmentId: string,
    date: string
  ) => {
    return logActivity(userId, 'appointment_confirmed', {
      appointmentId,
      date,
    });
  },

  /**
   * Log appointment cancelled
   */
  logAppointmentCancelled: async (
    userId: string,
    appointmentId: string,
    date: string
  ) => {
    return logActivity(userId, 'appointment_cancelled', {
      appointmentId,
      date,
    });
  },

  /**
   * Log reward earned
   */
  logRewardEarned: async (
    userId: string,
    points: number,
    reason: string,
    referenceId?: string
  ) => {
    return logActivity(userId, 'reward_earned', {
      points,
      reason,
      referenceId,
    });
  },

  /**
   * Log reward redeemed
   */
  logRewardRedeemed: async (
    userId: string,
    rewardName: string,
    points: number,
    redemptionId: string
  ) => {
    return logActivity(userId, 'reward_redeemed', {
      rewardName,
      points,
      redemptionId,
    });
  },

  /**
   * Log membership renewed
   */
  logMembershipRenewed: async (
    userId: string,
    tierName: string,
    expiryDate: string,
    subscriptionId: string
  ) => {
    return logActivity(userId, 'membership_renewed', {
      tierName,
      expiryDate,
      subscriptionId,
    });
  },

  /**
   * Log membership upgraded
   */
  logMembershipUpgraded: async (
    userId: string,
    newTier: string,
    oldTier: string,
    subscriptionId: string
  ) => {
    return logActivity(userId, 'membership_upgraded', {
      newTier,
      oldTier,
      subscriptionId,
    });
  },

  /**
   * Log membership cancelled
   */
  logMembershipCancelled: async (
    userId: string,
    tierName: string,
    subscriptionId: string
  ) => {
    return logActivity(userId, 'membership_cancelled', {
      tierName,
      subscriptionId,
    });
  },

  /**
   * Log referral completed
   */
  logReferralCompleted: async (
    userId: string,
    referredName: string,
    points: number,
    referralId: string
  ) => {
    return logActivity(userId, 'referral_completed', {
      referredName,
      points,
      referralId,
    });
  },

  /**
   * Log payment successful
   */
  logPaymentSuccessful: async (
    userId: string,
    amount: number,
    tierName: string,
    invoiceId: string
  ) => {
    return logActivity(userId, 'payment_successful', {
      amount: amount.toFixed(2),
      tierName,
      invoiceId,
    });
  },

  /**
   * Log payment failed
   */
  logPaymentFailed: async (
    userId: string,
    tierName: string,
    invoiceId: string
  ) => {
    return logActivity(userId, 'payment_failed', {
      tierName,
      invoiceId,
    });
  },

  /**
   * Log points expired
   */
  logPointsExpired: async (
    userId: string,
    points: number,
    reason: string
  ) => {
    return logActivity(userId, 'points_expired', {
      points,
      reason,
    });
  },

  /**
   * Log profile updated
   */
  logProfileUpdated: async (
    userId: string,
    updatedFields?: string
  ) => {
    return logActivity(userId, 'profile_updated', {
      updatedFields,
    });
  },

  /**
   * Log appointment rescheduled
   */
  logAppointmentRescheduled: async (
    userId: string,
    appointmentId: string,
    newDate: string,
    newTime: string
  ) => {
    return logActivity(userId, 'appointment_rescheduled', {
      appointmentId,
      newDate,
      newTime,
    });
  },

  // Utility functions
  getRecentActivities,
  getAllActivities,
};

export default ActivityLogger;
