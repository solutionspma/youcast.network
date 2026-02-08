# Supabase Redirect URL Configuration

## Issue
Email verification links redirect to `http://localhost:3000` instead of production URL `https://youcast.network`

## Fix

### Step 1: Configure Site URL in Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **ysuueuhnqvpmvixeyban**
3. Navigate to **Authentication** → **URL Configuration**
4. Update the following settings:

#### Site URL
```
https://youcast.network
```

#### Redirect URLs (Add all of these)
```
https://youcast.network
https://youcast.network/auth/callback
https://youcast.network/auth/confirm
https://youcast.network/dashboard
http://localhost:3000 (keep for local development)
http://localhost:3000/auth/callback
```

### Step 2: Email Template Variables

The email templates automatically use the **Site URL** you configured above.

No changes needed to templates - they'll now redirect to production.

### Step 3: Test Email Verification

1. Sign up with a new test account on https://youcast.network
2. Check email for verification link
3. Click link → Should redirect to https://youcast.network (not localhost)

---

## Current Configuration

Your Supabase project is configured with:
- **Project URL**: https://ysuueuhnqvpmvixeyban.supabase.co
- **Anon Key**: (already set in Netlify env vars)
- **Service Role Key**: (already set in Netlify env vars)

Site URL needs to be updated from `localhost:3000` to `youcast.network`

---

## How to Update (Quick)

```bash
# Open Supabase dashboard
open https://supabase.com/dashboard/project/ysuueuhnqvpmvixeyban/auth/url-configuration

# Or use SQL to check current settings
```

```sql
-- Check current auth configuration
SELECT * FROM auth.config;
```

---

## Alternative: Use Environment Variable

If you want dynamic redirects based on environment, update your auth code:

```typescript
// src/lib/supabase/client.ts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce',
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  }
);
```

But this is already handled by your current setup - you just need to update the Site URL in Supabase dashboard.

---

## Verification

After making the change:
1. The change takes effect immediately
2. All new email verification links will use the production URL
3. Old links in already-sent emails will still use the old URL (users need new verification emails)

To resend verification:
```typescript
const { error } = await supabase.auth.resend({
  type: 'signup',
  email: 'user@example.com',
});
```
