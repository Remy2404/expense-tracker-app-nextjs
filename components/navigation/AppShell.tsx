'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Menu, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationsBell } from '@/components/NotificationsBell';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { NavContent } from './NavContent';

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const { user, signOutUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const displayName = user?.displayName || user?.email || 'Account';

  const handleSignOut = async () => {
    const result = await signOutUser();
    if (!result.success) {
      toast.error(result.error || 'Failed to sign out.');
      return;
    }

    toast.success('Signed out.');
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="hidden md:flex md:w-72 md:flex-col border-r border-border bg-card">
        <div className="h-16 px-5 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <p className="text-lg font-semibold tracking-tight">ExpenseVault</p>
        </div>
        <Separator />
        <ScrollArea className="flex-1 px-4 py-5">
          <NavContent />
        </ScrollArea>
        <Separator />
        <div className="p-4 space-y-3">
          <p className="px-2 text-xs text-muted-foreground truncate">{displayName}</p>
          <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden h-14 border-b border-border bg-card/90 backdrop-blur px-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open navigation">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="px-5 py-4 border-b border-border">
                  <SheetTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    ExpenseVault
                  </SheetTitle>
                  <SheetDescription className="truncate">{displayName}</SheetDescription>
                </SheetHeader>
                <div className="p-4">
                  <NavContent onNavigate={() => setMobileOpen(false)} />
                </div>
                <div className="mt-auto p-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setMobileOpen(false);
                      void handleSignOut();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="font-semibold tracking-tight">ExpenseVault</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationsBell />
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
              {user?.email?.charAt(0).toUpperCase() || '?'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
