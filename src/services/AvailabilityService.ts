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
      const { data, error} = await supabase
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
   * Create a new schedule exception
   */
  static async createScheduleException(
    barberId: string,
    date: string,
    isAvailable: boolean,
    startTime?: string,
    endTime?: string,
    reason?: string
  ): Promise<ScheduleException> {
    try {
      const { data, error } = await supabase
        .from('schedule_exceptions')
        .insert({
          barber_id: barberId,
          date: date,
          is_available: isAvailable,
          start_time: startTime,
          end_time: endTime,
          reason: reason,
        })
        .select()
        .single();

      if (error) throw error;

      // Map database fields to interface
      return {
        id: data.id,
        barberId: data.barber_id,
        date: data.date,
        startTime: data.start_time,
        endTime: data.end_time,
        isAvailable: data.is_available,
        reason: data.reason,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error creating schedule exception:', error);
      throw error;
    }
  }

  /**
   * Update an existing schedule exception
   */
  static async updateScheduleException(
    exceptionId: string,
    updates: {
      date?: string;
      isAvailable?: boolean;
      startTime?: string;
      endTime?: string;
      reason?: string;
    }
  ): Promise<ScheduleException> {
    try {
      const updateData: any = {};
      if (updates.date !== undefined) updateData.date = updates.date;
      if (updates.isAvailable !== undefined) updateData.is_available = updates.isAvailable;
      if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
      if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
      if (updates.reason !== undefined) updateData.reason = updates.reason;

      const { data, error } = await supabase
        .from('schedule_exceptions')
        .update(updateData)
        .eq('id', exceptionId)
        .select()
        .single();

      if (error) throw error;

      // Map database fields to interface
      return {
        id: data.id,
        barberId: data.barber_id,
        date: data.date,
        startTime: data.start_time,
        endTime: data.end_time,
        isAvailable: data.is_available,
        reason: data.reason,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error updating schedule exception:', error);
      throw error;
    }
  }

  /**
   * Delete a schedule exception
   */
  static async deleteScheduleException(exceptionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('schedule_exceptions')
        .delete()
        .eq('id', exceptionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting schedule exception:', error);
      throw error;
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
      // Parse date string in local timezone to avoid timezone shifts
      const [year, month, day] = date.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      const dayOfWeek = localDate.getDay();
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
      let availableSlots = this.generateTimeSlots(
        startTime,
        endTime,
        serviceDuration,
        existingAppointments
      );

      // Filter out past times if the selected date is today
      const today = this.getLocalDateString(new Date());
      if (date === today) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        availableSlots = availableSlots.filter(slot => {
          const slotMinutes = this.timeToMinutes(slot);
          // Add 5-minute buffer to prevent booking in the immediate past
          return slotMinutes > currentMinutes + 5;
        });
      }

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

    // Allow booking at the end time (e.g., 10pm slot if barber works until 10pm)
    while (currentTime <= endMinutes) {
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

  /**
   * Get local date string in YYYY-MM-DD format without timezone conversion
   */
  private static getLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Update or create barber's availability for a specific day
   */
  static async upsertBarberAvailability(
    barberId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    isAvailable: boolean
  ): Promise<boolean> {
    try {
      // First, check if record exists for this barber and day
      const { data: existing } = await supabase
        .from('barber_availability')
        .select('id')
        .eq('barber_id', barberId)
        .eq('day_of_week', dayOfWeek)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('barber_availability')
          .update({
            start_time: startTime,
            end_time: endTime,
            is_available: isAvailable,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('barber_availability')
          .insert({
            barber_id: barberId,
            day_of_week: dayOfWeek,
            start_time: startTime,
            end_time: endTime,
            is_available: isAvailable,
          });

        if (error) throw error;
      }

      // Clear cache to force refresh on next fetch
      this.clearCache();

      return true;
    } catch (error) {
      console.error('Error upserting barber availability:', error);
      return false;
    }
  }

  /**
   * Copy a week's schedule (exceptions) to target weeks
   */
  static async copyWeekSchedule(
    barberId: string,
    sourceWeekStart: string,
    targetWeekStarts: string[],
    includeExceptions: boolean
  ): Promise<boolean> {
    try {
      // Note: barber_availability is day-of-week based, so it already applies to all weeks
      // We only need to copy schedule_exceptions if requested

      if (!includeExceptions || targetWeekStarts.length === 0) {
        return true;
      }

      // Get source week end date
      const sourceDate = new Date(sourceWeekStart);
      const sourceEndDate = new Date(sourceDate);
      sourceEndDate.setDate(sourceEndDate.getDate() + 6);
      const sourceWeekEnd = this.getLocalDateString(sourceEndDate);

      // Get all exceptions from source week
      const sourceExceptions = await this.getScheduleExceptions(
        barberId,
        sourceWeekStart,
        sourceWeekEnd
      );

      if (sourceExceptions.length === 0) {
        return true;
      }

      // For each target week, copy exceptions with adjusted dates
      for (const targetWeekStart of targetWeekStarts) {
        const sourceStartDate = new Date(sourceWeekStart);
        const targetStartDate = new Date(targetWeekStart);

        // Calculate day offset between source and target week
        const dayOffset = Math.floor(
          (targetStartDate.getTime() - sourceStartDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Copy each exception to the target week with adjusted date
        for (const exception of sourceExceptions) {
          const exceptionDate = new Date(exception.date);
          exceptionDate.setDate(exceptionDate.getDate() + dayOffset);
          const newDate = this.getLocalDateString(exceptionDate);

          // Check if exception already exists for this date
          const existingExceptions = await this.getScheduleExceptions(
            barberId,
            newDate,
            newDate
          );

          if (existingExceptions.length === 0) {
            // Create new exception with adjusted date
            await this.createScheduleException(
              barberId,
              newDate,
              exception.isAvailable,
              exception.startTime,
              exception.endTime,
              exception.reason
            );
          }
        }
      }

      // Clear cache after copying
      this.clearCache();

      return true;
    } catch (error) {
      console.error('Error copying week schedule:', error);
      return false;
    }
  }

}
