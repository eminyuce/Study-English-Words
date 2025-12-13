import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Word, Language } from '../../backend';
import { DifficultySelector as DifficultySelectorType, Difficulty } from '../../backend';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { Trophy, ArrowLeft, HelpCircle } from 'lucide-react';
import { useGetCallerProgress, useUpdateUserProgress } from '../../hooks/useQueries';
import { toast } from 'sonner';
import DifficultySelector from './DifficultySelector';

interface MissingLettersGameProps {
  words: Word[];
  language: Language;
  onClose: () => void;
}

export default function MissingLettersGame({ words, language, onClose }: MissingLettersGameProps) {
  const { data: progress } = useGetCallerProgress();
  const { mutate: updateProgress } = useUpdateUserProgress();
  
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultySelectorType>('all' as DifficultySelectorType);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [wordWithBlanks, setWordWithBlanks] = useState('');
  const [missingPositions, setMissingPositions] = useState<number[]>([]);
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

  const generateBlanks = (word: string): { display: string; positions: number[] } => {
    if (word.length < 3) return { display: word, positions: [] };

    const numBlanks = Math.min(Math.ceil(word.length / 3), 3);
    const positions: number[] = [];
    
    while (positions.length < numBlanks) {
      const pos = Math.floor(Math.random() * word.length);
      if (!positions.includes(pos)) {
        positions.push(pos);
      }
    }

    positions.sort((a, b) => a - b);

    let display = '';
    for (let i = 0; i < word.length; i++) {
      if (positions.includes(i)) {
        display += '_';
      } else {
        display += word[i];
      }
    }

    return { display, positions };
  };

  useEffect(() => {
    if (!currentWord) return;
    const { display, positions } = generateBlanks(currentWord.english);
    setWordWithBlanks(display);
    setMissingPositions(positions);
    setUserInput('');
    setIsAnswered(false);
  }, [currentWord]);

  const handleDifficultyChange = (newDifficulty: DifficultySelectorType) => {
    setSelectedDifficulty(newDifficulty);
    setCurrentIndex(0);
    setUserInput('');
    setScore(0);
    setGameComplete(false);
  };

  const handleSubmit = useCallback(() => {
    if (!currentWord || isAnswered) return;

    const correct = userInput.trim().toLowerCase() === currentWord.english.toLowerCase();
    setIsAnswered(true);

    if (correct) {
      setScore(prev => prev + 1);
      toast.success('Correct! 🎉', { duration: 1500 });
    } else {
      toast.error(`Wrong! The answer was: ${currentWord.english}`, { duration: 2000 });
    }

    setTimeout(() => {
      handleNext();
    }, 1500);
  }, [currentWord, userInput, isAnswered]);

  const handleNext = () => {
    if (currentIndex + 1 < totalQuestions) {
      setCurrentIndex(prev => prev + 1);
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
    const percentage = Math.round((score / totalQuestions) * 100);
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
                <p className="text-5xl font-bold mb-2">{percentage}%</p>
                <p className="text-muted-foreground">
                  You got {score} out of {totalQuestions} correct!
                </p>
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
          <h2 className="text-2xl font-bold">Missing Letters</h2>
          <p className="text-sm text-muted-foreground">Fill in the blanks</p>
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
              <span>Score: {score}/{totalQuestions}</span>
            </div>
            <Progress value={((currentIndex + 1) / totalQuestions) * 100} className="h-2" />
          </div>

          <div className="text-center py-8 space-y-4">
            <HelpCircle className="w-12 h-12 mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Complete the word:</p>
            <p className="text-6xl font-bold tracking-widest font-mono">
              {wordWithBlanks}
            </p>
            <p className="text-sm text-muted-foreground">
              Meaning: {currentWord.foreign}
            </p>
          </div>

          <div className="space-y-4">
            <Input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type the complete word..."
              className="text-lg h-14 text-center"
              disabled={isAnswered}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />

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
