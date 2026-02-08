/**
 * Format subscription price for display
 *
 * This handles edge cases where price_amount might be missing from the database.
 * We never display "Free" since the app doesn't support free plans.
 *
 * @param priceAmount - Price in cents from database (can be null/undefined)
 * @param interval - Billing interval ('month' or 'year')
 * @param status - Subscription status
 * @returns Formatted price string
 */
export function formatSubscriptionPrice(
  priceAmount: number | null | undefined,
  interval: 'month' | 'year',
  status?: string
): string {
  // Valid price amount
  if (priceAmount != null && priceAmount > 0) {
    const intervalAbbr = interval === 'month' ? 'mo' : 'yr';
    return `$${(priceAmount / 100).toFixed(0)}/${intervalAbbr}`;
  }

  // Active subscription but missing price - data issue
  if (status === 'active' || status === 'trialing') {
    return '—';
  }

  // Incomplete/unpaid subscription
  if (status === 'incomplete' || status === 'unpaid' || status === 'past_due') {
    return 'Pending';
  }

  // Canceled subscription
  if (status === 'canceled') {
    return 'Canceled';
  }

  // Fallback for unknown state
  return '—';
}

/**
 * Format price amount in cents to dollars
 *
 * @param priceAmount - Price in cents (can be null/undefined)
 * @returns Price in dollars, or null if invalid
 */
export function formatPriceAmountToDollars(
  priceAmount: number | null | undefined
): number | null {
  if (priceAmount == null || priceAmount <= 0) {
    return null;
  }
  return priceAmount / 100;
}
