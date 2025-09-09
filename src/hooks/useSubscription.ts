import { useEffect, useState, useCallback } from 'react';
import { BillingService, UserSubscription } from '../services/billing';

export interface UseSubscriptionReturn {
  subscription: UserSubscription | null;
  cutsRemaining: number;
  daysLeft: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isActive: boolean;
  statusText: string;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await BillingService.getSubscription();
      setSubscription(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subscription';
      setError(errorMessage);
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const cutsRemaining = BillingService.calculateCutsRemaining(subscription);
  const daysLeft = BillingService.calculateDaysLeft(subscription);
  const isActive = BillingService.isSubscriptionActive(subscription);
  const statusText = BillingService.getStatusDisplayText(subscription);

  return {
    subscription,
    cutsRemaining,
    daysLeft,
    loading,
    error,
    refresh: fetchSubscription,
    isActive,
    statusText,
  };
}
