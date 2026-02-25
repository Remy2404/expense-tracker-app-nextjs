import Link from 'next/link';
import { Home, Receipt, PieChart, Target, Tags, Bell } from 'lucide-react';

export default function MobileNav() {
  const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Expenses', href: '/expenses', icon: Receipt },
    { name: 'Categories', href: '/categories', icon: Tags },
    { name: 'Budgets', href: '/budgets', icon: PieChart },
    { name: 'Goals', href: '/goals', icon: Target },
    { name: 'Alerts', href: '/notifications', icon: Bell },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-foreground/10 bg-background/80 backdrop-blur-md pb-safe z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full text-foreground/60 hover:text-foreground transition-colors"
            >
              <Icon size={22} className="mb-1" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
