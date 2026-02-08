/**
 * Business/Shop Information
 * Centralized configuration for barbershop details
 */

export const BUSINESS_INFO = {
  /** Official business name */
  name: 'Prestige Cuts',

  /** Business location/area */
  location: 'Downtown',

  /** Full business address */
  address: '123 Main St, San Francisco, CA',

  /** Display name for Stripe payments */
  merchantDisplayName: 'Prestige Cuts',
} as const;

export type BusinessInfo = typeof BUSINESS_INFO;
