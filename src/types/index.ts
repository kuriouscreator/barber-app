export type UserRole = 'customer' | 'barber';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  subscription?: Subscription;
  credits: number;
  avatar?: string;
  memberSince?: string;
  location?: string;
  // Onboarding fields
  onboardingCompleted?: boolean;
  onboardingStep?: number;
  onboardingCompletedAt?: string;
  // Shop/business fields (for barbers)
  shopName?: string;
  shopAddress?: string;
  shopCity?: string;
  shopState?: string;
  shopZip?: string;
  shopPhone?: string;
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
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  servicePrice: number;
  appointmentDate: string; // YYYY-MM-DD format
  appointmentTime: string; // HH:MM format
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  specialRequests?: string;
  location?: string;
  paymentMethod?: string;
  creditsUsed?: number;
  rating?: number | null; // Rating given by the user (1-5 stars)
  reviewText?: string;
  reviewPhotoUrl?: string;
  barberId: string;
  barberName?: string;
  barberAvatar?: string;
  venueId?: string;
  venue?: VenueDetails;
  createdAt?: string;
  updatedAt?: string;
  // Walk-in appointment fields
  appointmentType?: 'booking' | 'walk_in';
  customerName?: string; // For walk-ins without user accounts
  customerPhone?: string; // Optional phone for walk-ins
  // Populated when fetching (booking appointments)
  customer?: { full_name?: string; email?: string; avatar_url?: string };
  // Legacy fields for backward compatibility
  userId?: string;
  date?: string;
  time?: string;
  service?: string;
  notes?: string;
  creditUsed?: boolean;
  review?: Review;
}

export interface Barber {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  availability: Availability[];
  scheduleExceptions: ScheduleException[];
  avatar?: string;
}

export interface VenueDetails {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  rating: number;
  reviewCount: number;
  imageUrl?: string;
  isTopRated?: boolean;
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
  SignIn: undefined;
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
  AppointmentDetails: {
    appointment: Appointment;
  };
  Activity: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Book: { rescheduleAppointment?: RescheduleAppointment; rebookAppointment?: RescheduleAppointment } | undefined;
  Appointments: { appointmentId?: string } | undefined;
  BarberAppointments: undefined;
  Schedule: undefined;
  Rewards: undefined;
  Profile: undefined;
  Services: undefined;
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
  appointmentType?: 'booking' | 'walk_in'; // Type of appointment
}

export interface DayProgress {
  completedCount: number;          // e.g., 3
  remainingCount: number;          // e.g., 4
  canceledCount: number;           // e.g., 1 (includes cancelled and no_show)
}

export interface MonthlyProgress {
  percent: number;                 // 0..100
  doneLabel: string;               // "96 cuts / 200 subscribed"
  remainingLabel: string;          // "104 remaining"
}

/** Barber notification row from barber_notifications (Supabase) */
export interface BarberNotification {
  id: string;
  barber_id: string;
  shop_id: string | null;
  type: 'appointment.booked' | 'appointment.canceled' | 'subscription.upgraded' | 'subscription.downgraded' | 'customer.signed_up';
  title: string;
  body: string | null;
  entity_type: 'appointment' | 'subscription' | 'customer' | null;
  entity_id: string | null;
  created_at: string;
  read_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface NotificationItem {
  id: string;
  title: string;                    // "New appointment booked"
  subtitle: string;                 // "Sarah Davis • 3:30 PM today"
  ctaLabel?: string;                // "View" | "Fix" | "Read"
  type?: "info" | "warning" | "review";
  /** For navigation; from barber_notifications */
  entity_type?: 'appointment' | 'subscription' | 'customer' | null;
  entity_id?: string | null;
  read_at?: string | null;
  /** For keyset pagination; set when from barber_notifications */
  created_at?: string;
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

// Barber Appointments Screen Filters
export interface AppointmentFilters {
  dateRange?: 'today' | 'week' | 'all' | 'last7' | 'last30' | 'last90';
  appointmentType?: 'all' | 'booking' | 'walk_in';
  status?: 'all' | 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  searchQuery?: string;
}
