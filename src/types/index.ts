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
  checkInStatus: 'pending' | 'arrived' | 'approved' | 'rejected';
  notes?: string;
}

export interface Barber {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  availability: Availability[];
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

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Subscription: undefined;
  Booking: undefined;
  CheckIn: { appointmentId: string };
  Admin: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Book: undefined;
  Profile: undefined;
  Admin: undefined;
};
