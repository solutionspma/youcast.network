# YouCast Stream Studio — Pro Architecture

> This is where we stop copying OBS and start outgrowing it.

## Three Core Systems

### 1. Pro Audio Mixer
### 2. Overlay JSON Spec
### 3. Composition System

---

## 1. Audio Mixer — Pro Signal Flow

### Mental Model
Each audio source = **Channel Strip**
Think old-school mixing desk, not DJ toy.

### Channel Strip Layout

```
┌─────────────────────────────────────────┐
│ [MIC] Microphone 1          [S] [M]     │  ← Source name + Solo/Mute
├─────────────────────────────────────────┤
│ ██████████████████████      ← L/R VU    │  ← Peak + RMS meters
│ ████████████████████                    │
├─────────────────────────────────────────┤
│ ───────●────────────── -6.2dB           │  ← Volume fader (dB scale)
├─────────────────────────────────────────┤
│ L ─────●───────────────────────────── R │  ← Pan control
├─────────────────────────────────────────┤
│ [EQ] [COMP -4dB] [GATE ON]              │  ← Processing buttons
├─────────────────────────────────────────┤
│ Output: [🔴 Stream] [🎧 Mon] [⏺ Rec]    │  ← Output routing
└─────────────────────────────────────────┘
```

### Under-the-Hood (Web Audio API)

```
MediaStreamSource
    → GainNode (input trim)
    → BiquadFilter × 3 (EQ: Low/Mid/High)
    → DynamicsCompressor
    → GainNode (makeup gain)
    → GainNode (noise gate)
    → StereoPanner
    → GainNode (fader)
    → AnalyserNode (meters)
    → Master Bus

Master Bus:
    → DynamicsCompressor (limiter)
    → GainNode (master volume)
    → AnalyserNode (master meters)
    → MediaStreamDestination
```

### Files

| File | Purpose |
|------|---------|
| `src/lib/audio/WebAudioEngine.ts` | Core audio processing engine |
| `src/components/stream/ProChannelStrip.tsx` | Channel strip UI with routing |
| `src/components/stream/ProAudioMixer.tsx` | Mixer container |

---

## 2. Overlay JSON Format — The Gold Standard

### Design Goals
- ✅ Portable (export/import)
- ✅ Versioned (future-proof)
- ✅ Survives UI changes
- ✅ Loads instantly
- ✅ Marketplace-ready

### Overlay Definition Schema

```typescript
interface Overlay {
  version: '1.0';
  type: OverlayType;           // 'lower-third' | 'logo' | 'text' | 'ticker' | ...
  id: string;
  name: string;
  layer: number;               // z-index (higher = on top)
  visible: boolean;
  locked?: boolean;
  
  position: {
    x: number;
    y: number;
    anchor: AnchorPosition;    // 'top-left' | 'bottom-center' | ...
  };
  
  size: {
    width: number;
    height: number;
  };
  
  style: {
    background?: string;
    opacity: number;
    borderRadius?: number;
    border?: { width, color, style };
    boxShadow?: { offsetX, offsetY, blur, spread, color };
  };
  
  text?: OverlayTextElement[];
  imageUrl?: string;
  
  animation: {
    in: AnimationType;         // 'fade' | 'slide-left' | 'zoom' | ...
    out: AnimationType;
    durationMs: number;
  };
  
  autoDismissMs?: number;      // 0 = stay forever
  metadata?: Record<string, unknown>;
}
```

### Example: Lower Third

```json
{
  "version": "1.0",
  "type": "lower-third",
  "id": "lt_001",
  "name": "Host Name Bar",
  "layer": 10,
  "visible": false,
  "position": {
    "x": 120,
    "y": 820,
    "anchor": "bottom-left"
  },
  "size": {
    "width": 900,
    "height": 120
  },
  "style": {
    "background": "#111111",
    "opacity": 0.92,
    "borderRadius": 12
  },
  "text": [
    {
      "content": "Jason Harris",
      "font": "Inter",
      "size": 42,
      "weight": 700,
      "color": "#ffffff"
    },
    {
      "content": "Founder | YouCast",
      "font": "Inter",
      "size": 26,
      "weight": 400,
      "color": "#cfcfcf"
    }
  ],
  "animation": {
    "in": "slide-left",
    "out": "fade",
    "durationMs": 350
  }
}
```

### Files

| File | Purpose |
|------|---------|
| `src/types/composition.ts` | All type definitions |
| `src/components/stream/ProOverlayEditor.tsx` | Overlay editor UI |

---

## 3. Composition System — The Brain

> We don't call them "Scenes". That's OBS nostalgia.
> We call them **Compositions**.

### What is a Composition?
A complete broadcast state recalled in one click:
- Which overlays are visible
- Audio levels and mutes
- Video source visibility
- Transition settings

### Composition Schema

```typescript
interface Composition {
  id: string;
  name: string;
  description?: string;
  color?: string;           // For UI color coding
  icon?: string;            // Emoji or icon name
  
  // What to show/hide
  overlays: string[];       // Overlay IDs
  audio: Record<string, AudioChannelState>;
  video: Record<string, VideoSourceState>;
  
  // How to switch
  transition: TransitionType;
  transitionDurationMs: number;
  
  // Triggers
  hotkey?: string;          // 'F1', 'Ctrl+1'
  midiNote?: number;
  midiChannel?: number;
  
  // Auto-advance
  autoAdvanceMs?: number;
  nextCompositionId?: string;
}
```

