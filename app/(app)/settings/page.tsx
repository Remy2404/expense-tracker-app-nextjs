'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Sun, Moon, Monitor, Bell, LogOut, Loader2, User } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [theme, setTheme] = useState<Theme>('system');
  const [dailyReminder, setDailyReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    // Persist to localStorage (would use a proper context in production)
    localStorage.setItem('theme', newTheme);
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
            <p className="text-sm text-foreground/60">
              {user ? 'Signed in with email' : 'Not signed in'}
            </p>
          </div>
        </div>
        {user && (
          <button
            onClick={handleSignOut}
            disabled={isLoading}
            className="mt-4 flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
            Sign Out
          </button>
        )}
      </div>

      {/* Theme Selection */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sun size={20} />
          Appearance
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleThemeChange('light')}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
              theme === 'light'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:bg-muted'
            }`}
          >
            <Sun size={24} />
            <span className="text-sm font-medium">Light</span>
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
              theme === 'dark'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:bg-muted'
            }`}
          >
            <Moon size={24} />
            <span className="text-sm font-medium">Dark</span>
          </button>
          <button
            onClick={() => handleThemeChange('system')}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
              theme === 'system'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:bg-muted'
            }`}
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
