# Notifications Feature Setup Guide

## ⚠️ Database Migration Required

Before the Notifications feature will work, you need to add three columns to your `profiles` table in Supabase.

### Error Messages You'll See Without Migration:

- "Error fetching notification preferences: column profiles.notify_push does not exist"
- "Error updating notification preferences: Could not find the 'notify_email' column"
- "Database migration required. Please run the SQL file..."

---

## Step-by-Step Setup

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Migration SQL

Copy and paste the following SQL into the editor:

```sql
-- Add notification preference columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notify_push BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_email BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_sms BOOLEAN DEFAULT false;

COMMENT ON COLUMN profiles.notify_push IS 'Whether user wants push notifications';
COMMENT ON COLUMN profiles.notify_email IS 'Whether user wants email notifications';
COMMENT ON COLUMN profiles.notify_sms IS 'Whether user wants SMS notifications';
```

### Step 3: Execute the Query

1. Click **Run** (or press Cmd+Enter / Ctrl+Enter)
2. You should see: "Success. No rows returned"

### Step 4: Verify Migration

Run this query to confirm the columns were added:

```sql
SELECT
  id,
  full_name,
  notify_push,
  notify_email,
  notify_sms
FROM profiles
LIMIT 5;
```

**Expected Result**: You should see the three new columns with default values:
- `notify_push`: `true`
- `notify_email`: `true`
- `notify_sms`: `false`

### Step 5: Test in the App

1. Reload your app (shake device → Reload, or `r` in terminal)
2. Navigate to **Profile → Account Settings → Notifications**
3. The sheet should open without errors
4. Toggle switches should work
5. Save button should persist changes

---

## Troubleshooting

### Issue: "column profiles.notify_push does not exist"

**Solution**: You haven't run the migration yet. Follow Steps 1-3 above.

### Issue: "Failed to update preferences"

**Possible causes**:
1. Migration not run → Follow setup steps
2. Database connection issue → Check Supabase status
3. Row Level Security (RLS) policy → Verify user can update their own profile

**To check RLS policies**:
```sql
-- See existing policies on profiles table
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

**To add update policy if missing**:
```sql
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### Issue: Toggles are disabled/grayed out

**SMS Toggle**:
- Requires phone number in profile
- Add phone in Personal Information first

**Email Toggle**:
- Requires email address (should always have one)

### Issue: Changes don't persist after reloading

1. Check browser console for API errors
2. Verify the SQL migration ran successfully
3. Check if there's a caching issue (clear app data)

---

## Default Values

After running the migration, all existing users will have:

| Preference | Default Value | Reason |
|------------|---------------|--------|
| Push Notifications | ✅ ON | Most users want appointment reminders |
| Email Notifications | ✅ ON | Important for receipts and confirmations |
| SMS Notifications | ❌ OFF | Opt-in only (requires phone number) |

Users can change these in: **Profile → Account Settings → Notifications**

---

## File Reference

The migration SQL is also available in:
- `add-notification-preferences.sql` (in project root)

The implementation files:
- Service: `src/services/profileService.ts`
- Component: `src/components/NotificationsForm.tsx`
- Screen: `src/screens/ProfileScreen.tsx`

---

## Questions?

If you encounter issues not covered here:
1. Check the Expo/React Native console for detailed error messages
2. Verify your Supabase project is accessible
3. Ensure you're using the correct project URL and keys in `.env`
