# Multi-Platform Streaming Setup Guide

## Overview

Youcast now supports simultaneous streaming to multiple platforms including YouTube, Facebook, Twitch, Twitter/X, and custom RTMP servers. When you go live, your stream will automatically broadcast to all enabled destinations.

## Quick Start

### 1. Access Streaming Destinations

Navigate to **Dashboard → Destinations** (https://youcast.network/dashboard/destinations)

### 2. Add Your First Destination

Click **"+ Add Destination"** and follow these steps:

#### YouTube

1. **Get Your Stream Key:**
   - Go to [YouTube Studio](https://studio.youtube.com)
   - Click **"Go Live"** in the top right
   - Select **"Stream"** tab
   - Copy your **Stream URL** and **Stream Key**

2. **Configure in Youcast:**
   - Platform: YouTube 📺
   - Name: "My YouTube Channel"
   - RTMP Server: `rtmp://a.rtmp.youtube.com/live2`
   - Stream Key: `[paste your key]`

#### Facebook

1. **Get Your Stream Key:**
   - Go to [Facebook Live Producer](https://www.facebook.com/live/producer)
   - Click **"Go Live"**
   - Copy **Stream URL** and **Stream Key**

2. **Configure in Youcast:**
   - Platform: Facebook 📘
   - Name: "My Facebook Page"
   - RTMP Server: `rtmps://live-api-s.facebook.com:443/rtmp`
   - Stream Key: `[paste your key]`

#### Twitch

1. **Get Your Stream Key:**
   - Go to [Twitch Dashboard](https://dashboard.twitch.tv/settings/stream)
   - Click **"Settings"** → **"Stream"**
   - Reveal and copy your **Primary Stream Key**

2. **Configure in Youcast:**
   - Platform: Twitch 🎮
   - Name: "My Twitch Channel"
   - RTMP Server: `rtmp://live.twitch.tv/app`
   - Stream Key: `[paste your key]`

#### Twitter/X

1. **Requirements:**
   - Must be approved for [Twitter Media Studio Producer](https://media.twitter.com)
   - Apply at: https://media.twitter.com/

2. **Configure in Youcast:**
   - Platform: Twitter/X 🐦
   - Name: "My Twitter Stream"
   - RTMP Server: `rtmp://fa.rtmp.twitter.com/live`
   - Stream Key: `[from Twitter Media Studio]`

#### Custom RTMP

For other platforms or custom servers:

- Platform: Custom RTMP 🔌
- Name: "Custom Server"
- RTMP Server: `rtmp://your-server.com/live`
- Stream Key: `[your custom key]`

### 3. Enable/Disable Destinations

- Click **"Enable"** to activate streaming to that destination
- Click **"Disable"** to temporarily stop streaming without deleting
- Only **enabled** destinations will receive your stream

### 4. Go Live

1. Go to **Dashboard → Stream Studio**
2. Select your camera and microphone
3. Click **"Start Preview"** to test your setup
4. Click **"Go Live"**
5. Your stream will automatically start broadcasting to **all enabled destinations**

## Features

### Automatic Multi-Streaming

When you click **"Go Live"**, Youcast automatically:
- Connects to LiveKit for WebRTC streaming
- Starts RTMP egress to all enabled destinations
- Monitors connection status for each platform
- Updates "Connected" badges in real-time

### Connection Status

Each destination shows:
- ✅ **Enabled** - Will receive stream when you go live
- 🔴 **Streaming** - Currently broadcasting
- ⏸️ **Disabled** - Won't receive stream
- 📅 **Last Used** - When this destination was last used

### Security

- Stream keys are encrypted and stored securely
- Displayed as password fields (•••••••)
- Never exposed in logs or frontend code
- Only accessible by your account

## Troubleshooting

### "Failed to start RTMP egress"

**Cause:** Invalid stream key or RTMP URL

**Solution:**
1. Verify stream key is correct (copy directly from platform)
2. Check RTMP URL matches platform requirements
3. Ensure platform account is in good standing
4. Test with a single destination first

### "Destination not connecting"

**Cause:** Platform may have restrictions or quota limits

**Solution:**
1. Check platform's streaming dashboard for errors
2. Verify your account has streaming permissions
3. Some platforms require pre-scheduling streams
4. Test RTMP URL with OBS to verify it works

### "Stream quality issues on specific platform"

**Cause:** Platform has different bitrate/encoding requirements

**Solution:**
- YouTube: Recommended 4500-9000 Kbps for 1080p
- Facebook: Recommended 3000-6000 Kbps for 1080p
- Twitch: Recommended 3000-6000 Kbps for 1080p
- Adjust quality in Stream Studio settings

### "Can't add destination"

**Cause:** Missing required fields or channel not found

**Solution:**
1. Ensure all fields are filled in
2. Verify you have a channel created (should auto-create on first visit)
3. Check browser console for specific errors

## Platform-Specific Notes

### YouTube
- **Latency:** 10-30 seconds
- **Requirements:** Channel must be verified for live streaming
- **Restrictions:** May need to wait 24 hours after first verification
- **Resolution:** Supports up to 4K

### Facebook
- **Latency:** 5-20 seconds
- **Requirements:** Page or profile with live access
- **Restrictions:** May have cooldown periods between streams
- **Resolution:** Supports up to 1080p

### Twitch
- **Latency:** 3-10 seconds (low latency mode)
- **Requirements:** Verified Twitch account
- **Restrictions:** Must comply with Twitch TOS
- **Resolution:** Supports up to 1080p60fps

### Twitter/X
- **Latency:** 10-30 seconds
- **Requirements:** Media Studio Producer access (approved accounts only)
- **Restrictions:** Limited to approved creators
- **Resolution:** Supports up to 1080p

## Best Practices

### 1. Test Before Going Live

- Add one destination at a time
- Test each platform individually first
- Use "Start Preview" to verify video/audio
- Check each platform's dashboard to confirm stream

### 2. Monitor Bandwidth

Streaming to multiple platforms uses more bandwidth:
- 1 destination: ~5 Mbps upload
- 2 destinations: ~5 Mbps upload (LiveKit handles distribution)
- 5+ destinations: ~5 Mbps upload (no additional bandwidth needed)

Note: LiveKit Egress handles the multi-streaming, so you only upload once!

### 3. Keep Stream Keys Private

- Never share stream keys publicly
- Rotate keys regularly (every few months)
- Disable unused destinations instead of deleting
- Use unique keys for each platform

### 4. Schedule Notifications

Before going live:
- Notify followers on each platform
- Create scheduled events (YouTube/Facebook support this)
- Update stream titles/descriptions on each platform
- Set appropriate categories/tags

## Technical Details

### Architecture

```
Your Browser → LiveKit Cloud → RTMP Egress → Multiple Platforms
                     ↓
              Youcast Viewers
```

1. **WebRTC Upload:** Your stream is sent to LiveKit via WebRTC (efficient, low latency)
2. **LiveKit Processing:** LiveKit Cloud receives and processes your stream
3. **RTMP Distribution:** LiveKit Egress converts to RTMP and sends to each destination
4. **Direct Viewing:** Youcast viewers watch directly from LiveKit (lowest latency)

### Supported Formats

- **Video Codec:** H.264
- **Audio Codec:** AAC
- **Container:** FLV (RTMP standard)
- **Bitrate:** Dynamic based on connection
- **Resolution:** Up to 1080p (4K experimental)
- **Frame Rate:** 30fps standard, 60fps optional

## FAQ

**Q: Does multi-streaming cost more?**
A: No! LiveKit's infrastructure handles distribution efficiently. You upload once, and LiveKit sends to all destinations.

**Q: Can I stream to more than 5 platforms?**
A: Yes! Add as many custom RTMP destinations as you need. No hard limit.

**Q: What if one platform fails?**
A: Other platforms continue streaming normally. Check the destinations page for status.

**Q: Can I add destinations while already live?**
A: Not yet. You must add destinations before going live. Feature coming soon!

**Q: Does this work with OBS/Streamlabs?**
A: Youcast has its own built-in encoder. For OBS, you'd need to set up individual RTMP connections manually.

**Q: Can I customize stream title/description per platform?**
A: Currently, you set title/description directly on each platform's dashboard before streaming.

## Support

Need help? Check these resources:
- **Youcast Docs:** https://youcast.network/docs
- **LiveKit Docs:** https://docs.livekit.io
- **YouTube Help:** https://support.google.com/youtube/topic/9257891
- **Facebook Help:** https://www.facebook.com/help/1636872026560015
- **Twitch Help:** https://help.twitch.tv/s/article/guide-to-broadcast-health

---

**Pro Tip:** Start with just YouTube or Twitch, get comfortable, then add more platforms gradually. Multi-streaming is powerful but requires good internet connection!
