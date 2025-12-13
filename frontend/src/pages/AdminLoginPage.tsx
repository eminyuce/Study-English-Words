import { useEffect } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';
import AdminLoginForm from '../components/Admin/AdminLoginForm';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface AdminLoginPageProps {
  onNavigate: (page: 'home' | 'admin') => void;
}

export default function AdminLoginPage({ onNavigate }: AdminLoginPageProps) {
  const { isAdminAuthenticated } = useAdminAuth();

  // Redirect to admin panel if already authenticated
  useEffect(() => {
    if (isAdminAuthenticated) {
      onNavigate('admin');
    }
  }, [isAdminAuthenticated, onNavigate]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <Button
          onClick={() => onNavigate('home')}
          variant="ghost"
          size="sm"
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Admin Access
        </h1>
        <p className="text-muted-foreground">
          Manage languages, vocabulary, and platform content
        </p>
      </div>

      <AdminLoginForm />
    </div>
  );
}
