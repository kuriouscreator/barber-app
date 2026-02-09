import { useState, useEffect } from 'react';
import { DayRowData, ExceptionItem, TemplateSummary, WeekRange, WeekStats } from '../types';
import { getEndOfWeekISO, isCurrentWeek, addDaysISO } from '../utils/dateUtils';
import { AvailabilityService, BarberAvailability, ScheduleException } from '../services/AvailabilityService';

interface UseBarberWeeklyScheduleReturn {
  weekRange: WeekRange;
  days: DayRowData[];
  exceptions: ExceptionItem[];
  stats: WeekStats;
  templates: TemplateSummary[];
  loading: boolean;
  error: string | null;
  actions: {
    addException: (payload: Omit<ExceptionItem, 'id'>) => void;
    editException: (id: string, payload: Partial<ExceptionItem>) => void;
    deleteException: (id: string) => void;
    copyWeek: (fromWeekISO: string, toWeekISOs: string[]) => void;
    bulkEditDays: (weekISO: string, days: string[], hours: string) => void;
    applyTemplate: (templateId: string, weekISO: string) => void;
  };
}

// Helper function to format time from 24h to 12h format
const formatTime = (time24: string): string => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Helper function to transform availability data to DayRowData
const transformToDayRowData = (
  availability: BarberAvailability[],
  dayKey: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
  dayLabel: string,
  dayOfWeek: number
): DayRowData => {
  const dayAvailability = availability.find(a => a.dayOfWeek === dayOfWeek);

  if (!dayAvailability || !dayAvailability.isAvailable) {
    return {
      key: dayKey,
      dayLabel,
      timeLabel: 'Closed',
      meta: 'Day off',
      status: 'unavailable',
    };
  }

  const startFormatted = formatTime(dayAvailability.startTime);
  const endFormatted = formatTime(dayAvailability.endTime);
  const timeLabel = `${startFormatted} - ${endFormatted}`;

  // Determine status based on day
  let status: DayRowData['status'] = 'available';
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    status = 'weekend';
  }

  // Calculate approximate appointment slots (30-min appointments)
  const startMinutes = parseInt(dayAvailability.startTime.split(':')[0]) * 60 +
                      parseInt(dayAvailability.startTime.split(':')[1]);
  const endMinutes = parseInt(dayAvailability.endTime.split(':')[0]) * 60 +
                    parseInt(dayAvailability.endTime.split(':')[1]);
  const totalMinutes = endMinutes - startMinutes;
  const slots = Math.floor(totalMinutes / 30);

  return {
    key: dayKey,
    dayLabel,
    timeLabel,
    meta: `${slots} appointments available`,
    status,
  };
};

// Helper function to transform schedule exceptions to ExceptionItems
const transformToExceptionItems = (exceptions: ScheduleException[]): ExceptionItem[] => {
  return exceptions.map(exception => {
    const date = new Date(exception.date + 'T00:00:00');
    const dateLabel = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    let description = exception.reason || '';
    if (!exception.isAvailable) {
      description = description || 'Closed';
    } else if (exception.startTime && exception.endTime) {
      const startFormatted = formatTime(exception.startTime);
      const endFormatted = formatTime(exception.endTime);
      description = description || `Modified hours: ${startFormatted} - ${endFormatted}`;
    }

    return {
      id: exception.id,
      icon: exception.isAvailable ? 'clock' : 'holiday',
      title: exception.reason || (!exception.isAvailable ? 'Closed' : 'Modified Hours'),
      dateLabel,
      description,
    };
  });
};

