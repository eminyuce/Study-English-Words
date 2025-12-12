import { useState, useEffect, useMemo } from 'react';
import type { Word, Language } from '../../backend';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { ArrowLeft, Trophy, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface MemoryMatchGameProps {
  words: Word[];
  language: Language;
  onClose: () => void;
}

type CardType = {
  id: number;
  text: string;
  type: 'english' | 'foreign';
  wordId: number;
  isFlipped: boolean;
  isMatched: boolean;
};

export default function MemoryMatchGame({ words, language, onClose }: MemoryMatchGameProps) {
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const gameWords = useMemo(() => {
    return [...words].sort(() => Math.random() - 0.5).slice(0, Math.min(8, words.length));
  }, [words]);

  const totalPairs = gameWords.length;

  useEffect(() => {
    const cardPairs: CardType[] = [];
    gameWords.forEach((word, idx) => {
      cardPairs.push({
        id: idx * 2,
        text: word.english,
        type: 'english',
        wordId: idx,
        isFlipped: false,
        isMatched: false,
      });
      cardPairs.push({
        id: idx * 2 + 1,
        text: word.foreign,
        type: 'foreign',
        wordId: idx,
        isFlipped: false,
        isMatched: false,
      });
    });
    
    const shuffled = cardPairs.sort(() => Math.random() - 0.5);
    setCards(shuffled);
  }, [gameWords]);

  const handleCardClick = (cardId: number) => {
    if (isProcessing || flippedCards.length === 2) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    const newCards = cards.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setIsProcessing(true);
      setMoves(prev => prev + 1);
      
      const [firstId, secondId] = newFlipped;
      const firstCard = newCards.find(c => c.id === firstId);
      const secondCard = newCards.find(c => c.id === secondId);

      if (firstCard && secondCard && firstCard.wordId === secondCard.wordId) {
        toast.success('Match! 🎉', { duration: 1000 });
        
        setTimeout(() => {
          setCards(prevCards => prevCards.map(c => 
            c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c
          ));
          setFlippedCards([]);
          setMatches(prev => prev + 1);
          setIsProcessing(false);
          
          if (matches + 1 === totalPairs) {
            setTimeout(() => setIsComplete(true), 500);
          }
        }, 600);
      } else {
        toast.error('Not a match!', { duration: 1000 });
        
        setTimeout(() => {
          setCards(prevCards => prevCards.map(c => 
            c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c
          ));
          setFlippedCards([]);
          setIsProcessing(false);
        }, 1200);
      }
    }
  };

  const handleRestart = () => {
    setIsComplete(false);
    setMoves(0);
    setMatches(0);
    setFlippedCards([]);
    setIsProcessing(false);
    
    const cardPairs: CardType[] = [];
    gameWords.forEach((word, idx) => {
      cardPairs.push({
        id: idx * 2,
        text: word.english,
        type: 'english',
        wordId: idx,
        isFlipped: false,
        isMatched: false,
      });
      cardPairs.push({
        id: idx * 2 + 1,
        text: word.foreign,
        type: 'foreign',
        wordId: idx,
        isFlipped: false,
        isMatched: false,
      });
    });
    
    setCards(cardPairs.sort(() => Math.random() - 0.5));
  };

  if (words.length < 2) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">Not enough words to play this game. At least 2 words are required.</p>
              <Button onClick={onClose}>Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-6">
              <div className="flex justify-center">
                <Trophy className="w-24 h-24 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">Congratulations! 🎉</h2>
                <p className="text-muted-foreground">
                  You completed the game in {moves} moves!
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleRestart} variant="outline" className="flex-1 gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Play Again
                </Button>
                <Button onClick={onClose} className="flex-1">
                  Continue Learning
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
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
            <h2 className="text-2xl font-bold">Memory Match</h2>
            <p className="text-sm text-muted-foreground">Match English with {language.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Moves: {moves}</p>
          <p className="text-sm text-muted-foreground">Matches: {matches}/{totalPairs}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card
            key={card.id}
            className={`cursor-pointer transition-all duration-300 transform hover:scale-105 ${
              card.isMatched ? 'opacity-40 cursor-not-allowed' : ''
            } ${card.isFlipped && !card.isMatched ? 'ring-2 ring-primary' : ''}`}
            onClick={() => handleCardClick(card.id)}
          >
            <CardContent className="p-6 h-32 flex items-center justify-center">
              {card.isFlipped || card.isMatched ? (
                <p className="text-center font-semibold text-sm break-words">{card.text}</p>
              ) : (
                <div className="text-4xl">❓</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
