import type { UserRole } from '@/types';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 0,
  creator: 1,
  admin: 2,
  network_operator: 3,
};

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canAccessDashboard(role: UserRole): boolean {
  return hasMinimumRole(role, 'creator');
}

export function canManageNetwork(role: UserRole): boolean {
  return hasMinimumRole(role, 'network_operator');
}

export function canAdminister(role: UserRole): boolean {
  return hasMinimumRole(role, 'admin');
}

export const ROLE_LABELS: Record<UserRole, string> = {
  viewer: 'Viewer',
  creator: 'Creator',
  admin: 'Administrator',
  network_operator: 'Network Operator',
};
