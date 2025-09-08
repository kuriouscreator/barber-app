import { useState, useEffect } from 'react';
import {
  BarberStats,
  QuickAction,
  QueueItem,
  DayProgress,
  MonthlyProgress,
  NotificationItem,
  SubscriptionInsights,
  QuickSettings,
} from '../types';

export const useBarberDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data - in a real app, this would come from API calls
  const [stats] = useState<BarberStats>({
    todayAppointments: 7,
    todayCutsUsed: 12,
    nextAppt: {
      timeLabel: '10:30 AM',
      clientName: 'John Smith',
    },
  });

  const [actions] = useState<QuickAction[]>([
    {
      key: 'book',
      title: 'Book Client',
      subtitle: 'New appointment',
      onPress: () => console.log('Book Client pressed'),
    },
    {
      key: 'schedule',
      title: 'Full Schedule',
      subtitle: 'View week',
      onPress: () => console.log('Full Schedule pressed'),
    },
    {
      key: 'clients',
      title: 'Client Status',
      subtitle: 'Subscriptions',
      onPress: () => console.log('Client Status pressed'),
    },
    {
      key: 'services',
      title: 'Manage Services',
      subtitle: 'Edit offerings',
      onPress: () => console.log('Manage Services pressed'),
    },
  ]);

  const [queue] = useState<QueueItem[]>([
    {
      id: '1',
      clientName: 'John Smith',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      serviceName: 'Classic Haircut',
      subService: 'Beard Trim',
      state: 'IN_PROGRESS',
      startTimeLabel: 'Started 10:30 AM',
      estimateLabel: 'Est. 45 min • $60',
    },
    {
      id: '2',
      clientName: 'Mike Johnson',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      serviceName: 'Fade Cut',
      state: 'NEXT_UP',
      nextTimeLabel: '11:30 AM',
      estimateLabel: 'Est. 30 min • $45',
    },
    {
      id: '3',
      clientName: 'David Wilson',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      serviceName: 'Full Service',
      state: 'SCHEDULED',
      nextTimeLabel: '12:30 PM',
      estimateLabel: 'Est. 60 min • $85',
    },
  ]);

  const [dayProgress] = useState<DayProgress>({
    completedCount: 3,
    remainingCount: 4,
  });

  const [monthlyProgress] = useState<MonthlyProgress>({
    percent: 48,
    doneLabel: '96 cuts / 200 subscribed',
    remainingLabel: '104 remaining',
  });

  const [notifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'New appointment booked',
      subtitle: 'Sarah Davis • 3:30 PM today',
      ctaLabel: 'View',
      type: 'info',
    },
    {
      id: '2',
      title: 'Running 15 min behind',
      subtitle: 'Consider adjusting schedule',
      ctaLabel: 'Fix',
      type: 'warning',
    },
    {
      id: '3',
      title: 'New 5-star review',
      subtitle: 'From Mike Johnson',
      ctaLabel: 'Read',
      type: 'review',
    },
  ]);

  const [insights] = useState<SubscriptionInsights>({
    plans: [
      { label: 'Basic Plan', count: 15 },
      { label: 'Premium Plan', count: 8 },
      { label: 'VIP Plan', count: 3 },
    ],
    reminderNote: '3 clients need renewal reminders this week.',
  });

  const [quickSettings, setQuickSettings] = useState<QuickSettings>({
    appointmentReminders: true,
    visibleToNewClients: true,
  });

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const updateQuickSetting = (key: keyof QuickSettings, value: boolean) => {
    setQuickSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return {
    loading,
    error,
    stats,
    actions,
    queue,
    dayProgress,
    monthlyProgress,
    notifications,
    insights,
    quickSettings,
    updateQuickSetting,
  };
};
