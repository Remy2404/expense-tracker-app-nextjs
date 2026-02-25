'use client';

import Link from 'next/link';
import { Smartphone, Monitor } from 'lucide-react';

export default function Hero() {
  return (
    <section className="w-full py-20 md:py-32 px-4 flex flex-col items-center text-center space-y-8">
      <div className="space-y-4 max-w-3xl">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Track Expenses. <br className="hidden sm:inline" /> Understand Your Money.
        </h1>
        <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto">
          Gain complete control over your finances with our seamless, multi-platform expense tracking solution.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
        <button className="flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity w-full sm:w-auto">
          <Smartphone size={20} />
          Download on App Store
        </button>
        <button className="flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity w-full sm:w-auto">
          <Smartphone size={20} />
          Get it on Google Play
        </button>
        <Link href="/dashboard" className="flex items-center justify-center gap-2 border border-foreground/20 px-6 py-3 rounded-full font-semibold hover:bg-foreground/5 transition-colors w-full sm:w-auto">
          <Monitor size={20} />
          Use Web App
        </Link>
      </div>
    </section>
  );
}
