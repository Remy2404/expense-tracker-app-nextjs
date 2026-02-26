'use client';

import { useRouter } from 'next/navigation';
import { Wallet, LogOut } from 'lucide-react';
import { NotificationsBell } from '@/components/NotificationsBell';
import { useAuth } from '@/contexts/AuthContext';

export default function MobileHeader() {
  const router = useRouter();
  const { user, signOutUser } = useAuth();

  const handleSignOut = async () => {
    const result = await signOutUser();
    if (result.success) {
      router.push('/login');
    }
  };

  return (
    <header className="md:hidden h-14 border-b border-foreground/10 bg-background/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <Wallet className="h-5 w-5 text-primary" />
        <span className="font-bold text-lg tracking-tight">ExpenseVault</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-medium text-primary">
            {user?.email?.charAt(0).toUpperCase() || '?'}
          </span>
        </div>
        <NotificationsBell />
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
