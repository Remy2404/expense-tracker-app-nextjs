import { PieChart, Shield, Smartphone, Zap } from 'lucide-react';

export default function Features() {
  const features = [
    {
      title: "Smart Categorization",
      description: "Automatically organize your spending into clear, actionable categories.",
      icon: <PieChart className="w-6 h-6" />
    },
    {
      title: "Budget Tracking",
      description: "Set custom budgets and get real-time alerts before you overspend.",
      icon: <Zap className="w-6 h-6" />
    },
    {
      title: "Secure & Private",
      description: "Bank-level encryption ensures your financial data stays entirely yours.",
      icon: <Shield className="w-6 h-6" />
    },
    {
      title: "Seamless Sync",
      description: "Instant synchronization between mobile app and web dashboard.",
      icon: <Smartphone className="w-6 h-6" />
    }
  ];

  return (
    <section id="features" className="w-full py-20 bg-foreground/[0.02]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight">Everything you need to manage your money</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className="bg-background border border-foreground/10 p-6 rounded-2xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-foreground/10 flex items-center justify-center rounded-xl text-foreground">
                {f.icon}
              </div>
              <h3 className="font-semibold text-xl">{f.title}</h3>
              <p className="text-foreground/70 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
