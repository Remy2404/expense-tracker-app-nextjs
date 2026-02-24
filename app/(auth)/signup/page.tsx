'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Wallet, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create an account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full border border-foreground/10 rounded-2xl p-8 space-y-6 shadow-sm bg-background">
        <div className="flex justify-center mb-6">
          <Wallet className="h-10 w-10 text-foreground" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Create an Account</h1>
          <p className="text-foreground/70">Get started with your multi-platform expense tracking.</p>
        </div>
        
        <form onSubmit={handleSignup} className="space-y-4 pt-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-10 px-3 bg-transparent border border-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="you@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full h-10 px-3 bg-transparent border border-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="Min 6 characters"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full h-10 px-3 bg-transparent border border-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-foreground text-background font-medium rounded-md hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50 mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
          </button>
        </form>
        
        <p className="text-sm text-foreground/60 pt-4 text-center">
          Already have an account? <Link href="/login" className="text-foreground underline underline-offset-4 hover:opacity-80">Sign in</Link>
        </p>
        <div className="pt-2 text-center">
          <Link href="/" className="text-sm text-foreground/50 hover:text-foreground transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
