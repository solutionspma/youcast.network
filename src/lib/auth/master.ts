// ============================================================================
// MASTER ACCOUNT CONFIGURATION
// The master account has unrestricted access to all platform features
// ============================================================================

export const MASTER_ACCOUNT_EMAIL = 'Solutions@pitchmarketing.agency';

/**
 * Check if an email belongs to the master account
 */
export function isMasterAccount(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase() === MASTER_ACCOUNT_EMAIL.toLowerCase();
}

/**
 * Get the effective tier for a user (master account gets enterprise)
 */
export function getEffectiveTier(
  email: string | null | undefined,
  dbTier: string | null | undefined
): string {
  if (isMasterAccount(email)) {
    return 'enterprise';
  }
  return dbTier || 'free';
}

/**
 * Get the effective role for a user (master account gets admin)
 */
export function getEffectiveRole(
  email: string | null | undefined,
  dbRole: string | null | undefined
): string {
  if (isMasterAccount(email)) {
    return 'admin';
  }
  return dbRole || 'viewer';
}

/**
 * Check if user has admin access (master account or global_admin)
 */
export function hasAdminAccess(
  email: string | null | undefined,
  isGlobalAdmin: boolean | null | undefined
): boolean {
  return isMasterAccount(email) || isGlobalAdmin === true;
}

/**
 * Check if user has access to a feature based on tier
 */
export function hasTierAccess(
  email: string | null | undefined,
  userTier: string | null | undefined,
  requiredTier: string
): boolean {
  if (isMasterAccount(email)) return true;
  
  const tierOrder: Record<string, number> = {
    guest: 0,
    free: 1,
    creator: 2,
    pro: 3,
    enterprise: 4,
  };
  
  const userLevel = tierOrder[userTier || 'free'] || 0;
  const requiredLevel = tierOrder[requiredTier] || 0;
  
  return userLevel >= requiredLevel;
}
