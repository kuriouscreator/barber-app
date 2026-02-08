# Activity Log System Setup

## Overview

The activity logging system tracks all key user events and displays them in a beautiful timeline on the homepage and dedicated activity screen.

## What's Been Implemented

### ✅ Database Schema
- **user_activities table** - Stores all activity events with metadata
- **Activity type enum** - 12 different activity types
- **Helper functions** - For querying activities efficiently
- **RLS policies** - Users can only see their own activities

### ✅ Service Layer
- **ActivityLogger service** - Complete TypeScript service for logging and retrieving activities
- **12 activity types** configured with icons, colors, and templates
- **Template interpolation** - Dynamic activity descriptions

### ✅ Integration Points
- **Rewards system** - Logs when points earned/redeemed
- **Stripe webhooks** - Logs payments, renewals, referrals
- **Appointment flow** - Ready for appointment logging (see TODO)

### ✅ UI Components
- **ActivityCard** - Beautiful card component with icons, badges, timestamps
- **RecentActivityWidget** - Shows last 5 activities on homepage with "View All" link
- **ActivityScreen** - Full activity log with pull-to-refresh
- **Navigation** - Added Activity screen to stack navigator

## Quick Setup (2 Steps)

### Step 1: Run Database Migration

**Via Supabase Dashboard (Recommended):**

1. Open https://app.supabase.com → Your Project
2. Go to **SQL Editor**
3. Click **New query**
4. Copy all contents from: `supabase/migrations/create_activity_log.sql`
5. Paste and click **Run**

You should see: "Success. No rows returned"

### Step 2: Verify Tables

Go to **Table Editor** and check:
- ✅ `user_activities` table exists
- ✅ Has columns: id, user_id, activity_type, title, description, metadata, icon_type, badge_text, badge_color, created_at
- ✅ RLS is enabled

## Activity Types

The system tracks 12 types of activities:

| Type | Icon | When Logged |
|------|------|-------------|
| `appointment_completed` | ✓ | When barber marks appointment done |
| `appointment_confirmed` | 📅 | After user books appointment |
| `appointment_cancelled` | ✕ | When appointment is cancelled |
| `reward_earned` | 🎁 | When user earns points |
| `reward_redeemed` | 🎁 | When user redeems a reward |
| `membership_renewed` | ✨ | Monthly subscription renewal |
| `membership_upgraded` | 📈 | Plan upgrade |
| `membership_cancelled` | ⚠️ | Subscription cancelled |
| `referral_completed` | 👥 | Referral friend subscribes |
| `points_expired` | ⏰ | Points expire (if implemented) |
| `payment_successful` | 💳 | Payment processed |
| `payment_failed` | ⚠️ | Payment failed |

## Automatic Logging

Activities are automatically logged when:

### Already Integrated ✅
1. **Points Earned** - RewardsService.ts:awardPoints()
2. **Reward Redeemed** - RewardsService.ts:redeemReward()
3. **Referral Completed** - RewardsService.ts:completeReferral()
4. **Membership Renewed** - Stripe webhook (invoice.payment_succeeded)
5. **Payment Successful** - Stripe webhook (invoice.paid)
6. **Referral Completed** - Stripe webhook (new subscription with referral)

### TODO: Appointment Flow
You still need to add activity logging for appointments:

**When appointment is created:**
```typescript
// In AppointmentService.ts after creating appointment
await ActivityLogger.logAppointmentConfirmed(
  userId,
  appointment.id,
  formatDate(appointment.appointmentDate)
);
```

**When appointment is completed:**
```typescript
// When barber marks appointment as completed
await ActivityLogger.logAppointmentCompleted(
  userId,
  appointment.id,
  appointment.barberName,
  appointment.serviceName
);
```

**When appointment is cancelled:**
```typescript
// When user/barber cancels appointment
await ActivityLogger.logAppointmentCancelled(
  userId,
  appointment.id,
  formatDate(appointment.appointmentDate)
);
```

## Manual Logging

You can manually log activities anywhere in your code:

