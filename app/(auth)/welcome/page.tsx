'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PieChart, TrendingUp, Brain, ArrowRight, Loader2 } from 'lucide-react';

const FEATURES = [
  { icon: PieChart, title: 'Track Expenses', desc: 'Monitor your spending patterns' },
  { icon: TrendingUp, title: 'Budget Goals', desc: 'Set and achieve targets' },
  { icon: Brain, title: 'AI Insights', desc: 'Smart financial advice' },
];

export default function WelcomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

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
