# Rewards System Migration Instructions

The automated migration script requires a function that isn't available by default. Here's the **easiest way** to run the migration:

## Option 1: Supabase Dashboard (Recommended)

This is the simplest and most reliable method:

1. **Open your Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy the migration SQL**
   - Open the file: `supabase/migrations/create_rewards_system.sql`
   - Copy the entire contents (Cmd+A, Cmd+C)

4. **Paste and Run**
   - Paste into the SQL Editor
   - Click "Run" (or Cmd+Enter)

5. **Verify Success**
   - You should see "Success. No rows returned"
   - Check the "Table Editor" sidebar - you should see these new tables:
     - `reward_points`
     - `rewards_catalog`
     - `reward_redemptions`
     - `referrals`
     - `user_referral_codes`

6. **Verify Seed Data**
   - Click on `rewards_catalog` table
   - You should see 6 rewards (Beard Trim, Hot Towel, Priority Booking, etc.)

## Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
# Make the script executable
chmod +x setup-rewards.sh

# Run it
./setup-rewards.sh
```

Or manually:

```bash
# Apply migration
supabase db push

# Or apply a specific migration
supabase migration up
```

## Option 3: psql Command Line

If you have PostgreSQL client tools:

```bash
# Get your database connection string from Supabase Dashboard
# Settings → Database → Connection string (URI)

psql "your-connection-string" -f supabase/migrations/create_rewards_system.sql
```

## Verification Checklist

After running the migration, verify:

- [ ] All 5 tables exist (reward_points, rewards_catalog, reward_redemptions, referrals, user_referral_codes)
- [ ] rewards_catalog has 6 seed rewards
- [ ] Functions exist: `get_user_points_balance`, `generate_referral_code`
- [ ] Trigger exists: `on_user_created_create_referral_code`
- [ ] RLS policies are enabled on all tables

## Quick SQL Verification

Run this in SQL Editor to verify everything:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'reward%' OR table_name LIKE '%referral%'
ORDER BY table_name;

-- Check rewards catalog has data
SELECT name, points_cost, category
FROM rewards_catalog
ORDER BY points_cost;

-- Check functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%reward%' OR routine_name LIKE '%referral%';
```

## Troubleshooting

### "Table already exists" errors
This is fine - it means tables were already created. The migration is idempotent.

### "Permission denied" errors
Make sure you're using the service role key, not the anon key.

### "Syntax error" messages
Check that you copied the entire SQL file without truncation.

### Tables created but no seed data
Run just the INSERT statements from the migration file:

```sql
INSERT INTO rewards_catalog (name, description, points_cost, category, is_active, terms) VALUES
  ('Free Beard Trim', 'Complimentary beard trim or lineup on your next visit', 1500, 'service', true, 'Valid for 90 days. Must be redeemed during appointment booking.'),
  ('Hot Towel Treatment', 'Premium hot towel service add-on', 1000, 'service', true, 'Can be added to any haircut service. Valid for 90 days.'),
  ('Priority Booking', 'Skip the waitlist for your next appointment', 2000, 'flexibility', true, 'One-time use. Book during peak hours without waiting.'),
  ('Guest Pass', 'Bring a friend for 50% off their cut', 2500, 'flexibility', true, 'Friend must be a new customer. Valid for 90 days.'),
  ('Scalp Massage', 'Relaxing scalp massage during your service', 800, 'service', true, 'Added to any haircut appointment.'),
  ('VIP Appointment', 'Extended time slot with premium setup', 3000, 'experiential', true, 'Includes extended service time and complimentary beverages.')
ON CONFLICT DO NOTHING;
```

## Next Steps

Once migration is complete:

1. Test the Rewards tab in your app
2. Verify points balance shows up
3. Check referral code generation
4. Test browsing the rewards catalog
5. Monitor Stripe webhook logs for automatic points awarding

## Need Help?

If you're still having issues:
1. Check Supabase Dashboard → Database → Tables
2. Look for any error messages in SQL Editor
3. Verify your connection string and credentials
4. Try running smaller sections of the SQL file one at a time
