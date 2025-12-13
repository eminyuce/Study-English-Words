import { useState, useEffect, useMemo } from 'react';
import type { Word, Language } from '../../backend';
import { DifficultySelector as DifficultySelectorType, Difficulty } from '../../backend';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { Trophy, ArrowLeft, Grid3x3 } from 'lucide-react';
import { useGetCallerProgress, useUpdateUserProgress } from '../../hooks/useQueries';
import { toast } from 'sonner';
import DifficultySelector from './DifficultySelector';

interface WordGridGameProps {
  words: Word[];
  language: Language;
  onClose: () => void;
}

type Category = 'short' | 'long' | 'beginner' | 'advanced';

export default function WordGridGame({ words, language, onClose }: WordGridGameProps) {
  const { data: progress } = useGetCallerProgress();
  const { mutate: updateProgress } = useUpdateUserProgress();
  
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultySelectorType>('all' as DifficultySelectorType);
  const [currentRound, setCurrentRound] = useState(0);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [gridWords, setGridWords] = useState<Word[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category>('short');
  const [correctWords, setCorrectWords] = useState<Set<string>>(new Set());

  const totalRounds = 5;

  const filteredWords = useMemo(() => {
    if (selectedDifficulty === 'all') return words;
    return words.filter(w => w.difficulty === (selectedDifficulty as unknown as Difficulty));
  }, [words, selectedDifficulty]);

  const categories: Category[] = ['short', 'long', 'beginner', 'advanced'];

  const getCategoryDescription = (cat: Category): string => {
    switch (cat) {
      case 'short': return 'Short words (5 letters or less)';
      case 'long': return 'Long words (more than 8 letters)';
      case 'beginner': return 'Beginner level words';
      case 'advanced': return 'Advanced level words';
    }
  };

  const matchesCategory = (word: Word, cat: Category): boolean => {
    switch (cat) {
      case 'short': return word.english.length <= 5;
      case 'long': return word.english.length > 8;
      case 'beginner': return word.difficulty === Difficulty.beginner;
      case 'advanced': return word.difficulty === Difficulty.advanced;
    }
  };

  useEffect(() => {
    if (filteredWords.length < 12) return;

    const category = categories[currentRound % categories.length];
    setCurrentCategory(category);

    const matching = filteredWords.filter(w => matchesCategory(w, category));
    const nonMatching = filteredWords.filter(w => !matchesCategory(w, category));

    const selectedMatching = matching.sort(() => Math.random() - 0.5).slice(0, 4);
    const selectedNonMatching = nonMatching.sort(() => Math.random() - 0.5).slice(0, 8);

    const grid = [...selectedMatching, ...selectedNonMatching].sort(() => Math.random() - 0.5);
    setGridWords(grid);
    setCorrectWords(new Set(selectedMatching.map(w => w.english)));
    setSelectedWords(new Set());
    setShowResults(false);
  }, [currentRound, filteredWords]);

  const handleDifficultyChange = (newDifficulty: DifficultySelectorType) => {
    setSelectedDifficulty(newDifficulty);
    setCurrentRound(0);
    setScore(0);
    setGameComplete(false);
  };

  const toggleWord = (wordText: string) => {
    if (showResults) return;

    const newSelected = new Set(selectedWords);
    if (newSelected.has(wordText)) {
      newSelected.delete(wordText);
    } else {
      newSelected.add(wordText);
    }
    setSelectedWords(newSelected);
  };

  const handleSubmit = () => {
    setShowResults(true);

    const correctSelections = Array.from(selectedWords).filter(w => correctWords.has(w)).length;
    const incorrectSelections = selectedWords.size - correctSelections;
    const missedCorrect = correctWords.size - correctSelections;

    const roundScore = Math.max(0, correctSelections - incorrectSelections);
    setScore(prev => prev + roundScore);

    if (roundScore === correctWords.size && incorrectSelections === 0) {
      toast.success('Perfect! 🎉', { duration: 1500 });
    } else if (roundScore > 0) {
      toast.success(`+${roundScore} points!`, { duration: 1500 });
    } else {
      toast.error('Try again next time!', { duration: 1500 });
    }
  };

  const handleNext = () => {
    if (currentRound + 1 < totalRounds) {
      setCurrentRound(prev => prev + 1);
    } else {
      setGameComplete(true);
      
      if (progress) {
        const newTotalCorrect = BigInt(Number(progress.totalCorrect || 0) + score);
        const newTotalAnswered = BigInt(Number(progress.totalAnswered || 0) + totalRounds * 4);
        
        updateProgress({
          totalCorrect: newTotalCorrect,
          totalAnswered: newTotalAnswered,
          streak: progress.streak || BigInt(0),
          badges: progress.badges || [],
        });
      }
    }
  };

  if (filteredWords.length < 12) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">Not enough words for the selected difficulty. At least 12 words are required.</p>
              <DifficultySelector value={selectedDifficulty} onChange={handleDifficultyChange} />
              <Button onClick={onClose}>Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameComplete) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-6">
              <div className="flex justify-center">
                <Trophy className="w-24 h-24 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">Game Complete! 🎉</h2>
                <p className="text-5xl font-bold mb-2">{score}</p>
                <p className="text-muted-foreground">Total points earned!</p>
              </div>
              <Button onClick={onClose} className="w-full" size="lg">
                Continue Learning
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onClose} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{
            background: `linear-gradient(135deg, ${language.gradientStart}, ${language.gradientEnd})`,
          }}
        >
          {language.flagEmoji}
        </div>
        <div>
          <h2 className="text-2xl font-bold">Word Grid</h2>
          <p className="text-sm text-muted-foreground">Select all words matching the category</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <DifficultySelector value={selectedDifficulty} onChange={handleDifficultyChange} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Round {currentRound + 1} of {totalRounds}</span>
              <span>Score: {score}</span>
            </div>
            <Progress value={((currentRound + 1) / totalRounds) * 100} className="h-2" />
          </div>

          <div className="text-center py-6 space-y-2">
            <Grid3x3 className="w-12 h-12 mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Select all words that match:</p>
            <p className="text-2xl font-bold">{getCategoryDescription(currentCategory)}</p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {gridWords.map((word, idx) => {
              const isSelected = selectedWords.has(word.english);
              const isCorrect = correctWords.has(word.english);
              const showFeedback = showResults;

              let buttonClass = 'h-20 text-base transition-all';
              if (showFeedback) {
                if (isSelected && isCorrect) {
                  buttonClass += ' bg-green-500 text-white hover:bg-green-600';
                } else if (isSelected && !isCorrect) {
                  buttonClass += ' bg-red-500 text-white hover:bg-red-600';
                } else if (!isSelected && isCorrect) {
                  buttonClass += ' bg-yellow-500 text-white hover:bg-yellow-600';
                }
              } else if (isSelected) {
                buttonClass += ' bg-primary text-primary-foreground';
              }

              return (
                <Button
                  key={idx}
                  variant={isSelected && !showFeedback ? 'default' : 'outline'}
                  className={buttonClass}
                  onClick={() => toggleWord(word.english)}
                  disabled={showResults}
                >
                  {word.english}
                </Button>
              );
            })}
          </div>

          {!showResults ? (
            <Button 
              onClick={handleSubmit} 
              className="w-full" 
              size="lg"
              disabled={selectedWords.size === 0}
            >
              Submit Selection
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                <p>✅ Green: Correct selections</p>
                <p>❌ Red: Incorrect selections</p>
                <p>⚠️ Yellow: Missed correct words</p>
              </div>
              <Button onClick={handleNext} className="w-full" size="lg">
                {currentRound + 1 < totalRounds ? 'Next Round' : 'Finish Game'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
