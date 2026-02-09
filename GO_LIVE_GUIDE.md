# 🎙️ GO LIVE GUIDE - YOUCAST STREAM STUDIO

Quick reference for streaming workflow and troubleshooting.

---

## 🚀 QUICK START - Going Live in 5 Steps

### 1. **Configure Devices** (Left Panel → Devices Tab)
- Select Camera from dropdown
- Select Microphone from dropdown
- Optional: Start Screen Share
- Verify green "Active" indicators appear

### 2. **Set Up Scenes** (Left Panel → Scenes Tab)
- Choose active scene layout
- Adjust scene composition if needed
- Preview appears in center canvas

### 3. **Configure Audio** (Left Panel → Audio Tab)
- Adjust microphone volume slider
- Set camera audio level
- Optional: Screen share audio level
- Test levels before going live

### 4. **Configure Destinations** (Left Panel → Destinations Tab)
- Enable desired platforms (YouTube, Twitch, Facebook, LinkedIn)
- Click "Configure RTMP →" for each enabled destination
- Enter RTMP Server URL (e.g., `rtmp://live.youtube.com/app`)
- Enter Stream Key from platform dashboard
- Click "Save Configuration"
- Verify "✓ Configured" appears

### 5. **Go Live**
- Click "Start Preview" button (center, below canvas)
- Verify preview looks correct
- Click "Go Live" button (red, with pulsing dot)
- Stream begins broadcasting

---

## 📺 Where to Find RTMP Details

### YouTube
1. Go to [YouTube Studio](https://studio.youtube.com)
2. Click "Go Live" → "Stream"
3. Copy **Stream URL** and **Stream Key**
   - Server: `rtmp://a.rtmp.youtube.com/live2`
   - Key: Your unique stream key

### Twitch
1. Go to [Twitch Dashboard](https://dashboard.twitch.tv/settings/stream)
2. Settings → Stream
3. Copy **Server URL** and **Stream Key**
   - Server: `rtmp://live.twitch.tv/app`
   - Key: Your stream key

### Facebook Live
1. Go to [Facebook Live Producer](https://www.facebook.com/live/producer)
2. Use "Streaming Software" option
3. Copy **Server URL** and **Stream Key**
   - Server: `rtmps://live-api-s.facebook.com:443/rtmp/`
   - Key: Provided by Facebook

### LinkedIn Live
1. Go to [LinkedIn Live Dashboard](https://www.linkedin.com/feed/)
2. Click "Start a video" → "Go Live"
3. Copy RTMP URL and Stream Key from settings

---

## ⚙️ CURRENT IMPLEMENTATION STATUS

### ✅ WORKING FEATURES
- Device selection (camera, mic, screen share)
- Scene management and preview
- Audio mixing with level controls
- Canvas rendering with real-time composition
- Lower Thirds graphics (F1-F2 keyboard shortcuts)
- Overlay compositor (logo, chroma key, images - F9-F11)
- RTMP destination configuration UI
- WebRTC streaming via LiveKit

### ⚠️ KNOWN LIMITATIONS
- **Multi-streaming to RTMP destinations requires backend infrastructure**
  - Current: Streams via WebRTC (LiveKit) to YouCast platform only
  - UI captures RTMP configs but doesn't fan out yet
  - Solution needed: Media server (OBS, Nginx RTMP, or cloud service)
  
- **Destinations status doesn't update during stream**
  - Status will show 'idle', 'connecting', 'streaming', 'error'
  - Currently hardcoded to 'idle' until backend wired
  
- **No recording functionality yet**
  - Streams are live only
  - VOD recording coming in future update

---

## 🐛 TROUBLESHOOTING

### Camera/Mic Not Detected
**Problem:** Device dropdowns are empty  
**Solution:**
1. Check browser permissions (camera/microphone access)
2. Reload page (keyboard: Cmd+R / Ctrl+R)
3. Try different browser (Chrome/Firefox recommended)
4. Check System Preferences → Privacy & Security

### "Configure RTMP" Button Does Nothing
**Problem:** Button unresponsive  
**Solution:**
1. Make sure destination is **Enabled** first (toggle button)
2. Click "Configure RTMP →" to open modal
3. If modal doesn't appear, check browser console for errors
4. Try reloading the page

### Stream Preview Shows Black Screen
**Problem:** Canvas is black after clicking "Start Preview"  
**Solutions:**
1. Verify camera is selected and active (green indicator)
2. Check Devices tab - ensure camera has "Camera Active" text
3. Try stopping and restarting preview
4. Reload page and reconfigure devices

### "Go Live" Button Grayed Out
**Problem:** Can't click "Go Live"  
**Solutions:**
1. Must click "Start Preview" first
2. Verify at least one device (camera/mic/screen) is active
3. Check browser console for authentication errors
4. Ensure Supabase connection is active (check .env.local)

### Multi-stream Not Working
**Problem:** Stream only goes to YouCast, not YouTube/Twitch  
**Status:** This is expected behavior  
**Explanation:**
- Current implementation streams via WebRTC (LiveKit)
- RTMP fanout requires backend media server
- UI captures RTMP configs for future backend integration
- For now, use OBS Studio to restream from YouCast to other platforms

---

## 🎨 GRAPHICS OVERLAYS - KEYBOARD SHORTCUTS

| Key | Function | Description |
|-----|----------|-------------|
| **F1** | Lower Third #1 | Show preset 1 (name + title) |
| **F2** | Lower Third #2 | Show preset 2 (alternate text) |
| **F9** | Toggle Logo | Show/hide watermark overlay |
| **F10** | Toggle Chroma | Enable/disable green screen |
| **F11** | Test Overlay | Show test image overlay |

**To Configure:**
- Lower Thirds: Left Panel → Graphics Tab
- Overlays: Left Panel → Overlays Tab

---

## 📊 STREAM HEALTH MONITORING

**During Live Stream:**
- Top-left corner shows "LIVE" indicator (red, pulsing)
- Stream duration timer
- Network quality indicator (excellent/good/poor)
- Bitrate, FPS, Latency stats below canvas

**Right Panel Stats:**
- Chat panel: View messages from viewers
- Stats panel: Viewer count, resolution, active scenes

---

## 🔮 COMING SOON

### Near-term (Next Update)
- [ ] Backend RTMP fanout implementation
- [ ] Real-time destination status updates
- [ ] Stream health warnings/alerts
- [ ] One-click platform authentication

### Future Features
- [ ] Recording to VOD
- [ ] Auto-save stream backups
- [ ] Advanced scene transitions
- [ ] Multiple lower thirds presets
- [ ] Custom graphics uploads
- [ ] Chat moderation tools

---

## 💡 PRO TIPS

1. **Test First:** Always use "Start Preview" before going live
2. **Audio Levels:** Keep levels in green zone (avoid red clipping)
3. **Internet:** Ensure stable connection (5+ Mbps upload for HD)
4. **Graphics:** Configure overlays/lower thirds before going live
5. **Backup Plan:** Have mobile hotspot ready if internet drops

---

## 📞 NEED HELP?

**Build Issues:** See [DEPLOYMENT_CHECKPOINT.md](./DEPLOYMENT_CHECKPOINT.md)  
**Architecture:** See [COMPOSITOR_ARCHITECTURE.md](./COMPOSITOR_ARCHITECTURE.md)

**Common Error Logs:**
```bash
# Check Next.js build
npm run build

# Check TypeScript
npx tsc --noEmit

# Check browser console
Right-click → Inspect → Console tab
```

---

**Last Updated:** February 8, 2026  
**Version:** 1.0 (WebRTC Streaming + UI Only RTMP Config)
