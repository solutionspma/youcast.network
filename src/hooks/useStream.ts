'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LiveKitClient, createLiveKitClient, generateLiveKitToken } from '@/lib/livekit/client';
import { startPreview as startCameraPreview } from '@/lib/streamStudio/startPreview';
import { IS_PRODUCTION_DATA } from '@/lib/env';
import { assertNoExternalReset, type StreamDBState } from '@/lib/streamStudio/constants';

// ============================================================================
// TYPES
// ============================================================================

export type DeviceInfo = {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
};

export type StreamSource = {
  id: string;
  type: 'camera' | 'screen' | 'mic' | 'audio';
  label: string;
  stream: MediaStream | null;
  enabled: boolean;
  volume: number;
};

export type Scene = {
  id: string;
  name: string;
  sources: StreamSource[];
  layout: 'fullscreen' | 'pip' | 'sidebyside' | 'custom';
  isActive: boolean;
};

export type StreamStatus = 'offline' | 'preview' | 'live' | 'error';

export type StreamHealth = {
  bitrate: number;
  fps: number;
  resolution: string;
  latency: number;
  packetLoss: number;
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor';
};

// ============================================================================
// USESTREAM HOOK - Real Device Connections & Streaming
// ============================================================================

export function useStream(channelId?: string) {
  // Device Management
  const [cameras, setCameras] = useState<DeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<DeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<DeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('');
  
  // Streams
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  
  // Scene Management
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string>('');
  
  // Stream State
  const [status, setStatus] = useState<StreamStatus>('offline');
  const [streamHealth, setStreamHealth] = useState<StreamHealth>({
    bitrate: 0,
    fps: 0,
    resolution: '1920x1080',
    latency: 0,
    packetLoss: 0,
    networkQuality: 'excellent',
  });
  const [duration, setDuration] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamId, setStreamId] = useState<string | null>(null);
  
  // Canvas & Compositor
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const compositorRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameRef = useRef<number>();
  
  // Video elements for rendering
  const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  
  // Audio Context
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const audioSourcesRef = useRef<Map<string, MediaStreamAudioSourceNode>>(new Map());
  const gainNodesRef = useRef<Map<string, GainNode>>(new Map());
  
  // WebRTC & LiveKit
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [liveKitClient, setLiveKitClient] = useState<LiveKitClient | null>(null);
  
  // Timers
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const healthCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // ============================================================================
  // DEVICE ENUMERATION - Real MediaDevices API
  // ============================================================================
  
  const enumerateDevices = useCallback(async () => {
    try {
      // Request permissions first to get actual device labels
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const videoDevices = devices
        .filter(d => d.kind === 'videoinput')
        .map(d => ({ 
          deviceId: d.deviceId, 
          label: d.label || `Camera ${d.deviceId.slice(0, 5)}`, 
          kind: d.kind 
        }));
      
      const audioInputDevices = devices
        .filter(d => d.kind === 'audioinput')
        .map(d => ({ 
          deviceId: d.deviceId, 
          label: d.label || `Microphone ${d.deviceId.slice(0, 5)}`, 
          kind: d.kind 
        }));
      
      const audioOutputDevices = devices
        .filter(d => d.kind === 'audiooutput')
        .map(d => ({ 
          deviceId: d.deviceId, 
          label: d.label || `Speaker ${d.deviceId.slice(0, 5)}`, 
          kind: d.kind 
        }));
      
      setCameras(videoDevices);
      setMicrophones(audioInputDevices);
      setSpeakers(audioOutputDevices);
      
      // Auto-select first devices if none selected
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
      if (audioInputDevices.length > 0 && !selectedMicrophone) {
        setSelectedMicrophone(audioInputDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
    }
  }, [selectedCamera, selectedMicrophone]);
  
  // ============================================================================
  // CAMERA SETUP - Real getUserMedia
  // ============================================================================
  
  const startCamera = useCallback(async (
    deviceId?: string, 
    resolution: '720p' | '1080p' = '1080p',
    frameRate: 30 | 60 = 30
  ) => {
    try {
      // Stop existing stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      
      const dimensions = resolution === '720p' 
        ? { width: { ideal: 1280 }, height: { ideal: 720 } }
        : { width: { ideal: 1920 }, height: { ideal: 1080 } };
      
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          ...dimensions,
          frameRate: { ideal: frameRate }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      
      return stream;
    } catch (error) {
      console.error('Failed to start camera:', error);
      return null;
    }
  }, [cameraStream]);
  
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);
  
  // ============================================================================
  // MICROPHONE SETUP - Real getUserMedia with Audio Processing
  // ============================================================================
  
  const startMicrophone = useCallback(async (deviceId?: string) => {
    try {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setAudioStream(stream);
      
      return stream;
    } catch (error) {
      console.error('Failed to start microphone:', error);
      return null;
    }
  }, [audioStream]);
  
  const stopMicrophone = useCallback(() => {
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
  }, [audioStream]);
  
  // ============================================================================
  // SCREEN SHARING - Real getDisplayMedia
  // ============================================================================
  
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: true // System audio if supported
      });
      
      setScreenStream(stream);
      
      // Handle user clicking "Stop sharing" in browser UI
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        setScreenStream(null);
      });
      
      return stream;
    } catch (error) {
      console.error('Failed to start screen share:', error);
      return null;
    }
  }, []);
  
  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
  }, [screenStream]);
  
  // ============================================================================
  // AUDIO MIXING - Real Web Audio API
  // ============================================================================
  
  const initAudioMixer = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      audioDestinationRef.current = audioContextRef.current.createMediaStreamDestination();
    }
  }, []);
  
  const removeAudioSource = useCallback((id: string) => {
    const source = audioSourcesRef.current.get(id);
    const gainNode = gainNodesRef.current.get(id);
    
    if (source) {
      source.disconnect();
      audioSourcesRef.current.delete(id);
    }
    
    if (gainNode) {
      gainNode.disconnect();
      gainNodesRef.current.delete(id);
    }
  }, []);
  
  const addAudioSource = useCallback((id: string, stream: MediaStream, volume: number = 1.0) => {
    if (!audioContextRef.current || !audioDestinationRef.current) return;
    
    // Check if stream has audio tracks
    if (stream.getAudioTracks().length === 0) {
      console.warn(`Stream ${id} has no audio tracks, skipping audio source creation`);
      return;
    }
    
    // Remove existing source if any
    removeAudioSource(id);
    
    const source = audioContextRef.current.createMediaStreamSource(stream);
    const gainNode = audioContextRef.current.createGain();
    
    gainNode.gain.value = volume;
    source.connect(gainNode);
    gainNode.connect(audioDestinationRef.current);
    
    audioSourcesRef.current.set(id, source);
    gainNodesRef.current.set(id, gainNode);
  }, [removeAudioSource]);
  
  const setAudioVolume = useCallback((id: string, volume: number) => {
    const gainNode = gainNodesRef.current.get(id);
    if (gainNode) {
      gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }, []);
  
  const muteAudio = useCallback((id: string, muted: boolean) => {
    const gainNode = gainNodesRef.current.get(id);
    if (gainNode) {
      gainNode.gain.value = muted ? 0 : 1;
    }
  }, []);
  
  // ============================================================================
  // SCENE MANAGEMENT
  // ============================================================================
  
  const createScene = useCallback((name: string, layout: Scene['layout'] = 'fullscreen') => {
    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      name,
      sources: [],
      layout,
      isActive: scenes.length === 0
    };
    
    setScenes(prev => [...prev, newScene]);
    
    if (scenes.length === 0) {
      setActiveSceneId(newScene.id);
    }
    
    return newScene;
  }, [scenes.length]);
  
  const deleteScene = useCallback((sceneId: string) => {
    setScenes(prev => prev.filter(s => s.id !== sceneId));
    if (activeSceneId === sceneId && scenes.length > 1) {
      const newActiveScene = scenes.find(s => s.id !== sceneId);
      if (newActiveScene) {
        setActiveSceneId(newActiveScene.id);
      }
    }
  }, [activeSceneId, scenes]);
  
  const switchScene = useCallback((sceneId: string) => {
    setActiveSceneId(sceneId);
    setScenes(prev => prev.map(s => ({ ...s, isActive: s.id === sceneId })));
  }, []);
  
  const addSourceToScene = useCallback((sceneId: string, source: StreamSource) => {
    setScenes(prev => prev.map(scene =>
      scene.id === sceneId
        ? { ...scene, sources: [...scene.sources, source] }
        : scene
    ));
  }, []);
  
  const removeSourceFromScene = useCallback((sceneId: string, sourceId: string) => {
    setScenes(prev => prev.map(scene =>
      scene.id === sceneId
        ? { ...scene, sources: scene.sources.filter(s => s.id !== sourceId) }
        : scene
    ));
  }, []);
  
  const updateSceneLayout = useCallback((sceneId: string, layout: Scene['layout']) => {
    setScenes(prev => prev.map(scene =>
      scene.id === sceneId ? { ...scene, layout } : scene
    ));
  }, []);
  
  // ============================================================================
  // CANVAS COMPOSITOR - Real Canvas API Rendering
  // ============================================================================
  
  const initCanvas = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
    compositorRef.current = canvas.getContext('2d', { alpha: false });
    canvas.width = 1920;
    canvas.height = 1080;
  }, []);
  
  const getOrCreateVideoElement = useCallback((streamId: string, stream: MediaStream): HTMLVideoElement => {
    let video = videoElementsRef.current.get(streamId);
    
    // If video element exists and is ready, use it
    if (video && video.srcObject === stream) {
      return video;
    }
    
    // Create new video element only if necessary
    if (!video) {
      video = document.createElement('video');
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      videoElementsRef.current.set(streamId, video);
    }
    
    // Update source if changed
    if (video.srcObject !== stream) {
      video.srcObject = stream;
      video.play().catch(err => {
        console.warn('Video autoplay failed:', err);
      });
    }
    
    return video;
  }, []);
  
  const renderFullscreen = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, sources: StreamSource[]) => {
    // Priority: screen > camera > other
    const primarySource = sources.find(s => s.enabled && s.type === 'screen') || 
                         sources.find(s => s.enabled && s.type === 'camera') ||
                         sources.find(s => s.enabled);
    
    if (!primarySource?.stream) {
      console.warn('No primary source stream in renderFullscreen');
      return;
    }
    
    const video = getOrCreateVideoElement(primarySource.id, primarySource.stream);
    
    // Wait for video to be ready
    if (video.readyState < video.HAVE_CURRENT_DATA) {
      // Show waiting state on canvas
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Initializing camera...', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px Arial';
      ctx.fillStyle = '#999999';
      ctx.fillText(`Video state: ${video.readyState}`, canvas.width / 2, canvas.height / 2 + 50);
      return;
    }
    
    // Maintain aspect ratio with letterboxing
    const videoAspect = video.videoWidth / video.videoHeight;
    const canvasAspect = canvas.width / canvas.height;
    
    let drawWidth = canvas.width;
    let drawHeight = canvas.height;
    let drawX = 0;
    let drawY = 0;
    
    if (videoAspect > canvasAspect) {
      drawHeight = canvas.width / videoAspect;
      drawY = (canvas.height - drawHeight) / 2;
    } else {
      drawWidth = canvas.height * videoAspect;
      drawX = (canvas.width - drawWidth) / 2;
    }
    
    ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
  }, [getOrCreateVideoElement]);
  
  const renderPictureInPicture = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, sources: StreamSource[]) => {
    const screenSource = sources.find(s => s.enabled && s.type === 'screen');
    const cameraSource = sources.find(s => s.enabled && s.type === 'camera');
    
    // Draw screen as background (fullscreen)
    if (screenSource?.stream) {
      const video = getOrCreateVideoElement(screenSource.id, screenSource.stream);
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
    }
    
    // Draw camera in corner (PIP) - bottom right, 25% of canvas size
    if (cameraSource?.stream) {
      const video = getOrCreateVideoElement(cameraSource.id, cameraSource.stream);
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        const pipWidth = canvas.width * 0.25;
        const pipHeight = canvas.height * 0.25;
        const pipX = canvas.width - pipWidth - 40;
        const pipY = canvas.height - pipHeight - 40;
        
        // Border
        ctx.strokeStyle = '#E6672A';
        ctx.lineWidth = 4;
        ctx.strokeRect(pipX - 2, pipY - 2, pipWidth + 4, pipHeight + 4);
        
        ctx.drawImage(video, pipX, pipY, pipWidth, pipHeight);
      }
    }
  }, [getOrCreateVideoElement]);
  
  const renderSideBySide = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, sources: StreamSource[]) => {
    const enabledSources = sources.filter(s => s.enabled && s.stream);
    const halfWidth = canvas.width / 2;
    
    enabledSources.slice(0, 2).forEach((source, index) => {
      if (!source.stream) return;
      
      const video = getOrCreateVideoElement(source.id, source.stream);
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        ctx.drawImage(video, index * halfWidth, 0, halfWidth, canvas.height);
      }
    });
  }, [getOrCreateVideoElement]);
  
  const renderFrame = useCallback(() => {
    if (!compositorRef.current || !canvasRef.current) {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      return;
    }
    
    const ctx = compositorRef.current;
    const canvas = canvasRef.current;
    
    // Clear canvas with black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Get active scene
    const activeScene = scenes.find(s => s.id === activeSceneId);
    if (!activeScene || activeScene.sources.length === 0) {
      // Show helpful message if no scene or sources
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#E6672A';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No video sources', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px Arial';
      ctx.fillStyle = '#999999';
      ctx.fillText('Select a camera or start screen share', canvas.width / 2, canvas.height / 2 + 50);
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      return;
    }
    
    // Render sources based on layout
    try {
      switch (activeScene.layout) {
        case 'fullscreen':
          renderFullscreen(ctx, canvas, activeScene.sources);
          break;
        case 'pip':
          renderPictureInPicture(ctx, canvas, activeScene.sources);
          break;
        case 'sidebyside':
          renderSideBySide(ctx, canvas, activeScene.sources);
          break;
      }
    } catch (error) {
      console.error('Render error:', error);
    }
    
    animationFrameRef.current = requestAnimationFrame(renderFrame);
  }, [scenes, activeSceneId, renderFullscreen, renderPictureInPicture, renderSideBySide]);
  
  // ============================================================================
  // STREAMING (WebRTC Core)
  // ============================================================================
  
  const startPreview = useCallback(async () => {
    try {
      console.log('Starting preview...');
      initAudioMixer();
      
      // Use bulletproof camera preview function
      const { videoEl, stream } = await startCameraPreview({
        cameraId: selectedCamera,
        micId: selectedMicrophone,
      });
      
      console.log('Camera ready:', stream.id, 'Video size:', videoEl.videoWidth, 'x', videoEl.videoHeight);
      
      // Store streams
      setCameraStream(stream);
      const videoTrack = stream.getVideoTracks()[0];
      const audioTracks = stream.getAudioTracks();
      
      if (audioTracks.length > 0) {
        const audioStream = new MediaStream([audioTracks[0]]);
        setAudioStream(audioStream);
        addAudioSource('microphone', audioStream, 1.0);
      }
      
      // Store video element for rendering
      videoElementsRef.current.set('camera-source', videoEl);
      
      // Create default scene if none exist and set camera source
      const cameraSource: StreamSource = {
        id: 'camera-source',
        type: 'camera',
        label: 'Camera',
        enabled: true,
        stream: stream,
        volume: 1.0
      };
      
      if (scenes.length === 0) {
        console.log('Creating default scene with camera');
        const newScene: Scene = {
          id: `scene-${Date.now()}`,
          name: 'Main Scene',
          sources: [cameraSource],
          layout: 'fullscreen',
          isActive: true
        };
        setScenes([newScene]);
        setActiveSceneId(newScene.id);
      } else {
        // Add camera to existing active scene
        const activeScene = scenes.find(s => s.id === activeSceneId);
        if (activeScene) {
          const hasCameraSource = activeScene.sources.some(s => s.type === 'camera');
          if (!hasCameraSource) {
            console.log('Adding camera to existing scene');
            addSourceToScene(activeScene.id, cameraSource);
          }
        }
      }
      
      // Set status to preview - this will trigger the render loop via useEffect
      setStatus('preview');
      console.log('Preview started - render loop will begin via effect');
      
    } catch (error) {
      console.error('Failed to start preview:', error);
      setStatus('error');
    }
  }, [
    selectedCamera, 
    selectedMicrophone,
    scenes,
    activeSceneId,
    initAudioMixer, 
    addAudioSource,
    addSourceToScene
  ]);
  
  const stopPreview = useCallback(() => {
    // Guard: Only allow user-initiated stops
    if (!assertNoExternalReset('user')) {
      console.warn('🚫 stopPreview blocked: not user-initiated');
      return;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setStatus('offline');
  }, []);
  
  const monitorStreamHealth = useCallback(() => {
    if (!peerConnectionRef.current) return;
    
    peerConnectionRef.current.getStats().then(stats => {
      let totalBitrate = 0;
      let fps = 0;
      let packetLoss = 0;
      
      stats.forEach(report => {
        if (report.type === 'outbound-rtp') {
          if (report.mediaType === 'video') {
            totalBitrate += report.bytesSent || 0;
            fps = report.framesPerSecond || 0;
          }
        }
        
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          const rtt = report.currentRoundTripTime || 0;
          packetLoss = ((report.packetsLost || 0) / (report.packetsSent || 1)) * 100;
          
          setStreamHealth(prev => ({
            ...prev,
            latency: Math.round(rtt * 1000),
            packetLoss: Math.round(packetLoss * 100) / 100
          }));
        }
      });
      
      // Calculate network quality
      let networkQuality: StreamHealth['networkQuality'] = 'excellent';
      if (packetLoss > 5 || fps < 20) networkQuality = 'poor';
      else if (packetLoss > 2 || fps < 25) networkQuality = 'fair';
      else if (packetLoss > 1 || fps < 28) networkQuality = 'good';
      
      setStreamHealth(prev => ({
        ...prev,
        bitrate: Math.round(totalBitrate / 1000),
        fps,
        networkQuality
      }));
    });
  }, []);
  
  const goLive = useCallback(async () => {
    if (!canvasRef.current || !audioDestinationRef.current || !channelId) {
      console.error('Missing canvas, audio destination, or channel ID');
      return false;
    }
    
    try {
      // Create composite stream from canvas
      const canvasStream = canvasRef.current.captureStream(30);
      const audioTracks = audioDestinationRef.current.stream.getAudioTracks();
      
      // Combine video and audio
      const compositeStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioTracks
      ]);
      
      localStreamRef.current = compositeStream;
      
      // Create stream record in Supabase
      const supabase = createClient();
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('User not authenticated');
      }
      
      const { data: stream, error } = await supabase
        .from('streams')
        .insert({
          channel_id: channelId,
          title: `Live Stream - ${new Date().toLocaleString()}`,
          status: 'offline' as StreamDBState, // Start as offline, update to live after publish succeeds
          webrtc_room_id: `stream-${Date.now()}`,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setStreamId(stream.id);
      
      // Generate LiveKit token
      const roomName = `stream-${stream.id}`;
      const participantName = `broadcaster-${user.user.id}`;
      const token = await generateLiveKitToken(roomName, participantName, true);
      
      if (!token) {
        throw new Error('Failed to generate LiveKit token');
      }
      
      // Create and connect LiveKit client
      const client = createLiveKitClient();
      await client.connect(token, {
        audio: true,
        video: true,
        adaptiveStream: true,
        dynacast: true
      });
      
      // Publish composite stream (canvas video + mixed audio)
      const canvasVideoTrack = compositeStream.getVideoTracks()[0];
      const mixedAudioTrack = compositeStream.getAudioTracks()[0];
      
      if (canvasVideoTrack && mixedAudioTrack) {
        await client.publishCompositeStream(canvasVideoTrack, mixedAudioTrack);
      } else if (canvasVideoTrack) {
        await client.publishVideoTrack(canvasVideoTrack);
      }
      
      setLiveKitClient(client);
      
      // Start RTMP egress for multi-platform streaming
      try {
        const { startRtmpEgress } = await import('@/lib/livekit/client');
        const egressResult = await startRtmpEgress(roomName, channelId);
        
        if (egressResult.success) {
          console.log('✅ RTMP egress started:', egressResult.egressIds);
        } else {
          console.warn('⚠️ Some RTMP destinations failed:', egressResult.errors);
        }
      } catch (error) {
        console.error('Failed to start RTMP egress:', error);
        // Continue anyway - LiveKit stream is still working
      }
      
      // Set status to live AFTER LiveKit connection succeeds
      setStatus('live');
      setDuration(0);
      
      // Update stream record from draft to live
      await supabase
        .from('streams')
        .update({ 
          status: 'live' as StreamDBState,
          started_at: new Date().toISOString()
        })
        .eq('id', stream.id);
      
      // Start duration timer
      durationTimerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
      // Start health monitoring
      healthCheckTimerRef.current = setInterval(() => {
        monitorStreamHealth();
      }, 5000);
      
      console.log('🎥 Live streaming via LiveKit!');
      
      return true;
      
    } catch (error) {
      console.error('Failed to go live:', error);
      setStatus('error');
      return false;
    }
  }, [channelId, monitorStreamHealth]);
  
  const stopStream = useCallback(async () => {
    // Guard: Only allow user-initiated stops
    if (!assertNoExternalReset('user')) {
      console.warn('🚫 stopStream blocked: not user-initiated');
      return false;
    }
    
    try {
      // Disconnect from LiveKit
      if (liveKitClient) {
        liveKitClient.disconnect();
        setLiveKitClient(null);
      }
      
      // Stop all timers
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      
      if (healthCheckTimerRef.current) {
        clearInterval(healthCheckTimerRef.current);
        healthCheckTimerRef.current = null;
      }
      
      // Stop all tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      // Close peer connection (if any fallback)
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Update stream status in Supabase
      if (streamId) {
        const supabase = createClient();
        await supabase
          .from('streams')
          .update({ 
            status: 'ended' as StreamDBState,
            ended_at: new Date().toISOString()
          })
          .eq('id', streamId);
        
        setStreamId(null);
      }
      
      // Stop sources
      stopCamera();
      stopMicrophone();
      stopScreenShare();
      
      setStatus('offline');
      setDuration(0);
      setViewerCount(0);
      
      return true;
    } catch (error) {
      console.error('Failed to stop stream:', error);
      return false;
    }
  }, [liveKitClient, streamId, stopCamera, stopMicrophone, stopScreenShare]);
  
  // ============================================================================
  // INITIALIZE & CLEANUP
  // ============================================================================
  
  useEffect(() => {
    // Enumerate devices on mount
    enumerateDevices();
    
    // Listen for device changes (USB devices plugged/unplugged)
    const handleDeviceChange = () => {
      enumerateDevices();
    };
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      // DO NOT call stopStream() here - it causes race conditions
      // when dependencies change. Stream should only stop on explicit user action.
    };
  }, [enumerateDevices]);
  
  // ============================================================================
  // REAL-TIME VIEWER COUNT SUBSCRIPTION
  // ============================================================================
  
  useEffect(() => {
    if (!streamId || status !== 'live') {
      return;
    }
    
    console.log('📊 Subscribing to viewer count for stream:', streamId);
    const supabase = createClient();
    
    // Get initial viewer count
    const fetchViewerCount = async () => {
      const { count, error } = await supabase
        .from('view_events')
        .select('*', { count: 'exact', head: true })
        .eq('stream_id', streamId)
        .is('ended_at', null);
      
      if (!error && count !== null) {
        console.log('👁️ Current viewer count:', count);
        setViewerCount(count);
      }
    };
    
    fetchViewerCount();
    
    // Subscribe to real-time viewer count updates
    const channel = supabase
      .channel(`stream-viewers-${streamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'view_events',
          filter: `stream_id=eq.${streamId}`,
        },
        async () => {
          // Re-fetch the count when view events change
          await fetchViewerCount();
        }
      )
      .subscribe((status) => {
        console.log('📡 Viewer count subscription status:', status);
      });
    
    return () => {
      console.log('🔕 Unsubscribing from viewer count');
      supabase.removeChannel(channel);
    };
  }, [streamId, status]);

  // Initialize default scene
  useEffect(() => {
    if (scenes.length === 0) {
      const defaultScene = createScene('Main Scene', 'fullscreen');
      
      // Add camera source if available
      if (cameraStream) {
        addSourceToScene(defaultScene.id, {
          id: 'camera-source',
          type: 'camera',
          label: 'Camera',
          stream: cameraStream,
          enabled: true,
          volume: 0
        });
      }
    }
  }, [scenes.length, cameraStream, createScene, addSourceToScene]);
  
  // Update camera source in scenes when cameraStream changes
  useEffect(() => {
    if (cameraStream && scenes.length > 0) {
      console.log('Camera stream changed, updating scene sources and video element');
      
      // Update all camera sources in all scenes with new stream
      setScenes(prev => prev.map(scene => ({
        ...scene,
        sources: scene.sources.map(source =>
          source.type === 'camera'
            ? { ...source, stream: cameraStream }
            : source
        )
      })));
      
      // Create or update video element with new stream
      const cameraSourceId = 'camera-source';
      let video = videoElementsRef.current.get(cameraSourceId);
      
      if (!video) {
        // Create new video element if it doesn't exist
        video = document.createElement('video');
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        videoElementsRef.current.set(cameraSourceId, video);
      }
      
      // Update video element with new stream
      video.srcObject = cameraStream;
      video.play().catch(err => console.warn('Video play failed:', err));
      
      console.log('Video element updated with new stream');
    }
  }, [cameraStream]);
  
  // Start render loop when canvas is ready and we have scenes
  useEffect(() => {
    if (canvasRef.current && compositorRef.current && scenes.length > 0 && (status === 'preview' || status === 'live')) {
      console.log('Starting render loop from effect');
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderFrame();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [canvasRef.current, compositorRef.current, scenes.length, status, renderFrame]);
  
  // ============================================================================
  // RETURN API
  // ============================================================================
  
  return {
    // Devices
    cameras,
    microphones,
    speakers,
    selectedCamera,
    selectedMicrophone,
    setSelectedCamera,
    setSelectedMicrophone,
    enumerateDevices,
    
    // Streams
    cameraStream,
    screenStream,
    audioStream,
    
    // Device Controls
    startCamera,
    stopCamera,
    startMicrophone,
    stopMicrophone,
    startScreenShare,
    stopScreenShare,
    
    // Audio Mixing
    addAudioSource,
    removeAudioSource,
    setAudioVolume,
    muteAudio,
    
    // Scenes
    scenes,
    activeSceneId,
    createScene,
    deleteScene,
    switchScene,
    addSourceToScene,
    removeSourceFromScene,
    updateSceneLayout,
    
    // Compositor
    initCanvas,
    
    // Streaming
    status,
    streamId,
    streamHealth,
    duration,
    viewerCount,
    startPreview,
    stopPreview,
    goLive,
    stopStream,
    
    // Legacy compatibility
    isLive: status === 'live',
    isPreview: status === 'preview',
    health: streamHealth.networkQuality,
  };
}
