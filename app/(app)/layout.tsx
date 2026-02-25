import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import MobileHeader from '@/components/MobileHeader';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AiChatWidget } from '@/components/AiChatWidget';
import { NotificationsBootstrap } from '@/components/NotificationsBootstrap';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <MobileHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
            <div className="max-w-6xl mx-auto w-full">
              {children}
            </div>
          </main>
          <MobileNav />
          <NotificationsBootstrap />
          <AiChatWidget />
        </div>
      </div>
    </ProtectedRoute>
  );
}
