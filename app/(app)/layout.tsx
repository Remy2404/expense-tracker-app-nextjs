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
      <AppShell>{children}</AppShell>
      <NotificationsBootstrap />
      <RealtimeBootstrap />
      <AiChatWidget />
    </ProtectedRoute>
  );
}
