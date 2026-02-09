# Email Confirmation Redirect Fix

## Issue
Email confirmations are redirecting to localhost instead of your production domain.

## Solution

### 1. Update Supabase Auth Configuration

Go to your Supabase Dashboard:
1. Navigate to **Authentication** → **URL Configuration**
2. Update the following settings:

**Site URL:**
```
https://youcast.network
```

**Redirect URLs (Add all of these):**
```
https://youcast.network/auth/callback
https://youcast.network/dashboard
https://youcast.network/**
```

### 2. Update Email Templates (Optional)

In **Authentication** → **Email Templates**, you can customize:
- Confirm signup email
- Magic link email  
- Reset password email

Make sure all links use `{{ .SiteURL }}` or `{{ .ConfirmationURL }}` which will automatically use your configured Site URL.

### 3. Environment Variables

Make sure your production environment has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ysuueuhnqvpmvixeyban.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The code already uses `window.location.origin` for redirects, so it will automatically work in production once the Supabase dashboard is configured.

## Testing

1. Update the Supabase dashboard settings above
2. Try signing up with a new email
3. Check that the confirmation email links to `https://youcast.network` not `localhost`

## Notes

- Changes to URL configuration are instant
- Existing pending confirmations will still use old URLs
- New signups will use the updated configuration
