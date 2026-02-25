'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Wallet, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log('Login successful, user:', user.email, user.uid);

      // Check if email is available
      if (!user.email) {
        setError('Login succeeded but email is not available. Please contact support.');
        return;
      }

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      // Provide more helpful error messages
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/user-disabled') {
        setError('This account has been disabled. Please contact support.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later or reset your password.');
      } else if (err.code === 'auth.operation-not-allowed') {
        setError('Email/Password sign-in is not enabled. Please enable it in Firebase Console > Authentication.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to sign in. Please check your credentials.');
      }
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
          <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-foreground/70">Sign in to your account to continue.</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4 pt-4">
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
              className="w-full h-10 px-3 bg-transparent border border-foreground/20 rounded-md focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-foreground text-background font-medium rounded-md hover:opacity-90 transition-opacity flex items-center justify-center disabled:opacity-50 mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>
        
        <p className="text-sm text-foreground/60 pt-4 text-center">
          Don&apos;t have an account? <Link href="/signup" className="text-foreground underline underline-offset-4 hover:opacity-80">Sign up</Link>
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
