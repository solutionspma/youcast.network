// ============================================================================
// LIVEKIT CLIENT - WebRTC Media Server Integration
// ============================================================================

import {
  Room,
  RoomEvent,
  LocalParticipant,
  RemoteParticipant,
  Track,
  LocalTrack,
  LocalVideoTrack,
  LocalAudioTrack,
  Participant,
  RoomOptions,
  VideoPresets,
  ConnectionState,
} from 'livekit-client';
import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type LiveKitConfig = {
  url: string;
  apiKey: string;
  apiSecret: string;
};

export type StreamQuality = '720p' | '1080p' | '4k';

export type LiveKitRoomOptions = {
  audio: boolean;
  video: boolean;
  simulcast: boolean;
  dynacast: boolean;
  adaptiveStream: boolean;
};

// ============================================================================
// LIVEKIT CLIENT CLASS
// ============================================================================

export class LiveKitClient {
  private room: Room | null = null;
  private config: LiveKitConfig;
  
  constructor(config: LiveKitConfig) {
    this.config = config;
  }
  
  // ============================================================================
  // CONNECT TO ROOM
  // ============================================================================
  
  async connect(
    token: string,
    options: Partial<LiveKitRoomOptions> = {}
  ): Promise<Room> {
    const roomOptions: RoomOptions = {
      adaptiveStream: options.adaptiveStream ?? true,
      dynacast: options.dynacast ?? true,
      videoCaptureDefaults: {
        resolution: VideoPresets.h1080.resolution,
        facingMode: 'user',
      },
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    };
    
    this.room = new Room(roomOptions);
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Connect to room
    await this.room.connect(this.config.url, token);
    
    return this.room;
  }
  
  // ============================================================================
  // DISCONNECT
  // ============================================================================
  
  async disconnect() {
    if (this.room) {
      await this.room.disconnect();
      this.room = null;
    }
  }
  
  // ============================================================================
  // PUBLISH TRACKS (BROADCASTER)
  // ============================================================================
  
  async publishVideoTrack(track: MediaStreamTrack): Promise<LocalVideoTrack | null> {
    if (!this.room || !this.room.localParticipant) {
      console.error('Room or local participant not available');
      return null;
    }
    
    try {
      const localTrack = new LocalVideoTrack(track);
      await this.room.localParticipant.publishTrack(localTrack, {
        videoCodec: 'vp9',
        videoEncoding: {
          maxBitrate: 8_000_000, // 8 Mbps for 1080p
          maxFramerate: 30,
        },
      });
      
      return localTrack;
    } catch (error) {
      console.error('Failed to publish video track:', error);
      return null;
    }
  }
  
  async publishAudioTrack(track: MediaStreamTrack): Promise<LocalAudioTrack | null> {
    if (!this.room || !this.room.localParticipant) {
      console.error('Room or local participant not available');
      return null;
    }
    
    try {
      const localTrack = new LocalAudioTrack(track);
      await this.room.localParticipant.publishTrack(localTrack, {
        audioPreset: {
          maxBitrate: 128_000, // 128 kbps for high-quality audio
        },
      });
      
      return localTrack;
    } catch (error) {
      console.error('Failed to publish audio track:', error);
      return null;
    }
  }
  
  async publishCompositeStream(videoTrack: MediaStreamTrack, audioTrack: MediaStreamTrack) {
    const video = await this.publishVideoTrack(videoTrack);
    const audio = await this.publishAudioTrack(audioTrack);
    
    return { video, audio };
  }
  
  // ============================================================================
  // UNPUBLISH TRACKS
  // ============================================================================
  
  async unpublishTrack(track: LocalTrack) {
    if (!this.room || !this.room.localParticipant) return;
    
    try {
      await this.room.localParticipant.unpublishTrack(track);
    } catch (error) {
      console.error('Failed to unpublish track:', error);
    }
  }
  
  // ============================================================================
  // SUBSCRIBE TO TRACKS (VIEWER)
  // ============================================================================
  
