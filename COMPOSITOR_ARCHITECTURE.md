# Youcast Stream Compositor System

## Overview
Complete broadcast-quality overlay and multistream system for professional live streaming.

## Architecture

### Core Components

**Overlay Engine** (`overlays/OverlayEngine.ts`)
- Manages z-indexed layer stack
- Handles layer enable/disable
- Emits updates to subscribers
- No database dependencies

**Compositor** (`compositor/renderCompositor.ts`)
- Single RAF loop renders everything
- Video → Chroma → Overlays → Lower Thirds
- Canvas-native (recording + multistream ready)
- < 5ms latency

**Lower Thirds** (`lower-thirds/`)
- Already implemented
- Integrated into compositor
- F1-F2 keyboard shortcuts

**Overlays**
- Logo/watermark with opacity + scale
- Image overlays with positioning
- Chroma key (green screen) with threshold control
- F9-F11 keyboard shortcuts

**Destinations** (`destinations/`)
- Multi-platform RTMP fan-out
- YouTube, Twitch, Facebook, LinkedIn, Custom
- Server-side streaming (no client duplication)
- One publish → many destinations

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| F1 | Show lower third preset 1 |
| F2 | Show lower third preset 2 |
| F9 | Toggle logo ON |
| F10 | Toggle logo OFF |
| F11 | Toggle chroma key |

## Integration Flow

```
Camera → Video Element → Compositor → Canvas → LiveKit → RTMP Fan-out
                             ↑
                        Overlay Layers
                      (sorted by z-index)
```

## State Management

- **Overlay Engine**: Layer stack management
- **Lower Third Engine**: Animation + timing
- **Compositor Hook**: Unified RAF rendering
- **Global Shortcuts**: Window-level keyboard events

## Zero Dependencies

- No database writes during streaming
- Client-side layer management
- State lives in memory only
- Production-safe preview/live separation

## Scaling Architecture

**Client Side:**
- Single WebRTC connection to LiveKit
- Canvas compositor (hardware accelerated)
- Overlay rendering (< 5ms overhead)

**Server Side:**
- LiveKit receives one stream
- FFmpeg fans out to multiple RTMP endpoints
- No client bandwidth multiplication
- Scales to millions of viewers

## Future Extensions

- Recording → VOD integration
- Saveable overlay templates
- Guest browser links (multi-participant)
- Hardware encoder mode
- Edge streaming nodes
- White-label networks
