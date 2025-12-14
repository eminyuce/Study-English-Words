import { useState } from 'react';
import { useActor } from '../hooks/useActor';

export function useGameReward() {
  const { actor } = useActor();
  const [showReward, setShowReward] = useState(false);
  const [rewardQuote, setRewardQuote] = useState('');
  const [rewardSuccessRate, setRewardSuccessRate] = useState(0);

  const checkReward = async (correctAnswers: number, totalQuestions: number) => {
    const successRate = (correctAnswers / totalQuestions) * 100;

    if (successRate >= 80) {
      try {
        let quote = 'we are proud of your success';
        
        if (actor) {
          quote = await actor.getRandomQuote();
        }

        setRewardQuote(quote);
        setRewardSuccessRate(successRate);
        setShowReward(true);
      } catch (error) {
        console.error('Error fetching reward quote:', error);
        setRewardQuote('we are proud of your success');
        setRewardSuccessRate(successRate);
        setShowReward(true);
      }
    }
  };

  const closeReward = () => {
    setShowReward(false);
  };

  return {
    checkReward,
    showReward,
    rewardQuote,
    rewardSuccessRate,
    closeReward,
  };
}

