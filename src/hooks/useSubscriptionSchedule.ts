import { useState, useEffect } from 'react';
import { BillingService } from '../services/billing';
import { useApp } from '../context/AppContext';

export interface SubscriptionSchedule {
  hasScheduledChange: boolean;
  scheduledPlanName?: string;
  scheduledPriceId?: string;
  scheduledEffectiveDate?: string;
  scheduleDetails?: any;
}

export interface UseSubscriptionScheduleReturn {
  schedule: SubscriptionSchedule | null;
  loading: boolean;
  error: string | null;
  scheduleDowngrade: (newPriceId: string) => Promise<void>;
  cancelScheduledDowngrade: (scheduleId: string) => Promise<void>;
  refreshSchedule: () => Promise<void>;
}

export function useSubscriptionSchedule(): UseSubscriptionScheduleReturn {
  const [schedule, setSchedule] = useState<SubscriptionSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { state } = useApp();

  const loadSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First check if we have scheduled change data in the subscription
      if (state.userSubscription?.scheduled_plan_name) {
        const localSchedule: SubscriptionSchedule = {
          hasScheduledChange: true,
          scheduledPlanName: state.userSubscription.scheduled_plan_name,
          scheduledPriceId: state.userSubscription.scheduled_price_id,
          scheduledEffectiveDate: state.userSubscription.scheduled_effective_date,
        };
        setSchedule(localSchedule);
        setLoading(false);
        return;
      }
      
      // If no local data, try to get from the schedule service
      const scheduleData = await BillingService.getSubscriptionSchedule();
      setSchedule(scheduleData);
    } catch (err) {
      console.error('Error loading subscription schedule:', err);
      setError(err instanceof Error ? err.message : 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const scheduleDowngrade = async (newPriceId: string) => {
    try {
      setError(null);
      await BillingService.scheduleDowngrade(newPriceId);
      // Refresh the schedule data after scheduling
      await loadSchedule();
    } catch (err) {
      console.error('Error scheduling downgrade:', err);
      setError(err instanceof Error ? err.message : 'Failed to schedule downgrade');
      throw err;
    }
  };

  const cancelScheduledDowngrade = async (scheduleId: string) => {
    try {
      setError(null);
      await BillingService.cancelScheduledDowngrade(scheduleId);
      // Refresh the schedule data after canceling
      await loadSchedule();
    } catch (err) {
      console.error('Error canceling scheduled downgrade:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel scheduled downgrade');
      throw err;
    }
  };

  const refreshSchedule = async () => {
    // Refresh both the schedule and the main subscription data
    await loadSchedule();
    // The AppContext will handle refreshing the subscription data
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  // Reload schedule when subscription data changes
  useEffect(() => {
    if (state.userSubscription) {
      loadSchedule();
    }
  }, [state.userSubscription]);

  return {
    schedule,
    loading,
    error,
    scheduleDowngrade,
    cancelScheduledDowngrade,
    refreshSchedule,
  };
}
