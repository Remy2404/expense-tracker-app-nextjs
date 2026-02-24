'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Wallet, Bell, LogOut } from 'lucide-react';

export default function MobileHeader() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="md:hidden h-14 border-b border-foreground/10 bg-background/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <Wallet className="h-5 w-5 text-primary" />
        <span className="font-bold text-lg tracking-tight">ExpenseVault</span>
      </div>
      <div className="flex items-center gap-3 text-foreground/70">
        <button className="hover:text-foreground transition-colors">
          <Bell size={20} />
        </button>
        <button 
          onClick={handleSignOut}
          className="hover:text-destructive transition-colors"
          aria-label="Sign Out"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
