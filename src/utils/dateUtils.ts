/**
 * Date utility functions for week navigation and formatting
 * All functions work with ISO date strings (YYYY-MM-DD format)
 */

/**
 * Get the start of the week (Monday) for a given date
 * @param date - Date object or ISO string
 * @returns ISO string of Monday of that week
 */
export const getStartOfWeekISO = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = day === 0 ? -6 : 1 - day; // Monday is day 1, so diff = 1-1=0 for Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday.toISOString().split('T')[0];
};

/**
 * Get the end of the week (Sunday) for a given date
 * @param date - Date object or ISO string
 * @returns ISO string of Sunday of that week
 */
export const getEndOfWeekISO = (date: Date | string): string => {
  const startOfWeek = getStartOfWeekISO(date);
  return addDaysISO(startOfWeek, 6);
};

/**
 * Add days to an ISO date string
 * @param isoDate - ISO date string (YYYY-MM-DD)
 * @param days - Number of days to add (can be negative)
 * @returns New ISO date string
 */
export const addDaysISO = (isoDate: string, days: number): string => {
  const date = new Date(isoDate + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

/**
 * Check if two ISO date strings represent the same week
 * @param isoDate1 - First ISO date string
 * @param isoDate2 - Second ISO date string
 * @returns True if both dates are in the same week
 */
export const isSameISOWeek = (isoDate1: string, isoDate2: string): boolean => {
  return getStartOfWeekISO(isoDate1) === getStartOfWeekISO(isoDate2);
};

/**
 * Format a date range for display (e.g., "Jan 6 – Jan 12, 2025")
 * @param startISO - Start date ISO string
 * @param endISO - End date ISO string
 * @returns Formatted date range string
 */
export const formatWeekRange = (startISO: string, endISO: string): string => {
  const startDate = new Date(startISO + 'T00:00:00');
  const endDate = new Date(endISO + 'T00:00:00');
  
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = startDate.getDate();
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  const endDay = endDate.getDate();
  const year = endDate.getFullYear();
  
  // Handle same month
  if (startDate.getMonth() === endDate.getMonth()) {
    return `${startMonth} ${startDay} – ${endDay}, ${year}`;
  }
  
  // Handle different months
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
};

/**
 * Get today's date as ISO string
 * @returns Today's date in YYYY-MM-DD format
 */
export const getTodayISO = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get the current week start (Monday of this week)
 * @returns ISO string of current week start
 */
export const getCurrentWeekStartISO = (): string => {
  return getStartOfWeekISO(new Date());
};

/**
 * Check if a given week start ISO is the current week
 * @param weekStartISO - Week start ISO string to check
 * @returns True if the week contains today
 */
export const isCurrentWeek = (weekStartISO: string): boolean => {
  return isSameISOWeek(weekStartISO, getCurrentWeekStartISO());
};
