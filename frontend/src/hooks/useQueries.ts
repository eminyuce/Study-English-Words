import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { Language, Word, UserProgress, UserProfile, Difficulty, TextDirection, UserRole } from '../backend';
import { toast } from 'sonner';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserProfile();
      } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: 1,
    staleTime: 30000,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onMutate: async (newProfile) => {
      await queryClient.cancelQueries({ queryKey: ['currentUserProfile'] });
      const previousProfile = queryClient.getQueryData<UserProfile | null>(['currentUserProfile']);
      queryClient.setQueryData<UserProfile | null>(['currentUserProfile'], newProfile);
      toast.success('Profile saved! ✨', { duration: 2000 });
      return { previousProfile };
    },
    onError: (error: Error, _newProfile, context) => {
      if (context?.previousProfile !== undefined) {
        queryClient.setQueryData(['currentUserProfile'], context.previousProfile);
      }
      toast.error(`Failed to save profile: ${error.message}`, { duration: 4000 });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Language Queries
export function useGetAllLanguages() {
  const { actor, isFetching } = useActor();

  return useQuery<Language[]>({
    queryKey: ['languages'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const result = await actor.getLanguagesSorted();
        return result || [];
      } catch (error) {
        console.error('Error fetching languages:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    staleTime: 60000,
  });
}

export function useCreateLanguage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      code: string;
      flag: string;
      direction: TextDirection;
      startColor: string;
      endColor: string;
      ordering: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createLanguage(
        params.name,
        params.code,
        params.flag,
        params.direction,
        params.startColor,
        params.endColor,
        params.ordering
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      toast.success('Language created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create language: ${error.message}`);
    },
  });
}

export function useRemoveLanguage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (languageName: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeLanguage(languageName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['allWords'] });
      toast.success('Language and all associated words removed successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove language: ${error.message}`);
    },
  });
}

export function useUpdateLanguageOrdering() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { name: string; newOrdering: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateLanguageOrdering(params.name, params.newOrdering);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      toast.success('Language ordering updated!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update ordering: ${error.message}`);
    },
  });
}

// Word Queries
export function useGetWordsForLanguage(language: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Word[]>({
    queryKey: ['words', language],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const result = await actor.getWordsForLanguage(language);
        return result || [];
      } catch (error) {
        console.error('Error fetching words for language:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!language,
    retry: 2,
    staleTime: 30000,
  });
}

export function useGetWordsByDifficulty(language: string, difficulty: Difficulty) {
  const { actor, isFetching } = useActor();

  return useQuery<Word[]>({
    queryKey: ['words', language, difficulty],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const result = await actor.getWordsByDifficulty(language, difficulty);
        return result || [];
      } catch (error) {
        console.error('Error fetching words by difficulty:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!language,
    retry: 2,
    staleTime: 30000,
  });
}

export function useGetAllWords() {
  const { actor, isFetching } = useActor();

  return useQuery<Word[]>({
    queryKey: ['allWords'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const result = await actor.getAllWords();
        return result || [];
      } catch (error) {
        console.error('Error fetching all words:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    staleTime: 30000,
  });
}

export function useAddWord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      english: string;
      foreign: string;
      language: string;
      difficulty: Difficulty;
      examples: string[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addWord(params.english, params.foreign, params.language, params.difficulty, params.examples);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['allWords'] });
      queryClient.invalidateQueries({ queryKey: ['words', variables.language] });
      toast.success('Word added successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add word: ${error.message}`);
    },
  });
}

export function useUpdateWord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      english: string;
      foreign: string;
      language: string;
      difficulty: Difficulty;
      examples: string[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateWord(params.id, params.english, params.foreign, params.language, params.difficulty, params.examples);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['allWords'] });
      queryClient.invalidateQueries({ queryKey: ['words', variables.language] });
      toast.success('Word updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update word: ${error.message}`);
    },
  });
}

export function useDeleteWord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteWord(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['allWords'] });
      toast.success('Word deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete word: ${error.message}`);
    },
  });
}

