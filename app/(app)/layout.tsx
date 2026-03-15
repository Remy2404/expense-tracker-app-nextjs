import ProtectedRoute from '@/components/ProtectedRoute';
import { AiChatWidget } from '@/components/AiChatWidget';
import { NotificationsBootstrap } from '@/components/NotificationsBootstrap';
import { RealtimeBootstrap } from '@/components/RealtimeBootstrap';
import { AppShell } from '@/components/navigation/AppShell';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-dvh bg-background">
        <div className="min-w-0 flex-1">
          <AppShell>{children}</AppShell>
        </div>
        <AiChatWidget />
      </div>
      <NotificationsBootstrap />
      <RealtimeBootstrap />
    </ProtectedRoute>
  );
}
