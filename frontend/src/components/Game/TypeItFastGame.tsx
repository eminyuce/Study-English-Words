import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Word, Language } from '../../backend';
import { DifficultySelector as DifficultySelectorType, Difficulty } from '../../backend';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { Trophy, ArrowLeft, Keyboard, Timer } from 'lucide-react';
import { useGetCallerProgress, useUpdateUserProgress } from '../../hooks/useQueries';
import { toast } from 'sonner';
import DifficultySelector from './DifficultySelector';

interface TypeItFastGameProps {
  words: Word[];
  language: Language;
  onClose: () => void;
}

export default function TypeItFastGame({ words, language, onClose }: TypeItFastGameProps) {
  const { data: progress } = useGetCallerProgress();
  const { mutate: updateProgress } = useUpdateUserProgress();
  
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultySelectorType>('all' as DifficultySelectorType);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isAnswered, setIsAnswered] = useState(false);

  const filteredWords = useMemo(() => {
    if (selectedDifficulty === 'all') return words;
    return words.filter(w => w.difficulty === (selectedDifficulty as unknown as Difficulty));
  }, [words, selectedDifficulty]);

  const shuffledWords = useMemo(() => {
    return [...filteredWords].sort(() => Math.random() - 0.5).slice(0, Math.min(20, filteredWords.length));
  }, [filteredWords]);

  const currentWord = shuffledWords[currentIndex];
  const totalQuestions = shuffledWords.length;

  useEffect(() => {
    if (!currentWord || isAnswered || gameComplete) return;

    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      handleTimeout();
    }
  }, [timeLeft, currentWord, isAnswered, gameComplete]);

  const handleTimeout = () => {
    setIsAnswered(true);
    setStreak(0);
    toast.error(`Time's up! The answer was: ${currentWord.english}`, { duration: 2000 });
    
    setTimeout(() => {
      handleNext();
    }, 2000);
  };

  const handleDifficultyChange = (newDifficulty: DifficultySelectorType) => {
    setSelectedDifficulty(newDifficulty);
    setCurrentIndex(0);
    setUserInput('');
    setScore(0);
    setStreak(0);
    setGameComplete(false);
    setTimeLeft(10);
    setIsAnswered(false);
  };

  const handleSubmit = useCallback(() => {
    if (!currentWord || isAnswered) return;

    const correct = userInput.trim().toLowerCase() === currentWord.english.toLowerCase();
    setIsAnswered(true);

    if (correct) {
      const timeBonus = Math.max(0, timeLeft);
      const streakBonus = streak + 1;
      const points = 10 + timeBonus + streakBonus;
      
      setScore(prev => prev + points);
      setStreak(prev => prev + 1);
      toast.success(`Correct! +${points} points (${timeBonus} time bonus, ${streakBonus}x streak)`, { duration: 1500 });
    } else {
      setStreak(0);
      toast.error(`Wrong! The answer was: ${currentWord.english}`, { duration: 2000 });
    }

    setTimeout(() => {
      handleNext();
    }, 1500);
  }, [currentWord, userInput, timeLeft, streak, isAnswered]);

  const handleNext = () => {
    if (currentIndex + 1 < totalQuestions) {
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
      setTimeLeft(10);
      setIsAnswered(false);
    } else {
      setGameComplete(true);
      
      if (progress) {
        const newTotalCorrect = BigInt(Number(progress.totalCorrect || 0) + score);
        const newTotalAnswered = BigInt(Number(progress.totalAnswered || 0) + totalQuestions);
        
        updateProgress({
          totalCorrect: newTotalCorrect,
          totalAnswered: newTotalAnswered,
          streak: progress.streak || BigInt(0),
          badges: progress.badges || [],
        });
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAnswered && userInput.trim()) {
      handleSubmit();
    }
  };

  if (filteredWords.length < 1) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">No words available for the selected difficulty.</p>
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
                <h2 className="text-3xl font-bold mb-2">Game Complete! ⚡</h2>
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

  if (!currentWord) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading question...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
          <h2 className="text-2xl font-bold">Type It Fast</h2>
          <p className="text-sm text-muted-foreground">Type the English word quickly</p>
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
              <span>Question {currentIndex + 1} of {totalQuestions}</span>
              <span>Score: {score} | Streak: {streak}x</span>
            </div>
            <Progress value={((currentIndex + 1) / totalQuestions) * 100} className="h-2" />
          </div>

          <div className="flex items-center justify-center gap-4 py-4">
            <Timer className={`w-8 h-8 ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
            <span className={`text-4xl font-bold ${timeLeft <= 3 ? 'text-red-500' : ''}`}>
              {timeLeft}s
            </span>
          </div>

          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-2">Type the English word for:</p>
            <p className="text-4xl font-bold" dir={language.textDirection === 'rtl' ? 'rtl' : 'ltr'}>
              {currentWord.foreign}
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Keyboard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your answer..."
                className="pl-12 text-lg h-14"
                disabled={isAnswered}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>

            {!isAnswered && (
              <Button 
                onClick={handleSubmit} 
                className="w-full" 
                size="lg"
                disabled={!userInput.trim()}
              >
                Submit Answer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