  async subscribeToTracks(
    onTrackReceived: (track: Track, participant: Participant) => void
  ) {
    if (!this.room) return;
    
    console.log('🎬 Setting up track subscription...');
    console.log('📊 Remote participants:', this.room.remoteParticipants.size);
    
    // Subscribe to existing tracks from remote participants
    this.room.remoteParticipants.forEach((participant: RemoteParticipant) => {
      console.log('👤 Remote participant:', participant.identity, 'tracks:', participant.trackPublications.size);
      participant.trackPublications.forEach((publication) => {
        console.log('📡 Track publication:', publication.trackSid, 'kind:', publication.kind, 'subscribed:', publication.isSubscribed, 'hasTrack:', !!publication.track);
        
        // Ensure we're subscribed to the track
        if (!publication.isSubscribed) {
          console.log('⏳ Subscribing to track...', publication.trackSid);
          publication.setSubscribed(true);
        }
        
        if (publication.track) {
          console.log('✅ Delivering existing track:', publication.kind);
          onTrackReceived(publication.track, participant);
        }
      });
    });
    
    // Subscribe to future tracks
    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log('🎉 TrackSubscribed event:', track.kind, 'from', participant.identity);
      onTrackReceived(track, participant);
    });
    
    // Also listen for when new participants join with tracks
    this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      console.log('👋 New participant joined:', participant.identity);
      participant.trackPublications.forEach((publication) => {
        if (!publication.isSubscribed) {
          publication.setSubscribed(true);
        }
      });
    });
    
    // Handle track published events (when broadcaster publishes new tracks)
    this.room.on(RoomEvent.TrackPublished, (publication, participant) => {
      console.log('📢 Track published:', publication.kind, 'by', participant.identity);
      if (participant instanceof RemoteParticipant && !publication.isSubscribed) {
        console.log('⏳ Auto-subscribing to new published track');
        (publication as any).setSubscribed(true);
      }
    });
  }
  
  // ============================================================================
  // EVENT LISTENERS
  // ============================================================================
  
  private setupEventListeners() {
    if (!this.room) return;
    
    this.room
      .on(RoomEvent.Connected, () => {
        console.log('Connected to LiveKit room');
      })
      .on(RoomEvent.Disconnected, () => {
        console.log('Disconnected from LiveKit room');
      })
      .on(RoomEvent.Reconnecting, () => {
        console.log('Reconnecting to LiveKit room...');
      })
      .on(RoomEvent.Reconnected, () => {
        console.log('Reconnected to LiveKit room');
      })
      .on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('Participant connected:', participant.identity);
      })
      .on(RoomEvent.ParticipantDisconnected, (participant) => {
        console.log('Participant disconnected:', participant.identity);
      })
      .on(RoomEvent.TrackPublished, (publication, participant) => {
        console.log('Track published:', publication.trackSid, 'by', participant.identity);
      })
      .on(RoomEvent.TrackUnpublished, (publication, participant) => {
        console.log('Track unpublished:', publication.trackSid, 'by', participant.identity);
      })
      .on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
        console.log('Connection quality changed:', quality, 'for', participant.identity);
      });
  }
  
  // ============================================================================
  // GETTERS
  // ============================================================================
  
  getRoom(): Room | null {
    return this.room;
  }
  
  getConnectionState(): ConnectionState | null {
    return this.room?.state || null;
  }
  
  getParticipantCount(): number {
    if (!this.room) return 0;
    // numParticipants includes local + remote participants
    return this.room.numParticipants;
  }
  
  isConnected(): boolean {
    return this.room?.state === ConnectionState.Connected;
  }
}

// ============================================================================
// TOKEN GENERATION (Server-Side)
// ============================================================================

