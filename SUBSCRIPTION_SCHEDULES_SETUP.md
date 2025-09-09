# Subscription Schedules Implementation Guide

This guide explains how to implement and use the new subscription schedules feature for handling downgrades without immediate proration.

## What This Solves

- **No immediate charges** when downgrading plans
- **No proration confusion** - changes happen at billing cycle boundaries
- **Better user experience** with clear communication about when changes take effect
- **Option to cancel** scheduled changes if users change their mind

## Setup Steps

### 1. Database Schema Update

Run the SQL script to add scheduled change fields:

```sql
-- Run this in your Supabase SQL Editor
-- File: add-scheduled-change-fields.sql
```

### 2. Deploy Edge Functions

Deploy the new Supabase Edge Functions:

```bash
# Deploy all three functions
supabase functions deploy stripe-schedule-downgrade
supabase functions deploy stripe-cancel-schedule  
supabase functions deploy stripe-get-schedule
```

### 3. Update Stripe Webhook Configuration

Add these new webhook events to your Stripe webhook endpoint:

- `subscription_schedule.created`
- `subscription_schedule.updated`
- `subscription_schedule.completed`
- `subscription_schedule.canceled`

### 4. Update Your App

The following components have been created/updated:

- **BillingService**: New methods for scheduling and managing downgrades
- **useSubscriptionSchedule**: Hook for managing schedule state
- **ScheduledChangeCard**: Component to display scheduled changes
- **ManageSubscriptionScreen**: Updated to show scheduled changes

## How It Works

### For Users

1. **Schedule Downgrade**: User selects a lower-tier plan
2. **Current Plan Continues**: User keeps current benefits until period ends
3. **Automatic Change**: Plan changes at the start of next billing period
4. **Cancel Option**: User can cancel the scheduled change anytime

### For Developers

1. **Schedule Creation**: `BillingService.scheduleDowngrade(priceId)` creates a Stripe subscription schedule
2. **Database Tracking**: Scheduled change info is stored in `user_subscriptions` table
3. **Webhook Handling**: Stripe events update the database automatically
4. **UI Updates**: Real-time updates show scheduled changes to users

## Usage Examples

### Schedule a Downgrade

```typescript
import { BillingService } from '../services/billing';

// Schedule a downgrade to Basic plan
const result = await BillingService.scheduleDowngrade('price_basic_monthly');
console.log('Downgrade scheduled:', result.effectiveDate);
```

### Cancel a Scheduled Change

```typescript
// Cancel a scheduled downgrade
await BillingService.cancelScheduledDowngrade(scheduleId);
```

### Check for Scheduled Changes

```typescript
import { useSubscriptionSchedule } from '../hooks/useSubscriptionSchedule';

function MyComponent() {
  const { schedule, loading } = useSubscriptionSchedule();
  
  if (schedule?.hasScheduledChange) {
    return <ScheduledChangeCard {...schedule} />;
  }
}
```

## Database Schema

New fields added to `user_subscriptions` table:

```sql
scheduled_plan_name TEXT           -- Name of scheduled plan
scheduled_price_id TEXT           -- Stripe price ID of scheduled plan  
scheduled_effective_date TIMESTAMPTZ -- When the change takes effect
```

## Webhook Events

The webhook handler now processes these additional events:

- **subscription_schedule.created**: Initial schedule creation
- **subscription_schedule.updated**: Schedule modifications
- **subscription_schedule.completed**: Schedule executed successfully
- **subscription_schedule.canceled**: Schedule was canceled

## Testing

### Test Scenarios

1. **Schedule Downgrade**: Create a schedule and verify database updates
2. **Cancel Schedule**: Cancel a scheduled change and verify cleanup
3. **Schedule Completion**: Wait for period end and verify plan change
4. **Webhook Events**: Test all subscription schedule webhook events

### Test Commands

```bash
# Test schedule creation
curl -X POST https://your-project.supabase.co/functions/v1/stripe-schedule-downgrade \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"newPriceId": "price_basic_monthly"}'

# Test schedule retrieval
curl -X POST https://your-project.supabase.co/functions/v1/stripe-get-schedule \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Benefits

### For Users
- ✅ No surprise charges when downgrading
- ✅ Keep current benefits until period ends
- ✅ Clear communication about when changes happen
- ✅ Option to cancel if they change their mind

### For Business
- ✅ Reduced support requests about billing confusion
- ✅ Better customer retention (less churn from billing surprises)
- ✅ Predictable revenue (changes at cycle boundaries)
- ✅ Professional billing experience

## Migration Notes

- **Existing Subscriptions**: No impact on current subscriptions
- **Backward Compatibility**: All existing functionality remains unchanged
- **Gradual Rollout**: Can be enabled for specific user segments first

## Troubleshooting

### Common Issues

1. **Schedule Not Created**: Check Stripe API keys and webhook configuration
2. **Database Not Updated**: Verify webhook events are being received
3. **UI Not Showing Changes**: Check realtime subscriptions are working

### Debug Steps

1. Check Supabase function logs for errors
2. Verify Stripe webhook events in dashboard
3. Check database for scheduled change records
4. Test webhook endpoints manually

## Support

For issues or questions:
1. Check the function logs in Supabase
2. Verify Stripe webhook configuration
3. Test with Stripe's webhook testing tools
4. Review the implementation against Stripe's documentation
