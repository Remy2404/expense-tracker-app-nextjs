'use client';

import Link from 'next/link';
import { Smartphone, Monitor, ArrowRight } from 'lucide-react';
import MagicRings from './MagicRings';

export default function Hero() {
  return (
    <section className="w-full py-20 md:py-32 px-4 flex flex-col items-center text-center space-y-8 animate-fade-in relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <MagicRings
          color="#10b981"
          colorTwo="#3b82f6"
          speed={0.5}
          ringCount={4}
          attenuation={8}
          lineThickness={1.5}
          baseRadius={0.4}
          radiusStep={0.15}
          scaleRate={0.12}
          opacity={2}
          blur={0}
          noiseAmount={0.05}
          rotation={0}
          ringGap={1.8}
          fadeIn={0.6}
          fadeOut={0.6}
          followMouse={true}
          mouseInfluence={0.15}
          hoverScale={1.1}
          parallax={0.03}
          clickBurst={true}
        />
      </div>

      {/* Content */}
      <div className="space-y-4 max-w-3xl relative z-10">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent animate-slide-in-right">
          Track Expenses. <br className="hidden sm:inline" /> Understand Your Money.
        </h1>
        <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
          Gain complete control over your finances with our seamless, multi-platform expense tracking solution.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in relative z-10" style={{ animationDelay: '0.2s' }}>
        <button className="group flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl w-full sm:w-auto">
          <Smartphone size={20} className="transition-transform group-hover:rotate-12" />
          Download on App Store
        </button>
        <button className="group flex items-center justify-center gap-2 bg-foreground text-background px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl w-full sm:w-auto">
          <Smartphone size={20} className="transition-transform group-hover:rotate-12" />
          Get it on Google Play
        </button>
        <Link href="/dashboard" className="group flex items-center justify-center gap-2 border-2 border-foreground/20 px-6 py-3 rounded-full font-semibold hover:bg-foreground/5 hover:border-foreground/40 transition-all hover:scale-105 active:scale-95 w-full sm:w-auto">
          <Monitor size={20} className="transition-transform group-hover:scale-110" />
          Use Web App
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}
