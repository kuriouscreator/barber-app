# Security Setup Guide

## 🔐 Environment Variables Setup

### Step 1: Create Your .env File

Create a `.env` file in the root directory of your project:

```bash
touch .env
```

### Step 2: Add Your Supabase Credentials

Open the `.env` file and add your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### Step 3: Get Your Supabase Credentials

1. **Go to [supabase.com](https://supabase.com)**
2. **Sign in to your account**
3. **Create a new project** (if you haven't already)
4. **Navigate to Settings > API**
5. **Copy the following values:**
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Step 4: Verify Your Setup

Run this command to check if your environment variables are loaded:

```bash
npx expo start
```

The app should now connect to your Supabase project.

## 🛡️ Security Best Practices

### ✅ What's Already Protected

- `.env` files are ignored by git (won't be committed)
- All sensitive file extensions are ignored
- API keys are properly prefixed with `EXPO_PUBLIC_`

### 🔒 Security Notes

1. **The anon key is safe for client-side use** - it's designed to be public
2. **Never commit your `.env` file** - it's already in `.gitignore`
3. **Use environment-specific configurations** for production
4. **Rotate your keys regularly** in production

### 🚨 What NOT to Do

- ❌ Don't put service role keys in client-side code
- ❌ Don't commit `.env` files to git
- ❌ Don't hardcode API keys in your source code
- ❌ Don't share your `.env` file with others

## 🔍 Verification Commands

### Check if .env is ignored:
```bash
git status
# Should NOT show .env in the output
```

### Check for sensitive files:
```bash
find . -name "*.env*" -o -name "*.key" -o -name "*.pem" -o -name "*.p12"
# Should only show env.example (if any)
```

### Verify gitignore is working:
```bash
git check-ignore .env
# Should return: .env
```

## 🚀 Next Steps

1. **Create your Supabase project**
2. **Add credentials to `.env` file**
3. **Test the authentication flow**
4. **Set up OAuth providers** (optional)
5. **Configure storage buckets**

## 📞 Need Help?

If you encounter any issues:
1. Check the `SUPABASE_SETUP.md` file for detailed setup instructions
2. Verify your Supabase project is active
3. Ensure your environment variables are correctly formatted
4. Check the Expo logs for any connection errors
