'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, LogOut, Menu, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationsBell } from '@/components/NotificationsBell';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/ui/user-avatar';
import { cn } from '@/lib/utils';
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

const DESKTOP_SIDEBAR_STORAGE_KEY = 'app-shell-desktop-sidebar-collapsed';

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const { user, signOutUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const displayName = user?.displayName || user?.email || 'Account';

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedValue = window.localStorage.getItem(DESKTOP_SIDEBAR_STORAGE_KEY);
    setDesktopCollapsed(storedValue === 'true');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(DESKTOP_SIDEBAR_STORAGE_KEY, String(desktopCollapsed));
  }, [desktopCollapsed]);

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
    <div className="flex min-h-dvh bg-background overflow-x-hidden md:h-dvh md:overflow-hidden">
      <TooltipProvider delayDuration={100}>
        <aside
          className={cn(
            'hidden border-r border-border bg-card transition-[width] duration-300 md:flex md:flex-col',
            desktopCollapsed ? 'md:w-20' : 'md:w-72'
          )}
        >
          <div
            className={cn(
              'flex h-16 items-center border-b border-border',
              desktopCollapsed ? 'justify-between px-3' : 'justify-between px-5'
            )}
          >
            <div className="flex min-w-0 items-center">
              <Link
                href="https://expensevault-ruddy.vercel.app/"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Wallet className="h-5 w-5 shrink-0 text-primary" />
                {!desktopCollapsed && (
                  <p className="truncate text-lg font-semibold tracking-tight">ExpenseVault</p>
                )}
              </Link>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  onClick={() => setDesktopCollapsed((current) => !current)}
                >
                  {desktopCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              </TooltipContent>
            </Tooltip>
          </div>
          <ScrollArea className={cn('flex-1 py-5', desktopCollapsed ? 'px-2' : 'px-4')}>
            <NavContent collapsed={desktopCollapsed} />
          </ScrollArea>
          <Separator />
          <div className={cn('space-y-3 p-4', desktopCollapsed && 'px-2')}>
            <div
              className={cn('px-2', desktopCollapsed ? 'flex justify-center' : 'flex items-center gap-3')}
            >
              <UserAvatar
                photoURL={user?.photoURL}
                displayName={user?.displayName}
                email={user?.email}
                className="h-10 w-10"
              />
              {!desktopCollapsed ? (
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
              ) : null}
            </div>
            {desktopCollapsed ? (
              <div className="flex justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Sign out" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Sign Out</TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            )}
          </div>
        </aside>
      </TooltipProvider>

      <div className="flex min-w-0 flex-1 flex-col md:h-dvh">
        <header className="md:hidden h-14 border-b border-border bg-card/90 backdrop-blur px-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open navigation">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex h-full w-80 max-w-[92vw] flex-col p-0">
                <SheetHeader className="shrink-0 border-b border-border px-5 py-4">
                  <SheetTitle>
                    <Link
                      href="https://expensevault-ruddy.vercel.app/"
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      <Wallet className="h-5 w-5 text-primary" />
                      ExpenseVault
                    </Link>
                  </SheetTitle>
                  <SheetDescription className="truncate">{displayName}</SheetDescription>
                </SheetHeader>

                <ScrollArea className="min-h-0 flex-1">
                  <div className="p-4">
                    <NavContent onNavigate={() => setMobileOpen(false)} />
                  </div>
                </ScrollArea>

                <div className="shrink-0 border-t border-border p-4">
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

            <div className="flex items-center">
              <Link
                href="https://expensevault-ruddy.vercel.app/"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Wallet className="h-5 w-5 text-primary" />
                <span className="font-semibold tracking-tight">ExpenseVault</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationsBell />
            <UserAvatar
              photoURL={user?.photoURL}
              displayName={user?.displayName}
              email={user?.email}
              className="h-8 w-8"
              fallbackClassName="text-xs font-semibold"
            />
          </div>
        </header>

        <main className="flex-1 p-4 pb-24 md:overflow-y-auto md:p-8 md:pb-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
