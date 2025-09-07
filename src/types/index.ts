export type UserRole = 'customer' | 'barber';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  subscription?: Subscription;
  credits: number;
}

export interface Subscription {
  id: string;
  name: string;
  price: number;
  credits: number;
  duration: 'monthly' | 'quarterly' | 'yearly';
  description: string;
}

export interface Appointment {
  id: string;
  userId: string;
  barberId: string;
  date: string;
  time: string;
  service: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  creditUsed?: boolean; // Track if a credit was used for this appointment
  rating?: number | null; // Rating given by the user (1-5 stars)
}

export interface Barber {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  availability: Availability[];
  scheduleExceptions: ScheduleException[];
}

export interface Availability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
  description: string;
}

export interface ScheduleException {
  id: string;
  date: string; // YYYY-MM-DD format
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  reason?: string; // Optional reason for the exception
}

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Subscription: undefined;
  Booking: undefined;
  Admin: { initialTab?: 'calendar' | 'services' | 'schedule' };
};

export type MainTabParamList = {
  Home: undefined;
  Book: { rescheduleAppointment?: RescheduleAppointment; rebookAppointment?: RescheduleAppointment } | undefined;
  Appointments: undefined;
  Profile: undefined;
  Admin: { initialTab?: 'calendar' | 'services' | 'schedule' };
};

export interface RescheduleAppointment {
  id: string;
  shopName: string;
  service: string;
  currentDate: string;
  currentTime: string;
  location: string;
  barberAvatar: string;
}
