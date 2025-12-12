import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useUpdateWord, useGetAllLanguages } from '../../hooks/useQueries';
import { Difficulty } from '../../backend';
import type { Word } from '../../backend';
import { Plus, X } from 'lucide-react';

interface EditWordModalProps {
  word: Word;
  open: boolean;
  onClose: () => void;
}

export default function EditWordModal({ word, open, onClose }: EditWordModalProps) {
  const [english, setEnglish] = useState(word.english);
  const [foreign, setForeign] = useState(word.foreign);
  const [language, setLanguage] = useState(word.languageName);
  const [difficulty, setDifficulty] = useState<Difficulty>(word.difficulty);
  const [examples, setExamples] = useState<string[]>(word.examples.length > 0 ? word.examples : ['']);

  const { data: languages } = useGetAllLanguages();
  const { mutate: updateWord, isPending } = useUpdateWord();

  useEffect(() => {
    setEnglish(word.english);
    setForeign(word.foreign);
    setLanguage(word.languageName);
    setDifficulty(word.difficulty);
    setExamples(word.examples.length > 0 ? word.examples : ['']);
  }, [word]);

  const handleAddExample = () => {
    if (examples.length < 5) {
      setExamples([...examples, '']);
    }
  };

  const handleRemoveExample = (index: number) => {
    setExamples(examples.filter((_, i) => i !== index));
  };

  const handleExampleChange = (index: number, value: string) => {
    const newExamples = [...examples];
    newExamples[index] = value;
    setExamples(newExamples);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filteredExamples = examples.filter(ex => ex.trim() !== '');
    updateWord(
      {
        id: word.id,
        english: english.trim(),
        foreign: foreign.trim(),
        language,
        difficulty,
        examples: filteredExamples,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Word</DialogTitle>
          <DialogDescription>
            Update the word details and example sentences.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="language">Language *</Label>
            <Select value={language} onValueChange={setLanguage} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {languages?.map((lang) => (
                  <SelectItem key={lang.name} value={lang.name}>
                    {lang.flagEmoji} {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="english">English Word *</Label>
            <Input
              id="english"
              placeholder="e.g., Hello"
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="foreign">Foreign Translation *</Label>
            <Input
              id="foreign"
              placeholder="e.g., Hola"
              value={foreign}
              onChange={(e) => setForeign(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty *</Label>
            <Select value={difficulty} onValueChange={(value) => setDifficulty(value as Difficulty)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Difficulty.beginner}>Beginner</SelectItem>
                <SelectItem value={Difficulty.medium}>Medium</SelectItem>
                <SelectItem value={Difficulty.hard}>Hard</SelectItem>
                <SelectItem value={Difficulty.advanced}>Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Example Sentences (up to 5)</Label>
              {examples.length < 5 && (
                <Button type="button" variant="ghost" size="sm" onClick={handleAddExample} className="gap-1">
                  <Plus className="w-4 h-4" />
                  Add Example
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {examples.map((example, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    placeholder={`Example ${index + 1}`}
                    value={example}
                    onChange={(e) => handleExampleChange(index, e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  {examples.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveExample(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !language} className="flex-1">
              {isPending ? 'Updating...' : 'Update Word'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
