# LiveKit Setup Guide for YOUCAST.NETWORK

## What is LiveKit?

LiveKit is an open-source WebRTC SFU (Selective Forwarding Unit) that handles real-time video/audio streaming at scale. It's the recommended solution for YOUCAST's production streaming infrastructure.

---

## Why LiveKit?

✅ **Open Source** - No vendor lock-in, full control  
✅ **Scalable** - Handles thousands of simultaneous viewers  
✅ **Low Latency** - WebRTC sub-second latency  
✅ **Multi-Platform** - Web, iOS, Android, Desktop  
✅ **Adaptive Bitrate** - Automatic quality adjustment  
✅ **Simulcast** - Multiple quality streams  
✅ **Recording** - Built-in cloud recording  

---

## Installation Options

### Option A: LiveKit Cloud (Recommended for Production)

**Pros**: Fully managed, automatic scaling, global edge network  
**Cons**: Paid service after free tier  

1. **Sign up**: https://cloud.livekit.io/
2. **Create a project**
3. **Copy credentials**:
   - WebSocket URL: `wss://your-project.livekit.cloud`
   - API Key: `APIxxxxxxxx`
   - API Secret: `your-secret-key`

4. **Add to `.env.local`**:
```bash
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
NEXT_PUBLIC_LIVEKIT_API_KEY=APIxxxxxxxx
LIVEKIT_API_SECRET=your-secret-key
```

**Pricing**: Free tier includes 50GB egress/month, then pay-as-you-go

---

### Option B: Self-Hosted LiveKit (Free, More Control)

**Pros**: Free, complete control, no usage limits  
**Cons**: Requires server management, DevOps knowledge  

#### Prerequisites
- Linux server (Ubuntu 20.04+ recommended)
- Docker & Docker Compose
- Public IP address
- Domain name (for HTTPS/WSS)
- Port 7880 open for WebRTC

#### Installation Steps

**1. Install Docker**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**2. Create LiveKit configuration**
```bash
mkdir -p ~/livekit
cd ~/livekit
nano livekit.yaml
```

**3. Add configuration** (`livekit.yaml`):
```yaml
port: 7880
bind_addresses:
  - "0.0.0.0"

rtc:
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true
  
redis:
  address: "redis:6379"

keys:
  APIxxxxxxxx: your-secret-key-here

logging:
  level: info
```

**4. Create Docker Compose** (`docker-compose.yml`):
```yaml
version: '3.9'

services:
  livekit:
    image: livekit/livekit-server:latest
    command: --config /etc/livekit.yaml
    restart: unless-stopped
    network_mode: "host"
    volumes:
      - ./livekit.yaml:/etc/livekit.yaml
    environment:
      - LIVEKIT_CONFIG=/etc/livekit.yaml

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
```

**5. Start LiveKit**
```bash
docker-compose up -d
```

**6. Verify it's running**
```bash
curl http://localhost:7880/
# Should return LiveKit server info
```

**7. Set up reverse proxy (Nginx)**

