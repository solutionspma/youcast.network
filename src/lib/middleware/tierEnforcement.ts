// ============================================================================
// TIER ENFORCEMENT MIDDLEWARE
// Server-side only - NEVER enforce limits in UI only
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ─── Tier Configuration ──────────────────────────────────────────────────────

export const TIER_RULES = {
  guest: {
    maxDuration: 900,           // 15 minutes
    sessionsPerWeek: 1,
    externalRTMP: false,
    maxOverlays: 1,
    maxDestinations: 0,
    aiFeatures: false,
    storageGB: 0,
    maxBitrateKbps: 1500,
    maxResolution: '720p',
  },
  free: {
    maxDuration: 1800,          // 30 minutes
    sessionsPerWeek: 3,
    externalRTMP: false,
    maxOverlays: 2,
    maxDestinations: 1,
    aiFeatures: false,
    storageGB: 1,
    maxBitrateKbps: 2500,
    maxResolution: '720p',
  },
  creator: {
    maxDuration: 14400,         // 4 hours
    sessionsPerWeek: 10,
    externalRTMP: true,
    maxOverlays: 5,
    maxDestinations: 3,
    aiFeatures: true,
    storageGB: 50,
    maxBitrateKbps: 6000,
    maxResolution: '1080p',
  },
  pro: {
    maxDuration: 43200,         // 12 hours
    sessionsPerWeek: -1,        // unlimited
    externalRTMP: true,
    maxOverlays: 10,
    maxDestinations: 5,
    aiFeatures: true,
    storageGB: 500,
    maxBitrateKbps: 10000,
    maxResolution: '1080p',
  },
  enterprise: {
    maxDuration: -1,            // unlimited
    sessionsPerWeek: -1,
    externalRTMP: true,
    maxOverlays: -1,
    maxDestinations: -1,
    aiFeatures: true,
    storageGB: -1,
    maxBitrateKbps: 25000,
    maxResolution: '4k',
  },
} as const;

export type Tier = keyof typeof TIER_RULES;
export type TierRule = typeof TIER_RULES[Tier];

// ─── Enforcement Types ───────────────────────────────────────────────────────

export type EnforcementAction =
  | 'stream_start'
  | 'stream_duration'
  | 'add_destination'
  | 'add_overlay'
  | 'ai_request'
  | 'storage_write'
  | 'set_bitrate'
  | 'set_resolution';

export interface EnforcementResult {
  allowed: boolean;
  tier: Tier;
  limit: number;
  current: number;
  reason?: string;
}

export class TierViolationError extends Error {
  public readonly tier: Tier;
  public readonly action: EnforcementAction;
  public readonly limit: number;
  public readonly current: number;

  constructor(
    message: string,
    tier: Tier,
    action: EnforcementAction,
    limit: number,
    current: number
  ) {
    super(message);
    this.name = 'TierViolationError';
    this.tier = tier;
    this.action = action;
    this.limit = limit;
    this.current = current;
  }
}

// ─── Enforcement Functions ───────────────────────────────────────────────────

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Get user's current tier
 */
export async function getUserTier(userId: string): Promise<Tier> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .single();
    
  if (error || !data) {
    return 'free'; // Default to free
  }
  
  return (data.tier as Tier) || 'free';
}

/**
 * Check if an action is allowed for a user's tier
 */
