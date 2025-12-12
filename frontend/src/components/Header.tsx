import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { LogIn, LogOut, Sparkles } from 'lucide-react';
import { useGetCallerUserProfile } from '../hooks/useQueries';

export default function Header() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        <div className="flex items-center gap-3">
          <img 
            src="/assets/generated/vocabchain-logo-transparent.dim_200x200.png" 
            alt="VocabChain" 
            className="w-10 h-10"
          />
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              VocabChain
            </h1>
            {isAuthenticated && !profileLoading && userProfile && (
              <p className="text-xs text-muted-foreground">Welcome, {userProfile.name}!</p>
            )}
          </div>
        </div>

        <Button
          onClick={handleAuth}
          disabled={disabled}
          variant={isAuthenticated ? 'outline' : 'default'}
          className="gap-2"
        >
          {loginStatus === 'logging-in' ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin" />
              Logging in...
            </>
          ) : isAuthenticated ? (
            <>
              <LogOut className="w-4 h-4" />
              Logout
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              Login
            </>
          )}
        </Button>
      </div>
    </header>
  );
}
