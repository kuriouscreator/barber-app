import { useState, useEffect } from 'react';
import {
  BarberStats,
  QuickAction,
  QueueItem,
  DayProgress,
  SubscriptionInsights,
  QuickSettings,
} from '../types';
import { AppointmentService } from '../services/AppointmentService';
import { useApp } from '../context/AppContext';
import { useBarberNotifications } from './useBarberNotifications';

// Helper function to format time from 24h to 12h
const formatTime12Hour = (time24: string | undefined): string => {
  if (!time24) return '--:--';
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Helper to determine appointment state based on current time
const getAppointmentState = (appointmentTime: string | undefined): QueueItem['state'] => {
  if (!appointmentTime) return 'SCHEDULED';

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
  const state = getAppointmentState(appointment.appointmentTime);
  const timeFormatted = formatTime12Hour(appointment.appointmentTime);

  // For walk-ins, use customerName; for bookings, use customer.full_name
  const clientName = appointment.appointmentType === 'walk_in'
    ? appointment.customerName || 'Walk-In Customer'
    : appointment.customer?.full_name || 'Unknown Customer';

  return {
    id: appointment.id,
    clientName,
    avatarUrl: appointment.customer?.avatar_url,
    serviceName: appointment.serviceName,
    state,
    startTimeLabel: state === 'IN_PROGRESS' ? `Started ${timeFormatted}` : undefined,
    nextTimeLabel: state !== 'IN_PROGRESS' ? timeFormatted : undefined,
    estimateLabel: `Est. ${appointment.serviceDuration} min • $${appointment.servicePrice?.toFixed(2) || '0.00'}`,
    appointmentType: appointment.appointmentType || 'booking',
  };
};

export const useBarberDashboardData = () => {
  const { state: appState } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todaysAppointments, setTodaysAppointments] = useState<any[]>([]);

  // Calculate stats from real appointments
  // Find next upcoming scheduled appointment (not completed/cancelled and in the future)
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

  const nextUpcomingAppointment = todaysAppointments.find(apt =>
    apt.status === 'scheduled' &&
    apt.appointmentTime &&
    apt.appointmentTime >= currentTime
  );

  const stats: BarberStats = {
    todayAppointments: todaysAppointments.length,
    todayCutsUsed: todaysAppointments
      .filter(apt => apt.status === 'completed')
      .reduce((sum, apt) => sum + (apt.cutsUsed || 0), 0),
    nextAppt: nextUpcomingAppointment
      ? {
          timeLabel: formatTime12Hour(nextUpcomingAppointment.appointmentTime),
          clientName: nextUpcomingAppointment.appointmentType === 'walk_in'
            ? nextUpcomingAppointment.customerName || 'Walk-In Customer'
            : nextUpcomingAppointment.customer?.full_name || 'Unknown',
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
      const appointmentDateTime = new Date(`${apt.appointmentDate}T${apt.appointmentTime}`);
      const now = new Date();
      return appointmentDateTime >= now;
    })
    .map(transformToQueueItem);

  // Calculate day progress
  const dayProgress: DayProgress = {
    completedCount: todaysAppointments.filter(apt => apt.status === 'completed').length,
    remainingCount: todaysAppointments.filter(apt =>
      apt.status !== 'completed' &&
      apt.status !== 'cancelled' &&
      apt.status !== 'no_show'
    ).length,
    canceledCount: todaysAppointments.filter(apt =>
      apt.status === 'cancelled' ||
      apt.status === 'no_show'
    ).length,
  };

  const barberId = appState.user?.role === 'barber' ? appState.user?.id : undefined;
  const {
    items: notifications,
    loading: notificationsLoading,
    error: notificationsError,
    hasMore: notificationsHasMore,
    loadingMore: notificationsLoadingMore,
    refresh: refreshNotifications,
    loadMore: loadMoreNotifications,
    markAsRead: markNotificationAsRead,
  } = useBarberNotifications(barberId);

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

    console.log('🔄 Dashboard: Fetching appointments...');
    setLoading(true);
    setError(null);

    try {
      // Fetch today's appointments for this barber
      const appointments = await AppointmentService.getBarberTodaysAppointments(appState.user.id);
      console.log('📋 Dashboard: Appointments fetched:', appointments.length, 'appointments');
      console.log('📋 Dashboard: Completed count:', appointments.filter(a => a.status === 'completed').length);
      console.log('📋 Dashboard: Scheduled count:', appointments.filter(a => a.status === 'scheduled').length);
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
    notifications,
    notificationsLoading,
    notificationsError,
    notificationsHasMore,
    notificationsLoadingMore,
    refreshNotifications,
    loadMoreNotifications,
    markNotificationAsRead,
    insights,
    quickSettings,
    updateQuickSetting,
    refreshData: fetchDashboardData,
  };
};
