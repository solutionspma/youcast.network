# Supabase Setup Guide for YouCast Network

This guide will walk you through setting up Supabase for the YouCast platform, including authentication, database schema, and admin configuration.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Access to your project's environment variables

## Step 1: Create a Supabase Project

1. Log in to [Supabase](https://supabase.com)
2. Click "New Project"
3. Enter project details:
   - **Name**: `youcast-network`
   - **Database Password**: (generate a strong password and save it securely)
   - **Region**: Choose the closest to your users
4. Wait for the project to be created (1-2 minutes)

## Step 2: Configure Environment Variables

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

4. Create `.env.local` in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://youcast.network
NEXT_PUBLIC_APP_NAME=Youcast
NEXT_PUBLIC_APP_ENV=production

# Feature Flags
NEXT_PUBLIC_FF_STREAMING=true
NEXT_PUBLIC_FF_MONETIZATION=false
NEXT_PUBLIC_FF_WHITELABEL=false
NEXT_PUBLIC_FF_API_ACCESS=false

# Media / Storage
MEDIA_STORAGE_PROVIDER=supabase
MEDIA_CDN_URL=
MEDIA_MAX_UPLOAD_SIZE_MB=500
```

## Step 3: Configure Authentication

### Enable Email Confirmation

1. Go to **Authentication** → **Settings** in Supabase
2. Under **Email Auth**:
   - ✅ Enable **Confirm email**
   - Set **Site URL**: `https://youcast.network`
   - Add **Redirect URLs**: 
     - `https://youcast.network/auth/callback`
     - `http://localhost:3000/auth/callback` (for development)

### Customize Email Templates

1. Go to **Authentication** → **Email Templates**
2. Customize the following templates:
   - **Confirm signup**: Welcome message + email confirmation
   - **Magic Link**: For passwordless login (optional)
   - **Change Email Address**: Confirmation for email changes
   - **Reset Password**: Password reset instructions

### Configure OAuth Providers (Optional)

1. Go to **Authentication** → **Providers**
2. Enable **Google**:
   - Get credentials from [Google Cloud Console](https://console.cloud.google.com)
   - Add authorized redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`
3. Enable **Apple** (follow similar process)

## Step 4: Create Database Schema

### User Profiles Table

Run this SQL in **Supabase SQL Editor**:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'creator' CHECK (role IN ('creator', 'admin', 'moderator')),
  bio TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'role'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Media/Content Tables

```sql
-- Create media table for videos, podcasts, etc.
CREATE TABLE media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('video', 'audio', 'live')),
  thumbnail_url TEXT,
  media_url TEXT,
  duration INTEGER, -- in seconds
  views INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Anyone can view published media
CREATE POLICY "Published media is viewable by everyone" 
ON media FOR SELECT 
USING (published_at IS NOT NULL);

-- Creators can CRUD their own media
CREATE POLICY "Creators can manage own media" 
ON media FOR ALL 
USING (auth.uid() = creator_id);

-- Create media views table
CREATE TABLE media_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Admin Tables

```sql
-- Create admin_actions table for audit logging
CREATE TABLE admin_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id),
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin actions
CREATE POLICY "Only admins can view admin actions"
ON admin_actions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

## Step 5: Set Up Master Admin Account

### Option A: Via SQL (Recommended)

1. First, sign up normally through the app with `solutions@pitchmarketing.agency`
2. Then run this SQL to upgrade to admin:

```sql
-- Update user role to admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'solutions@pitchmarketing.agency';

-- Verify it worked
SELECT id, email, role FROM profiles 
WHERE email = 'solutions@pitchmarketing.agency';
```

### Option B: Manual via Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Find the user with email `solutions@pitchmarketing.agency`
3. Click to edit
4. In **User Metadata**, add:
   ```json
   {
     "role": "admin"
   }
   ```

## Step 6: Configure Storage for Media

1. Go to **Storage** in Supabase dashboard
2. Create buckets:
   - **avatars** (for profile pictures)
     - Public bucket
     - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
     - Max file size: 2MB
   
   - **media** (for videos, audio)
     - Public bucket
     - Allowed MIME types: `video/*`, `audio/*`
     - Max file size: 500MB
   
   - **thumbnails** (for video thumbnails)
     - Public bucket
     - Allowed MIME types: `image/*`
     - Max file size: 5MB

3. Set up storage policies:

```sql
-- Avatars: Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Media: Creators can upload to their folder
CREATE POLICY "Creators can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Public read access to all buckets
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id IN ('avatars', 'media', 'thumbnails'));
```

## Step 7: Test the Integration

### Test Email Confirmation Flow

1. Go to https://youcast.network/auth/signup
2. Create a test account
3. Check your email for confirmation
4. Click the link → should redirect to `/auth/callback` → then `/dashboard`

### Test Master Admin Access

1. Sign in with `solutions@pitchmarketing.agency`
2. Navigate to `/dashboard/admin`
3. Verify you see the admin control panel

### Test User Management

1. In Supabase dashboard → **Authentication** → **Users**
2. You should see all registered users
3. Test creating/updating/deleting users

## Step 8: Production Checklist

Before going live:

- [ ] Email confirmation is enabled
- [ ] Site URL and redirect URLs are correct
- [ ] RLS policies are enabled on all tables
- [ ] Master admin account is configured
- [ ] Storage buckets are created with proper policies
- [ ] `.env.local` is in `.gitignore` (never commit secrets!)
- [ ] Service role key is stored securely (use Netlify environment variables)
- [ ] Test signup, login, and email confirmation flows
- [ ] Test admin panel access and permissions

## Troubleshooting

### Email Confirmation Not Working

1. Check **Authentication** → **Settings** → **Email Auth**
2. Ensure "Confirm email" is checked
3. Verify redirect URLs include your auth callback
4. Check spam folder for confirmation emails

### User Not Appearing in Dashboard

1. Check the `handle_new_user()` trigger is created
2. Verify the trigger is firing: Check **Database** → **Functions** logs
3. Manually create profile if needed:
   ```sql
   INSERT INTO profiles (id, email, display_name, role)
   SELECT id, email, raw_user_meta_data->>'display_name', 'creator'
   FROM auth.users
   WHERE email = 'user@example.com';
   ```

### Admin Access Not Working

1. Verify role in profiles table:
   ```sql
   SELECT email, role FROM profiles WHERE email = 'solutions@pitchmarketing.agency';
   ```
2. If role is not 'admin', update it:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'solutions@pitchmarketing.agency';
   ```

## Next Steps

- Set up email sending via custom SMTP (optional)
- Configure custom domain for auth emails
- Set up realtime subscriptions for live features
- Implement media transcoding pipeline
- Add Stripe integration for monetization

## Support

For Supabase-specific questions: https://supabase.com/docs
For platform issues: Contact solutions@pitchmarketing.agency