export const useBarberWeeklySchedule = (
  startOfWeekISO: string,
  barberId?: string,
  refreshKey?: number
): UseBarberWeeklyScheduleReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [weekRange, setWeekRange] = useState<WeekRange>({
    startISO: startOfWeekISO,
    endISO: getEndOfWeekISO(startOfWeekISO),
    isCurrentWeek: isCurrentWeek(startOfWeekISO),
  });

  const [days, setDays] = useState<DayRowData[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);

  const [stats, setStats] = useState<WeekStats>({
    hoursValue: '0 hours',
    metaLeft: '0 working days',
    metaRight: 'Average: 0 hrs/day',
    availableSlots: {
      value: 0,
      caption: '30-min appointments',
      icon: 'calendar',
    },
    booked: {
      value: 0,
      caption: '0% utilization',
      icon: 'person',
    },
    utilizationPct: 0,
  });

  const [templates, setTemplates] = useState<TemplateSummary[]>([
    {
      id: '1',
      name: 'Standard Week',
      lines: ['Mon-Fri: 9-6, Sat: 10-4, Sun: Closed'],
    },
  ]);

  // Actions
  const addException = (payload: Omit<ExceptionItem, 'id'>) => {
    const newException: ExceptionItem = {
      ...payload,
      id: Date.now().toString(),
    };
    setExceptions(prev => [...prev, newException]);
  };

  const editException = (id: string, payload: Partial<ExceptionItem>) => {
    setExceptions(prev => 
      prev.map(exception => 
        exception.id === id ? { ...exception, ...payload } : exception
      )
    );
  };

  const deleteException = (id: string) => {
    setExceptions(prev => prev.filter(exception => exception.id !== id));
  };

  const copyWeek = (fromWeekISO: string, toWeekISOs: string[]) => {
    // Mock implementation - in real app, this would make API calls
    console.log('Copying week from', fromWeekISO, 'to', toWeekISOs);
  };

  const bulkEditDays = (weekISO: string, days: string[], hours: string) => {
    // Mock implementation - in real app, this would make API calls
    console.log('Bulk editing days', days, 'for week', weekISO, 'with hours', hours);
  };

  const applyTemplate = (templateId: string, weekISO: string) => {
    // Mock implementation - in real app, this would make API calls
    console.log('Applying template', templateId, 'to week', weekISO);
  };

  useEffect(() => {
    // Update week range when startOfWeekISO changes
    setWeekRange({
      startISO: startOfWeekISO,
      endISO: getEndOfWeekISO(startOfWeekISO),
      isCurrentWeek: isCurrentWeek(startOfWeekISO),
    });

    // Fetch real data if barberId is provided
    const fetchScheduleData = async () => {
      if (!barberId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch availability and exceptions in parallel
        const [availability, scheduleExceptions] = await Promise.all([
          AvailabilityService.getBarberAvailability(barberId),
          AvailabilityService.getScheduleExceptions(
            barberId,
            startOfWeekISO,
            getEndOfWeekISO(startOfWeekISO)
          ),
        ]);

        // Transform availability to DayRowData
        const daysData: DayRowData[] = [
          transformToDayRowData(availability, 'mon', 'Monday', 1),
          transformToDayRowData(availability, 'tue', 'Tuesday', 2),
          transformToDayRowData(availability, 'wed', 'Wednesday', 3),
          transformToDayRowData(availability, 'thu', 'Thursday', 4),
          transformToDayRowData(availability, 'fri', 'Friday', 5),
          transformToDayRowData(availability, 'sat', 'Saturday', 6),
          transformToDayRowData(availability, 'sun', 'Sunday', 0),
        ];
        setDays(daysData);

        // Transform exceptions
        const exceptionsData = transformToExceptionItems(scheduleExceptions);
        setExceptions(exceptionsData);

        // Calculate stats
        const workingDays = daysData.filter(day => day.status !== 'unavailable').length;
        const totalHours = daysData.reduce((sum, day) => {
          if (day.status === 'unavailable') return sum;

          // Extract hours from timeLabel (e.g., "9:00 AM - 6:00 PM")
          const timeMatch = day.timeLabel.match(/(\d+):(\d+)\s*(AM|PM)\s*-\s*(\d+):(\d+)\s*(AM|PM)/);
          if (!timeMatch) return sum;

          let startHour = parseInt(timeMatch[1]);
          if (timeMatch[3] === 'PM' && startHour !== 12) startHour += 12;
          if (timeMatch[3] === 'AM' && startHour === 12) startHour = 0;

          const startMin = parseInt(timeMatch[2]);

          let endHour = parseInt(timeMatch[4]);
          if (timeMatch[6] === 'PM' && endHour !== 12) endHour += 12;
          if (timeMatch[6] === 'AM' && endHour === 12) endHour = 0;

          const endMin = parseInt(timeMatch[5]);

          const hours = (endHour * 60 + endMin - startHour * 60 - startMin) / 60;
          return sum + hours;
        }, 0);

        const avgHoursPerDay = workingDays > 0 ? (totalHours / workingDays).toFixed(1) : 0;
        const totalSlots = Math.floor(totalHours * 2); // 30-min appointments

        setStats({
          hoursValue: `${totalHours.toFixed(0)} hours`,
          metaLeft: `${workingDays} working ${workingDays === 1 ? 'day' : 'days'}`,
          metaRight: `Average: ${avgHoursPerDay} hrs/day`,
          availableSlots: {
            value: totalSlots,
            caption: '30-min appointments',
            icon: 'calendar',
          },
          booked: {
            value: 0, // TODO: Fetch actual booked appointments
            caption: '0% utilization',
            icon: 'person',
          },
          utilizationPct: 0,
        });
      } catch (err) {
        console.error('Error fetching schedule data:', err);
        setError('Failed to load schedule data');
      } finally {
        setLoading(false);
      }
    };

    fetchScheduleData();
  }, [startOfWeekISO, barberId, refreshKey]);

  return {
    weekRange,
    days,
    exceptions,
    stats,
    templates,
    loading,
    error,
    actions: {
      addException,
      editException,
      deleteException,
      copyWeek,
      bulkEditDays,
      applyTemplate,
    },
  };
};
