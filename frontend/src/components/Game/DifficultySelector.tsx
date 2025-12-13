import { useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { DifficultySelector as DifficultySelectorType } from '../../backend';
import { useGetCallerUserPreferences, useUpdateCallerUserPreferences } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';

interface DifficultySelectorProps {
  value: DifficultySelectorType;
  onChange: (value: DifficultySelectorType) => void;
  className?: string;
}

export default function DifficultySelector({ value, onChange, className }: DifficultySelectorProps) {
  const { identity } = useInternetIdentity();
  const { data: preferences } = useGetCallerUserPreferences();
  const { mutate: updatePreferences } = useUpdateCallerUserPreferences();

  // Load saved preference on mount
  useEffect(() => {
    if (preferences && identity) {
      onChange(preferences.difficulty);
    }
  }, [preferences, identity]);

  const handleChange = (newValue: string) => {
    const difficulty = newValue as DifficultySelectorType;
    onChange(difficulty);

    // Persist to backend if user is authenticated
    if (identity && preferences) {
      updatePreferences({
        ...preferences,
        difficulty,
      });
    }
  };

  return (
    <Tabs value={value} onValueChange={handleChange} className={className}>
      <TabsList className="grid grid-cols-5 w-full">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="beginner">Beginner</TabsTrigger>
        <TabsTrigger value="medium">Medium</TabsTrigger>
        <TabsTrigger value="hard">Hard</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
