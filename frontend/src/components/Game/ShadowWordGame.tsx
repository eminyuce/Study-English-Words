import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Word, Language } from '../../backend';
import { DifficultySelector as DifficultySelectorType, Difficulty } from '../../backend';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { CheckCircle2, XCircle, Trophy, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useGetCallerProgress, useUpdateUserProgress } from '../../hooks/useQueries';
import { toast } from 'sonner';
import DifficultySelector from './DifficultySelector';

interface ShadowWordGameProps {
  words: Word[];
  language: Language;
  onClose: () => void;
}

export default function ShadowWordGame({ words, language, onClose }: ShadowWordGameProps) {
  const { data: progress } = useGetCallerProgress();
  const { mutate: updateProgress } = useUpdateUserProgress();
  
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultySelectorType>('all' as DifficultySelectorType);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [showWord, setShowWord] = useState(true);
  const [displayDuration] = useState(2000); // 2 seconds

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
    if (!currentWord || filteredWords.length < 4) return;

    const correctAnswer = currentWord.english;
    
    const wrongAnswers = filteredWords
      .filter(w => w.english !== correctAnswer && w.id !== currentWord.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.english);
    
    if (wrongAnswers.length < 3) {
      console.warn('Not enough words to generate options');
      return;
    }

    const allOptions = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
    setShowWord(true);

    // Hide word after display duration
    const timer = setTimeout(() => {
      setShowWord(false);
    }, displayDuration);

    return () => clearTimeout(timer);
  }, [currentWord, filteredWords, displayDuration]);

  const handleDifficultyChange = (newDifficulty: DifficultySelectorType) => {
    setSelectedDifficulty(newDifficulty);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setScore(0);
    setQuizComplete(false);
  };

  const handleAnswer = useCallback((answer: string) => {
    if (selectedAnswer !== null || !currentWord) return;

    setSelectedAnswer(answer);
    const correct = answer === currentWord.english;
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 1);
      toast.success('Correct! 🎉', { duration: 1000 });
    } else {
      toast.error(`Wrong! The answer was: ${currentWord.english}`, { duration: 2000 });
    }
  }, [selectedAnswer, currentWord]);

  const handleNext = () => {
    if (currentIndex + 1 < totalQuestions) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      setQuizComplete(true);
      
      if (progress) {
        const newTotalCorrect = BigInt(Number(progress.totalCorrect || 0) + score);
        const newTotalAnswered = BigInt(Number(progress.totalAnswered || 0) + totalQuestions);
        const newStreak = score === totalQuestions 
          ? BigInt(Number(progress.streak || 0) + 1)
          : BigInt(0);
        
        updateProgress({
          totalCorrect: newTotalCorrect,
          totalAnswered: newTotalAnswered,
          streak: newStreak,
          badges: progress.badges || [],
        });
      }
    }
  };

  if (filteredWords.length < 4) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">Not enough words for the selected difficulty. At least 4 words are required.</p>
              <DifficultySelector value={selectedDifficulty} onChange={handleDifficultyChange} />
              <Button onClick={onClose}>Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quizComplete) {
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
                <h2 className="text-3xl font-bold mb-2">Quiz Complete! 🎉</h2>
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

  if (!currentWord || options.length === 0) {
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
          <h2 className="text-2xl font-bold">Shadow Word</h2>
          <p className="text-sm text-muted-foreground">Remember the word shown briefly</p>
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

          <div className="text-center py-12 min-h-[200px] flex items-center justify-center">
            {showWord ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                <Eye className="w-12 h-12 mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Remember this word:</p>
                <p className="text-5xl font-bold">{currentWord.english}</p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-300">
                <EyeOff className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Which word did you see?</p>
              </div>
            )}
          </div>

          {!showWord && (
            <div className="grid grid-cols-1 gap-3 animate-in fade-in duration-500">
              {options.map((option, idx) => {
                const isSelected = selectedAnswer === option;
                const isCorrectAnswer = option === currentWord.english;
                const showResult = selectedAnswer !== null;

                let buttonClass = 'w-full p-4 text-lg transition-all';
                if (showResult) {
                  if (isSelected && isCorrect) {
                    buttonClass += ' bg-green-500 text-white hover:bg-green-600';
                  } else if (isSelected && !isCorrect) {
                    buttonClass += ' bg-red-500 text-white hover:bg-red-600';
                  } else if (isCorrectAnswer) {
                    buttonClass += ' bg-green-500 text-white hover:bg-green-600';
                  }
                }

                return (
                  <Button
                    key={idx}
                    variant={showResult ? 'default' : 'outline'}
                    className={buttonClass}
                    onClick={() => handleAnswer(option)}
                    disabled={selectedAnswer !== null}
                  >
                    <span className="flex items-center justify-between w-full">
                      <span>{option}</span>
                      {showResult && isSelected && (
                        isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />
                      )}
                      {showResult && !isSelected && isCorrectAnswer && (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                    </span>
                  </Button>
                );
              })}
            </div>
          )}

          {selectedAnswer !== null && (
            <Button onClick={handleNext} className="w-full" size="lg">
              {currentIndex + 1 < totalQuestions ? 'Next Question' : 'Finish Quiz'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
