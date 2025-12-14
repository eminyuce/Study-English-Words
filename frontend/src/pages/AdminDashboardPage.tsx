import { useEffect } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';
import AdminWordManagement from '../components/Admin/AdminWordManagement';

interface AdminDashboardPageProps {
  onBack: () => void;
  onNavigateToLogin: () => void;
}

export default function AdminDashboardPage({ onBack, onNavigateToLogin }: AdminDashboardPageProps) {
  const { isAdminAuthenticated } = useAdminAuth();

  useEffect(() => {
    if (!isAdminAuthenticated) {
      onNavigateToLogin();
    }
  }, [isAdminAuthenticated, onNavigateToLogin]);

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Gradient Background */}
        <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20" />
        
        <div className="relative z-10 min-h-[60vh] flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 border-4 border-purple-300/30 border-t-purple-600 rounded-full animate-spin mx-auto mb-8"></div>
            <h2 className="text-2xl font-bold mb-3 tracking-tight">Checking Authentication</h2>
            <p className="text-gray-600 dark:text-gray-300">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20" />
      
      <div className="relative z-10">
        <AdminWordManagement onBack={onBack} onNavigateToLogin={onNavigateToLogin} />
      </div>
    </div>
  );
}
