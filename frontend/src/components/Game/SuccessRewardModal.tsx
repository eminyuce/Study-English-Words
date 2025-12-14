import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Sparkles, Trophy, Star, Award } from 'lucide-react';
import { Button } from '../ui/button';

interface SuccessRewardModalProps {
  open: boolean;
  onClose: () => void;
  quote: string;
  successRate: number;
}

export default function SuccessRewardModal({
  open,
  onClose,
  quote,
  successRate,
}: SuccessRewardModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-modal sm:max-w-lg">
        <div className="relative overflow-hidden rounded-xl">
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none z-10">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '-10px',
                    animationDelay: `${Math.random() * 0.6}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                  }}
                >
                  {i % 4 === 0 ? (
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                  ) : i % 4 === 1 ? (
                    <Star className="w-4 h-4 text-pink-500" />
                  ) : i % 4 === 2 ? (
                    <Trophy className="w-4 h-4 text-purple-500" />
                  ) : (
                    <Award className="w-4 h-4 text-blue-500" />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="text-center py-10 px-4 space-y-8 relative z-20">
            <div className="flex justify-center">
              <div className="relative animate-celebrate">
                <Trophy className="w-32 h-32 text-yellow-500 drop-shadow-2xl" />
                <Sparkles className="w-10 h-10 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
                <Star className="w-8 h-8 text-pink-500 absolute -bottom-1 -left-1 animate-pulse" />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-4xl font-bold glass-text">
                Outstanding Performance!
              </h2>
              <div className="space-y-1">
                <p className="text-6xl font-bold text-primary drop-shadow-sm">
                  {Math.round(successRate)}%
                </p>
                <p className="text-sm font-medium glass-text-muted uppercase tracking-wide">
                  Success Rate
                </p>
              </div>
            </div>

            <div className="glass-card-inner p-8 shadow-md">
              <div className="flex justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <p className="text-xl font-semibold italic glass-text leading-relaxed">
                "{quote}"
              </p>
            </div>

            <Button 
              onClick={onClose} 
              size="lg" 
              className="w-full h-14 text-lg font-semibold glass-button"
            >
              Continue Learning
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
