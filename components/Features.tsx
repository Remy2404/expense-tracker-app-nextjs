import { PieChart, Shield, Smartphone, Zap } from 'lucide-react';

export default function Features() {
  const features = [
    {
      title: "Smart Categorization",
      description: "Automatically organize your spending into clear, actionable categories.",
      icon: <PieChart className="w-6 h-6" />,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: "Budget Tracking",
      description: "Set custom budgets and get real-time alerts before you overspend.",
      icon: <Zap className="w-6 h-6" />,
      gradient: "from-amber-500 to-orange-500"
    },
    {
      title: "Secure & Private",
      description: "Bank-level encryption ensures your financial data stays entirely yours.",
      icon: <Shield className="w-6 h-6" />,
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      title: "Seamless Sync",
      description: "Instant synchronization between mobile app and web dashboard.",
      icon: <Smartphone className="w-6 h-6" />,
      gradient: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <section id="features" className="w-full py-24 bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Everything you need to manage your money
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to give you complete control over your finances
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 stagger-children">
          {features.map((f, i) => (
            <div
              key={i}
              className="group bg-card border border-border p-8 rounded-2xl flex flex-col gap-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden"
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

              <div className={`w-14 h-14 bg-gradient-to-br ${f.gradient} flex items-center justify-center rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-xl relative z-10 group-hover:text-primary transition-colors">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed relative z-10">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
