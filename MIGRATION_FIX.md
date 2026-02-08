# Migration Fix Applied ✅

## What Was Fixed

The migration was referencing `p.name` in the view, but your `profiles` table uses `full_name` instead.

**Fixed:** Line 205 in `create_rewards_system.sql`
- ❌ Was: `p.name`
- ✅ Now: `p.full_name`

## Run Migration Again

Now that the fix is applied, run the migration again:

### Steps:

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Copy & Paste**
   - Open `supabase/migrations/create_rewards_system.sql`
   - Copy ALL contents (Cmd+A, Cmd+C)
   - Paste into SQL Editor

4. **Run**
   - Click "Run" (or Cmd+Enter)
   - Should see: "Success. No rows returned"

5. **Verify**
   - Go to "Table Editor"
   - Check for these 5 new tables:
     - ✅ reward_points
     - ✅ rewards_catalog
     - ✅ reward_redemptions
     - ✅ referrals
     - ✅ user_referral_codes

## What the Migration Does

1. **Creates Tables**
   - reward_points (ledger)
   - rewards_catalog (available rewards)
   - reward_redemptions (user redemptions)
   - referrals (track referrals)
   - user_referral_codes (unique codes)

2. **Adds to profiles table**
   - `total_points` column
   - `subscription_start_date` column
   - `last_anniversary_reward` column

3. **Creates Functions**
   - `get_user_points_balance()` - Calculate current balance
   - `generate_referral_code()` - Generate unique 8-char codes

4. **Creates Trigger**
   - Auto-generates referral code when new user signs up

5. **Adds Security**
   - RLS policies on all tables
   - Users can only see their own data

6. **Seeds Data**
   - 6 initial rewards in catalog

## Expected Result

After running, you should have:
- ✅ 5 new tables
- ✅ 3 new columns in profiles table
- ✅ 2 new functions
- ✅ 1 new trigger
- ✅ 6 rewards in catalog

## Test It Works

After migration:

1. Open your app
2. Go to Rewards tab
3. Should see:
   - Points balance (100 if new user)
   - Your referral code
   - Rewards catalog button

## Still Getting Errors?

If you see other errors, share them and I'll fix those too!

Common issues:
- "column already exists" → OK, skip those lines
- "table already exists" → OK, migration is idempotent
- "permission denied" → Use service role key in SQL Editor

## Quick Verification SQL

Run this to verify everything worked:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND (table_name LIKE 'reward%' OR table_name LIKE '%referral%')
ORDER BY table_name;

-- Check columns added to profiles
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('total_points', 'subscription_start_date', 'last_anniversary_reward');

-- Check rewards catalog has data
SELECT COUNT(*) as reward_count FROM rewards_catalog;
-- Should return: 6
```
