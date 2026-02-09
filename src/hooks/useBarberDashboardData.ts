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
import { AppointmentService } from '../services/AppointmentService';
import { useApp } from '../context/AppContext';

// Helper function to format time from 24h to 12h
const formatTime12Hour = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Helper to determine appointment state based on current time
const getAppointmentState = (appointmentTime: string): QueueItem['state'] => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [hours, minutes] = appointmentTime.split(':').map(Number);
  const appointmentMinutes = hours * 60 + minutes;

  const diffMinutes = appointmentMinutes - currentMinutes;

  // If appointment is in progress (within 30 min window around current time)
  if (diffMinutes >= -15 && diffMinutes <= 15) {
    return 'IN_PROGRESS';
  }

  // If appointment is next up (within next hour)
  if (diffMinutes > 15 && diffMinutes <= 60) {
    return 'NEXT_UP';
  }

  // Otherwise scheduled for later
  return 'SCHEDULED';
};

// Transform appointment to QueueItem
const transformToQueueItem = (appointment: any): QueueItem => {
  const state = getAppointmentState(appointment.appointment_time);
  const timeFormatted = formatTime12Hour(appointment.appointment_time);

  // For walk-ins, use customer_name; for bookings, use customer.full_name
  const clientName = appointment.appointment_type === 'walk_in'
    ? appointment.customer_name || 'Walk-In Customer'
    : appointment.customer?.full_name || 'Unknown Customer';

  return {
    id: appointment.id,
    clientName,
    avatarUrl: appointment.customer?.avatar_url,
    serviceName: appointment.service_name,
    state,
    startTimeLabel: state === 'IN_PROGRESS' ? `Started ${timeFormatted}` : undefined,
    nextTimeLabel: state !== 'IN_PROGRESS' ? timeFormatted : undefined,
    estimateLabel: `Est. ${appointment.service_duration} min • $${appointment.service_price.toFixed(2)}`,
    appointmentType: appointment.appointment_type || 'booking',
  };
};

export const useBarberDashboardData = () => {
  const { state: appState } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todaysAppointments, setTodaysAppointments] = useState<any[]>([]);

  // Calculate stats from real appointments
  const stats: BarberStats = {
    todayAppointments: todaysAppointments.length,
    todayCutsUsed: todaysAppointments
      .filter(apt => apt.status === 'completed')
      .reduce((sum, apt) => sum + (apt.cuts_used || 0), 0),
    nextAppt: todaysAppointments.length > 0
      ? {
          timeLabel: formatTime12Hour(todaysAppointments[0].appointment_time),
          clientName: todaysAppointments[0].customer?.full_name || 'Unknown',
        }
      : undefined,
  };

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

  // Transform appointments to queue items, filtering out past appointments
  const queue: QueueItem[] = todaysAppointments
    .filter(apt => {
      // Filter out past appointments by comparing full datetime
      const appointmentDateTime = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
      const now = new Date();
      return appointmentDateTime >= now;
    })
    .map(transformToQueueItem);

  // Calculate day progress
  const dayProgress: DayProgress = {
    completedCount: todaysAppointments.filter(apt => apt.status === 'completed').length,
    remainingCount: todaysAppointments.filter(apt => apt.status === 'scheduled' || apt.status === 'confirmed').length,
  };

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

  const fetchDashboardData = async () => {
    // Only fetch if user is a barber
    if (!appState.user || appState.user.role !== 'barber') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch today's appointments for this barber
      const appointments = await AppointmentService.getBarberTodaysAppointments(appState.user.id);
      console.log('📋 Dashboard: Appointments fetched:', appointments);
      console.log('👤 Dashboard: First appointment customer:', appointments[0]?.customer);
      console.log('👤 Dashboard: First appointment full data:', JSON.stringify(appointments[0], null, 2));
      setTodaysAppointments(appointments);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [appState.user?.id]);

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
    refreshData: fetchDashboardData,
  };
};
