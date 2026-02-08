# Stripe Billing Integration Setup

This document provides step-by-step instructions for setting up Stripe billing integration for the BarberCuts app.

## Overview

The integration uses Stripe Billing for subscription management with the following architecture:
- **Stripe Products/Prices**: Define subscription plans (Basic, Premium, VIP)
- **Supabase Edge Functions**: Handle Stripe operations securely
- **Postgres Database**: Track subscription state and cuts usage
- **Deep Linking**: Handle Stripe redirects back to the app

## Prerequisites

1. Stripe account with billing enabled
2. Supabase project with Edge Functions enabled
3. Expo app with deep linking configured

## 1. Stripe Dashboard Setup

### Create Products and Prices

1. Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products)
2. Create products for each subscription plan:

**Basic Plan:**
- Product Name: "Basic"
- Description: "1 haircuts per month"
- Price: $45/month (or your preferred price)
- Billing: Recurring monthly
- Add metadata: `cuts_included: 1`, `interval: month`

**Premium Plan:**
- Product Name: "Premium" 
- Description: "2 haircuts per month"
- Price: $80/month
- Billing: Recurring monthly
- Add metadata: `cuts_included: 2`, `interval: month`

**VIP Plan:**
- Product Name: "VIP"
- Description: "4 haircuts per month"
- Price: $120/month
- Billing: Recurring monthly
- Add metadata: `cuts_included: 4`, `interval: month`

3. Note down the Product IDs and Price IDs for each plan

### Configure Webhooks

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Endpoint URL: `https://your-project-ref.supabase.co/functions/v1/stripe-webhook`
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
5. Copy the webhook signing secret (starts with `whsec_`)

## 2. Supabase Setup

### Environment Variables

Add these secrets to your Supabase project:

1. Go to [Supabase Dashboard > Settings > Edge Functions](https://supabase.com/dashboard/project/_/settings/functions)
2. Add the following secrets:

```
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
STRIPE_WEBHOOK_SECRET=whsec_...
APP_DEEP_LINK_SUCCESS=barbercuts://billing/success
APP_DEEP_LINK_CANCEL=barbercuts://billing/cancel
```

### Deploy Edge Functions

Deploy the Edge Functions to your Supabase project:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy stripe-create-checkout
supabase functions deploy stripe-create-portal
supabase functions deploy stripe-webhook
supabase functions deploy add-cut-usage
```

### Database Schema

Run the SQL commands in `setup-billing-schema.sql` in your Supabase SQL Editor:

```sql
-- This creates the billing tables and policies
-- See setup-billing-schema.sql for the complete schema
```

### Update Plan Catalog

Update the plan catalog with your actual Stripe Product/Price IDs:

```sql
-- Replace with your actual Stripe IDs
UPDATE plan_catalog SET 
  stripe_product_id = 'prod_your_basic_product_id',
  stripe_price_id = 'price_your_basic_price_id'
WHERE name = 'Basic Plan';

UPDATE plan_catalog SET 
  stripe_product_id = 'prod_your_premium_product_id',
  stripe_price_id = 'price_your_premium_price_id'
WHERE name = 'Premium Plan';

UPDATE plan_catalog SET 
  stripe_product_id = 'prod_your_vip_product_id',
  stripe_price_id = 'price_your_vip_price_id'
WHERE name = 'VIP Plan';
```

## 3. App Configuration

### Environment Variables

Add to your `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (optional, for future PaymentSheet)
```

### Deep Linking

The app.json is already configured with the necessary deep link routes:
- `barbercuts://billing/success`
- `barbercuts://billing/cancel`

## 4. Testing

### Test Mode Setup

1. Use Stripe test mode for development
2. Create test products and prices in Stripe Dashboard
3. Use test webhook endpoint: `https://your-project-ref.supabase.co/functions/v1/stripe-webhook`
4. Test with Stripe test cards:
   - Success: `4242424242424242`
   - Decline: `4000000000000002`

### Test Flow

1. Open the app and navigate to Plans screen
2. Select a plan and complete checkout
3. Verify webhook events are received
4. Check that subscription is created in database
5. Test billing portal access
6. Test cuts usage tracking

## 5. Production Deployment

### Switch to Live Mode

1. Update Stripe secret key to live mode
2. Update webhook endpoint to production URL
3. Update plan catalog with live Stripe IDs
4. Test with real payment methods

### Monitoring

Monitor the following:
- Webhook delivery success rate in Stripe Dashboard
- Edge Function logs in Supabase Dashboard
- Database subscription records
- App deep link handling

## 6. Usage

### For Customers

1. **Select Plan**: Navigate to Plans screen and choose a subscription
2. **Complete Payment**: Use Stripe Checkout for secure payment
3. **Manage Subscription**: Access billing portal to update payment method, cancel, or upgrade
4. **Track Usage**: View remaining cuts and days until renewal

### For Developers

1. **Add New Plans**: Create in Stripe Dashboard and update plan_catalog
2. **Handle Webhooks**: Edge Functions automatically sync subscription state
3. **Track Usage**: Call `BillingService.addCutUsage()` when appointments complete
4. **Monitor**: Check Supabase logs and Stripe Dashboard for issues

## 7. Troubleshooting

### Common Issues

**Webhook not receiving events:**
- Check webhook URL is correct
- Verify webhook secret matches
- Check Supabase Edge Function logs

**Deep links not working:**
- Verify app.json configuration
- Test with `expo-linking` debug tools
- Check device-specific deep link handling

**Subscription not syncing:**
- Check webhook event types are selected
- Verify Edge Function deployment
- Check database RLS policies

**Cuts usage not tracking:**
- Verify appointment status is 'completed'
- Check user has active subscription
- Review Edge Function logs for errors

### Debug Commands

```bash
# Check Supabase Edge Function logs
supabase functions logs stripe-webhook

# Test webhook locally
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# Verify deep links
npx uri-scheme open barbercuts://billing/success --ios
npx uri-scheme open barbercuts://billing/success --android
```

## 8. Security Considerations

- Never expose Stripe secret keys in client code
- Use Supabase RLS policies to protect user data
- Validate webhook signatures in Edge Functions
- Implement rate limiting for API calls
- Monitor for suspicious activity

## 9. Cost Optimization

- Use Stripe test mode for development
- Implement webhook retry logic
- Cache subscription data appropriately
- Monitor Edge Function execution costs

## Support

For issues with:
- **Stripe**: Check [Stripe Documentation](https://stripe.com/docs)
- **Supabase**: Check [Supabase Documentation](https://supabase.com/docs)
- **Expo**: Check [Expo Documentation](https://docs.expo.dev)

## Files Created/Modified

- `setup-billing-schema.sql` - Database schema
- `supabase/functions/stripe-create-checkout/` - Checkout session creation
- `supabase/functions/stripe-create-portal/` - Billing portal access
- `supabase/functions/stripe-webhook/` - Webhook handling
- `supabase/functions/add-cut-usage/` - Usage tracking
- `src/services/billing.ts` - Client-side billing service
- `src/hooks/useSubscription.ts` - Subscription hook
- `src/screens/PlansScreen.tsx` - Plan selection UI
- `src/screens/ManageSubscriptionScreen.tsx` - Subscription management UI
- `src/lib/billingLinking.ts` - Deep link handling
- `src/services/AppointmentService.ts` - Updated with cuts tracking
- `app.json` - Updated with deep link routes

