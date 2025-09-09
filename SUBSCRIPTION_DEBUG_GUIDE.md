# Subscription Plan Reverting Issue - Debug Guide

## 🚨 **Problem Description**
User was on Premium plan, screen refreshed, and user is now showing VIP plan again. This shouldn't happen since Stripe is the source of truth.

## 🔍 **Potential Root Causes**

### 1. **Scheduled Changes Issue**
- **Most Likely**: User has a scheduled downgrade that's being processed
- **Check**: Look for `scheduled_plan_name`, `scheduled_price_id`, and `scheduled_effective_date` in the database
- **Solution**: Clear scheduled changes if they're incorrect

### 2. **Multiple Subscription Records**
- **Issue**: User might have multiple subscription records in the database
- **Check**: Look for duplicate `user_id` entries in `user_subscriptions` table
- **Solution**: Clean up duplicate records, keep only the most recent

### 3. **Webhook Processing Issues**
- **Issue**: Stripe webhooks might be processing old events or processing events out of order
- **Check**: Look at webhook logs and Stripe dashboard for recent events
- **Solution**: Verify webhook endpoint is working correctly

### 4. **RLS Policy Issues**
- **Issue**: Row Level Security might not be filtering correctly
- **Check**: Verify RLS policies are working as expected
- **Solution**: Fixed by adding explicit user ID filtering in BillingService

### 5. **Caching Issues**
- **Issue**: App might be using cached data instead of fresh data
- **Check**: Look at console logs for subscription loading
- **Solution**: Enhanced logging to track data flow

## 🛠️ **Debug Steps**

### Step 1: Run the Debug Script
```bash
node debug-subscription-issue.js
```

This will show you:
- All subscription records in the database
- Any scheduled changes
- Duplicate subscriptions
- Recent webhook activity

### Step 2: Monitor Real-time Changes
```bash
node debug-subscription-refresh.js
```

This will monitor the database for real-time changes when you refresh the screen.

### Step 3: Check Console Logs
Look for these log messages in your app:
- `🔄 Loading user subscription...`
- `👤 Current user in context:`
- `📊 Subscription loaded:`
- `📋 Plan details:`

### Step 4: Check Stripe Dashboard
1. Go to Stripe Dashboard → Customers
2. Find your user's customer record
3. Check the Subscriptions tab
4. Look for any subscription schedules
5. Check the Events tab for recent webhook events

## 🔧 **Fixes Applied**

### 1. **Enhanced BillingService.getSubscription()**
- Added explicit user ID filtering
- Added better error handling and logging
- Added user authentication check

### 2. **Enhanced AppContext Logging**
- Added detailed logging of subscription data
- Added logging of scheduled changes
- Added user context logging

### 3. **Debug Scripts**
- Created `debug-subscription-issue.js` for one-time analysis
- Created `debug-subscription-refresh.js` for real-time monitoring

## 🎯 **Most Likely Solutions**

### If it's a Scheduled Change Issue:
```sql
-- Check for scheduled changes
SELECT user_id, plan_name, scheduled_plan_name, scheduled_effective_date 
FROM user_subscriptions 
WHERE scheduled_plan_name IS NOT NULL;

-- Clear scheduled changes if incorrect
UPDATE user_subscriptions 
SET scheduled_plan_name = NULL, 
    scheduled_price_id = NULL, 
    scheduled_effective_date = NULL 
WHERE user_id = 'YOUR_USER_ID';
```

### If it's Duplicate Subscriptions:
```sql
-- Find duplicate subscriptions
SELECT user_id, COUNT(*) as count 
FROM user_subscriptions 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- Keep only the most recent subscription
DELETE FROM user_subscriptions 
WHERE user_id = 'YOUR_USER_ID' 
AND created_at < (
    SELECT MAX(created_at) 
    FROM user_subscriptions 
    WHERE user_id = 'YOUR_USER_ID'
);
```

### If it's a Webhook Issue:
1. Check Stripe webhook endpoint configuration
2. Verify webhook events are being received
3. Check webhook processing logs
4. Manually trigger a webhook if needed

## 📋 **Next Steps**

1. **Run the debug scripts** to identify the root cause
2. **Check the console logs** when the issue occurs
3. **Verify Stripe data** matches your database
4. **Apply the appropriate fix** based on the root cause
5. **Test the fix** by refreshing the screen multiple times

## 🚨 **Emergency Fix**

If you need to immediately fix the user's plan:

```sql
-- Update the user's subscription to the correct plan
UPDATE user_subscriptions 
SET plan_name = 'Premium Plan',
    stripe_price_id = 'price_premium_plan_id',
    updated_at = NOW()
WHERE user_id = 'YOUR_USER_ID';
```

**Note**: This should only be done after identifying the root cause to prevent the issue from recurring.
