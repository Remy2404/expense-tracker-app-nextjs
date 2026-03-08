'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Using your exact uploaded screenshots to preserve the real UI perfectly
const screenshots = [
  { src: '/screenshots/dashboard.png', alt: 'Dashboard UI' },
  { src: '/screenshots/ai-assistant.png', alt: 'AI Assistant UI' },
  { src: '/screenshots/analytics.png', alt: 'Analytics UI' },
  { src: '/screenshots/budget.png', alt: 'Budget UI' },
  { src: '/screenshots/insights.png', alt: 'Insights UI' },
  { src: '/screenshots/all_Expense.png', alt: 'All Expense UI' },
  { src: '/screenshots/goal.png', alt: 'Goal UI' }
];

export default function MarketingScreenshots() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      const scrollAmount = window.innerWidth < 768 ? window.innerWidth * 0.85 : 400;
      scrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const scrollAmount = window.innerWidth < 768 ? window.innerWidth * 0.85 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 overflow-hidden relative">
      {/* Background glow effects - Light mode */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-full max-w-2xl h-[400px] bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10 text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-slate-900">
          Experience the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">Future of Finance</span>
        </h2>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-medium">
          A premium, intelligent companion for your wealth. Discover our beautiful features designed for the modern era.
        </p>
      </div>

      <div className="relative w-full pb-16 px-4 group/carousel max-w-[100vw]">
        {/* Navigation Buttons */}
        <button 
          onClick={scrollLeft}
          className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-emerald-50 border border-slate-200 text-slate-700 hover:text-emerald-600 rounded-full p-3 md:p-4 backdrop-blur-md transition-all opacity-0 md:opacity-100 lg:opacity-0 lg:group-hover/carousel:opacity-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button 
          onClick={scrollRight}
          className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-emerald-50 border border-slate-200 text-slate-700 hover:text-emerald-600 rounded-full p-3 md:p-4 backdrop-blur-md transition-all opacity-0 md:opacity-100 lg:opacity-0 lg:group-hover/carousel:opacity-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Horizontal scrolling showcase */}
        <div 
          ref={scrollRef}
          className="flex gap-8 overflow-x-auto snap-x snap-mandatory px-6 md:px-12 py-8 [&::-webkit-scrollbar]:hidden items-center" 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {screenshots.map((item, index) => (
            <div 
              key={index}
              className="relative flex-shrink-0 snap-center group transition-all duration-500 hover:-translate-y-4"
            >
              {/* CSS Phone Mockup Wrapper */}
              <div className="relative mx-auto border-gray-900 dark:border-gray-900 bg-gray-900 border-[8px] rounded-[2.5rem] h-[650px] w-[300px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-black/5 overflow-hidden group-hover:shadow-[0_30px_60px_rgba(16,185,129,0.2)] transition-shadow duration-500">
                
                {/* iPhone Notch */}
                <div className="absolute top-0 inset-x-0 h-6 bg-gray-900 rounded-b-3xl w-40 mx-auto z-20 flex justify-center items-center">
                  <div className="w-12 h-1.5 bg-gray-800 rounded-full mt-1"></div>
                </div>

                {/* Inner Screen */}
                <div className="relative w-full h-full bg-black rounded-[2rem] overflow-hidden">
                  <Image 
                    src={item.src} 
                    alt={item.alt}
                    fill
                    className="object-cover"
                    sizes="300px"
                    priority={index < 3}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