### Example

```json
{
  "id": "comp_intro",
  "name": "Intro",
  "icon": "🎬",
  "color": "#22c55e",
  "overlays": ["lt_001", "bug_logo"],
  "audio": {
    "mic_main": { "channelId": "mic_main", "gain": 0.9, "mute": false },
    "music_bed": { "channelId": "music_bed", "gain": 0.4, "mute": false }
  },
  "video": {
    "camera": { "sourceId": "camera", "visible": true },
    "screen": { "sourceId": "screen", "visible": false }
  },
  "transition": "fade",
  "transitionDurationMs": 300,
  "hotkey": "F1"
}
```

### UI Behavior
- One-click apply
- F1-F6 hotkeys by default
- MIDI triggerable
- Safe switching (no audio pops, no video drops)
- Preview/Program workflow (like broadcast mixers)

### Files

| File | Purpose |
|------|---------|
| `src/lib/streamStudio/CompositionEngine.ts` | Core composition state machine |
| `src/components/stream/CompositionSwitcher.tsx` | Composition switcher UI |
| `src/hooks/useCompositions.ts` | React hooks |

---

## 4. Soundboard — Pro Pads

### Sound Effect Schema

```typescript
interface SoundEffect {
  id: string;
  name: string;
  type: 'sound';
  fileUrl: string;
  volume: number;           // 0-100
  playMode: 'oneshot' | 'toggle' | 'hold' | 'loop';
  
  duck?: {
    target: string;         // Channel ID to duck
    amount: number;         // dB reduction (-24 to 0)
    fadeMs: number;
  };
  
  trigger: {
    keyboard?: string;      // 'KeyA', 'Digit1'
    midi?: { note, channel };
    padIndex?: number;
  };
  
  color?: string;
}
```

### Features
- 8 pads per bank, multiple banks
- USB pad controller support
- MIDI learn
- Ducking (auto-lower mic when playing)
- Keyboard shortcuts

### Files

| File | Purpose |
|------|---------|
| `src/lib/audio/SoundboardEngine.ts` | Audio buffer playback |
| `src/components/stream/ProSoundboard.tsx` | Soundboard UI |

---

## How It All Comes Together

```
                     ┌─────────────────┐
                     │  COMPOSITION    │
                     │     ENGINE      │
                     └────────┬────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   AUDIO ENGINE  │  │  OVERLAY ENGINE │  │  VIDEO SOURCES  │
│                 │  │                 │  │                 │
│  - Channel EQ   │  │  - Lower thirds │  │  - Camera       │
│  - Compression  │  │  - Logos        │  │  - Screen       │
│  - Noise gate   │  │  - Text         │  │  - Media        │
│  - Metering     │  │  - Animations   │  │  - PiP layout   │
│  - Routing      │  │                 │  │                 │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │   COMPOSITOR    │
                     │  (Canvas/WebGL) │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │    LIVEKIT →    │
                     │   RTMP FANOUT   │
                     └─────────────────┘
```

---

## Usage Examples

### React: Using Compositions

```tsx
import { useCompositions, useCompositionHotkeys } from '@/hooks';

function StreamStudio() {
  const {
    compositions,
    activeComposition,
    switchToComposition,
    transitionToPreview,
  } = useCompositions();

  // Enable F-key hotkeys
  useCompositionHotkeys();

  return (
    <div>
      {compositions.map(comp => (
        <button 
          key={comp.id}
          onClick={() => switchToComposition(comp.id)}
          className={comp.id === activeComposition?.id ? 'active' : ''}
        >
          {comp.icon} {comp.name}
        </button>
      ))}
    </div>
  );
}
```

### React: Pro Audio Mixer

```tsx
import { ProChannelStrip, MasterBus } from '@/components/stream/ProChannelStrip';
import { getAudioEngine } from '@/lib/audio/WebAudioEngine';

function AudioMixer() {
  const engine = getAudioEngine();
  const channels = engine.getAllChannels();

  return (
    <div className="flex gap-2">
      {Array.from(channels.values()).map(channel => (
        <ProChannelStrip key={channel.id} channel={channel} />
      ))}
      <MasterBus volume={100} onVolumeChange={v => engine.setMasterVolume(v)} />
    </div>
  );
}
```

---

## What This Enables

| Feature | Status |
|---------|--------|
| Pro-grade audio cleanup | ✅ Browser-native |
| Real compressor/EQ/gate | ✅ Web Audio API |
| JSON overlays | ✅ Marketplace-ready |
| One-click compositions | ✅ MIDI + keyboard |
| Soundboard with ducking | ✅ Controller support |
| Export/import configs | ✅ Portable JSON |

This is how you turn "I stream sometimes" into "I look and sound professional."

---

## Files Created/Modified

### New Files
- `src/types/composition.ts` — Type definitions
- `src/lib/streamStudio/CompositionEngine.ts` — Composition state machine
- `src/components/stream/CompositionSwitcher.tsx` — Composition UI
- `src/components/stream/ProChannelStrip.tsx` — Enhanced channel strip with routing
- `src/components/stream/ProOverlayEditor.tsx` — Overlay editor with JSON support
- `src/components/stream/ProSoundboard.tsx` — Enhanced soundboard
- `src/hooks/useCompositions.ts` — React hooks

### Updated Files
- `src/hooks/index.ts` — Added exports

---

*Built for YouCast.network — February 2026*
