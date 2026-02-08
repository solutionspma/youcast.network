'use client';

import { useAuth } from '@/lib/auth/context';
import { hasMinimumRole } from '@/lib/auth/roles';
import type { UserRole } from '@/types';
import type { ReactNode } from 'react';

interface RoleGuardProps {
  requiredRole: UserRole;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ requiredRole, children, fallback }: RoleGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (!user || !hasMinimumRole(user.role, requiredRole)) {
    return fallback ? <>{fallback}</> : (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-surface-400">You don&apos;t have permission to view this content.</p>
      </div>
    );
  }

  return <>{children}</>;
}
