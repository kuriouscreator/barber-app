import { supabase } from '../lib/supabase';
import { ActivityLogger } from './ActivityLogger';

export interface RewardPoint {
  id: string;
  user_id: string;
  points: number;
  transaction_type: 'earned' | 'redeemed' | 'expired';
  source: 'monthly_loyalty' | 'referral' | 'anniversary' | 'signup_bonus' | 'manual' | 'plan_upgrade';
  description: string;
  reference_id?: string;
  created_at: string;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  category: 'service' | 'flexibility' | 'product' | 'experiential';
  is_active: boolean;
  image_url?: string;
  terms?: string;
  created_at: string;
  updated_at: string;
}

export interface RewardRedemption {
  id: string;
  user_id: string;
  reward_id: string;
  reward?: Reward;
  points_spent: number;
  status: 'pending' | 'redeemed' | 'expired' | 'cancelled';
  redemption_code?: string;
  redeemed_at?: string;
  expires_at?: string;
  appointment_id?: string;
  notes?: string;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_user_id: string;
  referred_user_id?: string;
  referral_code: string;
  points_awarded: number;
  status: 'pending' | 'completed' | 'cancelled';
  completed_at?: string;
  created_at: string;
}

// Points configuration
const POINTS_CONFIG = {
  TIER_MULTIPLIERS: {
    basic: 1.0,
    premium: 2.0,
    vip: 3.0,
  },
  BASE_MONTHLY_POINTS: 100,
  REFERRAL_BONUS: 500,
  ANNIVERSARY_6M: 750,
  ANNIVERSARY_12M: 1500,
  ANNIVERSARY_YEARLY: 2000,
  SIGNUP_BONUS: 100,
};

