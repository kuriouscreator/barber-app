# Quick Start: Rewards System

## 🚀 3-Step Setup (5 minutes)

### Step 1: Run Migration (2 min)

1. Open https://app.supabase.com → Your Project
2. Click **SQL Editor** (left sidebar)
3. Click **New query**
4. Open `supabase/migrations/create_rewards_system.sql` on your computer
5. Copy ALL the SQL (Cmd+A, Cmd+C)
6. Paste into SQL Editor
7. Click **Run** (or Cmd+Enter)

✅ You should see: "Success. No rows returned"

### Step 2: Verify Tables (1 min)

1. Click **Table Editor** (left sidebar)
2. Look for these 5 new tables:
   - ✅ `reward_points`
   - ✅ `rewards_catalog`
   - ✅ `reward_redemptions`
   - ✅ `referrals`
   - ✅ `user_referral_codes`

3. Click `rewards_catalog` → Should have **6 rewards**

### Step 3: Test in App (2 min)

1. Open your app
2. Sign in (or create new account)
3. Tap **Rewards** tab (gift icon)
4. You should see:
   - ✅ Points balance (100 if new user)
   - ✅ Your referral code
   - ✅ Rewards catalog button

## ✨ That's it!

The rewards system is now active. Points will automatically be awarded when:
- Users sign up (100 points)
- Monthly subscription renews (100-300 points)
- Referrals complete (500 points)
- Anniversary milestones (750-2000 points)

## 🎯 Quick Test

Test the full flow:

1. **Get Points**: Check your balance in Rewards tab
2. **View Catalog**: Tap "Rewards Catalog"
3. **Browse Rewards**: See all available rewards
4. **Share Code**: Tap "Share Code" to invite friends
5. **Redeem** (if enough points): Select a reward and redeem

## 📚 More Info

- Full setup guide: [REWARDS_SYSTEM_SETUP.md](./REWARDS_SYSTEM_SETUP.md)
- Migration help: [MIGRATION_INSTRUCTIONS.md](./MIGRATION_INSTRUCTIONS.md)
- Troubleshooting: See setup guide section

## 🆘 Issues?

**Tables not showing up?**
→ Check SQL Editor for error messages

**No seed data in rewards_catalog?**
→ Run just the INSERT statements from migration file

**App crashing?**
→ Check that all 5 tables exist with correct columns

**Points not showing?**
→ Check Stripe webhook logs for errors
