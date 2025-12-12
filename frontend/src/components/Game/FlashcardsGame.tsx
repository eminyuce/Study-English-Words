import { useState, useMemo } from 'react';
import type { Word, Language } from '../../backend';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { ArrowLeft, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { TextDirection } from '../../backend';

interface FlashcardsGameProps {
  words: Word[];
  language: Language;
  onClose: () => void;
}

export default function FlashcardsGame({ words, language, onClose }: FlashcardsGameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const shuffledWords = useMemo(() => {
    return [...words].sort(() => Math.random() - 0.5);
  }, [words]);

  const currentWord = shuffledWords[currentIndex];

  const handleNext = () => {
    if (currentIndex < shuffledWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(prev => !prev);
  };

  if (!currentWord) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">No words available for flashcards.</p>
              <Button onClick={onClose}>Back</Button>
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
          <h2 className="text-2xl font-bold">Flashcards</h2>
          <p className="text-sm text-muted-foreground">Card {currentIndex + 1} of {shuffledWords.length}</p>
        </div>
      </div>

      <div className="perspective-1000">
        <Card 
          className="min-h-[450px] cursor-pointer transition-all duration-500 transform hover:scale-[1.02]"
          onClick={handleFlip}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <CardContent className="pt-6 h-full flex flex-col justify-center items-center p-8">
            {!isFlipped ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">English</p>
                <p className="text-5xl font-bold mb-4">{currentWord.english}</p>
                <p className="text-sm text-muted-foreground mt-8">Click to flip</p>
              </div>
            ) : (
              <div className="text-center space-y-4 w-full" style={{ transform: 'rotateY(180deg)' }}>
                <p className="text-sm text-muted-foreground">{language.name}</p>
                <p 
                  className="text-5xl font-bold mb-6"
                  dir={language.textDirection === TextDirection.rtl ? 'rtl' : 'ltr'}
                >
                  {currentWord.foreign}
                </p>
                {currentWord.examples && currentWord.examples.length > 0 && (
                  <div className="mt-8 space-y-3 text-left max-w-xl mx-auto">
                    <p className="text-sm font-semibold text-muted-foreground">Example Sentences:</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {currentWord.examples.slice(0, 5).map((example, idx) => (
                        <p key={idx} className="text-sm italic bg-muted/50 p-2 rounded">
                          {example}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        
        <Button
          variant="outline"
          onClick={handleFlip}
          className="gap-2"
        >
          <RotateCw className="w-4 h-4" />
          Flip Card
        </Button>

        <Button
          variant="outline"
          onClick={handleNext}
          disabled={currentIndex === shuffledWords.length - 1}
          className="gap-2"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
