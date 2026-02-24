'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { Home, Receipt, PieChart, BarChart3, Settings, LogOut, Wallet } from 'lucide-react';
import { auth } from '@/lib/firebase';

export default function Sidebar() {
  const router = useRouter();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Expenses', href: '/expenses', icon: Receipt },
    { name: 'Budgets', href: '/budgets', icon: PieChart },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-foreground/10 bg-background h-screen sticky top-0">
      <div className="p-6 flex items-center gap-2">
        <Wallet className="h-6 w-6 text-primary" />
        <span className="font-bold text-xl tracking-tight">ExpenseVault</span>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-foreground/5 text-foreground/80 hover:text-foreground font-medium transition-colors"
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-foreground/10 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-foreground/5 text-foreground/80 hover:text-foreground font-medium transition-colors">
          <Settings size={20} />
          Settings
        </button>
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 text-destructive font-medium transition-colors"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
