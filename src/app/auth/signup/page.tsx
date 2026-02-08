'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const supabase = createClient();
      
      // Check if this is the master admin email
      const isMasterAdmin = email === 'solutions@pitchmarketing.agency';
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            display_name: displayName,
            role: isMasterAdmin ? 'admin' : 'creator'
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        },
      });

      if (signUpError) throw signUpError;

      // Show success message
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/80 to-surface-950" />
        <div className="relative flex flex-col justify-center px-16">
          <Link href="/" className="flex items-center gap-4 mb-12">
            <img src="/youCastlogoorange.png" alt="YouCast" className="h-16 w-auto" />
            <span className="text-3xl font-display font-bold tracking-tight text-brand-400">YOUCAST</span>
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Start building your media empire today
          </h1>
          <p className="text-lg text-surface-300 max-w-md">
            Create your channel, upload content, go live, and grow your audience — all from one platform.
          </p>
          <div className="mt-12 space-y-4">
            {['Free to start — no credit card required', 'Professional streaming studio included', 'Full analytics and audience tools'].map((point) => (
              <div key={point} className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-surface-300 text-sm">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link href="/" className="flex items-center gap-3 mb-8 lg:hidden">
            <img src="/youCastlogoorange.png" alt="YouCast" className="h-12 w-auto" />
            <span className="text-2xl font-display font-bold tracking-tight text-brand-400">YOUCAST</span>
          </Link>

          <h2 className="text-2xl font-bold text-white mb-2">Create your account</h2>
          <p className="text-surface-400 mb-8">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">
              Sign in
            </Link>
          </p>

          {success && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-emerald-400 font-semibold mb-1">Check your email!</h3>
                  <p className="text-sm text-emerald-300/80">
                    We&apos;ve sent a confirmation link to <strong>{email}</strong>. 
                    Click the link in the email to verify your account and get started.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your creator name"
              required
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              hint="Must be at least 8 characters with one number"
              required
            />

            <Button type="submit" size="lg" fullWidth isLoading={isLoading}>
              Create Account
            </Button>

            <p className="text-xs text-surface-500 text-center">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-brand-400 hover:text-brand-300">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-brand-400 hover:text-brand-300">Privacy Policy</a>.
            </p>
          </form>

          {/* OAuth */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-700" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-surface-950 px-3 text-sm text-surface-500">or sign up with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-sm font-medium text-surface-300 hover:bg-surface-700 hover:text-white transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-sm font-medium text-surface-300 hover:bg-surface-700 hover:text-white transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                Apple
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
