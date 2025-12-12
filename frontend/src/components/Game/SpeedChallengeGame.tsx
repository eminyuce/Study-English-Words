import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Word, Language } from '../../backend';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { ArrowLeft, Trophy, Zap } from 'lucide-react';
import { useGetCallerProgress, useUpdateUserProgress } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface SpeedChallengeGameProps {
  words: Word[];
  language: Language;
  onClose: () => void;
}

type QuestionType = 'meaning' | 'reverse';

interface Question {
  word: Word;
  type: QuestionType;
  correctAnswer: string;
  options: string[];
}

export default function SpeedChallengeGame({ words, language, onClose }: SpeedChallengeGameProps) {
  const { data: progress } = useGetCallerProgress();
  const { mutate: updateProgress } = useUpdateUserProgress();
  
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);

  const questions = useMemo(() => {
    const questionList: Question[] = [];
    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(50, shuffledWords.length * 2); i++) {
      const word = shuffledWords[i % shuffledWords.length];
      const type: QuestionType = Math.random() > 0.5 ? 'meaning' : 'reverse';
      const correctAnswer = type === 'meaning' ? word.foreign : word.english;
      
      const wrongAnswers = words
        .filter(w => w.id !== word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => type === 'meaning' ? w.foreign : w.english);
      
      const options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
      
      questionList.push({
        word,
        type,
        correctAnswer,
        options,
      });
    }
    
    return questionList;
  }, [words]);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setGameOver(true);
      
      if (progress) {
        const newTotalCorrect = BigInt(Number(progress.totalCorrect || 0) + score);
        const newTotalAnswered = BigInt(Number(progress.totalAnswered || 0) + currentQuestionIndex);
        
        updateProgress({
          totalCorrect: newTotalCorrect,
          totalAnswered: newTotalAnswered,
          streak: progress.streak || BigInt(0),
          badges: progress.badges || [],
        });
      }
    }
  }, [timeLeft, gameStarted, gameOver, score, currentQuestionIndex, progress, updateProgress]);

  const handleAnswer = useCallback((answer: string) => {
    if (isAnswering || !currentQuestion || gameOver) return;
    
    setIsAnswering(true);
    
    const correct = answer === currentQuestion.correctAnswer;
    
    if (correct) {
      setScore(prev => prev + 1);
      toast.success('+1 🎉', { duration: 500 });
    }
    
    setTimeout(() => {
      setCurrentQuestionIndex(prev => prev + 1);
      setIsAnswering(false);
    }, 300);
  }, [currentQuestion, isAnswering, gameOver]);

  const startGame = () => {
    setGameStarted(true);
    setTimeLeft(30);
    setScore(0);
    setCurrentQuestionIndex(0);
    setGameOver(false);
    setIsAnswering(false);
  };

  if (words.length < 4) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">Not enough words to play this game. At least 4 words are required.</p>
              <Button onClick={onClose}>Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-6">
              <div className="flex justify-center">
                <Zap className="w-24 h-24 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">Speed Challenge</h2>
                <p className="text-muted-foreground">
                  Answer as many questions as you can in 30 seconds!
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Mix of English → {language.name} and {language.name} → English
                </p>
              </div>
              <Button onClick={startGame} size="lg" className="w-full">
                Start Challenge
              </Button>
              <Button onClick={onClose} variant="outline" className="w-full">
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-6">
              <div className="flex justify-center">
                <Trophy className="w-24 h-24 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">Time's Up! ⚡</h2>
                <p className="text-5xl font-bold mb-2">{score}</p>
                <p className="text-muted-foreground">
                  Correct answers in 30 seconds!
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {currentQuestionIndex} questions attempted
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={startGame} variant="outline" className="flex-1">
                  Play Again
                </Button>
                <Button onClick={onClose} className="flex-1">
                  Back to Learning
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentQuestion) {
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
          Exit
        </Button>
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{
            background: `linear-gradient(135deg, ${language.gradientStart}, ${language.gradientEnd})`,
          }}
        >
          {language.flagEmoji}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Speed Challenge ⚡</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="font-semibold text-lg">{timeLeft}s</span>
            <span>Score: {score}</span>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <Progress value={(timeLeft / 30) * 100} className="h-3" />

          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-2">
              {currentQuestion.type === 'meaning' 
                ? `Translate to ${language.name}:` 
                : 'Translate to English:'}
            </p>
            <p className="text-4xl font-bold">
              {currentQuestion.type === 'meaning' 
                ? currentQuestion.word.english 
                : currentQuestion.word.foreign}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {currentQuestion.options.map((option, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="w-full p-4 text-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => handleAnswer(option)}
                disabled={isAnswering}
              >
                {option}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
