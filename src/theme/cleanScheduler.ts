/**
 * Clean Scheduler design system tokens.
 * Use for Appointments screen and Appointment Detail sheet to match Schedule screen.
 */
export const cleanScheduler = {
  background: '#F5F5F7',
  card: {
    bg: '#FFFFFF',
    radius: 12,
    border: '#E5E7EB',
  },
  text: {
    heading: '#111827',
    body: '#374151',
    subtext: '#6B7280',
  },
  status: {
    available: '#2ECC71',
    warning: '#F39C12',
    unavailable: '#E74C3C',
  },
  primary: '#000000',
  secondary: {
    bg: '#F3F4F6',
    text: '#111827',
  },
  padding: 16,
  sectionSpacing: 24,
  sheet: {
    radius: 20,
    divider: '#E5E7EB',
  },
  input: {
    radius: 8,
    border: '#E5E7EB',
  },
  /** Rounded bottom corners for dark hero header sections (e.g. Profile, Rewards). */
  heroBottomRadius: 28,
} as const;
