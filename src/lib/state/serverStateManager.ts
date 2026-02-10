// ============================================================================
// SERVER-SIDE BROADCAST STATE MANAGER
// All commands MUST go through this service
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  BroadcastState,
  BroadcastCommand,
  CommandResult,
  CommandValidation,
  StreamConfig,
  TierLimitsResult,
} from '@/types/broadcast-state';
import {
  createDefaultBroadcastState,
  commandValidators,
  applyCommand,
} from '@/types/broadcast-state';

// ─── In-Memory State Store ───────────────────────────────────────────────────
// In production, use Redis or similar

const stateStore = new Map<string, BroadcastState>();
const subscribers = new Map<string, Set<(state: BroadcastState) => void>>();

// ─── Helper Functions ────────────────────────────────────────────────────────

function getSupabaseAdmin(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── Tier Enforcement ────────────────────────────────────────────────────────

export async function checkTierLimits(
  userId: string,
  action: string,
  actionValue: number = 0
): Promise<TierLimitsResult> {
  const supabase = getSupabaseAdmin();
  
  const { data, error } = await supabase.rpc('tier_allows', {
    check_user_id: userId,
    action_type: action,
    action_value: actionValue,
  });
  
  if (error) {
    console.error('Tier check error:', error);
    // Fail closed - deny on error
    return {
      allowed: false,
      reason: 'Tier verification failed',
      tier: 'unknown',
      limits: {} as TierLimitsResult['limits'],
    };
  }
  
  return {
    allowed: data.allowed,
    reason: data.reason || '',
    tier: data.tier,
    limits: data.limits,
  };
}

// ─── Stream Lifecycle ────────────────────────────────────────────────────────

export async function createStream(
  userId: string,
  config: StreamConfig
): Promise<BroadcastState> {
  // Check tier limits for starting a stream
  const tierCheck = await checkTierLimits(userId, 'stream_start');
  if (!tierCheck.allowed) {
    throw new Error(`Stream denied: ${tierCheck.reason}`);
  }
  
  // Check if user is suspended
  const supabase = getSupabaseAdmin();
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_suspended, suspended_until')
    .eq('id', userId)
    .single();
    
  if (profile?.is_suspended) {
    const until = profile.suspended_until 
      ? new Date(profile.suspended_until).toISOString() 
      : 'indefinitely';
    throw new Error(`Account suspended until ${until}`);
  }
  
  // Create stream in database
  const { data: stream, error } = await supabase
    .from('streams')
    .insert({
      owner_id: userId,
      title: config.title,
      description: config.description,
      visibility: config.visibility,
      status: 'preview',
      is_recorded: config.recordingEnabled,
    })
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to create stream: ${error.message}`);
  }
  
  // Create session record for tracking
  await supabase.from('stream_sessions').insert({
    user_id: userId,
    stream_id: stream.id,
    tier: tierCheck.tier,
    limits_applied: tierCheck.limits,
  });
  
  // Initialize state
  const state = createDefaultBroadcastState(stream.id, userId);
  stateStore.set(stream.id, state);
  
  // Log activity
  await supabase.rpc('log_activity', {
    p_actor_id: userId,
    p_action: 'stream_created',
    p_metadata: { stream_id: stream.id, title: config.title },
    p_category: 'stream',
  });
  
  return state;
}

export async function getStream(streamId: string): Promise<BroadcastState | null> {
  // Check memory first
  if (stateStore.has(streamId)) {
    return stateStore.get(streamId)!;
  }
  
  // Load from database
  const supabase = getSupabaseAdmin();
  const { data: stream } = await supabase
    .from('streams')
    .select('*')
    .eq('id', streamId)
    .single();
    
  if (!stream) {
    return null;
  }
  
  // Reconstruct state (in production, load from Redis/snapshot)
  const state = createDefaultBroadcastState(stream.id, stream.owner_id);
  state.status = stream.status;
  state.startedAt = stream.started_at;
  stateStore.set(streamId, state);
  
  return state;
}

export async function destroyStream(streamId: string): Promise<void> {
  const state = stateStore.get(streamId);
  
  if (state) {
    // Update database
    const supabase = getSupabaseAdmin();
    await supabase
      .from('streams')
      .update({ 
        status: 'ended',
        ended_at: new Date().toISOString(),
        duration_seconds: state.startedAt 
          ? Math.floor((Date.now() - new Date(state.startedAt).getTime()) / 1000)
          : 0,
      })
      .eq('id', streamId);
    
    // End session
    await supabase
      .from('stream_sessions')
      .update({ 
        ended_at: new Date().toISOString(),
        duration: state.startedAt 
          ? Math.floor((Date.now() - new Date(state.startedAt).getTime()) / 1000)
          : 0,
      })
      .eq('stream_id', streamId)
      .is('ended_at', null);
    
    // Clean up
    stateStore.delete(streamId);
    subscribers.delete(streamId);
  }
}

// ─── Command Processing ──────────────────────────────────────────────────────

export async function processCommand(
  streamId: string,
  command: BroadcastCommand
): Promise<CommandResult> {
  const state = await getStream(streamId);
  
  if (!state) {
    return {
      success: false,
      command,
      error: 'Stream not found',
      appliedAt: new Date().toISOString(),
    };
  }
  
  // Validate command
  const validator = commandValidators[command.type];
  if (!validator) {
    return {
      success: false,
      command,
      error: `Unknown command type: ${command.type}`,
      appliedAt: new Date().toISOString(),
    };
  }
  
  const validation = validator(command, state);
  if (!validation.valid) {
    return {
      success: false,
      command,
      error: validation.errors.join(', '),
      appliedAt: new Date().toISOString(),
    };
  }
  
  // Tier enforcement for specific commands
  const tierCheckCommands = ['ADD_OVERLAY', 'START_STREAM', 'START_RECORDING'];
  if (tierCheckCommands.includes(command.type)) {
    let tierAction = '';
    let tierValue = 0;
    
    switch (command.type) {
      case 'ADD_OVERLAY':
        tierAction = 'add_overlay';
        tierValue = state.overlays.length;
        break;
      case 'START_STREAM':
        tierAction = 'stream_start';
        break;
    }
    
    if (tierAction) {
      const tierCheck = await checkTierLimits(command.userId, tierAction, tierValue);
      if (!tierCheck.allowed) {
        return {
          success: false,
          command,
          error: `Tier limit: ${tierCheck.reason}`,
          appliedAt: new Date().toISOString(),
        };
      }
    }
  }
  
  // Check version if specified (optimistic concurrency)
  if (command.expectedVersion !== undefined && command.expectedVersion !== state.version) {
    return {
      success: false,
      command,
      error: `Version mismatch: expected ${command.expectedVersion}, got ${state.version}`,
      appliedAt: new Date().toISOString(),
    };
  }
  
  // Apply command
  const newState = applyCommand(state, command);
  stateStore.set(streamId, newState);
  
  // Broadcast to subscribers
  broadcastState(streamId, newState);
  
  // Persist critical state changes
  await persistStateChange(streamId, command, newState);
  
  return {
    success: true,
    command,
    newState: {
      version: newState.version,
      status: newState.status,
      lastUpdated: newState.lastUpdated,
    },
    appliedAt: new Date().toISOString(),
  };
}

// ─── Admin Operations ────────────────────────────────────────────────────────

export async function killStream(
  streamId: string,
  adminId: string,
  reason: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  
  // Verify admin
  const { data: admin } = await supabase
    .from('profiles')
    .select('global_admin')
    .eq('id', adminId)
    .single();
    
  if (!admin?.global_admin) {
    throw new Error('Unauthorized: Admin access required');
  }
  
  // Kill via database function (handles logging)
  await supabase.rpc('kill_stream', {
    p_admin_id: adminId,
    p_stream_id: streamId,
    p_reason: reason,
  });
  
  // Update in-memory state
  const state = stateStore.get(streamId);
  if (state) {
    state.status = 'killed';
    state.lastUpdated = new Date().toISOString();
    state.version++;
    broadcastState(streamId, state);
  }
}

export async function transferControl(
  streamId: string,
  fromUserId: string,
  toUserId: string
): Promise<void> {
  const state = stateStore.get(streamId);
  if (!state) {
    throw new Error('Stream not found');
  }
  
  if (state.controlAuthority !== fromUserId) {
    throw new Error('Not current control authority');
  }
  
  // Log the transfer
  const supabase = getSupabaseAdmin();
  await supabase.rpc('log_activity', {
    p_actor_id: fromUserId,
    p_action: 'transfer_control',
    p_target_user_id: toUserId,
    p_metadata: { stream_id: streamId },
    p_category: 'stream',
  });
  
  state.controlAuthority = toUserId;
  state.lastUpdated = new Date().toISOString();
  state.version++;
  broadcastState(streamId, state);
}

// ─── Real-time Sync ──────────────────────────────────────────────────────────

export function subscribe(
  streamId: string,
  callback: (state: BroadcastState) => void
): () => void {
  if (!subscribers.has(streamId)) {
    subscribers.set(streamId, new Set());
  }
  
  subscribers.get(streamId)!.add(callback);
  
  return () => {
    subscribers.get(streamId)?.delete(callback);
  };
}

function broadcastState(streamId: string, state: BroadcastState): void {
  const subs = subscribers.get(streamId);
  if (subs) {
    subs.forEach((callback) => {
      try {
        callback(state);
      } catch (error) {
        console.error('Subscriber error:', error);
      }
    });
  }
}

// ─── Persistence ─────────────────────────────────────────────────────────────

async function persistStateChange(
  streamId: string,
  command: BroadcastCommand,
  state: BroadcastState
): Promise<void> {
  const supabase = getSupabaseAdmin();
  
  // Only persist certain state changes
  const persistCommands = ['START_STREAM', 'STOP_STREAM', 'KILL_STREAM', 'START_RECORDING', 'STOP_RECORDING'];
  
  if (persistCommands.includes(command.type)) {
    await supabase
      .from('streams')
      .update({
        status: state.status,
        started_at: state.startedAt,
        viewer_count: state.viewerCount,
        updated_at: state.lastUpdated,
      })
      .eq('id', streamId);
  }
  
  // Check duration limits periodically
  if (state.status === 'live' && state.startedAt) {
    const duration = Math.floor((Date.now() - new Date(state.startedAt).getTime()) / 1000);
    const tierCheck = await checkTierLimits(state.userId, 'stream_duration', duration);
    
    if (!tierCheck.allowed) {
      // Duration exceeded - end stream
      console.log(`Stream ${streamId} exceeded duration limit, ending`);
      await processCommand(streamId, {
        id: `auto-${Date.now()}`,
        type: 'STOP_STREAM',
        userId: state.userId,
        timestamp: new Date().toISOString(),
        payload: { reason: tierCheck.reason },
        source: 'api',
      });
      
      // Log violation
      await supabase.from('stream_limit_violations').insert({
        user_id: state.userId,
        violation_type: 'duration',
        limit_value: tierCheck.limits.maxDuration,
        actual_value: duration,
        enforced: true,
      });
    }
  }
}

// ─── Duration Monitor ────────────────────────────────────────────────────────
// Start a background task to monitor stream durations

let durationMonitorInterval: NodeJS.Timeout | null = null;

export function startDurationMonitor(): void {
  if (durationMonitorInterval) return;
  
  durationMonitorInterval = setInterval(async () => {
    for (const [streamId, state] of stateStore) {
      if (state.status === 'live' && state.startedAt) {
        const duration = Math.floor((Date.now() - new Date(state.startedAt).getTime()) / 1000);
        const tierCheck = await checkTierLimits(state.userId, 'stream_duration', duration);
        
        if (!tierCheck.allowed) {
          await killStream(streamId, 'system', tierCheck.reason);
        }
      }
    }
  }, 30000); // Check every 30 seconds
}

export function stopDurationMonitor(): void {
  if (durationMonitorInterval) {
    clearInterval(durationMonitorInterval);
    durationMonitorInterval = null;
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const serverStateManager = {
  createStream,
  getStream,
  destroyStream,
  processCommand,
  killStream,
  transferControl,
  subscribe,
  checkTierLimits,
  startDurationMonitor,
  stopDurationMonitor,
};
