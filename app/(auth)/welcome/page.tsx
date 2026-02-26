'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PieChart, TrendingUp, Brain, ArrowRight, Loader2 } from 'lucide-react';

const FEATURES = [
  { icon: PieChart, title: 'Track Expenses', desc: 'Monitor your spending patterns' },
  { icon: TrendingUp, title: 'Budget Goals', desc: 'Set and achieve targets' },
  { icon: Brain, title: 'AI Insights', desc: 'Smart financial advice' },
];

export default function WelcomePage() {
  const { user, isLoading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  const handleGoogleContinue = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const result = await signInWithGoogle();
      if (result.success) {
        router.push('/dashboard');
        return;
      }

      setError(result.error || 'Failed to sign in with Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-md w-full text-center space-y-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">E</span>
            </div>
            <span className="text-2xl font-bold">ExpenseVault</span>
          </div>

          {/* Tagline */}
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Smart expense tracking
          </h1>
          <p className="text-lg text-foreground/60">
            Track expenses, set budgets, and get AI-powered insights to improve your finances.
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 gap-4 pt-8">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">{feature.title}</p>
                    <p className="text-sm text-foreground/60">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 pt-8">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleContinue}
              disabled={googleLoading}
              className="w-full border border-foreground/20 px-6 py-3 rounded-xl font-medium hover:bg-foreground/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {googleLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4">
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.86c2.26-2.08 3.57-5.14 3.57-8.65Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.86-3c-1.07.72-2.44 1.15-4.09 1.15-3.14 0-5.8-2.12-6.75-4.98H1.27v3.09A12 12 0 0 0 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.25 14.27A7.2 7.2 0 0 1 4.87 12c0-.79.14-1.56.38-2.27V6.64H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.36l3.98-3.09Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.43-3.43A11.44 11.44 0 0 0 12 0 12 12 0 0 0 1.27 6.64l3.98 3.09c.95-2.86 3.61-4.98 6.75-4.98Z"
                  />
                </svg>
              )}
              Continue with Google
            </button>

            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Get Started
              <ArrowRight size={20} />
            </Link>
            <p className="text-sm text-foreground/60">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-foreground/40">
        <p>© 2024 ExpenseVault. All rights reserved.</p>
      </footer>
    </div>
  );
}
