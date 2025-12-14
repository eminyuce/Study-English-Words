import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Trophy, Star, Sparkles, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';

interface GameCompletionScreenProps {
  score: number;
  totalQuestions: number;
  onContinue: () => void;
  gameMode: string;
}

export default function GameCompletionScreen({
  score,
  totalQuestions,
  onContinue,
  gameMode,
}: GameCompletionScreenProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const percentage = Math.round((score / totalQuestions) * 100);
  const accuracy = percentage;

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Dialog open={true}>
      <DialogContent className="glass-modal max-w-2xl">
        <div className="relative overflow-hidden">
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '-10px',
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                  }}
                >
                  {i % 3 === 0 ? (
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                  ) : i % 3 === 1 ? (
                    <Star className="w-4 h-4 text-pink-500" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="pt-8 relative z-10">
            <div className="space-y-8">
              <div className="flex justify-center">
                <div className="relative animate-celebrate">
                  <Trophy className="w-28 h-28 text-yellow-500 drop-shadow-lg" />
                  <Sparkles className="w-10 h-10 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
                </div>
              </div>

              <div className="space-y-3 text-center">
                <h2 className="text-4xl font-bold glass-text">
                  Game Complete! 🎉
                </h2>
                <p className="text-lg glass-text-muted">
                  {gameMode}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6 py-6">
                <div className="space-y-2 text-center">
                  <p className="text-sm font-medium glass-text-muted uppercase tracking-wide">
                    Score
                  </p>
                  <p className="text-4xl font-bold text-primary">
                    {score}
                  </p>
                  <p className="text-xs glass-text-muted">
                    out of {totalQuestions}
                  </p>
                </div>

                <div className="space-y-2 text-center">
                  <p className="text-sm font-medium glass-text-muted uppercase tracking-wide">
                    Accuracy
                  </p>
                  <p className="text-4xl font-bold text-success">
                    {accuracy}%
                  </p>
                  <p className="text-xs glass-text-muted">
                    success rate
                  </p>
                </div>

                <div className="space-y-2 text-center">
                  <p className="text-sm font-medium glass-text-muted uppercase tracking-wide">
                    Questions
                  </p>
                  <p className="text-4xl font-bold glass-text">
                    {totalQuestions}
                  </p>
                  <p className="text-xs glass-text-muted">
                    completed
                  </p>
                </div>
              </div>

              <div className="glass-card-inner p-6">
                <p className="text-lg font-medium glass-text text-center">
                  {accuracy >= 90
                    ? '🌟 Outstanding! You\'re mastering English vocabulary!'
                    : accuracy >= 80
                    ? '🎯 Excellent work! Keep up the great progress!'
                    : accuracy >= 70
                    ? '👍 Good job! You\'re improving steadily!'
                    : accuracy >= 60
                    ? '💪 Nice effort! Practice makes perfect!'
                    : '📚 Keep learning! Every attempt makes you better!'}
                </p>
              </div>

              <Button 
                onClick={onContinue} 
                className="w-full h-14 text-lg font-semibold glass-button"
                size="lg"
              >
                Continue Learning
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