export async function generateLiveKitToken(
  roomName: string,
  participantName: string,
  isPublisher: boolean = false
): Promise<string | null> {
  try {
    const supabase = createClient();
    
    // Get current session for authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return null;
    }
    
    if (!session) {
      console.error('No active session found for token generation');
      console.log('Current user state:', await supabase.auth.getUser());
      return null;
    }
    
    console.log('✅ Session found, access_token exists:', !!session.access_token);
    console.log('🔑 Generating LiveKit token for room:', roomName, 'participant:', participantName);
    
    // TEMPORARY: Use bypass function without authentication
    // Call Supabase Edge Function to generate token
    const { data, error } = await supabase.functions.invoke('generate-livekit-token-bypass', {
      body: {
        roomName,
        participantName,
        isPublisher,
      },
    });
    
    if (error) {
      console.error('Edge function error:', error);
      return null;
    }
    
    if (!data?.token) {
      console.error('No token returned from edge function');
      return null;
    }
    
    // Verify this is a LiveKit token, not a Supabase JWT
    const tokenPreview = data.token.substring(0, 50);
    console.log('✅ LiveKit token generated successfully');
    console.log('🔍 Token preview (first 50 chars):', tokenPreview);
    console.log('🔍 Token length:', data.token.length);
    
    // Decode JWT header to verify it's a LiveKit token
    try {
      const [header] = data.token.split('.');
      const decodedHeader = JSON.parse(atob(header));
      console.log('🔍 JWT Header:', decodedHeader);
      
      const [, payload] = data.token.split('.');
      const decodedPayload = JSON.parse(atob(payload));
      console.log('🔍 JWT Payload excerpt:', {
        iss: decodedPayload.iss,
        sub: decodedPayload.sub,
        name: decodedPayload.name,
        video: decodedPayload.video ? 'present' : 'missing'
      });
      
      // CRITICAL: Verify this is a LiveKit token, not Supabase
      if (decodedPayload.iss === 'supabase') {
        console.error('❌ ERROR: Received Supabase JWT instead of LiveKit token!');
        console.error('This will fail when connecting to LiveKit');
        return null;
      }
      
      console.log('✅ Verified: This is a proper LiveKit token');
    } catch (e) {
      console.warn('Could not decode token for verification:', e);
    }
    
    return data.token;
  } catch (error) {
    console.error('Failed to generate LiveKit token:', error);
    return null;
  }
}

// ============================================================================
// INITIALIZE LIVEKIT CLIENT
// ============================================================================

export function createLiveKitClient(): LiveKitClient {
  const config: LiveKitConfig = {
    url: process.env.NEXT_PUBLIC_LIVEKIT_URL || 'ws://localhost:7880',
    apiKey: process.env.NEXT_PUBLIC_LIVEKIT_API_KEY || '',
    apiSecret: process.env.LIVEKIT_API_SECRET || '',
  };
  
  return new LiveKitClient(config);
}

// ============================================================================
// RTMP EGRESS (Multi-Platform Streaming)
// ============================================================================

export async function startRtmpEgress(roomName: string, channelId: string): Promise<{
  success: boolean;
  egressIds?: Record<string, string>;
  errors?: Record<string, string>;
}> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase.functions.invoke('start-rtmp-egress', {
      body: { roomName, channelId }
    });

    if (error) {
      console.error('Failed to start RTMP egress:', error);
      return { success: false, errors: { general: error.message } };
    }

    return data;
  } catch (error) {
    console.error('RTMP egress error:', error);
    return { success: false, errors: { general: String(error) } };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getVideoQualitySettings(quality: StreamQuality) {
  switch (quality) {
    case '720p':
      return {
        width: 1280,
        height: 720,
        bitrate: 2_500_000, // 2.5 Mbps
        frameRate: 30,
      };
    case '1080p':
      return {
        width: 1920,
        height: 1080,
        bitrate: 5_000_000, // 5 Mbps
        frameRate: 30,
      };
    case '4k':
      return {
        width: 3840,
        height: 2160,
        bitrate: 15_000_000, // 15 Mbps
        frameRate: 30,
      };
  }
}
