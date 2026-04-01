'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Sparkles, TrendingUp } from 'lucide-react';

export default function CTASection() {
  const benefits = [
    'AI-powered expense tracking',
    'Real-time budget alerts',
    'Multi-platform sync',
    'Bank-level security'
  ];

  return (
    <section className="w-full py-24 px-4 bg-gradient-to-br from-primary/5 via-emerald-500/5 to-primary/5 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium animate-fade-in">
          <Sparkles size={16} />
          <span>Start Your Financial Journey Today</span>
        </div>

        <h2 className="text-4xl md:text-6xl font-bold tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Take Control of Your{' '}
          <span className="bg-gradient-to-r from-primary via-emerald-500 to-primary bg-clip-text text-transparent">
            Financial Future
          </span>
        </h2>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Join thousands of users who are already managing their finances smarter with ExpenseVault.
          Start tracking, budgeting, and saving today.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 backdrop-blur-sm px-4 py-3 rounded-lg border border-border"
            >
              <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Link
            href="/signup"
            className="group flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            Get Started Free
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 border-2 border-border px-8 py-4 rounded-full font-semibold text-lg hover:bg-accent transition-all hover:scale-105 active:scale-95"
          >
            <TrendingUp size={20} className="transition-transform group-hover:scale-110" />
            View Demo
          </Link>
        </div>

        <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.5s' }}>
          No credit card required • Free forever • Cancel anytime
        </p>
      </div>
    </section>
  );
}
