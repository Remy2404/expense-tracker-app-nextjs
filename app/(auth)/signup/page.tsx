'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Wallet, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      return setError('Please fill in all fields.');
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if email is available
      if (!user.email) {
        setError('Account created but email is not available. Please contact support.');
        return;
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      // Provide more helpful error messages
      if (!(err instanceof FirebaseError)) {
        setError(err instanceof Error ? err.message : 'Failed to create an account.');
        return;
      }

      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address. Please check and try again.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-up is not enabled. Please enable it in Firebase Console.');
      } else {
        setError(err.message || 'Failed to create an account.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await signInWithGoogle();
      if (result.success) {
        router.push('/dashboard');
        return;
      }

      setError(result.error || 'Failed to sign in with Google.');
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

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-foreground/15" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wide text-foreground/60">
              <span className="bg-background px-2">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full h-10 border border-foreground/20 rounded-md hover:bg-foreground/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4">
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.86c2.26-2.08 3.57-5.14 3.57-8.65Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.86-3c-1.07.72-2.44 1.15-4.09 1.15-3.14 0-5.8-2.12-6.75-4.98H1.27v3.09A12 12 0 0 0 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.25 14.27A7.2 7.2 0 0 1 4.87 12c0-.79.14-1.56.38-2.27V6.64H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.36l3.98-3.09Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.43-3.43A11.44 11.44 0 0 0 12 0 12 12 0 0 0 1.27 6.64l3.98 3.09c.95-2.86 3.61-4.98 6.75-4.98Z"
                />
              </svg>
            )}
            Continue with Google
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
