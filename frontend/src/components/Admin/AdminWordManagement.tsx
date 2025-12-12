import { useState, useMemo } from 'react';
import { useGetAllWords, useDeleteWord, useGetAllLanguages, useRemoveWordsByLanguage } from '../../hooks/useQueries';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Search, Plus, Pencil, Trash2, Upload, ArrowLeft, Info } from 'lucide-react';
import { Difficulty } from '../../backend';
import type { Word } from '../../backend';
import AddWordModal from './AddWordModal';
import EditWordModal from './EditWordModal';
import VocabImportModal from './VocabImportModal';
import AdminLoginForm from './AdminLoginForm';

interface AdminWordManagementProps {
  onBack?: () => void;
}

export default function AdminWordManagement({ onBack }: AdminWordManagementProps) {
  const { isAdminAuthenticated } = useAdminAuth();
  const { data: words, isLoading } = useGetAllWords();
  const { data: languages } = useGetAllLanguages();
  const { mutate: deleteWord } = useDeleteWord();
  const { mutate: removeWordsByLanguage, isPending: isRemoving } = useRemoveWordsByLanguage();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Turkish');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Beginner');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [languageToRemove, setLanguageToRemove] = useState<string>('');

  const filteredLanguages = languages?.filter(lang => lang.name !== 'Russian') || [];

  const filteredWords = useMemo(() => {
    if (!words) return [];
    
    let filtered = words;

    if (selectedLanguage !== 'all') {
      filtered = filtered.filter(w => w.languageName === selectedLanguage);
    }

    if (selectedDifficulty !== 'all') {
      const difficultyMap: Record<string, Difficulty> = {
        'Beginner': Difficulty.beginner,
        'Medium': Difficulty.medium,
        'Hard': Difficulty.hard,
        'Advanced': Difficulty.advanced,
      };
      filtered = filtered.filter(w => w.difficulty === difficultyMap[selectedDifficulty]);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(w => 
        w.english.toLowerCase().includes(query) || 
        w.foreign.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [words, selectedLanguage, selectedDifficulty, searchQuery]);

  const handleDelete = (id: bigint) => {
    if (confirm('Are you sure you want to delete this word?')) {
      deleteWord(id);
    }
  };

  const handleRemoveLanguageWords = () => {
    if (!languageToRemove) return;
    removeWordsByLanguage(languageToRemove);
    setLanguageToRemove('');
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

  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case Difficulty.beginner: return 'bg-green-500';
      case Difficulty.medium: return 'bg-yellow-500';
      case Difficulty.hard: return 'bg-orange-500';
      case Difficulty.advanced: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (!isAdminAuthenticated) {
    return <AdminLoginForm />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          <h1 className="text-3xl font-bold">Word Management</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowImportModal(true)} variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Import JSON
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Word
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="w-5 h-5" />
            Current Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-semibold">Selected Language:</span>{' '}
              <Badge variant="outline" className="ml-2">
                {selectedLanguage === 'all' ? 'All Languages' : selectedLanguage}
              </Badge>
            </div>
            <div>
              <span className="font-semibold">Difficulty Filter:</span>{' '}
              <Badge variant="outline" className="ml-2">
                {selectedDifficulty === 'all' ? 'All Levels' : selectedDifficulty}
              </Badge>
            </div>
            <div>
              <span className="font-semibold">Search Query:</span>{' '}
              <Badge variant="outline" className="ml-2">
                {searchQuery || 'None'}
              </Badge>
            </div>
          </div>
          <div className="pt-2 border-t">
            <span className="font-semibold text-sm">Showing:</span>{' '}
            <span className="text-lg font-bold text-primary">{filteredWords.length}</span> words
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filters & Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search words..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="All Languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {filteredLanguages.map((lang) => (
                  <SelectItem key={lang.name} value={lang.name}>
                    {lang.flagEmoji} {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger>
                <SelectValue placeholder="All Difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Remove Words
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove All Words for Language</AlertDialogTitle>
                  <AlertDialogDescription>
                    Select a language to remove all its words. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Select value={languageToRemove} onValueChange={setLanguageToRemove}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredLanguages.map((lang) => (
                      <SelectItem key={lang.name} value={lang.name}>
                        {lang.flagEmoji} {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setLanguageToRemove('')}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRemoveLanguageWords}
                    disabled={!languageToRemove || isRemoving}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isRemoving ? 'Removing...' : 'Remove All Words'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading words...</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Words ({filteredWords.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredWords.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No words found.</p>
              ) : (
                filteredWords.map((word) => (
                  <div key={Number(word.id)} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getDifficultyColor(word.difficulty)}>
                          {getDifficultyLabel(word.difficulty)}
                        </Badge>
                        <span className="font-semibold">{word.english}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-semibold">{word.foreign}</span>
                        <Badge variant="outline">{word.languageName}</Badge>
                      </div>
                      {word.examples && word.examples.length > 0 && (
                        <p className="text-sm text-muted-foreground italic">{word.examples[0]}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingWord(word)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(word.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {showAddModal && <AddWordModal open={showAddModal} onClose={() => setShowAddModal(false)} />}
      {editingWord && <EditWordModal word={editingWord} open={!!editingWord} onClose={() => setEditingWord(null)} />}
      {showImportModal && <VocabImportModal open={showImportModal} onClose={() => setShowImportModal(false)} />}
    </div>
  );
}
