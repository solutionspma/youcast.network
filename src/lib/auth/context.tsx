'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User, UserRole } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          // Map Supabase user to app user
          setUser({
            id: authUser.id,
            email: authUser.email ?? '',
            display_name: authUser.user_metadata?.display_name ?? authUser.email ?? '',
            avatar_url: authUser.user_metadata?.avatar_url ?? null,
            role: (authUser.user_metadata?.role as UserRole) ?? 'viewer',
            created_at: authUser.created_at,
            updated_at: authUser.updated_at ?? authUser.created_at,
            is_verified: !!authUser.email_confirmed_at,
            metadata: authUser.user_metadata ?? {},
          });
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const u = session.user;
          setUser({
            id: u.id,
            email: u.email ?? '',
            display_name: u.user_metadata?.display_name ?? u.email ?? '',
            avatar_url: u.user_metadata?.avatar_url ?? null,
            role: (u.user_metadata?.role as UserRole) ?? 'viewer',
            created_at: u.created_at,
            updated_at: u.updated_at ?? u.created_at,
            is_verified: !!u.email_confirmed_at,
            metadata: u.user_metadata ?? {},
          });
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, role: 'creator' },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    // Redirect to home page after sign out
    window.location.href = '/';
  };

  const hasRole = (role: UserRole) => user?.role === role;

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, signIn, signUp, signOut, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
