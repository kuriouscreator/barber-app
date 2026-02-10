# Reset Database & Test Barber Onboarding

This guide will help you reset your database and test the barber onboarding flow from scratch.

## Step 1: Apply the Onboarding Migration

First, make sure the onboarding fields are added to your database:

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open the file: `supabase/migrations/20260209_add_barber_onboarding_fields.sql`
4. Copy the contents and paste into SQL Editor
5. Click **Run** to execute

**What this does:**
- Adds `onboarding_completed`, `onboarding_step`, `onboarding_completed_at` columns
- Adds shop info columns: `shop_name`, `shop_address`, `shop_city`, `shop_state`, `shop_zip`, `shop_phone`

## Step 2: Reset All Data (Clean Slate)

1. Open **Supabase Dashboard > SQL Editor**
2. Open the file: `reset-database.sql` (in your project root)
3. Copy and paste the entire script
4. Click **Run** to execute

**What this does:**
- Deletes all appointments, services, availability, subscriptions, rewards, profiles
- Keeps table structure intact
- Does NOT delete auth.users (you'll do that manually)

## Step 3: Delete All Users (Manual)

1. Go to **Supabase Dashboard > Authentication > Users**
2. Select all users
3. Click **Delete Users** button
4. Confirm deletion

**Why manual?** The `auth.users` table requires admin privileges to delete programmatically.

## Step 4: Create a New Test Account

### Option A: Sign Up in the App

1. Launch your app (it should show the Sign In screen)
2. Tap **Register** or **Sign Up**
3. Enter test credentials:
   - Email: `testbarber@example.com`
   - Password: `password123`
   - Name: `Test Barber`
4. Complete sign up

### Option B: Create User in Supabase Dashboard

1. Go to **Supabase Dashboard > Authentication > Add User**
2. Enter:
   - Email: `testbarber@example.com`
   - Password: `password123`
   - Auto Confirm: Yes
3. Click **Create User**

## Step 5: Convert User to Barber

After creating your test account:

1. Go to **Supabase Dashboard > Authentication > Users**
2. Click on your new user
3. Copy the **User ID** (UUID)
4. Go to **SQL Editor**
5. Open `create-test-barber.sql`
6. Replace `'YOUR_USER_ID'` with your actual UUID
7. Run the script

**What this does:**
- Sets `role = 'barber'`
- Sets `onboarding_completed = false`
- Sets `onboarding_step = 0`
- Clears all shop info fields

## Step 6: Test the Onboarding Flow

1. **Sign In** to the app with your test barber account
2. You should immediately see the **Business Info Screen** (Step 1)
3. Fill out:
   - Shop name (required): "Test Barbershop"
   - Other fields are optional
4. Tap **Continue**
5. You should see **Services Setup Screen** (Step 2)
6. Tap **Add Service** and create at least one service:
   - Name: "Haircut"
   - Duration: 30 minutes
   - Price: $25
7. Tap **Continue**
8. You should see **Schedule Setup Screen** (Step 3)
9. Toggle at least one day to "available"
10. Set hours (e.g., Mon-Fri 9:00 AM - 6:00 PM)
11. Tap **Finish Setup**
12. You should see the **Success Screen**
13. Tap **Get Started**
14. You should land on the **Barber Dashboard** (Home screen)

## Step 7: Verify Onboarding Completed

1. Go to **Supabase Dashboard > Table Editor > profiles**
2. Find your test barber user
3. Verify:
   - `onboarding_completed` = `true`
   - `onboarding_step` = `3`
   - `shop_name` = "Test Barbershop" (or whatever you entered)
   - `onboarding_completed_at` has a timestamp

## Step 8: Test Return User

1. **Sign out** of the app
2. **Sign in** again with the same barber credentials
3. You should go **directly to the Barber Dashboard**
4. You should **NOT** see the onboarding flow again

## Troubleshooting

### Issue: Onboarding doesn't show after sign in

**Check:**
1. Is `role = 'barber'` in profiles table?
2. Is `onboarding_completed = false` or `NULL`?
3. Did you restart the app after applying migrations?
4. Check console logs for errors

### Issue: Can't save business info

**Check:**
1. Did you run the migration to add the shop fields?
2. Check RLS policies on profiles table
3. Check console logs for database errors

### Issue: Services/Schedule not saving

**Check:**
1. Are `services` and `barber_availability` tables created?
2. Check RLS policies allow inserts for authenticated users
3. Verify `barber_id` foreign keys are correct

### Issue: Stuck on onboarding screen

**Solution:**
1. Check which step is failing (look at console logs)
2. Manually update `onboarding_completed = true` in profiles table
3. Sign out and back in

## Quick Reset for Another Test

To test again without full reset:

```sql
-- Just reset your test barber's onboarding status
UPDATE profiles
SET
    onboarding_completed = false,
    onboarding_step = 0,
    shop_name = NULL,
    shop_address = NULL,
    shop_city = NULL,
    shop_state = NULL,
    shop_zip = NULL,
    shop_phone = NULL
WHERE email = 'testbarber@example.com';

-- Delete their services and availability
DELETE FROM services WHERE barber_id = (SELECT id FROM profiles WHERE email = 'testbarber@example.com');
DELETE FROM barber_availability WHERE barber_id = (SELECT id FROM profiles WHERE email = 'testbarber@example.com');
```

Then sign in again to go through onboarding!

## Notes

- **Progress is saved** after each step, so you can close the app and resume
- **Back button works** to edit previous steps
- **Validation** prevents skipping required fields
- **Design matches** the reference image with progress dots and clean UI
