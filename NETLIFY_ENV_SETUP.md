# Netlify Environment Variables Setup

**CRITICAL**: These environment variables MUST be configured in Netlify dashboard for production to work.

## Steps:
1. Go to https://app.netlify.com
2. Select your `youcast.network` site
3. Go to: **Site configuration → Environment variables**
4. Add each variable below:

---

## Required Environment Variables

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://ysuueuhnqvpmvixeyban.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzdXVldWhucXZwbXZpeGV5YmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NTI5MTIsImV4cCI6MjA4NjEyODkxMn0.5j9yVEBzhWlZVhNzYtpDPfoNI5S_JWS7a8OnLJO9BFg
```

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzdXVldWhucXZwbXZpeGV5YmFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDU1MjkxMiwiZXhwIjoyMDg2MTI4OTEyfQ.vZoiu9c5Gh-gx4eD3irM9QOxDZRslSb1gspA40vd43A
```

### App Configuration
```
NEXT_PUBLIC_APP_URL=https://youcast.network
```

```
NEXT_PUBLIC_APP_NAME=Youcast
```

```
NEXT_PUBLIC_APP_ENV=production
```

### Feature Flags
```
NEXT_PUBLIC_FF_STREAMING=true
```

```
NEXT_PUBLIC_FF_MONETIZATION=true
```

```
NEXT_PUBLIC_FF_WHITELABEL=false
```

```
NEXT_PUBLIC_FF_API_ACCESS=false
```

### LiveKit Configuration
```
NEXT_PUBLIC_LIVEKIT_URL=wss://youcast-yxcegry8.livekit.cloud
```

```
NEXT_PUBLIC_LIVEKIT_API_KEY=APIedBLG3LQXyqy
```

```
LIVEKIT_API_SECRET=iahcFTlYoF2fecvzqlJGNW4cMWa2eeBRmPMKyyNwNTSB
```

### Media / Storage
```
MEDIA_STORAGE_PROVIDER=supabase
```

```
MEDIA_CDN_URL=
```

### Stream Studio Production Mode
```
NEXT_PUBLIC_USE_REAL_DATA=true
```

---

## After Adding Variables:
1. Click **"Save"** on each variable
2. Go to **Deploys** tab
3. Click **"Trigger deploy"** → **"Clear cache and deploy site"**
4. Wait for deploy to finish (2-3 minutes)
5. Test your site at https://youcast.network

---

## Verification:
After deploy completes, open browser console on https://youcast.network and check:
- No "missing API key" errors
- Supabase queries work
- Stream studio loads correctly
