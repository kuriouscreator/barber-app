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

export interface Review {
  id: string;
  appointmentId: string;
  customerId: string;
  customerName: string;
  barberId: string;
  rating: number;
  text: string;
  photos: string[];
  date: string;
  service: string;
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
  review?: Review; // Full review object if user has reviewed
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
  BarberProfile: {
    barberId: string;
    barberName: string;
    barberAvatar: string;
    barberRating: number;
    barberReviewCount: number;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Book: { rescheduleAppointment?: RescheduleAppointment; rebookAppointment?: RescheduleAppointment } | undefined;
  Appointments: undefined;
  Profile: undefined;
  Admin: { initialTab?: 'calendar' | 'services' | 'schedule' };
  BarberProfile: {
    barberId: string;
    barberName: string;
    barberAvatar: string;
    barberRating: number;
    barberReviewCount: number;
  };
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

// Barber Dashboard Types
export interface BarberStats {
  todayAppointments: number;
  todayCutsUsed: number;
  nextAppt?: { timeLabel: string; clientName: string } | null;
}

export interface QuickAction {
  key: "book" | "schedule" | "clients" | "services";
  title: string;
  subtitle: string;
  icon?: string;
  onPress: () => void;
}

export interface QueueItem {
  id: string;
  clientName: string;
  avatarUrl?: string;
  serviceName: string;
  subService?: string;
  state: "IN_PROGRESS" | "NEXT_UP" | "SCHEDULED";
  startTimeLabel?: string;         // e.g., "Started 10:30 AM"
  nextTimeLabel?: string;          // e.g., "11:30 AM"
  estimateLabel: string;           // e.g., "Est. 45 min • $60"
}

export interface DayProgress {
  completedCount: number;          // e.g., 3
  remainingCount: number;          // e.g., 4
}

export interface MonthlyProgress {
  percent: number;                 // 0..100
  doneLabel: string;               // "96 cuts / 200 subscribed"
  remainingLabel: string;          // "104 remaining"
}

export interface NotificationItem {
  id: string;
  title: string;                    // "New appointment booked"
  subtitle: string;                 // "Sarah Davis • 3:30 PM today"
  ctaLabel?: string;                // "View" | "Fix" | "Read"
  type?: "info" | "warning" | "review";
}

export interface SubscriptionInsights {
  plans: { label: string; count: number }[];  // e.g., [{label:"Basic Plan",count:15}, ...]
  reminderNote?: string;                       // "3 clients need renewal reminders this week."
}

export interface QuickSettings {
  appointmentReminders: boolean;
  visibleToNewClients: boolean;
}

// Barber Weekly Schedule Types
export interface DayRowData {
  key: 'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun';
  dayLabel: string;
  timeLabel: string;        // e.g., "9:00 AM - 6:00 PM" | "Closed" | "9–1, 3–7 PM"
  meta: string;             // e.g., "8 appointments available" | "Split shift • 6 appointments" | "Day off"
  status: 'available'|'unavailable'|'partial'|'weekend'; // map to dot color
}

export interface ExceptionItem {
  id: string;
  icon: 'holiday'|'clock';
  title: string;            // e.g., "Martin Luther King Day"
  dateLabel: string;        // e.g., "Monday, Jan 20, 2025"
  description: string;      // e.g., "Closed for holiday" | "Opening at 11:00 AM..."
}

export interface TemplateSummary {
  id: string;
  name: string;
  lines: string[];          // summary lines
}

export interface WeekRange {
  startISO: string;
  endISO: string;
  isCurrentWeek: boolean;
}

export interface WeekStats {
  hoursValue: string;
  metaLeft: string;
  metaRight: string;
  availableSlots: { value: number; caption: string; icon: string };
  booked: { value: number; caption: string; icon: string };
  utilizationPct: number;
}
