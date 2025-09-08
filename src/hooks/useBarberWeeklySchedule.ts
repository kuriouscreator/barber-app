import { useState, useEffect } from 'react';
import { DayRowData, ExceptionItem, TemplateSummary, WeekRange, WeekStats } from '../types';
import { getEndOfWeekISO, isCurrentWeek } from '../utils/dateUtils';

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

export const useBarberWeeklySchedule = (startOfWeekISO: string): UseBarberWeeklyScheduleReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data - in real app, this would come from API calls
  const [weekRange, setWeekRange] = useState<WeekRange>({
    startISO: startOfWeekISO,
    endISO: getEndOfWeekISO(startOfWeekISO),
    isCurrentWeek: isCurrentWeek(startOfWeekISO),
  });

  const [days, setDays] = useState<DayRowData[]>([
    {
      key: 'mon',
      dayLabel: 'Monday',
      timeLabel: '9:00 AM - 6:00 PM',
      meta: '8 appointments available',
      status: 'available',
    },
    {
      key: 'tue',
      dayLabel: 'Tuesday',
      timeLabel: '9:00 AM - 6:00 PM',
      meta: '8 appointments available',
      status: 'available',
    },
    {
      key: 'wed',
      dayLabel: 'Wednesday',
      timeLabel: '9:00 AM - 1:00 PM, 3:00 PM - 7:00 PM',
      meta: 'Split shift • 6 appointments',
      status: 'partial',
    },
    {
      key: 'thu',
      dayLabel: 'Thursday',
      timeLabel: '8:00 AM - 8:00 PM',
      meta: 'Extended hours • 12 appointments',
      status: 'available',
    },
    {
      key: 'fri',
      dayLabel: 'Friday',
      timeLabel: '9:00 AM - 6:00 PM',
      meta: '8 appointments available',
      status: 'available',
    },
    {
      key: 'sat',
      dayLabel: 'Saturday',
      timeLabel: '10:00 AM - 4:00 PM',
      meta: 'Weekend hours • 6 appointments',
      status: 'weekend',
    },
    {
      key: 'sun',
      dayLabel: 'Sunday',
      timeLabel: 'Closed',
      meta: 'Day off',
      status: 'unavailable',
    },
  ]);

  const [exceptions, setExceptions] = useState<ExceptionItem[]>([
    {
      id: '1',
      icon: 'holiday',
      title: 'Martin Luther King Day',
      dateLabel: 'Monday, Jan 20, 2025',
      description: 'Closed for holiday',
    },
    {
      id: '2',
      icon: 'clock',
      title: 'Late Start',
      dateLabel: 'Tuesday, Jan 14, 2025',
      description: 'Opening at 11:00 AM instead of 9:00 AM',
    },
  ]);

  const [stats, setStats] = useState<WeekStats>({
    hoursValue: '42 hours',
    metaLeft: '6 working days',
    metaRight: 'Average: 7 hrs/day',
    availableSlots: {
      value: 48,
      caption: '30-min appointments',
      icon: 'calendar',
    },
    booked: {
      value: 31,
      caption: '65% utilization',
      icon: 'person',
    },
    utilizationPct: 65,
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

    // In real app, this would fetch data based on startOfWeekISO
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 300); // Shorter delay for better UX
  }, [startOfWeekISO]);

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
