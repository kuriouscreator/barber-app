import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { BarberNotification, NotificationItem } from '../types';

const PAGE_SIZE = 20;

function barberNotificationToItem(n: BarberNotification): NotificationItem {
  let ctaLabel: string = 'Read';
  let type: NotificationItem['type'] = 'info';
  if (n.type === 'appointment.booked' || n.type === 'appointment.canceled') {
    ctaLabel = 'View';
    type = n.type === 'appointment.canceled' ? 'warning' : 'info';
  } else if (n.type === 'subscription.upgraded' || n.type === 'subscription.downgraded') {
    ctaLabel = 'View';
    type = 'info';
  } else if (n.type === 'customer.signed_up') {
    ctaLabel = 'View';
    type = 'info';
  }
  return {
    id: n.id,
    title: n.title,
    subtitle: n.body ?? '',
    ctaLabel,
    type,
    entity_type: n.entity_type ?? undefined,
    entity_id: n.entity_id ?? undefined,
    read_at: n.read_at ?? undefined,
    created_at: n.created_at,
  };
}

export function useBarberNotifications(barberId: string | undefined) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(
    async (beforeCreatedAt?: string) => {
      if (!barberId) return [];
      const query = supabase
        .from('barber_notifications')
        .select('*')
        .eq('barber_id', barberId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (beforeCreatedAt) {
        query.lt('created_at', beforeCreatedAt);
      }
      const { data, error: e } = await query;
      if (e) throw e;
      return (data ?? []) as BarberNotification[];
    },
    [barberId]
  );

  const refresh = useCallback(async () => {
    if (!barberId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPage();
      setItems(data.map(barberNotificationToItem));
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error fetching barber notifications:', err);
      setError('Failed to load notifications');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [barberId, fetchPage]);

  const loadMore = useCallback(async () => {
    if (!barberId || !hasMore || loadingMore || items.length === 0) return;
    const lastCreatedAt = items[items.length - 1]?.created_at;
    if (!lastCreatedAt) return;
    setLoadingMore(true);
    try {
      const data = await fetchPage(lastCreatedAt);
      const newItems = data.map(barberNotificationToItem);
      setItems((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const appended = newItems.filter((n) => !existingIds.has(n.id));
        return [...prev, ...appended];
      });
      setHasMore(newItems.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error loading more notifications:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [barberId, hasMore, loadingMore, items, fetchPage]);

  useEffect(() => {
    refresh();
  }, [barberId]);

  useEffect(() => {
    if (!barberId) return;
    const channel = supabase
      .channel('barber_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'barber_notifications',
          filter: `barber_id=eq.${barberId}`,
        },
        (payload) => {
          const row = payload.new as BarberNotification;
          setItems((prev) => {
            if (prev.some((p) => p.id === row.id)) return prev;
            return [barberNotificationToItem(row), ...prev];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [barberId]);

  const markAsRead = useCallback(
    async (id: string) => {
      if (!barberId) return;
      const { error: e } = await supabase
        .from('barber_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .eq('barber_id', barberId);
      if (e) {
        console.error('Error marking notification as read:', e);
        return;
      }
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, read_at: new Date().toISOString() } : i))
      );
    },
    [barberId]
  );

  return {
    items,
    loading,
    error,
    hasMore,
    loadingMore,
    refresh,
    loadMore,
    markAsRead,
  };
}
