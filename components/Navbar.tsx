'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Wallet, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, loading, signOutUser } = useAuth();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSignOut = async () => {
    const result = await signOutUser();
    if (result.success) {
      router.push('/login');
    }
  };

  return (
    <nav className="w-full border-b border-foreground/10 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-foreground" />
          <span className="font-bold text-xl tracking-tight">ExpenseVault</span>
        </div>
        <div className="hidden md:flex gap-6 text-sm font-medium text-foreground/80">
          <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#platforms" className="hover:text-foreground transition-colors">Platforms</Link>
          <Link href="#about" className="hover:text-foreground transition-colors">About</Link>
        </div>
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-8 rounded-full bg-foreground/10 animate-pulse"></div>
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {user.email?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <ChevronDown size={16} className="text-foreground/60" />
              </button>
              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium truncate">{user.displayName || user.email}</p>
                      <p className="text-xs text-foreground/50 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-foreground/5 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <LayoutDashboard size={16} />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium hover:opacity-80 transition-opacity">
                Sign In
              </Link>
              <Link href="/signup" className="text-sm font-medium bg-foreground text-background px-4 py-2 rounded-full hover:opacity-90 transition-opacity">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
