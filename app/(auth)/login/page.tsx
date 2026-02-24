import Link from 'next/link';
import { Wallet } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full border border-foreground/10 rounded-2xl p-8 space-y-6 text-center shadow-sm bg-background">
        <div className="flex justify-center mb-6">
          <Wallet className="h-10 w-10 text-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
        <p className="text-foreground/70">Sign in to your account to continue.</p>
        
        {/* Placeholder form area */}
        <div className="space-y-4 pt-4">
          <div className="h-10 bg-foreground/5 rounded-md animate-pulse border border-foreground/10"></div>
          <div className="h-10 bg-foreground/5 rounded-md animate-pulse border border-foreground/10"></div>
          <button className="w-full h-10 bg-foreground text-background font-medium rounded-md hover:opacity-90 transition-opacity">
            Sign In
          </button>
        </div>
        
        <p className="text-sm text-foreground/60 pt-4">
          Don&apos;t have an account? <Link href="/signup" className="text-foreground underline underline-offset-4 hover:opacity-80">Sign up</Link>
        </p>
        <div className="pt-4">
          <Link href="/" className="text-sm text-foreground/50 hover:text-foreground transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
