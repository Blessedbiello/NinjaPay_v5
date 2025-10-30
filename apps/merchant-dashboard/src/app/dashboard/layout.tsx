import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import { OnboardingModal } from '@/components/OnboardingModal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="container mx-auto p-6">{children}</div>
          </main>
        </div>
        <OnboardingModal />
      </div>
    </ProtectedRoute>
  );
}