export async function tierAllows(
  userId: string,
  action: EnforcementAction,
  currentValue: number = 0
): Promise<EnforcementResult> {
  const tier = await getUserTier(userId);
  const rules = TIER_RULES[tier];
  const supabase = getSupabaseAdmin();
  
  switch (action) {
    case 'stream_start': {
      // Check weekly session count
      const { count } = await supabase
        .from('stream_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
        
      const sessionCount = count || 0;
      const limit = rules.sessionsPerWeek;
      
      if (limit === -1 || sessionCount < limit) {
        return { allowed: true, tier, limit, current: sessionCount };
      }
      return {
        allowed: false,
        tier,
        limit,
        current: sessionCount,
        reason: `Weekly session limit reached (${sessionCount}/${limit})`,
      };
    }
    
    case 'stream_duration': {
      const limit = rules.maxDuration;
      if (limit === -1 || currentValue <= limit) {
        return { allowed: true, tier, limit, current: currentValue };
      }
      return {
        allowed: false,
        tier,
        limit,
        current: currentValue,
        reason: `Max stream duration exceeded (${Math.floor(currentValue / 60)}/${Math.floor(limit / 60)} minutes)`,
      };
    }
    
    case 'add_destination': {
      if (!rules.externalRTMP) {
        return {
          allowed: false,
          tier,
          limit: 0,
          current: 0,
          reason: 'External RTMP not available on this tier',
        };
      }
      
      const { count } = await supabase
        .from('streaming_destinations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_enabled', true);
        
      const destCount = count || 0;
      const limit = rules.maxDestinations;
      
      if (limit === -1 || destCount < limit) {
        return { allowed: true, tier, limit, current: destCount };
      }
      return {
        allowed: false,
        tier,
        limit,
        current: destCount,
        reason: `Destination limit reached (${destCount}/${limit})`,
      };
    }
    
    case 'add_overlay': {
      const limit = rules.maxOverlays;
      if (limit === -1 || currentValue < limit) {
        return { allowed: true, tier, limit, current: currentValue };
      }
      return {
        allowed: false,
        tier,
        limit,
        current: currentValue,
        reason: `Overlay limit reached (${currentValue}/${limit})`,
      };
    }
    
    case 'ai_request': {
      if (rules.aiFeatures) {
        return { allowed: true, tier, limit: 1, current: 0 };
      }
      return {
        allowed: false,
        tier,
        limit: 0,
        current: 0,
        reason: 'AI features not available on this tier',
      };
    }
    
    case 'storage_write': {
      const limit = rules.storageGB;
      if (limit === -1) {
        return { allowed: true, tier, limit: -1, current: currentValue };
      }
      
      // Get current storage usage (approximate)
      const { data: videos } = await supabase
        .from('videos')
        .select('duration_seconds')
        .eq('owner_id', userId);
        
      // Estimate ~100MB per hour of video
      const usedGB = (videos || []).reduce((acc, v) => acc + (v.duration_seconds || 0) / 3600 * 0.1, 0);
      const newTotal = usedGB + currentValue / 1024; // currentValue in MB
      
      if (newTotal <= limit) {
        return { allowed: true, tier, limit, current: usedGB };
      }
      return {
        allowed: false,
        tier,
        limit,
        current: usedGB,
        reason: `Storage limit exceeded (${usedGB.toFixed(1)}/${limit} GB)`,
      };
    }
    
    case 'set_bitrate': {
      const limit = rules.maxBitrateKbps;
      if (currentValue <= limit) {
        return { allowed: true, tier, limit, current: currentValue };
      }
      return {
        allowed: false,
        tier,
        limit,
        current: currentValue,
        reason: `Bitrate limit exceeded (${currentValue}/${limit} kbps)`,
      };
    }
    
    case 'set_resolution': {
      const maxRes = rules.maxResolution;
      const resolutionOrder = ['720p', '1080p', '4k'];
      const maxIndex = resolutionOrder.indexOf(maxRes);
      const currentIndex = resolutionOrder.indexOf(currentValue.toString());
      
      if (currentIndex <= maxIndex) {
        return { allowed: true, tier, limit: maxIndex, current: currentIndex };
      }
      return {
        allowed: false,
        tier,
        limit: maxIndex,
        current: currentIndex,
        reason: `Resolution ${currentValue} not available. Max: ${maxRes}`,
      };
    }
    
    default:
      return { allowed: true, tier, limit: -1, current: 0 };
  }
}

/**
 * Enforce tier limits - throws if not allowed
 */
export async function enforceTierLimit(
  userId: string,
  action: EnforcementAction,
  currentValue: number = 0
): Promise<void> {
  const result = await tierAllows(userId, action, currentValue);
  
  if (!result.allowed) {
    // Log violation
    const supabase = getSupabaseAdmin();
    await supabase.from('stream_limit_violations').insert({
      user_id: userId,
      violation_type: action,
      limit_value: result.limit,
      actual_value: result.current,
      enforced: true,
    });
    
    throw new TierViolationError(
      result.reason || 'Tier limit exceeded',
      result.tier as Tier,
      action,
      result.limit,
      result.current
    );
  }
}

// ─── API Route Middleware ────────────────────────────────────────────────────

type RouteHandler = (
  req: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse>;

/**
 * Middleware wrapper for tier enforcement
 */
export function withTierEnforcement(
  action: EnforcementAction,
  getCurrentValue?: (req: NextRequest, userId: string) => Promise<number>
) {
  return function (handler: RouteHandler): RouteHandler {
    return async function (req: NextRequest, context?: { params?: Record<string, string> }) {
      // Get user ID from auth header or session
      const authHeader = req.headers.get('authorization');
      let userId: string | null = null;
      
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const supabase = getSupabaseAdmin();
        const { data } = await supabase.auth.getUser(token);
        userId = data.user?.id || null;
      }
      
      if (!userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      // Get current value if function provided
      const currentValue = getCurrentValue 
        ? await getCurrentValue(req, userId) 
        : 0;
      
      // Check tier limits
      const result = await tierAllows(userId, action, currentValue);
      
      if (!result.allowed) {
        // Log violation
        const supabase = getSupabaseAdmin();
        await supabase.from('stream_limit_violations').insert({
          user_id: userId,
          violation_type: action,
          limit_value: result.limit,
          actual_value: result.current,
          enforced: true,
        });
        
        return NextResponse.json(
          {
            error: 'Tier limit exceeded',
            details: {
              tier: result.tier,
              action,
              limit: result.limit,
              current: result.current,
              reason: result.reason,
              upgradeUrl: '/dashboard/settings/subscription',
            },
          },
          { status: 403 }
        );
      }
      
      // Proceed with handler
      return handler(req, context);
    };
  };
}

// ─── Direct Import for API Routes ────────────────────────────────────────────

export async function checkAndEnforce(
  userId: string,
  action: EnforcementAction,
  currentValue: number = 0
): Promise<{ success: true } | { success: false; error: string; status: number }> {
  const result = await tierAllows(userId, action, currentValue);
  
  if (!result.allowed) {
    // Log violation
    const supabase = getSupabaseAdmin();
    await supabase.from('stream_limit_violations').insert({
      user_id: userId,
      violation_type: action,
      limit_value: result.limit,
      actual_value: result.current,
      enforced: true,
    });
    
    return {
      success: false,
      error: result.reason || 'Tier limit exceeded',
      status: 403,
    };
  }
  
  return { success: true };
}

// ─── Tier Display Helpers ────────────────────────────────────────────────────

export function formatTierLimits(tier: Tier): Record<string, string> {
  const rules = TIER_RULES[tier];
  
  return {
    duration: rules.maxDuration === -1 
      ? 'Unlimited' 
      : `${Math.floor(rules.maxDuration / 3600)}h ${Math.floor((rules.maxDuration % 3600) / 60)}m`,
    sessions: rules.sessionsPerWeek === -1 
      ? 'Unlimited' 
      : `${rules.sessionsPerWeek} per week`,
    rtmp: rules.externalRTMP ? 'Yes' : 'No',
    overlays: rules.maxOverlays === -1 
      ? 'Unlimited' 
      : `${rules.maxOverlays}`,
    destinations: rules.maxDestinations === -1 
      ? 'Unlimited' 
      : `${rules.maxDestinations}`,
    ai: rules.aiFeatures ? 'Yes' : 'No',
    storage: rules.storageGB === -1 
      ? 'Unlimited' 
      : `${rules.storageGB} GB`,
    bitrate: `${rules.maxBitrateKbps} kbps`,
    resolution: rules.maxResolution,
  };
}

export function getTierUpgradeBenefits(currentTier: Tier): string[] {
  const tiers: Tier[] = ['guest', 'free', 'creator', 'pro', 'enterprise'];
  const currentIndex = tiers.indexOf(currentTier);
  
  if (currentIndex === tiers.length - 1) {
    return ['You have the highest tier!'];
  }
  
  const nextTier = tiers[currentIndex + 1];
  const currentRules = TIER_RULES[currentTier];
  const nextRules = TIER_RULES[nextTier];
  const benefits: string[] = [];
  
  if (nextRules.maxDuration !== currentRules.maxDuration) {
    benefits.push(`Longer streams: up to ${nextRules.maxDuration === -1 ? 'unlimited' : `${Math.floor(nextRules.maxDuration / 3600)} hours`}`);
  }
  
  if (nextRules.sessionsPerWeek !== currentRules.sessionsPerWeek) {
    benefits.push(`More streams: ${nextRules.sessionsPerWeek === -1 ? 'unlimited' : nextRules.sessionsPerWeek} per week`);
  }
  
  if (nextRules.externalRTMP && !currentRules.externalRTMP) {
    benefits.push('Stream to YouTube, Twitch, and more');
  }
  
  if (nextRules.maxOverlays !== currentRules.maxOverlays) {
    benefits.push(`More overlays: ${nextRules.maxOverlays === -1 ? 'unlimited' : nextRules.maxOverlays}`);
  }
  
  if (nextRules.aiFeatures && !currentRules.aiFeatures) {
    benefits.push('AI-powered features');
  }
  
  if (nextRules.storageGB !== currentRules.storageGB) {
    benefits.push(`More storage: ${nextRules.storageGB === -1 ? 'unlimited' : `${nextRules.storageGB} GB`}`);
  }
  
  return benefits;
}
