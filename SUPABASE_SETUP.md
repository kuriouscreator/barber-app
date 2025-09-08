# Supabase Setup Instructions

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Project Setup

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key from Settings > API

### 2. Configure Authentication
1. Go to Authentication > Settings
2. Add your redirect URL: `barbercuts://auth/callback`
3. Enable email/password authentication
4. Configure OAuth providers (Google, Apple) if needed

### 3. Create Storage Bucket
1. Go to Storage
2. Create a new bucket called `avatars`
3. Set it to public if you want public access to avatars

### 4. Set up Row Level Security (RLS)
Run these SQL commands in the SQL Editor:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Public read policy for avatars
CREATE POLICY "Public read avatars" ON storage.objects
FOR SELECT USING ( bucket_id = 'avatars' );

-- Users can write to their own avatar folder
CREATE POLICY "Users can write own avatars" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own avatars
CREATE POLICY "Users can update own avatars" ON storage.objects
FOR UPDATE TO authenticated USING (
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### 5. OAuth Configuration

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - `https://your-project-id.supabase.co/auth/v1/callback`
4. Add the client ID and secret to Supabase Auth settings

#### Apple OAuth
1. Go to [Apple Developer Console](https://developer.apple.com)
2. Create a Services ID
3. Configure the redirect URL
4. Add the client ID and secret to Supabase Auth settings

## Testing

1. Start the app: `npm start`
2. Try signing up with email/password
3. Test magic link authentication
4. Test OAuth providers (if configured)
5. Test avatar upload in the Profile screen

## Features Implemented

- ✅ Email/password authentication
- ✅ Magic link authentication
- ✅ Google OAuth (requires configuration)
- ✅ Apple OAuth (requires configuration)
- ✅ Session persistence
- ✅ Avatar upload to Supabase Storage
- ✅ Navigation guard (shows SignIn if not authenticated)
- ✅ Deep linking support for OAuth callbacks
