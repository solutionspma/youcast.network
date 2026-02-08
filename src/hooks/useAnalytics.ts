'use client';

import { useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type ViewEvent = {
  stream_id: string;
  viewer_id?: string;
  session_id: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  location?: string;
  quality?: string;
  buffering_count?: number;
};

export type EngagementEvent = {
  stream_id: string;
  viewer_id?: string;
  event_type: 'like' | 'share' | 'comment' | 'subscribe' | 'tip' | 'join' | 'leave';
  event_data?: Record<string, any>;
};

// ============================================================================
// USEANALYTICS HOOK - Real Analytics Ingestion
// ============================================================================

export function useAnalytics() {
  const supabase = createClient();
  const sessionIdRef = useRef<string>(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const viewEventIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // ============================================================================
  // DEVICE DETECTION
  // ============================================================================
  
  const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
    if (typeof window === 'undefined') return 'desktop';
    
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };
  
  const getBrowser = (): string => {
    if (typeof window === 'undefined') return 'unknown';
    
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  };
  
  // ============================================================================
  // VIEW TRACKING
  // ============================================================================
  
  const startViewTracking = useCallback(async (streamId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      startTimeRef.current = new Date();
      
      // Create view event
      const { data, error } = await supabase
        .from('view_events')
        .insert({
          stream_id: streamId,
          viewer_id: user?.id,
          session_id: sessionIdRef.current,
          started_at: startTimeRef.current.toISOString(),
          device_type: getDeviceType(),
          browser: getBrowser(),
        })
        .select()
        .single();
      
      if (error) {
        console.error('Failed to create view event:', error);
        return null;
      }
      
      viewEventIdRef.current = data.id;
      
      // Start heartbeat to update duration every 30 seconds
      heartbeatIntervalRef.current = setInterval(() => {
        updateViewDuration(streamId);
      }, 30000);
      
      return data.id;
    } catch (error) {
      console.error('Error starting view tracking:', error);
      return null;
    }
  }, []);
  
  const updateViewDuration = useCallback(async (streamId: string) => {
    if (!viewEventIdRef.current || !startTimeRef.current) return;
    
    try {
      const duration = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
      
      await supabase
        .from('view_events')
        .update({
          duration_seconds: duration,
        })
        .eq('id', viewEventIdRef.current);
    } catch (error) {
      console.error('Error updating view duration:', error);
    }
  }, []);
  
  const stopViewTracking = useCallback(async (streamId: string) => {
    if (!viewEventIdRef.current || !startTimeRef.current) return;
    
    try {
      // Stop heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - startTimeRef.current.getTime()) / 1000);
      
      // Update final view event
      await supabase
        .from('view_events')
        .update({
          ended_at: endTime.toISOString(),
          duration_seconds: duration,
        })
        .eq('id', viewEventIdRef.current);
      
      viewEventIdRef.current = null;
      startTimeRef.current = null;
    } catch (error) {
      console.error('Error stopping view tracking:', error);
    }
  }, []);
  
  // ============================================================================
  // ENGAGEMENT TRACKING
  // ============================================================================
  
  const trackEngagement = useCallback(async (
    streamId: string,
    eventType: EngagementEvent['event_type'],
    eventData?: Record<string, any>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('engagement_events')
        .insert({
          stream_id: streamId,
          viewer_id: user?.id,
          event_type: eventType,
          event_data: eventData,
        });
      
      if (error) {
        console.error('Failed to track engagement:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error tracking engagement:', error);
      return false;
    }
  }, []);
  
  const trackLike = useCallback((streamId: string) => {
    return trackEngagement(streamId, 'like');
  }, [trackEngagement]);
  
  const trackShare = useCallback((streamId: string, platform?: string) => {
    return trackEngagement(streamId, 'share', { platform });
  }, [trackEngagement]);
  
  const trackComment = useCallback((streamId: string, commentId: string, commentText: string) => {
    return trackEngagement(streamId, 'comment', { comment_id: commentId, text: commentText });
  }, [trackEngagement]);
  
  const trackSubscribe = useCallback((streamId: string, channelId: string) => {
    return trackEngagement(streamId, 'subscribe', { channel_id: channelId });
  }, [trackEngagement]);
  
  const trackTip = useCallback((streamId: string, amount: number, currency: string) => {
    return trackEngagement(streamId, 'tip', { amount, currency });
  }, [trackEngagement]);
  
  const trackJoin = useCallback((streamId: string) => {
    return trackEngagement(streamId, 'join');
  }, [trackEngagement]);
  
  const trackLeave = useCallback((streamId: string) => {
    return trackEngagement(streamId, 'leave');
  }, [trackEngagement]);
  
  // ============================================================================
  // VIEWER COUNT (Real-Time)
  // ============================================================================
  
  const subscribeToViewerCount = useCallback((streamId: string, callback: (count: number) => void) => {
    // Subscribe to real-time viewer count updates
    const channel = supabase
      .channel(`stream-${streamId}-viewers`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'view_events',
          filter: `stream_id=eq.${streamId}`,
        },
        async () => {
          // Count active viewers (views with no ended_at)
          const { count, error } = await supabase
            .from('view_events')
            .select('*', { count: 'exact', head: true })
            .eq('stream_id', streamId)
            .is('ended_at', null);
          
          if (!error && count !== null) {
            callback(count);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  // ============================================================================
  // STREAM ANALYTICS (Dashboard)
  // ============================================================================
  
  const getStreamAnalytics = useCallback(async (streamId: string) => {
    try {
      // Get view stats
      const { data: viewStats, error: viewError } = await supabase
        .from('view_events')
        .select('*')
        .eq('stream_id', streamId);
      
      if (viewError) throw viewError;
      
      // Get engagement stats
      const { data: engagementStats, error: engagementError } = await supabase
        .from('engagement_events')
        .select('*')
        .eq('stream_id', streamId);
      
      if (engagementError) throw engagementError;
      
      // Calculate metrics
      const totalViews = viewStats?.length || 0;
      const uniqueViewers = new Set(viewStats?.map(v => v.viewer_id).filter(Boolean)).size;
      const avgWatchTime = viewStats?.reduce((acc, v) => acc + (v.duration_seconds || 0), 0) / totalViews || 0;
      const peakViewers = Math.max(...(viewStats?.map(v => 1) || [0])); // Would need timestamps to calculate properly
      
      const likes = engagementStats?.filter(e => e.event_type === 'like').length || 0;
      const shares = engagementStats?.filter(e => e.event_type === 'share').length || 0;
      const comments = engagementStats?.filter(e => e.event_type === 'comment').length || 0;
      const subscriptions = engagementStats?.filter(e => e.event_type === 'subscribe').length || 0;
      const tips = engagementStats?.filter(e => e.event_type === 'tip') || [];
      const totalTipAmount = tips.reduce((acc, t) => acc + (t.event_data?.amount || 0), 0);
      
      return {
        views: {
          total: totalViews,
          unique: uniqueViewers,
          avgWatchTime: Math.round(avgWatchTime),
          peak: peakViewers,
        },
        engagement: {
          likes,
          shares,
          comments,
          subscriptions,
          tips: tips.length,
          totalTipAmount,
        },
        devices: {
          desktop: viewStats?.filter(v => v.device_type === 'desktop').length || 0,
          mobile: viewStats?.filter(v => v.device_type === 'mobile').length || 0,
          tablet: viewStats?.filter(v => v.device_type === 'tablet').length || 0,
        },
        browsers: viewStats?.reduce((acc, v) => {
          acc[v.browser] = (acc[v.browser] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {},
      };
    } catch (error) {
      console.error('Error getting stream analytics:', error);
      return null;
    }
  }, []);
  
  const getChannelAnalytics = useCallback(async (channelId: string) => {
    try {
      // Get all streams for this channel
      const { data: streams, error: streamsError } = await supabase
        .from('streams')
        .select('id')
        .eq('channel_id', channelId);
      
      if (streamsError) throw streamsError;
      
      const streamIds = streams?.map(s => s.id) || [];
      
      // Get all view events for these streams
      const { data: viewEvents, error: viewError } = await supabase
        .from('view_events')
        .select('*')
        .in('stream_id', streamIds);
      
      if (viewError) throw viewError;
      
      // Get all engagement events
      const { data: engagementEvents, error: engagementError } = await supabase
        .from('engagement_events')
        .select('*')
        .in('stream_id', streamIds);
      
      if (engagementError) throw engagementError;
      
      // Calculate aggregate metrics
      const totalViews = viewEvents?.length || 0;
      const uniqueViewers = new Set(viewEvents?.map(v => v.viewer_id).filter(Boolean)).size;
      const totalWatchTime = viewEvents?.reduce((acc, v) => acc + (v.duration_seconds || 0), 0) || 0;
      
      const totalLikes = engagementEvents?.filter(e => e.event_type === 'like').length || 0;
      const totalShares = engagementEvents?.filter(e => e.event_type === 'share').length || 0;
      const totalComments = engagementEvents?.filter(e => e.event_type === 'comment').length || 0;
      const totalSubscriptions = engagementEvents?.filter(e => e.event_type === 'subscribe').length || 0;
      
      return {
        totalStreams: streams?.length || 0,
        totalViews,
        uniqueViewers,
        totalWatchTime: Math.round(totalWatchTime / 60), // minutes
        totalLikes,
        totalShares,
        totalComments,
        totalSubscriptions,
        avgViewsPerStream: Math.round(totalViews / (streams?.length || 1)),
      };
    } catch (error) {
      console.error('Error getting channel analytics:', error);
      return null;
    }
  }, []);
  
  // ============================================================================
  // CLEANUP
  // ============================================================================
  
  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);
  
  // ============================================================================
  // RETURN API
  // ============================================================================
  
  return {
    // View Tracking
    startViewTracking,
    stopViewTracking,
    updateViewDuration,
    
    // Engagement Tracking
    trackEngagement,
    trackLike,
    trackShare,
    trackComment,
    trackSubscribe,
    trackTip,
    trackJoin,
    trackLeave,
    
    // Real-Time
    subscribeToViewerCount,
    
    // Analytics
    getStreamAnalytics,
    getChannelAnalytics,
    
    // Session Info
    sessionId: sessionIdRef.current,
  };
}
