import { formatSubscriptionPrice, formatPriceAmountToDollars } from '../priceFormatter';

describe('formatSubscriptionPrice', () => {
  describe('valid price amounts', () => {
    it('should format monthly price correctly', () => {
      expect(formatSubscriptionPrice(4500, 'month')).toBe('$45/mo');
    });

    it('should format yearly price correctly', () => {
      expect(formatSubscriptionPrice(12000, 'year')).toBe('$120/yr');
    });

    it('should round to nearest dollar', () => {
      expect(formatSubscriptionPrice(4999, 'month')).toBe('$50/mo');
    });
  });

  describe('null/undefined/zero amounts', () => {
    it('should show "—" for active subscription with null price', () => {
      expect(formatSubscriptionPrice(null, 'month', 'active')).toBe('—');
    });

    it('should show "—" for trialing subscription with undefined price', () => {
      expect(formatSubscriptionPrice(undefined, 'month', 'trialing')).toBe('—');
    });

    it('should show "—" for active subscription with zero price', () => {
      expect(formatSubscriptionPrice(0, 'month', 'active')).toBe('—');
    });

    it('should show "Pending" for incomplete subscription with null price', () => {
      expect(formatSubscriptionPrice(null, 'month', 'incomplete')).toBe('Pending');
    });

    it('should show "Pending" for unpaid subscription', () => {
      expect(formatSubscriptionPrice(null, 'month', 'unpaid')).toBe('Pending');
    });

    it('should show "Pending" for past_due subscription', () => {
      expect(formatSubscriptionPrice(null, 'month', 'past_due')).toBe('Pending');
    });

    it('should show "Canceled" for canceled subscription', () => {
      expect(formatSubscriptionPrice(null, 'month', 'canceled')).toBe('Canceled');
    });

    it('should show "—" for unknown status with null price', () => {
      expect(formatSubscriptionPrice(null, 'month')).toBe('—');
    });
  });

  describe('edge cases', () => {
    it('should never show "Free" (we dont support free plans)', () => {
      const result1 = formatSubscriptionPrice(0, 'month', 'active');
      const result2 = formatSubscriptionPrice(null, 'month', 'active');
      const result3 = formatSubscriptionPrice(undefined, 'month', 'active');

      expect(result1).not.toBe('Free');
      expect(result2).not.toBe('Free');
      expect(result3).not.toBe('Free');
    });
  });
});

describe('formatPriceAmountToDollars', () => {
  it('should convert cents to dollars', () => {
    expect(formatPriceAmountToDollars(4500)).toBe(45);
    expect(formatPriceAmountToDollars(12000)).toBe(120);
  });

  it('should return null for null input', () => {
    expect(formatPriceAmountToDollars(null)).toBe(null);
  });

  it('should return null for undefined input', () => {
    expect(formatPriceAmountToDollars(undefined)).toBe(null);
  });

  it('should return null for zero', () => {
    expect(formatPriceAmountToDollars(0)).toBe(null);
  });

  it('should return null for negative values', () => {
    expect(formatPriceAmountToDollars(-100)).toBe(null);
  });
});
