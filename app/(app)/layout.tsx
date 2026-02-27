import ProtectedRoute from '@/components/ProtectedRoute';
import { AiChatWidget } from '@/components/AiChatWidget';
import { NotificationsBootstrap } from '@/components/NotificationsBootstrap';
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
      <AiChatWidget />
    </ProtectedRoute>
  );
}
