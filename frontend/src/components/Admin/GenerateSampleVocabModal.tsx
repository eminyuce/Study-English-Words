import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { useGenerateSampleVocabulary, useGetAllLanguages } from '../../hooks/useQueries';
import { Sparkles, Loader2 } from 'lucide-react';

interface GenerateSampleVocabModalProps {
  open: boolean;
  onClose: () => void;
  defaultLanguage?: string;
}

export default function GenerateSampleVocabModal({ open, onClose, defaultLanguage }: GenerateSampleVocabModalProps) {
  const { data: languages } = useGetAllLanguages();
  const { mutate: generateVocab, isPending } = useGenerateSampleVocabulary();
  
  const [selectedLanguage, setSelectedLanguage] = useState<string>(defaultLanguage || 'Turkish');
  const [batchSize, setBatchSize] = useState<string>('50');

  const filteredLanguages = languages?.filter(lang => lang.name !== 'Russian') || [];

  const handleGenerate = () => {
    if (!selectedLanguage) return;
    
    generateVocab(
      { language: selectedLanguage, count: parseInt(batchSize) },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Generate Sample Vocabulary
          </DialogTitle>
          <DialogDescription className="space-y-2 pt-2">
            <p>
              This will auto-generate English → target language vocabulary for the selected language.
            </p>
            <p className="text-sm">
              Generated words include:
            </p>
            <ul className="text-sm list-disc list-inside space-y-1 pl-2">
              <li>English word (programmatically generated)</li>
              <li>Foreign translation (language-specific mapping)</li>
              <li>Difficulty level (Beginner/Medium/Hard/Advanced)</li>
              <li>Exactly 5 English example sentences per word</li>
            </ul>
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              ⚠️ Existing words will be skipped (idempotent operation)
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="language">Target Language</Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger id="language">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="batchSize">Batch Size</Label>
            <Select value={batchSize} onValueChange={setBatchSize}>
              <SelectTrigger id="batchSize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 words</SelectItem>
                <SelectItem value="100">100 words</SelectItem>
                <SelectItem value="500">500 words</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Larger batches may take longer to process
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isPending || !selectedLanguage} className="gap-2">
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
