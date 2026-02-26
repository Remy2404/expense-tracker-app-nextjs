'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Sun, Moon, Monitor, Bell, LogOut, Loader2, User } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { user, signOutUser, linkGoogleProvider, isGoogleLinked } = useAuth();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [dailyReminder, setDailyReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [isLoading, setIsLoading] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [authFeedback, setAuthFeedback] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const authMethod = user?.providerData.some((providerData) => providerData.providerId === 'password')
    ? 'Signed in with email'
    : isGoogleLinked
      ? 'Signed in with Google'
      : 'Signed in';

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      setAuthFeedback('');
      const result = await signOutUser();
      if (!result.success) {
        setAuthFeedback(result.error || 'Failed to sign out.');
        return;
      }

      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    setAuthFeedback('');
    setIsLinkingGoogle(true);
    try {
      const result = await linkGoogleProvider();
      if (!result.success) {
        setAuthFeedback(result.error || 'Failed to link Google account.');
        return;
      }

      setAuthFeedback('Google account linked successfully.');
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };

  const handleDailyReminderToggle = () => {
    setDailyReminder(!dailyReminder);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-foreground/60">Manage your app preferences.</p>
      </div>

      {/* Profile Section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User size={20} />
          Account
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xl font-semibold text-primary">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <p className="font-medium">{user?.email || 'Guest'}</p>
            <p className="text-sm text-foreground/60">{user ? authMethod : 'Not signed in'}</p>
          </div>
        </div>
        {user && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!isGoogleLinked && (
              <button
                onClick={handleLinkGoogle}
                disabled={isLinkingGoogle || isLoading}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              >
                {isLinkingGoogle ? <Loader2 size={18} className="animate-spin" /> : null}
                {isLinkingGoogle ? 'Linking Google...' : 'Link Google account'}
              </button>
            )}

            <button
              onClick={handleSignOut}
              disabled={isLoading || isLinkingGoogle}
              className="flex items-center gap-2 px-4 py-2 border border-destructive/30 text-destructive rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
              Sign Out
            </button>
          </div>
        )}
        {authFeedback ? (
          <p className="mt-3 text-sm text-foreground/70">{authFeedback}</p>
        ) : null}
      </div>

      {/* Theme Selection */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sun size={20} />
          Appearance
        </h2>
        <p className="text-sm text-foreground/60 mb-4">
          Active theme: {isMounted && resolvedTheme === 'dark' ? 'Dark' : 'Light'}
          {isMounted && theme === 'system' ? ' (System)' : ''}
        </p>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleThemeChange('light')}
            disabled={!isMounted}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
              isMounted && theme === 'light'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:bg-muted'
            } ${!isMounted ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <Sun size={24} />
            <span className="text-sm font-medium">Light</span>
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            disabled={!isMounted}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
              isMounted && theme === 'dark'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:bg-muted'
            } ${!isMounted ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <Moon size={24} />
            <span className="text-sm font-medium">Dark</span>
          </button>
          <button
            onClick={() => handleThemeChange('system')}
            disabled={!isMounted}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
              isMounted && theme === 'system'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:bg-muted'
            } ${!isMounted ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <Monitor size={24} />
            <span className="text-sm font-medium">System</span>
          </button>
        </div>
      </div>

      {/* Daily Reminder */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bell size={20} />
          Notifications
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Daily Reminder</p>
              <p className="text-sm text-foreground/60">Get reminded to log your expenses</p>
            </div>
            <button
              onClick={handleDailyReminderToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                dailyReminder ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  dailyReminder ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {dailyReminder && (
            <div>
              <label className="text-sm font-medium">Reminder Time</label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="mt-1 w-full h-10 px-3 border border-border rounded-lg bg-transparent"
              />
            </div>
          )}
        </div>
      </div>

      {/* App Info */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">About</h2>
        <div className="space-y-2 text-sm text-foreground/60">
          <p>ExpenseVault - Expense Tracker</p>
          <p>Version 1.0.0</p>
          <p className="pt-2">
            Track your expenses, set budgets, and achieve your savings goals.
          </p>
        </div>
      </div>
    </div>
  );
}
