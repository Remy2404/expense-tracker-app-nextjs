import { Apple, Play, Globe } from 'lucide-react';

export default function MultiPlatform() {
  return (
    <section id="platforms" className="w-full py-24 px-4 border-t border-foreground/10">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h2 className="text-3xl md:text-4xl font-bold">One App. All Your Devices.</h2>
        <p className="text-lg text-foreground/70">
          Whether you&apos;re tapping on your phone or analyzing on your desktop, we&apos;ve got you covered with native performance and perfectly synced data.
        </p>
        <div className="grid sm:grid-cols-3 gap-6 pt-8">
          <div className="flex flex-col items-center gap-3 p-6 border border-foreground/10 rounded-2xl">
            <Apple size={32} />
            <h3 className="font-semibold text-lg">iOS App</h3>
            <p className="text-sm text-foreground/60">Optimized for iPhone with native feel and widgets.</p>
          </div>
          <div className="flex flex-col items-center gap-3 p-6 border border-foreground/10 rounded-2xl">
            <Play size={32} />
            <h3 className="font-semibold text-lg">Android App</h3>
            <p className="text-sm text-foreground/60">Material design with fast performance on all devices.</p>
          </div>
          <div className="flex flex-col items-center gap-3 p-6 border border-foreground/10 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-foreground text-background text-[10px] uppercase font-bold px-2 py-1 rounded-bl-lg">Beta</div>
            <Globe size={32} />
            <h3 className="font-semibold text-lg">Web App</h3>
            <p className="text-sm text-foreground/60">Full dashboard experience for deep dives and analytics.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
