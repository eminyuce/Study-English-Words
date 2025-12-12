import { useGetAllLanguages } from '../hooks/useQueries';
import LanguageCard from './LanguageCard';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle } from 'lucide-react';

interface LanguageGridProps {
  onSelectLanguage: (language: string) => void;
}

export default function LanguageGrid({ onSelectLanguage }: LanguageGridProps) {
  const { data: languages, isLoading, error } = useGetAllLanguages();

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Choose a Language
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Choose a Language
        </h2>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load languages. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!languages || languages.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Choose a Language
        </h2>
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl">
          <p className="text-muted-foreground mb-2">No languages available yet.</p>
          <p className="text-sm text-muted-foreground">Check back soon or contact an admin to add languages!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        Choose a Language
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {languages.map((language) => (
          <LanguageCard 
            key={language.name} 
            language={language} 
            onSelect={() => onSelectLanguage(language.name)}
          />
        ))}
      </div>
    </div>
  );
}
