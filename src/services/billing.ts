import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';
import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import { BUSINESS_INFO } from '../constants/business';

export interface Plan {
  id: string;
  stripe_product_id: string;
  stripe_price_id: string;
  name: string;
  cuts_included_per_period: number;
  interval: 'month' | 'year';
  active: boolean;
  price_amount?: number;
}

export interface UserSubscription {
  user_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  plan_name: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  cuts_included: number;
  cuts_used: number;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  price_amount?: number;
  interval?: 'month' | 'year';
  // Scheduled change fields
  scheduled_plan_name?: string;
  scheduled_price_id?: string;
  scheduled_effective_date?: string;
}

export interface BillingCustomer {
  user_id: string;
  stripe_customer_id: string;
  created_at: string;
  updated_at: string;
}

export class BillingService {
  /**
   * Get all available plans from the catalog
   * This syncs with Stripe to ensure we have the latest plan information
   */
  static async getPlans(): Promise<Plan[]> {
    // First, sync plans from Stripe to ensure we have the latest data
    await this.syncPlansFromStripe();
    
    const { data, error } = await supabase
      .from('plan_catalog')
      .select('*')
      .eq('active', true)
      .order('cuts_included_per_period', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch plans: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Sync plans from Stripe to local database
   * This ensures our local data matches Stripe's metadata
   */
  static async syncPlansFromStripe(): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('sync-stripe-plans', {
        body: {}
      });

      if (error) {
        console.warn('Failed to sync plans from Stripe:', error);
        // Don't throw error - we can still use cached data
      }
    } catch (error) {
      console.warn('Error syncing plans from Stripe:', error);
      // Don't throw error - we can still use cached data
    }
  }

  /**
   * Get user's current subscription
   */
  static async getSubscription(): Promise<UserSubscription | null> {
    console.log('🔍 BillingService.getSubscription() called');
    
    // First, let's get the current user to ensure we have the right context
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Error getting current user:', authError);
      throw new Error('User not authenticated');
    }
    
