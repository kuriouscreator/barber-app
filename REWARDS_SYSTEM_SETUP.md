# Rewards System Setup Guide

## Overview

The rewards system is a points-based loyalty program that incentivizes users to maintain subscriptions and refer friends. Users earn points through:

- **Monthly Loyalty Bonus**: 100-300 points per month based on subscription tier
- **Referrals**: 500 points when referred friend completes first subscription
- **Anniversary Milestones**: 750-2,000 points at subscription milestones (6 months, 1 year, yearly)
- **Welcome Bonus**: 100 points for signing up

## Database Schema

The rewards system uses the following tables:

- `reward_points` - Ledger of all point transactions
- `rewards_catalog` - Available rewards that users can redeem
- `reward_redemptions` - Track user redemptions with codes and expiry
- `referrals` - Track referral relationships and rewards
- `user_referral_codes` - Unique referral code per user

## Installation

### 1. Run Database Migration

**RECOMMENDED: Use Supabase Dashboard**

The easiest way to run the migration:

1. Open your Supabase Dashboard (https://app.supabase.com)
2. Go to SQL Editor
3. Copy the contents of `supabase/migrations/create_rewards_system.sql`
4. Paste into the SQL Editor and click "Run"

📖 **Detailed instructions:** See [MIGRATION_INSTRUCTIONS.md](./MIGRATION_INSTRUCTIONS.md) for step-by-step guide and troubleshooting.

Alternative methods:
- Supabase CLI: `supabase db push`
- Automated script: `node setup-rewards-direct.js` (requires dependencies)

### 2. Verify Tables Created

Check your Supabase dashboard to confirm the following tables exist:
- ✅ reward_points
- ✅ rewards_catalog
- ✅ reward_redemptions
- ✅ referrals
- ✅ user_referral_codes

### 3. Verify Seed Data

Check that the `rewards_catalog` table has 6 initial rewards:
- Free Beard Trim (1,500 points)
- Hot Towel Treatment (1,000 points)
- Priority Booking (2,000 points)
- Guest Pass (2,500 points)
- Scalp Massage (800 points)
- VIP Appointment (3,000 points)

### 4. Test Rewards Functionality

1. Sign in to the app
2. Navigate to the **Rewards** tab (gift icon)
3. Check your points balance (should show 100 signup bonus if new user)
4. View your referral code
5. Browse the rewards catalog
6. Try redeeming a reward (if you have enough points)

## Points Configuration

Points are configured in `src/services/RewardsService.ts`:

```typescript
const POINTS_CONFIG = {
  TIER_MULTIPLIERS: {
    basic: 1.0,
    premium: 2.0,
    vip: 3.0,
  },
  BASE_MONTHLY_POINTS: 100,
  REFERRAL_BONUS: 500,
  ANNIVERSARY_6M: 750,
  ANNIVERSARY_12M: 1500,
  ANNIVERSARY_YEARLY: 2000,
  SIGNUP_BONUS: 100,
};
```

You can adjust these values to match your business requirements.

## How It Works

### Automatic Points Awarding

Points are automatically awarded through Stripe webhooks in `supabase/functions/stripe-webhook/index.ts`:

1. **New Subscription Created** → Award signup bonus (100 points)
2. **Monthly Billing Period Renews** → Award monthly loyalty bonus (100-300 points)
3. **Subscription Created (with referral)** → Award referral bonus to referrer (500 points)
4. **Anniversary Check** → Award milestone bonuses at 6mo/1yr/yearly

### Manual Points Management

You can manually award points using the RewardsService:

```typescript
import { RewardsService } from './services/RewardsService';

// Award custom points
await RewardsService.awardPoints(
  userId,
  250, // points
  'manual',
  'Special promotion bonus'
);
```

### Referral System

1. Each user gets a unique 8-character referral code (auto-generated)
2. New users can enter a referral code during signup
3. When the new user completes their first subscription payment, the referrer gets 500 points
4. Users can view their referrals in the Rewards screen

### Reward Redemption

1. Users browse the rewards catalog
2. Select a reward they can afford
3. Confirm redemption
4. Receive a unique 10-character redemption code
5. Redemption expires after 90 days if unused
6. Points are deducted immediately

## UI Components

### RewardsScreen
Main rewards dashboard showing:
- Current points balance
- Progress to next milestone
- How to earn points
- Recent activity
- Referral code with sharing
- Quick actions (Rewards Catalog, Referrals, Share)

### RewardsCatalogSheet
Bottom sheet showing all available rewards grouped by category:
- Service Rewards (haircuts, grooming services)
- Flexibility Perks (priority booking, guest passes)
- Product Rewards (grooming products)
- Exclusive Experiences (VIP appointments)

### Navigation
Added new "Rewards" tab to the main tab navigator (customer view only).

## Stripe Webhook Integration

The Stripe webhook (`supabase/functions/stripe-webhook/index.ts`) handles:

- **customer.subscription.created** - Award signup bonus, check referrals
- **customer.subscription.updated** - Award monthly loyalty bonus on period renewal
- **invoice.paid** - Ensure proper period tracking

### Testing Webhooks Locally

1. Use Stripe CLI to forward webhooks:
```bash
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

2. Trigger test events:
```bash
stripe trigger customer.subscription.created
stripe trigger invoice.paid
```

## Environment Variables

No additional environment variables needed beyond existing Stripe/Supabase config:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (for migrations)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

## Future Enhancements

Consider adding:

1. **Push Notifications** - Notify users when they earn points or rewards are expiring
2. **Points Expiration** - Expire points after 90 days of subscription cancellation
3. **Tiered Rewards** - Different reward catalogs based on subscription tier
4. **Bonus Events** - Double points weekends or special promotions
5. **Gamification** - Badges, streaks, leaderboards
6. **Partner Rewards** - Integrate with partner businesses for expanded catalog
7. **Points Gifting** - Allow users to gift points to friends
8. **Seasonal Rewards** - Limited-time exclusive rewards

## Troubleshooting

### Points Not Showing Up

1. Check if reward_points table has entries:
```sql
SELECT * FROM reward_points WHERE user_id = 'user_id_here';
```

2. Verify webhook is being called:
```bash
# Check Stripe webhook logs in dashboard
# Check Supabase function logs
```

### Referral Code Not Generated

Check if the trigger is enabled:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_user_created_create_referral_code';
```

### Can't Redeem Rewards

1. Verify user has sufficient points:
```sql
SELECT get_user_points_balance('user_id_here');
```

2. Check reward is active:
```sql
SELECT * FROM rewards_catalog WHERE is_active = true;
```

## Database Maintenance

### View All Points Balances
```sql
SELECT * FROM user_points_summary;
```

### Find High-Value Users
```sql
SELECT
  p.email,
  p.name,
  get_user_points_balance(p.id) as balance,
  p.total_points as lifetime_points
FROM profiles p
WHERE get_user_points_balance(p.id) > 1000
ORDER BY balance DESC;
```

### Check Pending Referrals
```sql
SELECT
  r.*,
  p1.email as referrer_email,
  p2.email as referred_email
FROM referrals r
JOIN profiles p1 ON r.referrer_user_id = p1.id
LEFT JOIN profiles p2 ON r.referred_user_id = p2.id
WHERE r.status = 'pending';
```

## Support

For issues or questions:
1. Check Supabase function logs
2. Check Stripe webhook logs
3. Review database RLS policies
4. Verify user authentication

## License

Part of the Barber App project.
