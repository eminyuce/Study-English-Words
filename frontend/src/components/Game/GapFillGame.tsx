import { useState, useEffect, useMemo } from 'react';
import type { Word, Language } from '../../backend';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { CheckCircle2, XCircle, Trophy, ArrowLeft } from 'lucide-react';
import { useGetCallerProgress, useUpdateUserProgress } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface GapFillGameProps {
  words: Word[];
  language: Language;
  onClose: () => void;
}

interface QuestionData {
  word: Word;
  gappedSentence: string;
  originalSentence: string;
}

export default function GapFillGame({ words, language, onClose }: GapFillGameProps) {
  const { data: progress } = useGetCallerProgress();
  const { mutate: updateProgress } = useUpdateUserProgress();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [options, setOptions] = useState<string[]>([]);

  const questions = useMemo(() => {
    const wordsWithExamples = words.filter(w => w.examples && w.examples.length > 0);
    
    const questionList: QuestionData[] = [];
    
    for (const word of wordsWithExamples) {
      for (const example of word.examples) {
        const regex = new RegExp(`\\b${word.english}\\b`, 'i');
        if (regex.test(example)) {
          const gapped = example.replace(regex, '______');
          questionList.push({
            word,
            gappedSentence: gapped,
            originalSentence: example,
          });
          break;
        }
      }
    }
    
    return questionList.sort(() => Math.random() - 0.5).slice(0, Math.min(15, questionList.length));
  }, [words]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  useEffect(() => {
    if (!currentQuestion || words.length < 4) return;

    const correctAnswer = currentQuestion.word.english;
    
    const wrongAnswers = words
      .filter(w => w.english !== correctAnswer && w.id !== currentQuestion.word.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.english);
    
    if (wrongAnswers.length < 3) {
      console.warn('Not enough words to generate options');
      return;
    }

    const allOptions = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
    setOptions(allOptions);
  }, [currentQuestion, words]);

  const handleAnswer = (answer: string) => {
    if (selectedAnswer !== null || !currentQuestion) return;

    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.word.english;
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 1);
      toast.success('Correct! 🎉', { duration: 1000 });
    } else {
      toast.error(`Wrong! The answer was: ${currentQuestion.word.english}`, { duration: 2000 });
    }
  };

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

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">Not enough words with example sentences for this game mode.</p>
              <p className="text-sm text-muted-foreground">Words need to have example sentences that contain the English word.</p>
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

  if (!currentQuestion || options.length === 0) {
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
          <h2 className="text-2xl font-bold">Gap-Fill Sentence</h2>
          <p className="text-sm text-muted-foreground">Fill in the missing word</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {currentIndex + 1} of {totalQuestions}</span>
              <span>Score: {score}/{totalQuestions}</span>
            </div>
            <Progress value={((currentIndex + 1) / totalQuestions) * 100} className="h-2" />
          </div>

          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">Fill in the blank:</p>
            <p className="text-2xl font-semibold leading-relaxed">{currentQuestion.gappedSentence}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrectAnswer = option === currentQuestion.word.english;
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
