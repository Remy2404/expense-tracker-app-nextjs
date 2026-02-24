import { Wallet } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full py-12 px-4 border-t border-foreground/10 bg-background text-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 opacity-70" />
          <span className="font-semibold opacity-70">ExpenseVault</span>
        </div>
        <div className="flex gap-6 opacity-60">
          <a href="#" className="hover:opacity-100 transition-opacity">Privacy Policy</a>
          <a href="#" className="hover:opacity-100 transition-opacity">Terms of Service</a>
          <a href="#" className="hover:opacity-100 transition-opacity">Contact</a>
        </div>
        <div className="opacity-50">
          &copy; {new Date().getFullYear()} ExpenseVault. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
