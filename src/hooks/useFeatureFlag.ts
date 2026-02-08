'use client';

import { useState, useEffect } from 'react';
import { isFeatureEnabled } from '@/lib/features/flags';
import type { FeatureFlags } from '@/types';

/**
 * Hook to check if a feature flag is enabled.
 * On the server, reads from env. On the client, defaults can be provided.
 */
export function useFeatureFlag(flag: keyof FeatureFlags, defaultValue = false): boolean {
  const [enabled, setEnabled] = useState(defaultValue);

  useEffect(() => {
    // Client-side: read from a global flags object injected by layout or API
    const globalFlags = (window as unknown as { __YOUCAST_FLAGS__?: FeatureFlags }).__YOUCAST_FLAGS__;
    if (globalFlags && flag in globalFlags) {
      setEnabled(globalFlags[flag]);
    }
  }, [flag]);

  return enabled;
}

/**
 * Hook to get all feature flags at once.
 */
export function useFeatureFlags(): Partial<FeatureFlags> {
  const [flags, setFlags] = useState<Partial<FeatureFlags>>({});

  useEffect(() => {
    const globalFlags = (window as unknown as { __YOUCAST_FLAGS__?: FeatureFlags }).__YOUCAST_FLAGS__;
    if (globalFlags) {
      setFlags(globalFlags);
    }
  }, []);

  return flags;
}
