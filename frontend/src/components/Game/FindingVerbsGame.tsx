import { useState, useEffect, useMemo } from 'react';
import type { Word, Language } from '../../backend';
import { DifficultySelector as DifficultySelectorType, Difficulty } from '../../backend';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Progress } from '../ui/progress';
import { Trophy, ArrowLeft, BookOpen } from 'lucide-react';
import { useGetCallerProgress, useUpdateUserProgress } from '../../hooks/useQueries';
import { toast } from 'sonner';
import DifficultySelector from './DifficultySelector';

interface FindingVerbsGameProps {
  words: Word[];
  language: Language;
  onClose: () => void;
}

interface SentenceWord {
  text: string;
  isVerb: boolean;
  isSelected: boolean;
}

export default function FindingVerbsGame({ words, language, onClose }: FindingVerbsGameProps) {
  const { data: progress } = useGetCallerProgress();
  const { mutate: updateProgress } = useUpdateUserProgress();
  
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultySelectorType>('all' as DifficultySelectorType);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [sentences, setSentences] = useState<string[]>([]);
  const [sentenceWords, setSentenceWords] = useState<SentenceWord[][]>([]);
  const [showResults, setShowResults] = useState(false);

  const totalRounds = 5;

  const filteredWords = useMemo(() => {
    if (selectedDifficulty === 'all') return words;
    return words.filter(w => w.difficulty === (selectedDifficulty as unknown as Difficulty));
  }, [words, selectedDifficulty]);

  // Common English verbs for detection
  const commonVerbs = new Set([
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must', 'shall',
    'go', 'goes', 'went', 'gone', 'going', 'make', 'makes', 'made', 'making',
    'get', 'gets', 'got', 'gotten', 'getting', 'see', 'sees', 'saw', 'seen', 'seeing',
    'come', 'comes', 'came', 'coming', 'take', 'takes', 'took', 'taken', 'taking',
    'know', 'knows', 'knew', 'known', 'knowing', 'think', 'thinks', 'thought', 'thinking',
    'look', 'looks', 'looked', 'looking', 'want', 'wants', 'wanted', 'wanting',
    'give', 'gives', 'gave', 'given', 'giving', 'use', 'uses', 'used', 'using',
    'find', 'finds', 'found', 'finding', 'tell', 'tells', 'told', 'telling',
    'ask', 'asks', 'asked', 'asking', 'work', 'works', 'worked', 'working',
    'seem', 'seems', 'seemed', 'seeming', 'feel', 'feels', 'felt', 'feeling',
    'try', 'tries', 'tried', 'trying', 'leave', 'leaves', 'left', 'leaving',
    'call', 'calls', 'called', 'calling', 'contain', 'contains', 'contained', 'containing',
  ]);

  const isVerb = (word: string): boolean => {
    const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
    return commonVerbs.has(cleaned);
  };

  useEffect(() => {
    if (filteredWords.length < 5) return;

    const selectedWords = [...filteredWords]
      .filter(w => w.examples && w.examples.length > 0)
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    const selectedSentences = selectedWords.map(w => {
      const validExamples = w.examples.filter(ex => ex && ex.trim().length > 0);
      return validExamples[Math.floor(Math.random() * validExamples.length)] || 'No example available.';
    });

    setSentences(selectedSentences);

    const parsedSentences = selectedSentences.map(sentence => {
      const words = sentence.split(/\s+/);
      return words.map(word => ({
        text: word,
        isVerb: isVerb(word),
        isSelected: false,
      }));
    });

    setSentenceWords(parsedSentences);
    setShowResults(false);
  }, [currentRound, filteredWords]);

  const handleDifficultyChange = (newDifficulty: DifficultySelectorType) => {
    setSelectedDifficulty(newDifficulty);
    setCurrentRound(0);
    setScore(0);
    setGameComplete(false);
  };

  const toggleWord = (sentenceIdx: number, wordIdx: number) => {
    if (showResults) return;

    setSentenceWords(prev => {
      const newSentences = [...prev];
      const newWords = [...newSentences[sentenceIdx]];
      newWords[wordIdx] = {
        ...newWords[wordIdx],
        isSelected: !newWords[wordIdx].isSelected,
      };
      newSentences[sentenceIdx] = newWords;
      return newSentences;
    });
  };

  const handleSubmit = () => {
    setShowResults(true);

    let correctCount = 0;
    let totalVerbs = 0;

    sentenceWords.forEach(sentence => {
      sentence.forEach(word => {
        if (word.isVerb) {
          totalVerbs++;
          if (word.isSelected) {
            correctCount++;
          }
        }
      });
    });

    const roundScore = correctCount;
    setScore(prev => prev + roundScore);

    if (correctCount === totalVerbs) {
      toast.success('Perfect! All verbs found! 🎉', { duration: 2000 });
    } else if (correctCount > 0) {
      toast.success(`Found ${correctCount} out of ${totalVerbs} verbs!`, { duration: 2000 });
    } else {
      toast.error('No verbs found. Try again!', { duration: 2000 });
    }
  };

  const handleNext = () => {
    if (currentRound + 1 < totalRounds) {
      setCurrentRound(prev => prev + 1);
    } else {
      setGameComplete(true);
      
      if (progress) {
        const newTotalCorrect = BigInt(Number(progress.totalCorrect || 0) + score);
        const newTotalAnswered = BigInt(Number(progress.totalAnswered || 0) + totalRounds * 5);
        
        updateProgress({
          totalCorrect: newTotalCorrect,
          totalAnswered: newTotalAnswered,
          streak: progress.streak || BigInt(0),
          badges: progress.badges || [],
        });
      }
    }
  };

  if (filteredWords.length < 5) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">Not enough words with examples for the selected difficulty. At least 5 words are required.</p>
              <DifficultySelector value={selectedDifficulty} onChange={handleDifficultyChange} />
              <Button onClick={onClose}>Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameComplete) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-6">
              <div className="flex justify-center">
                <Trophy className="w-24 h-24 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">Game Complete! 🎉</h2>
                <p className="text-5xl font-bold mb-2">{score}</p>
                <p className="text-muted-foreground">Verbs found!</p>
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
          <h2 className="text-2xl font-bold">Finding Verbs</h2>
          <p className="text-sm text-muted-foreground">Tap all the verbs in the sentences</p>
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
              <span>Round {currentRound + 1} of {totalRounds}</span>
              <span>Verbs Found: {score}</span>
            </div>
            <Progress value={((currentRound + 1) / totalRounds) * 100} className="h-2" />
          </div>

          <div className="text-center py-4 space-y-2">
            <BookOpen className="w-12 h-12 mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Tap all the verbs in these sentences:</p>
          </div>

          <div className="space-y-6">
            {sentenceWords.map((sentence, sentenceIdx) => (
              <div key={sentenceIdx} className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Sentence {sentenceIdx + 1}:</p>
                <div className="flex flex-wrap gap-2">
                  {sentence.map((word, wordIdx) => {
                    const isSelected = word.isSelected;
                    const isCorrectVerb = word.isVerb;
                    const showFeedback = showResults;

                    let buttonClass = 'px-3 py-1 text-base transition-all';
                    if (showFeedback) {
                      if (isSelected && isCorrectVerb) {
                        buttonClass += ' bg-green-500 text-white hover:bg-green-600';
                      } else if (isSelected && !isCorrectVerb) {
                        buttonClass += ' bg-red-500 text-white hover:bg-red-600';
                      } else if (!isSelected && isCorrectVerb) {
                        buttonClass += ' bg-yellow-500 text-white hover:bg-yellow-600';
                      }
                    } else if (isSelected) {
                      buttonClass += ' bg-primary text-primary-foreground';
                    }

                    return (
                      <Button
                        key={wordIdx}
                        variant={isSelected && !showFeedback ? 'default' : 'outline'}
                        size="sm"
                        className={buttonClass}
                        onClick={() => toggleWord(sentenceIdx, wordIdx)}
                        disabled={showResults}
                      >
                        {word.text}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {!showResults ? (
            <Button onClick={handleSubmit} className="w-full" size="lg">
              Check Answers
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                <p>✅ Green: Correct verb selections</p>
                <p>❌ Red: Incorrect selections</p>
                <p>⚠️ Yellow: Missed verbs</p>
              </div>
              <Button onClick={handleNext} className="w-full" size="lg">
                {currentRound + 1 < totalRounds ? 'Next Round' : 'Finish Game'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
