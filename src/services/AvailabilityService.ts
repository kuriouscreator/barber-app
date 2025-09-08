import { supabase } from '../lib/supabase';

export interface BarberAvailability {
  id: string;
  barberId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleException {
  id: string;
  barberId: string;
  date: string; // YYYY-MM-DD format
  startTime?: string; // HH:MM format (optional, uses default if not provided)
  endTime?: string; // HH:MM format (optional, uses default if not provided)
  isAvailable: boolean;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export class AvailabilityService {
  // Cache for availability data to avoid unnecessary API calls
  private static availabilityCache = new Map<string, { data: BarberAvailability[], timestamp: number }>();
  private static appointmentsCache = new Map<string, { data: any[], timestamp: number }>();
  private static CACHE_DURATION = 30000; // 30 seconds

  /**
   * Clear the availability cache (useful when appointments are canceled)
   */
  static clearCache() {
    this.availabilityCache.clear();
    this.appointmentsCache.clear();
  }
  /**
   * Get barber's weekly availability
   */
  static async getBarberAvailability(barberId: string): Promise<BarberAvailability[]> {
    try {
      const { data, error } = await supabase
        .from('barber_availability')
        .select('*')
        .eq('barber_id', barberId)
        .order('day_of_week', { ascending: true });

      if (error) {
        console.error('Error fetching barber availability:', error);
        throw error;
      }
      
      // Map database fields to our interface
      const mappedData = (data || []).map((record: any) => ({
        id: record.id,
        barberId: record.barber_id,
        dayOfWeek: record.day_of_week,
        startTime: record.start_time,
        endTime: record.end_time,
        isAvailable: record.is_available,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }));
      
      return mappedData;
    } catch (error) {
      console.error('Error fetching barber availability:', error);
      return [];
    }
  }

  /**
   * Get barber's schedule exceptions for a date range
   */
  static async getScheduleExceptions(
    barberId: string, 
    startDate: string, 
    endDate: string
  ): Promise<ScheduleException[]> {
    try {
      const { data, error } = await supabase
        .from('schedule_exceptions')
        .select('*')
        .eq('barber_id', barberId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching schedule exceptions:', error);
      return [];
    }
  }

  /**
   * Get existing appointments for a specific date and barber
   */
  static async getBarberAppointmentsForDate(
    barberId: string, 
    date: string
  ): Promise<{ appointmentTime: string; serviceDuration: number }[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_time, service_duration, status')
        .eq('barber_id', barberId)
        .eq('appointment_date', date)
        .in('status', ['scheduled', 'confirmed']); // Only count active appointments

      if (error) throw error;
      
      // Map database field names to our interface
      const mappedData = (data || []).map((appointment: any) => ({
        appointmentTime: appointment.appointment_time,
        serviceDuration: appointment.service_duration
      }));
      
      return mappedData;
    } catch (error) {
      console.error('Error fetching barber appointments:', error);
      return [];
    }
  }

  /**
   * Generate available time slots for a specific date
   */
  static async getAvailableTimeSlots(
    barberId: string,
    date: string,
    serviceDuration: number = 30 // Default 30 minutes
  ): Promise<string[]> {
    try {
      // Get barber's weekly availability
      const dayOfWeek = new Date(date).getDay();
      const availability = await this.getBarberAvailability(barberId);
      const dayAvailability = availability.find(avail => avail.dayOfWeek === dayOfWeek);

      if (!dayAvailability || !dayAvailability.isAvailable) {
        return [];
      }

      // Check for schedule exceptions
      const exceptions = await this.getScheduleExceptions(barberId, date, date);
      const dayException = exceptions.find(exp => exp.date === date);

      if (dayException && !dayException.isAvailable) {
        return [];
      }

      // Get existing appointments for the date
      const existingAppointments = await this.getBarberAppointmentsForDate(barberId, date);

      // Determine working hours
      const startTime = dayException?.startTime || dayAvailability.startTime;
      const endTime = dayException?.endTime || dayAvailability.endTime;

      // Generate time slots
      const availableSlots = this.generateTimeSlots(
        startTime,
        endTime,
        serviceDuration,
        existingAppointments
      );

      return availableSlots;
    } catch (error) {
      console.error('Error generating available time slots:', error);
      return [];
    }
  }

  /**
   * Generate time slots based on working hours and existing appointments
   */
  private static generateTimeSlots(
    startTime: string,
    endTime: string,
    serviceDuration: number,
    existingAppointments: { appointmentTime: string; serviceDuration: number }[]
  ): string[] {
    const slots: string[] = [];
    
    // Convert times to minutes for easier calculation
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    const slotDuration = serviceDuration;

    // Create a set of blocked time ranges
    const blockedRanges: { start: number; end: number }[] = [];
    existingAppointments.forEach(apt => {
      const aptStart = this.timeToMinutes(apt.appointmentTime);
      const aptEnd = aptStart + apt.serviceDuration;
      blockedRanges.push({ start: aptStart, end: aptEnd });
    });

    // Sort blocked ranges by start time
    blockedRanges.sort((a, b) => a.start - b.start);

    // Generate available slots
    let currentTime = startMinutes;
    
    while (currentTime + slotDuration <= endMinutes) {
      const slotEnd = currentTime + slotDuration;
      const slotTime = this.minutesToTime(currentTime);
      
      // Check if this slot conflicts with any existing appointment
      const isBlocked = blockedRanges.some(blocked => 
        (currentTime < blocked.end && slotEnd > blocked.start)
      );

      if (!isBlocked) {
        slots.push(slotTime);
      }

      // Move to next 30-minute slot
      currentTime += 30;
    }

    return slots;
  }

  /**
   * Convert time string (HH:MM) to minutes
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes to time string (HH:MM)
   */
  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

}
