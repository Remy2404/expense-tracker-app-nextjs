import { Apple, Play, Globe } from 'lucide-react';

export default function MultiPlatform() {
  const platforms = [
    {
      icon: <Apple size={40} />,
      title: "iOS App",
      description: "Optimized for iPhone with native feel and widgets.",
      badge: null,
      gradient: "from-gray-700 to-gray-900"
    },
    {
      icon: <Play size={40} />,
      title: "Android App",
      description: "Material design with fast performance on all devices.",
      badge: null,
      gradient: "from-green-600 to-emerald-600"
    },
    {
      icon: <Globe size={40} />,
      title: "Web App",
      description: "Full dashboard experience for deep dives and analytics.",
      badge: "Beta",
      gradient: "from-blue-600 to-cyan-600"
    }
  ];

  return (
    <section id="platforms" className="w-full py-24 px-4 border-t border-border bg-gradient-to-b from-background to-muted/30 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />

      <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
        <div className="animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            One App. All Your Devices.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you&apos;re tapping on your phone or analyzing on your desktop, we&apos;ve got you covered with native performance and perfectly synced data.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 pt-8 stagger-children">
          {platforms.map((platform, index) => (
            <div
              key={index}
              className="group flex flex-col items-center gap-4 p-8 border border-border rounded-2xl bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden"
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${platform.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

              {platform.badge && (
                <div className="absolute top-3 right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] uppercase font-bold px-2.5 py-1 rounded-full shadow-lg animate-pulse">
                  {platform.badge}
                </div>
              )}

              <div className={`w-20 h-20 bg-gradient-to-br ${platform.gradient} flex items-center justify-center rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                {platform.icon}
              </div>
              <h3 className="font-semibold text-xl relative z-10 group-hover:text-primary transition-colors">{platform.title}</h3>
              <p className="text-sm text-muted-foreground relative z-10">{platform.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
