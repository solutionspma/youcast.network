import type { FeatureFlags } from '@/types';

const defaultFlags: FeatureFlags = {
  streaming: true,
  monetization: false,
  whitelabel: false,
  api_access: false,
};

export function getFeatureFlags(): FeatureFlags {
  if (typeof window === 'undefined') {
    return {
      streaming: process.env.NEXT_PUBLIC_FF_STREAMING === 'true',
      monetization: process.env.NEXT_PUBLIC_FF_MONETIZATION === 'true',
      whitelabel: process.env.NEXT_PUBLIC_FF_WHITELABEL === 'true',
      api_access: process.env.NEXT_PUBLIC_FF_API_ACCESS === 'true',
    };
  }
  return defaultFlags;
}

export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return getFeatureFlags()[flag] ?? false;
}
