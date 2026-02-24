import Hero from '@/components/Hero';
import Features from '@/components/Features';
import MultiPlatform from '@/components/MultiPlatform';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <Features />
      <MultiPlatform />
    </div>
  );
}