export class RewardsService {
  /**
   * Get user's current points balance
   */
  static async getPointsBalance(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_user_points_balance', {
        p_user_id: userId,
      });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error getting points balance:', error);
      return 0;
    }
  }

  /**
   * Get user's points transaction history
   */
  static async getPointsHistory(userId: string): Promise<RewardPoint[]> {
    try {
      const { data, error } = await supabase
        .from('reward_points')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting points history:', error);
      return [];
    }
  }

  /**
   * Award points to a user
   */
  static async awardPoints(
    userId: string,
    points: number,
    source: RewardPoint['source'],
    description: string,
    referenceId?: string
  ): Promise<boolean> {
    try {
      const { error: insertError } = await supabase.from('reward_points').insert({
        user_id: userId,
        points,
        transaction_type: 'earned',
        source,
        description,
        reference_id: referenceId,
      });

      if (insertError) throw insertError;

      // Update total_points in profiles
      const { error: updateError } = await supabase.rpc('increment', {
        table_name: 'profiles',
        row_id: userId,
        column_name: 'total_points',
        x: points,
      });

      if (updateError) {
        // If increment fails, manually update
        const currentBalance = await this.getPointsBalance(userId);
        await supabase
          .from('profiles')
          .update({ total_points: currentBalance })
          .eq('id', userId);
      }

      // Log activity
      await ActivityLogger.logRewardEarned(userId, points, description, referenceId);

      return true;
    } catch (error) {
      console.error('Error awarding points:', error);
      return false;
    }
  }

  /**
   * Award monthly loyalty bonus based on subscription tier
   */
  static async awardMonthlyLoyaltyBonus(
    userId: string,
    tier: 'basic' | 'premium' | 'vip',
    subscriptionId: string
  ): Promise<boolean> {
    const multiplier = POINTS_CONFIG.TIER_MULTIPLIERS[tier] || 1.0;
    const points = Math.floor(POINTS_CONFIG.BASE_MONTHLY_POINTS * multiplier);

    return await this.awardPoints(
      userId,
      points,
      'monthly_loyalty',
      `Monthly loyalty bonus - ${tier} tier`,
      subscriptionId
    );
  }

  /**
   * Award signup bonus
   */
  static async awardSignupBonus(userId: string): Promise<boolean> {
    return await this.awardPoints(
      userId,
      POINTS_CONFIG.SIGNUP_BONUS,
      'signup_bonus',
      'Welcome bonus for joining!'
    );
  }

  /**
   * Get all available rewards
   */
  static async getRewardsCatalog(): Promise<Reward[]> {
    try {
      const { data, error } = await supabase
        .from('rewards_catalog')
        .select('*')
        .eq('is_active', true)
        .order('points_cost', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting rewards catalog:', error);
      return [];
    }
  }

  /**
   * Redeem a reward
   */
  static async redeemReward(
    userId: string,
    rewardId: string
  ): Promise<{ success: boolean; redemption?: RewardRedemption; error?: string }> {
    try {
      // Get reward details
      const { data: reward, error: rewardError } = await supabase
        .from('rewards_catalog')
        .select('*')
        .eq('id', rewardId)
        .single();

      if (rewardError || !reward) {
        return { success: false, error: 'Reward not found' };
      }

      // Check user has enough points
      const balance = await this.getPointsBalance(userId);
      if (balance < reward.points_cost) {
        return { success: false, error: 'Insufficient points' };
      }

      // Generate redemption code
      const redemptionCode = this.generateRedemptionCode();

      // Calculate expiry date (90 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      // Create redemption record
      const { data: redemption, error: redemptionError } = await supabase
        .from('reward_redemptions')
        .insert({
          user_id: userId,
          reward_id: rewardId,
          points_spent: reward.points_cost,
          redemption_code: redemptionCode,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (redemptionError) throw redemptionError;

      // Deduct points
      await supabase.from('reward_points').insert({
        user_id: userId,
        points: reward.points_cost,
        transaction_type: 'redeemed',
        source: 'manual',
        description: `Redeemed: ${reward.name}`,
        reference_id: redemption.id,
      });

      // Log activity
      await ActivityLogger.logRewardRedeemed(
        userId,
        reward.name,
        reward.points_cost,
        redemption.id
      );

      return { success: true, redemption };
    } catch (error) {
      console.error('Error redeeming reward:', error);
      return { success: false, error: 'Failed to redeem reward' };
    }
  }

  /**
   * Get user's redemption history
   */
  static async getRedemptionHistory(userId: string): Promise<RewardRedemption[]> {
    try {
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          reward:rewards_catalog(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting redemption history:', error);
      return [];
    }
  }

  /**
   * Get user's referral code
   */
  static async getReferralCode(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('user_referral_codes')
        .select('referral_code')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data?.referral_code || null;
    } catch (error) {
      console.error('Error getting referral code:', error);
      return null;
    }
  }

  /**
   * Validate if a referral code exists
   */
  static async validateReferralCode(referralCode: string): Promise<boolean> {
    try {
      if (!referralCode || referralCode.trim().length === 0) {
        return false;
      }

      const cleanCode = referralCode.toUpperCase().trim();

      const { data, error } = await supabase
        .from('user_referral_codes')
        .select('user_id')
        .eq('referral_code', cleanCode);

      if (error) {
        console.error('Error validating referral code:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error validating referral code:', error);
      return false;
    }
  }

  /**
   * Validate and process referral code during signup
   */
  static async processReferral(
    referralCode: string,
    newUserId: string
  ): Promise<boolean> {
    try {
      // Find the referrer
      const { data: referrerData, error: referrerError } = await supabase
        .from('user_referral_codes')
        .select('user_id')
        .eq('referral_code', referralCode.toUpperCase())
        .single();

      if (referrerError || !referrerData) {
        console.log('Invalid referral code');
        return false;
      }

      // Create referral record
      const { error: referralError } = await supabase.from('referrals').insert({
        referrer_user_id: referrerData.user_id,
        referred_user_id: newUserId,
        referral_code: referralCode.toUpperCase(),
        status: 'pending',
      });

      if (referralError) throw referralError;

      return true;
    } catch (error) {
      console.error('Error processing referral:', error);
      return false;
    }
  }

  /**
   * Complete referral and award points (call after first subscription payment)
   */
  static async completeReferral(referredUserId: string): Promise<boolean> {
    try {
      // Find pending referral
      const { data: referral, error: findError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_user_id', referredUserId)
        .eq('status', 'pending')
        .single();

      if (findError || !referral) {
        console.log('No pending referral found');
        return false;
      }

      // Award points to referrer
      await this.awardPoints(
        referral.referrer_user_id,
        POINTS_CONFIG.REFERRAL_BONUS,
        'referral',
        'Referral bonus',
        referral.id
      );

      // Update referral status
      await supabase
        .from('referrals')
        .update({
          status: 'completed',
          points_awarded: POINTS_CONFIG.REFERRAL_BONUS,
          completed_at: new Date().toISOString(),
        })
        .eq('id', referral.id);

      // Log activity for referrer
      const { data: referredUser } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', referredUserId)
        .single();

      await ActivityLogger.logReferralCompleted(
        referral.referrer_user_id,
        referredUser?.full_name || 'New user',
        POINTS_CONFIG.REFERRAL_BONUS,
        referral.id
      );

      return true;
    } catch (error) {
      console.error('Error completing referral:', error);
      return false;
    }
  }

  /**
   * Get user's referrals
   */
  static async getUserReferrals(userId: string): Promise<Referral[]> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user referrals:', error);
      return [];
    }
  }

  /**
   * Check and award anniversary points
   */
  static async checkAndAwardAnniversaryPoints(userId: string): Promise<boolean> {
    try {
      // Get user profile with subscription start date
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_start_date, last_anniversary_reward')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.subscription_start_date) {
        return false;
      }

      const subscriptionStart = new Date(profile.subscription_start_date);
      const now = new Date();
      const monthsDiff = this.getMonthsDifference(subscriptionStart, now);

      // Check if eligible for anniversary reward
      let points = 0;
      let shouldAward = false;

      if (monthsDiff === 6 && !this.hasRewardedMilestone(profile.last_anniversary_reward, 6)) {
        points = POINTS_CONFIG.ANNIVERSARY_6M;
        shouldAward = true;
      } else if (monthsDiff >= 12) {
        const yearsSinceStart = Math.floor(monthsDiff / 12);
        const lastRewardYears = profile.last_anniversary_reward
          ? Math.floor(
              this.getMonthsDifference(
                new Date(profile.last_anniversary_reward),
                subscriptionStart
              ) / 12
            )
          : 0;

        if (yearsSinceStart > lastRewardYears) {
          points =
            yearsSinceStart === 1
              ? POINTS_CONFIG.ANNIVERSARY_12M
              : POINTS_CONFIG.ANNIVERSARY_YEARLY;
          shouldAward = true;
        }
      }

      if (shouldAward) {
        await this.awardPoints(
          userId,
          points,
          'anniversary',
          `${monthsDiff} month anniversary bonus`
        );

        await supabase
          .from('profiles')
          .update({ last_anniversary_reward: now.toISOString() })
          .eq('id', userId);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking anniversary points:', error);
      return false;
    }
  }

  // Helper methods
  private static generateRedemptionCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private static getMonthsDifference(date1: Date, date2: Date): number {
    return (
      (date2.getFullYear() - date1.getFullYear()) * 12 +
      (date2.getMonth() - date1.getMonth())
    );
  }

  private static hasRewardedMilestone(lastReward: string | null, months: number): boolean {
    if (!lastReward) return false;
    const lastRewardDate = new Date(lastReward);
    const now = new Date();
    const monthsSinceLastReward = this.getMonthsDifference(lastRewardDate, now);
    return monthsSinceLastReward < months;
  }
}