LiveKit requires WebSocket over TLS (wss://) in production.

```nginx
server {
    listen 443 ssl http2;
    server_name livekit.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/livekit.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/livekit.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:7880;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**8. Get SSL certificate**
```bash
sudo certbot --nginx -d livekit.yourdomain.com
```

**9. Update `.env.local`**
```bash
NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.yourdomain.com
NEXT_PUBLIC_LIVEKIT_API_KEY=APIxxxxxxxx
LIVEKIT_API_SECRET=your-secret-key-here
```

---

## Supabase Edge Function for Token Generation

Create a Supabase Edge Function to securely generate LiveKit tokens:

**File**: `supabase/functions/generate-livekit-token/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { AccessToken } from 'https://esm.sh/livekit-server-sdk@1.2.7';

serve(async (req) => {
  const { roomName, participantName, isPublisher } = await req.json();

  const apiKey = Deno.env.get('LIVEKIT_API_KEY');
  const apiSecret = Deno.env.get('LIVEKIT_API_SECRET');

  if (!apiKey || !apiSecret) {
    return new Response(
      JSON.stringify({ error: 'LiveKit credentials not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: isPublisher,
    canSubscribe: true,
  });

  return new Response(
    JSON.stringify({ token: token.toJwt() }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

**Deploy the function**:
```bash
supabase functions deploy generate-livekit-token
```

**Set environment variables**:
```bash
supabase secrets set LIVEKIT_API_KEY=APIxxxxxxxx
supabase secrets set LIVEKIT_API_SECRET=your-secret-key
```

---

## Integration with YOUCAST

The integration is already built into the codebase:

### 1. **Broadcaster Flow** (Stream Studio)

```typescript
// src/hooks/useStream.ts
import { createLiveKitClient, generateLiveKitToken } from '@/lib/livekit/client';

const client = createLiveKitClient();

// Generate token for broadcaster
const token = await generateLiveKitToken(roomName, userName, true);

// Connect to room
await client.connect(token);

// Publish composite stream
await client.publishCompositeStream(videoTrack, audioTrack);
```

### 2. **Viewer Flow** (Watch Page)

```typescript
// src/app/watch/[streamId]/page.tsx
const token = await generateLiveKitToken(roomName, viewerId, false);
await client.connect(token);

// Subscribe to broadcaster's tracks
await client.subscribeToTracks((track, participant) => {
  if (videoRef.current) {
    videoRef.current.srcObject = new MediaStream([track.mediaStreamTrack]);
  }
});
```

---

## Testing LiveKit Integration

### 1. **Local Testing** (Development)

```bash
# Start LiveKit locally
docker run --rm -it \
  -e LIVEKIT_KEYS="devkey: devsecret" \
  -p 7880:7880 \
  -p 50000-50100:50000-50100/udp \
  livekit/livekit-server
```

Update `.env.local`:
```bash
NEXT_PUBLIC_LIVEKIT_URL=ws://localhost:7880
NEXT_PUBLIC_LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=devsecret
```

### 2. **Test Stream**

1. Navigate to `/dashboard/stream`
2. Select camera/microphone
3. Click "Start Preview"
4. Click "Go Live" → LiveKit connection starts
5. Open `/watch/[stream-id]` in another browser → Should see the stream

### 3. **Monitor LiveKit**

View active rooms and participants:
```bash
# Self-hosted
curl http://localhost:7880/rooms

# Cloud
# Use LiveKit Cloud dashboard
```

---

## NPM Dependencies

Install LiveKit client SDK:

```bash
npm install livekit-client
```

---

## Production Considerations

### 1. **Scaling**

- **Cloud**: Automatic scaling included
- **Self-hosted**: Use LiveKit's clustering mode for 1000+ viewers

### 2. **TURN Servers**

For viewers behind strict firewalls, add TURN servers:

```yaml
# livekit.yaml
rtc:
  turn_servers:
    - host: turn.yourdomain.com
      port: 3478
      protocol: udp
      username: youcast
      credential: your-secret
```

Or use Twilio TURN:
```yaml
turn_servers:
  - urls: ["turn:global.turn.twilio.com:3478?transport=udp"]
    username: abc123
    credential: xyz789
```

### 3. **Recording**

Enable cloud recording:

```typescript
// When going live
const roomOptions = {
  recordingOptions: {
    enabled: true,
    output: 's3://your-bucket/recordings/',
  },
};
```

### 4. **Monitoring**

Set up Prometheus/Grafana:
```yaml
# livekit.yaml
prometheus:
  enabled: true
  port: 6789
```

---

## Troubleshooting

### Issue: "Connection failed"
- Check firewall rules (ports 7880, 50000-60000)
- Verify WebSocket URL is correct (ws:// for local, wss:// for production)
- Ensure API key/secret match

### Issue: "No video/audio"
- Check browser permissions (camera/microphone)
- Verify tracks are publishing: `room.localParticipant.tracks`
- Check codec support (Chrome/Firefox prefer VP8/VP9)

### Issue: "High latency"
- Enable adaptive streaming: `adaptiveStream: true`
- Use LiveKit edges close to viewers
- Check network quality in console

---

## Cost Estimation

### LiveKit Cloud Pricing

| Viewers | Egress/Month | Cost |
|---------|--------------|------|
| 100 avg | 500 GB | Free |
| 500 avg | 2.5 TB | ~$50 |
| 5,000 avg | 25 TB | ~$500 |
| 50,000 avg | 250 TB | ~$5,000 |

*1080p @ 5 Mbps = ~2.25 GB/hour per viewer*

### Self-Hosted Costs

| Component | Monthly Cost |
|-----------|--------------|
| VPS (8GB RAM) | $40 |
| Bandwidth (10TB) | $100 |
| TURN server | $20 |
| **Total** | **$160** |

---

## Next Steps

After setting up LiveKit:

1. ✅ Generate tokens via Supabase Edge Function
2. ✅ Test broadcaster publishing tracks
3. ✅ Test viewer receiving tracks
4. ✅ Enable recording (optional)
5. ✅ Set up monitoring (Grafana)
6. ✅ Configure TURN servers for production
7. ✅ Load test with multiple viewers

---

## Resources

- **LiveKit Docs**: https://docs.livekit.io/
- **LiveKit Cloud**: https://cloud.livekit.io/
- **GitHub**: https://github.com/livekit/livekit
- **Discord**: https://livekit.io/discord

---

**Status**: Ready for implementation  
**Estimated Setup Time**: 2-4 hours  
**Difficulty**: Medium (Cloud), Advanced (Self-hosted)