```typescript
import { ActivityLogger } from '../services/ActivityLogger';

// Log a reward earned
await ActivityLogger.logRewardEarned(
  userId,
  150, // points
  'completed visit', // reason
  appointmentId // optional reference
);

// Log membership upgrade
await ActivityLogger.logMembershipUpgraded(
  userId,
  'Premium Plan',
  'Basic Plan',
  subscriptionId
);

// Log payment failed
await ActivityLogger.logPaymentFailed(
  userId,
  'Basic Plan',
  invoiceId
);
```

## UI Features

### Homepage - RecentActivityWidget
- Shows last 5 activities
- "View All" link navigates to full activity screen
- Auto-loads on component mount
- Pull-to-refresh support

### Activity Screen
- Full list of all activities (50 at a time)
- Pull-to-refresh
- Shows total count
- Empty state when no activities
- Beautiful card design matching your app's style

### Activity Card
- Colored icon circle (background color matches activity type)
- Title and description from templates
- Optional badge (points, "Review", "Auto", etc.)
- Smart timestamps:
  - "Today at 2:30 PM"
  - "Yesterday at 10:00 AM"
  - "September 14, 2024 • 3:45 PM"

## Customization

### Add New Activity Type

1. Add to enum in migration SQL:
```sql
CREATE TYPE activity_type AS ENUM (
  ...,
  'your_new_type'
);
```

2. Add config in ActivityLogger.ts:
```typescript
const ACTIVITY_CONFIG = {
  your_new_type: {
    icon: 'star',
    iconColor: 'blue',
    titleTemplate: 'Your Title',
    descriptionTemplate: 'Description with {variable}',
    badgeText: '+{points}',
    badgeColor: 'blue',
  },
};
```

3. Add helper function:
```typescript
export const ActivityLogger = {
  logYourNewType: async (userId: string, metadata: any) => {
    return logActivity(userId, 'your_new_type', metadata);
  },
};
```

### Change Colors/Styles

All styling is in:
- `src/components/ActivityCard.tsx` - Individual card styling
- `src/components/RecentActivityWidget.tsx` - Widget container
- `src/screens/ActivityScreen.tsx` - Full screen layout

## Testing

1. **Create a test user**
2. **Award some points** → Should see "Reward Earned" activity
3. **Redeem a reward** → Should see "Reward Redeemed" activity
4. **Complete subscription payment** → Should see "Payment Successful" and "Membership Renewed"
5. **Refer a friend** (when they subscribe) → Should see "Referral Bonus"
6. **Check homepage** → Should see recent activities widget
7. **Tap "View All"** → Should navigate to full activity screen

## Database Queries

### View all activities for a user
```sql
SELECT * FROM user_activities
WHERE user_id = 'user-id-here'
ORDER BY created_at DESC;
```

### Count activities by type
```sql
SELECT activity_type, COUNT(*) as count
FROM user_activities
GROUP BY activity_type
ORDER BY count DESC;
```

### Recent activities across all users
```sql
SELECT
  ua.*,
  p.full_name,
  p.email
FROM user_activities ua
JOIN profiles p ON ua.user_id = p.id
ORDER BY ua.created_at DESC
LIMIT 20;
```

## Performance

- **Indexes created** on user_id, created_at, activity_type
- **RLS enabled** - Users only see their own data
- **Limit 50 items** per page (configurable)
- **Efficient queries** using RPC functions

## Future Enhancements

Consider adding:
1. **Push notifications** when new activities occur
2. **Activity filtering** by type (appointments, rewards, payments)
3. **Date range filtering**
4. **Search functionality**
5. **Activity groups** (e.g., "This Week", "Last Month")
6. **Clickable activities** that navigate to relevant screens
7. **Activity deletion** (mark as read/hide)
8. **Export activities** as PDF/CSV

## Troubleshooting

### Activities not showing up
1. Check if table exists: `SELECT * FROM user_activities LIMIT 1;`
2. Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'user_activities';`
3. Check service role key is set correctly
4. Look for errors in console logs

### Migration fails
- Make sure you're using the SQL Editor in Supabase Dashboard
- Check that the enum doesn't already exist
- Try running sections of the migration one at a time

### Wrong user's activities showing
- Verify RLS policies are enabled
- Check auth.uid() is working: `SELECT auth.uid();`
- Ensure user_id matches auth.users.id

## Support

All activity logging happens automatically through:
- RewardsService
- Stripe webhooks
- (TODO) AppointmentService

If activities aren't being logged, check the console logs for errors from ActivityLogger.
