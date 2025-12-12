import { useEffect, useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSeedData } from './hooks/useQueries';
import { AdminAuthProvider } from './hooks/useAdminAuth';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetupModal from './components/ProfileSetupModal';
import HomePage from './pages/HomePage';
import LanguagePage from './pages/LanguagePage';
import AdminWordManagement from './components/Admin/AdminWordManagement';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';

type Page = 'home' | 'language' | 'admin';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched, error: profileError } = useGetCallerUserProfile();
  const { seedData, isSeeding } = useSeedData();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Turkish');

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null && !profileError;

  // Seed initial data on first load
  useEffect(() => {
    if (isAuthenticated && !isInitializing && !isSeeding) {
      seedData();
    }
  }, [isAuthenticated, isInitializing, seedData, isSeeding]);

  // Handle browser back/forward
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/admin') {
      setCurrentPage('admin');
    } else if (path.startsWith('/language')) {
      setCurrentPage('language');
    } else {
      setCurrentPage('home');
    }
  }, []);

  const navigateTo = (page: Page, language?: string) => {
    setCurrentPage(page);
    if (page === 'home') {
      window.history.pushState({}, '', '/');
    } else if (page === 'language' && language) {
      setSelectedLanguage(language);
      window.history.pushState({}, '', `/language/${language}`);
    } else if (page === 'admin') {
      window.history.pushState({}, '', '/admin');
    }
  };

  // Loading state
  if (isInitializing) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading VocabChain...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AdminAuthProvider>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
          <Header />
          
          <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
            {!isAuthenticated ? (
              <div className="text-center py-20">
                <img 
                  src="/assets/generated/vocabchain-logo-transparent.dim_200x200.png" 
                  alt="VocabChain Logo" 
                  className="w-32 h-32 mx-auto mb-6 animate-bounce"
                />
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Welcome to VocabChain
                </h1>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Learn vocabulary from multiple languages with fun, interactive exercises. 
                  Track your progress and earn badges as you master new words!
                </p>
                <div className="flex gap-4 justify-center items-center flex-wrap">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg max-w-xs">
                    <div className="text-4xl mb-2">🌍</div>
                    <h3 className="font-semibold mb-1">Multiple Languages</h3>
                    <p className="text-sm text-muted-foreground">Learn Turkish, Spanish, Arabic, and more</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg max-w-xs">
                    <div className="text-4xl mb-2">📊</div>
                    <h3 className="font-semibold mb-1">Track Progress</h3>
                    <p className="text-sm text-muted-foreground">Monitor your learning journey</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg max-w-xs">
                    <div className="text-4xl mb-2">🏆</div>
                    <h3 className="font-semibold mb-1">Earn Badges</h3>
                    <p className="text-sm text-muted-foreground">Unlock achievements as you learn</p>
                  </div>
                </div>
              </div>
            ) : profileError ? (
              <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Profile</AlertTitle>
                <AlertDescription>
                  There was an error loading your profile. Please try refreshing the page. If the problem persists, try logging out and back in.
                </AlertDescription>
              </Alert>
            ) : currentPage === 'admin' ? (
              <AdminWordManagement onBack={() => navigateTo('home')} />
            ) : currentPage === 'language' ? (
              <LanguagePage 
                languageName={selectedLanguage} 
                onBack={() => navigateTo('home')} 
              />
            ) : (
              <HomePage onSelectLanguage={(lang) => navigateTo('language', lang)} />
            )}
          </main>

          <Footer />
          
          {showProfileSetup && <ProfileSetupModal />}
          <Toaster />
        </div>
      </AdminAuthProvider>
    </ThemeProvider>
  );
}
