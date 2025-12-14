import { useState, useCallback, useRef } from 'react';

interface ProgressCheckpoint {
  percentage: number;
  message: string;
}

const CHECKPOINTS: ProgressCheckpoint[] = [
  { percentage: 20, message: 'You can do it.' },
  { percentage: 40, message: "You're halfway there." },
  { percentage: 60, message: 'Great progress. Keep the momentum.' },
  { percentage: 80, message: 'Almost there. Stay focused.' },
  { percentage: 100, message: 'Well done. You completed the game.' },
];

export function useSessionProgress(totalQuestions: number) {
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [showOverlay, setShowOverlay] = useState(false);
  const shownCheckpoints = useRef<Set<number>>(new Set());

  const checkProgress = useCallback(
    (questionsCompleted: number) => {
      if (totalQuestions === 0) return;

      const progressPercentage = Math.floor((questionsCompleted / totalQuestions) * 100);

      for (const checkpoint of CHECKPOINTS) {
        if (
          progressPercentage >= checkpoint.percentage &&
          !shownCheckpoints.current.has(checkpoint.percentage)
        ) {
          shownCheckpoints.current.add(checkpoint.percentage);
          setCurrentMessage(checkpoint.message);
          setShowOverlay(true);
          break;
        }
      }
    },
    [totalQuestions]
  );

  const resetProgress = useCallback(() => {
    shownCheckpoints.current.clear();
    setCurrentMessage('');
    setShowOverlay(false);
  }, []);

  const dismissOverlay = useCallback(() => {
    setShowOverlay(false);
  }, []);

  return {
    currentMessage,
    showOverlay,
    checkProgress,
    resetProgress,
    dismissOverlay,
  };
}
