'use client';

import { useRouter } from 'next/navigation';
import { Wallet, LogOut } from 'lucide-react';
import { NotificationsBell } from '@/components/NotificationsBell';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/ui/user-avatar';

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
        <UserAvatar
          photoURL={user?.photoURL}
          displayName={user?.displayName}
          email={user?.email}
          className="h-7 w-7"
          fallbackClassName="text-xs"
        />
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
