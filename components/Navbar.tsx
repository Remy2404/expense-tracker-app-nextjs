import Link from 'next/link';
import { Wallet } from 'lucide-react';

export default function Navbar() {
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
          <Link href="/login" className="text-sm font-medium hover:opacity-80 transition-opacity">
            Sign In
          </Link>
          <Link href="/signup" className="text-sm font-medium bg-foreground text-background px-4 py-2 rounded-full hover:opacity-90 transition-opacity">
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}
