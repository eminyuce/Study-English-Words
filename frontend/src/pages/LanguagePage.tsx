import { useState, useMemo } from 'react';
import { useGetWordsForLanguage, useGetAllLanguages } from '../hooks/useQueries';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowLeft, Search, ChevronDown, ChevronUp, Gamepad2 } from 'lucide-react';
import { Difficulty, TextDirection } from '../backend';
import type { Word } from '../backend';
import MeaningMatchGame from '../components/Game/MeaningMatchGame';
import ReverseMeaningGame from '../components/Game/ReverseMeaningGame';
import GapFillGame from '../components/Game/GapFillGame';
import FlashcardsGame from '../components/Game/FlashcardsGame';
import MemoryMatchGame from '../components/Game/MemoryMatchGame';
import SpeedChallengeGame from '../components/Game/SpeedChallengeGame';

interface LanguagePageProps {
  languageName: string;
  onBack: () => void;
}

type GameMode = 'meaning' | 'reverse' | 'gapfill' | 'flashcards' | 'memory' | 'speed' | null;

export default function LanguagePage({ languageName, onBack }: LanguagePageProps) {
  const { data: words, isLoading } = useGetWordsForLanguage(languageName);
  const { data: languages } = useGetAllLanguages();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [expandedWords, setExpandedWords] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [activeGame, setActiveGame] = useState<GameMode>(null);
  const itemsPerPage = 20;

  const language = languages?.find(l => l.name === languageName);

  const filteredWords = useMemo(() => {
    if (!words) return [];
    
    let filtered = words;

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(w => w.difficulty === selectedDifficulty);
    }

    // Filter by search query (English or Turkish)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(w => 
        w.english.toLowerCase().includes(query) || 
        w.foreign.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [words, selectedDifficulty, searchQuery]);

  const paginatedWords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredWords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredWords, currentPage]);

  const totalPages = Math.ceil(filteredWords.length / itemsPerPage);

  const toggleExpanded = (wordId: number) => {
    const newExpanded = new Set(expandedWords);
    if (newExpanded.has(wordId)) {
      newExpanded.delete(wordId);
    } else {
      newExpanded.add(wordId);
    }
    setExpandedWords(newExpanded);
  };

  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case Difficulty.beginner: return 'bg-green-500';
      case Difficulty.medium: return 'bg-yellow-500';
      case Difficulty.hard: return 'bg-orange-500';
      case Difficulty.advanced: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDifficultyLabel = (difficulty: Difficulty) => {
    switch (difficulty) {
      case Difficulty.beginner: return 'Beginner';
      case Difficulty.medium: return 'Medium';
      case Difficulty.hard: return 'Hard';
      case Difficulty.advanced: return 'Advanced';
      default: return 'Unknown';
    }
  };

  if (activeGame && filteredWords.length > 0) {
    const gameProps = {
      words: filteredWords,
      language: language!,
      onClose: () => setActiveGame(null),
    };

    switch (activeGame) {
      case 'meaning':
        return <MeaningMatchGame {...gameProps} />;
      case 'reverse':
        return <ReverseMeaningGame {...gameProps} />;
      case 'gapfill':
        return <GapFillGame {...gameProps} />;
      case 'flashcards':
        return <FlashcardsGame {...gameProps} />;
      case 'memory':
        return <MemoryMatchGame {...gameProps} />;
      case 'speed':
        return <SpeedChallengeGame {...gameProps} />;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          {language && (
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${language.gradientStart}, ${language.gradientEnd})`,
              }}
            >
              {language.flagEmoji}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{languageName}</h1>
            <p className="text-muted-foreground">{filteredWords.length} words available</p>
          </div>
        </div>
      </div>

      {/* Game Modes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5" />
            Game Modes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4"
              onClick={() => setActiveGame('meaning')}
              disabled={filteredWords.length === 0}
            >
              <span className="text-2xl">🎯</span>
              <span className="text-sm font-semibold">Meaning Match</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4"
              onClick={() => setActiveGame('reverse')}
              disabled={filteredWords.length === 0}
            >
              <span className="text-2xl">🔄</span>
              <span className="text-sm font-semibold">Reverse Meaning</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4"
              onClick={() => setActiveGame('gapfill')}
              disabled={filteredWords.length === 0}
            >
              <span className="text-2xl">📝</span>
              <span className="text-sm font-semibold">Gap-Fill</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4"
              onClick={() => setActiveGame('flashcards')}
              disabled={filteredWords.length === 0}
            >
              <span className="text-2xl">🃏</span>
              <span className="text-sm font-semibold">Flashcards</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4"
              onClick={() => setActiveGame('memory')}
              disabled={filteredWords.length === 0}
            >
              <span className="text-2xl">🧠</span>
              <span className="text-sm font-semibold">Memory Match</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4"
              onClick={() => setActiveGame('speed')}
              disabled={filteredWords.length === 0}
            >
              <span className="text-2xl">⚡</span>
              <span className="text-sm font-semibold">Speed Challenge</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search English or Turkish..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Tabs value={selectedDifficulty} onValueChange={(v) => {
              setSelectedDifficulty(v as Difficulty | 'all');
              setCurrentPage(1);
            }}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value={Difficulty.beginner}>Beginner</TabsTrigger>
                <TabsTrigger value={Difficulty.medium}>Medium</TabsTrigger>
                <TabsTrigger value={Difficulty.hard}>Hard</TabsTrigger>
                <TabsTrigger value={Difficulty.advanced}>Advanced</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Word List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading words...</p>
        </div>
      ) : filteredWords.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No words found matching your criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedWords.map((word) => {
              const isExpanded = expandedWords.has(Number(word.id));
              return (
                <Card key={Number(word.id)} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge className={getDifficultyColor(word.difficulty)}>
                            {getDifficultyLabel(word.difficulty)}
                          </Badge>
                          <span className="font-semibold text-lg">{word.english}</span>
                          <span className="text-muted-foreground">→</span>
                          <span 
                            className="font-semibold text-lg"
                            dir={language?.textDirection === TextDirection.rtl ? 'rtl' : 'ltr'}
                          >
                            {word.foreign}
                          </span>
                        </div>
                        
                        {isExpanded && word.examples && word.examples.length > 0 && (
                          <div className="mt-4 space-y-2 pl-4 border-l-2 border-primary">
                            <p className="text-sm font-semibold text-muted-foreground">Example Sentences:</p>
                            {word.examples.map((example, idx) => (
                              <p key={idx} className="text-sm italic">{example}</p>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {word.examples && word.examples.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(Number(word.id))}
                          className="gap-2"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Examples ({word.examples.length})
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-10"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
