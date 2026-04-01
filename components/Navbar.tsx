'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Wallet, LogOut, LayoutDashboard, ChevronDown, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import { UserAvatar } from '@/components/ui/user-avatar';

export default function Navbar() {
  const { user, loading, signOutUser } = useAuth();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    const result = await signOutUser();
    if (result.success) {
      router.push('/login');
    }
  };

  return (
    <nav className="w-full border-b border-border bg-background/95 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 group">
          <Wallet className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            ExpenseVault
          </span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-all hover:scale-105 relative group">
            Features
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link href="#platforms" className="hover:text-foreground transition-all hover:scale-105 relative group">
            Platforms
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link href="#about" className="hover:text-foreground transition-all hover:scale-105 relative group">
            About
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-accent transition-all hover:scale-110 text-foreground"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          )}
          {loading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition-all hover:scale-105"
              >
                <UserAvatar
                  photoURL={user.photoURL}
                  displayName={user.displayName}
                  email={user.email}
                  className="h-8 w-8 ring-2 ring-transparent hover:ring-primary transition-all"
                  fallbackClassName="text-sm"
                />
                <ChevronDown size={16} className="text-muted-foreground transition-transform" style={{ transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-scale-in">
                    <div className="px-4 py-3 border-b border-border bg-muted/30">
                      <div className="mb-3 flex items-center gap-3">
                        <UserAvatar
                          photoURL={user.photoURL}
                          displayName={user.displayName}
                          email={user.email}
                          className="h-10 w-10"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{user.displayName || user.email}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-accent transition-all group"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <LayoutDashboard size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="group-hover:translate-x-1 transition-transform">Dashboard</span>
                    </Link>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-all group"
                    >
                      <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
                      <span className="group-hover:translate-x-1 transition-transform">Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium hover:text-primary transition-all hover:scale-105">
                Sign In
              </Link>
              <Link href="/signup" className="text-sm font-medium bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-5 py-2 rounded-full hover:shadow-lg transition-all hover:scale-105 active:scale-95">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