// User Progress Queries
export function useGetCallerProgress() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<UserProgress | null>({
    queryKey: ['userProgress'],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getCallerProgress();
      } catch (error) {
        console.error('Error fetching user progress:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!identity,
    retry: 2,
    staleTime: 10000,
  });
}

export function useUpdateUserProgress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      totalCorrect: bigint;
      totalAnswered: bigint;
      streak: bigint;
      badges: string[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateUserProgress(
        params.totalCorrect,
        params.totalAnswered,
        params.streak,
        params.badges
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
    },
    onError: (error: Error) => {
      console.error('Failed to update progress:', error);
      toast.error(`Failed to update progress: ${error.message}`);
    },
  });
}

// Admin Queries
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
    },
    enabled: !!actor && !isFetching && !!identity,
    retry: 1,
    staleTime: 60000,
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<UserRole>({
    queryKey: ['userRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserRole();
      } catch (error) {
        console.error('Error fetching user role:', error);
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !!identity,
    retry: 1,
    staleTime: 60000,
  });
}

// Seed Data
export function useSeedData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const seedLanguages = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.seedInitialLanguages();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
    },
  });

  const seedData = async () => {
    try {
      await seedLanguages.mutateAsync();
    } catch (error) {
      console.log('Data seeding skipped:', error);
    }
  };

  return { seedData, isSeeding: seedLanguages.isPending };
}

// Optimized Bulk Import with Frontend Parsing
export interface VocabEntry {
  english: string;
  foreign: string;
  language: string;
  difficulty: string;
  examples: string[];
}

const BATCH_SIZE = 300;

export function useBulkImportWords() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      entries: VocabEntry[];
      onProgress?: (current: number, total: number) => void;
    }) => {
      if (!actor) throw new Error('Actor not available');

      const { entries, onProgress } = params;
      const startTime = Date.now();
      let totalProcessed = 0;
      const affectedLanguages = new Set<string>();

      const batches: VocabEntry[][] = [];
      for (let i = 0; i < entries.length; i += BATCH_SIZE) {
        batches.push(entries.slice(i, i + BATCH_SIZE));
      }

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        batch.forEach(entry => affectedLanguages.add(entry.language));

        const processedBatch = batch.map(entry => {
          const difficultyMap: Record<string, Difficulty> = {
            'Beginner': 'beginner' as Difficulty,
            'Medium': 'medium' as Difficulty,
            'Hard': 'hard' as Difficulty,
            'Advanced': 'advanced' as Difficulty,
          };

          return {
            english: entry.english,
            foreign: entry.foreign,
            language: entry.language,
            difficulty: difficultyMap[entry.difficulty] || ('beginner' as Difficulty),
            examples: entry.examples,
          };
        });

        await Promise.all(
          processedBatch.map(word =>
            actor.addWord(word.english, word.foreign, word.language, word.difficulty, word.examples)
              .catch(err => {
                console.warn(`Failed to add word ${word.english}:`, err);
              })
          )
        );

        totalProcessed += batch.length;
        
        if (onProgress) {
          onProgress(totalProcessed, entries.length);
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      return {
        success: totalProcessed,
        duration,
        affectedLanguages: Array.from(affectedLanguages),
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['allWords'] });
      
      result.affectedLanguages.forEach(language => {
        queryClient.invalidateQueries({ queryKey: ['words', language] });
      });

      toast.success(`✅ Imported ${result.success} words in ${result.duration}s`, {
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });
}

export function useRemoveWordsByLanguage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (language: string) => {
      if (!actor) throw new Error('Actor not available');
      
      const startTime = Date.now();
      
      await actor.removeWordsByLanguage(language);

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      return {
        duration,
        language,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['words'] });
      queryClient.invalidateQueries({ queryKey: ['allWords'] });
      queryClient.invalidateQueries({ queryKey: ['words', result.language] });

      toast.success(`🗑️ All ${result.language} words removed successfully in ${result.duration}s`, { 
        duration: 5000 
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove words: ${error.message}`);
    },
  });
}
