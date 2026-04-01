import Hero from '@/components/Hero';
import Features from '@/components/Features';
import MultiPlatform from '@/components/MultiPlatform';
import MarketingScreenshots from '@/components/MarketingScreenshots';
import CTASection from '@/components/CTASection';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <MarketingScreenshots />
      <Features />
      <MultiPlatform />
      <CTASection />
    </div>
  );
}