    console.log('👤 Current user ID:', user.id);
    
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id) // Explicitly filter by user ID for extra safety
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - user has no subscription
        console.log('📭 No subscription found for user:', user.id);
        return null;
      }
      console.error('❌ Error fetching subscription:', error);
      throw new Error(`Failed to fetch subscription: ${error.message}`);
    }

    console.log('✅ Subscription found for user:', user.id, data);
    console.log('💰 Price amount from DB:', data.price_amount, 'Type:', typeof data.price_amount);
    return data;
  }

  /**
   * Open Stripe Checkout for subscription (web-based)
   */
  static async openCheckout(priceId: string): Promise<WebBrowser.WebBrowserResult> {
    const { data, error } = await supabase.functions.invoke('stripe-create-checkout', {
      body: { priceId }
    });

    if (error) {
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }

    if (!data?.url) {
      throw new Error('No checkout URL returned');
    }

    return WebBrowser.openBrowserAsync(data.url);
  }

  /**
   * Open native Stripe PaymentSheet for subscription
   */
  static async openNativeCheckout(priceId: string): Promise<void> {
    try {
      // Create PaymentIntent for subscription
      const { data, error } = await supabase.functions.invoke('stripe-create-payment-intent', {
        body: { priceId }
      });

      if (error) {
        throw new Error(`Failed to create payment intent: ${error.message}`);
      }

      if (!data?.clientSecret) {
        throw new Error('No client secret returned from server');
      }

      console.log('Initializing payment sheet...');

      // Initialize the payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: BUSINESS_INFO.merchantDisplayName,
        paymentIntentClientSecret: data.clientSecret,
        customerId: data.customerId,
        customerEphemeralKeySecret: data.ephemeralKey,
        allowsDelayedPaymentMethods: true,
        returnURL: 'barbercuts://stripe-redirect',
        defaultBillingDetails: {
          name: data.customerName,
        },
      });

      if (initError) {
        console.error('Payment sheet init error:', initError);
        throw new Error(initError.message);
      }

      console.log('Presenting payment sheet...');

      // Present the payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          throw new Error('Payment was cancelled');
        }
        console.error('Payment sheet present error:', presentError);
        throw new Error(presentError.message);
      }

      // Payment succeeded - Realtime will handle the subscription update
      console.log('Payment successful! Subscription will be activated via webhook.');

    } catch (error) {
      console.error('Error with native checkout:', error);
      throw error;
    }
  }

  /**
   * Open Stripe Customer Portal for subscription management
   */
  static async openBillingPortal(): Promise<WebBrowser.WebBrowserResult> {
    const { data, error } = await supabase.functions.invoke('stripe-create-portal', {
      body: {}
    });

    if (error) {
      throw new Error(`Failed to create portal session: ${error.message}`);
    }

    if (!data?.url) {
      throw new Error('No portal URL returned');
    }

    return WebBrowser.openBrowserAsync(data.url);
  }

  /**
   * Add cut usage for a completed appointment
   */
  static async addCutUsage(appointmentId: string): Promise<{
    success: boolean;
    cutsUsed: number;
    cutsRemaining: number;
  }> {
    const { data, error } = await supabase.functions.invoke('add-cut-usage', {
      body: { appointmentId }
    });

    if (error) {
      throw new Error(`Failed to add cut usage: ${error.message}`);
    }

    return data;
  }

  /**
   * Calculate cuts remaining for a subscription
   */
  static calculateCutsRemaining(subscription: UserSubscription | null): number {
    if (!subscription) return 0;
    return Math.max(0, subscription.cuts_included - subscription.cuts_used);
  }

  /**
   * Calculate days left until renewal
   */
  static calculateDaysLeft(subscription: UserSubscription | null): number {
    if (!subscription) return 0;
    const now = new Date();
    const endDate = new Date(subscription.current_period_end);
    const diffTime = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  /**
   * Check if subscription is active
   */
  static isSubscriptionActive(subscription: UserSubscription | null): boolean {
    if (!subscription) return false;
    return ['active', 'trialing'].includes(subscription.status);
  }

  /**
   * Get subscription status display text
   */
  static getStatusDisplayText(subscription: UserSubscription | null): string {
    if (!subscription) return 'No subscription';
    
    switch (subscription.status) {
      case 'active':
        return 'Active';
      case 'trialing':
        return 'Trial';
      case 'past_due':
        return 'Past Due';
      case 'canceled':
        return 'Canceled';
      case 'incomplete':
        return 'Incomplete';
      case 'unpaid':
        return 'Unpaid';
      default:
        return 'Unknown';
    }
  }


  /**
   * Schedule a downgrade to take effect at the end of the current billing period
   */
  static async scheduleDowngrade(newPriceId: string): Promise<{
    success: boolean;
    scheduleId: string;
    effectiveDate: string;
    newPlanName: string;
  }> {
    const { data, error } = await supabase.functions.invoke('stripe-schedule-downgrade', {
      body: { newPriceId }
    });

    if (error) {
      throw new Error(`Failed to schedule downgrade: ${error.message}`);
    }

    return data;
  }

  /**
   * Cancel a scheduled downgrade (if user changes mind)
   */
  static async cancelScheduledDowngrade(scheduleId: string): Promise<{
    success: boolean;
    canceledScheduleId: string;
  }> {
    const { data, error } = await supabase.functions.invoke('stripe-cancel-schedule', {
      body: { scheduleId }
    });

    if (error) {
      throw new Error(`Failed to cancel scheduled downgrade: ${error.message}`);
    }

    return data;
  }

  /**
   * Get current subscription schedule (if any)
   */
  static async getSubscriptionSchedule(): Promise<{
    hasScheduledChange: boolean;
    scheduledPlanName?: string;
    scheduledPriceId?: string;
    scheduledEffectiveDate?: string;
    scheduleDetails?: any;
  }> {
    const { data, error } = await supabase.functions.invoke('stripe-get-schedule', {
      body: {}
    });

    if (error) {
      throw new Error(`Failed to get subscription schedule: ${error.message}`);
    }

    return data;
  }

  /**
   * Refresh subscription data (for use after payment)
   */
  static async refreshSubscription(): Promise<void> {
    // This will be called by the app context to refresh subscription data
    // The actual refresh logic is handled in AppContext
  }

  /**
   * Get customer sheet configuration for managing payment methods
   */
  static async getCustomerSheetConfig(): Promise<{
    customerId: string;
    ephemeralKeySecret: string;
    setupIntentClientSecret: string;
    publishableKey: string;
    defaultPaymentMethod?: {
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    };
  }> {
    const { data, error } = await supabase.functions.invoke('stripe-customer-sheet-config', {
      body: {}
    });

    if (error) {
      throw new Error(`Failed to get customer sheet config: ${error.message}`);
    }

    if (!data?.customerId || !data?.ephemeralKeySecret || !data?.setupIntentClientSecret) {
      throw new Error('Invalid customer sheet config returned');
    }

    return data;
  }

  /**
   * Update subscription to a new plan with proration
   */
  static async updateSubscription(newPriceId: string): Promise<{
    success: boolean;
    message: string;
    subscriptionId: string;
  }> {
    const { data, error } = await supabase.functions.invoke('stripe-update-subscription', {
      body: { newPriceId }
    });

    if (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }

    if (!data?.success) {
      throw new Error(data?.error || 'Failed to update subscription');
    }

    return data;
  }

  /**
   * Toggle auto-renew for subscription
   * @param autoRenew - true to enable auto-renew, false to cancel at period end
   */
  static async toggleAutoRenew(autoRenew: boolean): Promise<{
    success: boolean;
    autoRenew: boolean;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: number;
  }> {
    const { data, error } = await supabase.functions.invoke('stripe-toggle-auto-renew', {
      body: { autoRenew }
    });

    if (error) {
      throw new Error(`Failed to toggle auto-renew: ${error.message}`);
    }

    if (!data?.success) {
      throw new Error('Failed to update auto-renew setting');
    }

    return data;
  }

  /**
   * Check if subscription will auto-renew (opposite of cancel_at_period_end)
   */
  static willAutoRenew(subscription: UserSubscription | null): boolean {
    if (!subscription) return false;
    // Check if subscription is active and NOT set to cancel at period end
    return subscription.status === 'active' && !subscription.cancel_at_period_end;
  }
}
