import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Upload, FileJson, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useBulkImportWords, type VocabEntry } from '../../hooks/useQueries';

interface VocabImportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function VocabImportModal({ open, onClose }: VocabImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [entries, setEntries] = useState<VocabEntry[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [importComplete, setImportComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: bulkImportWords, isPending } = useBulkImportWords();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setValidationError(null);
    setImportComplete(false);

    try {
      const text = await selectedFile.text();
      const data = JSON.parse(text);

      // Validate JSON structure
      if (!Array.isArray(data)) {
        throw new Error('JSON must contain an array of vocabulary entries');
      }

      if (data.length === 0) {
        throw new Error('JSON file is empty');
      }

      // Validate each entry on frontend
      const validatedEntries: VocabEntry[] = [];
      for (let i = 0; i < data.length; i++) {
        const entry = data[i];
        
        if (!entry.english || typeof entry.english !== 'string') {
          throw new Error(`Entry ${i + 1}: Missing or invalid 'english' field`);
        }
        if (!entry.foreign || typeof entry.foreign !== 'string') {
          throw new Error(`Entry ${i + 1}: Missing or invalid 'foreign' field`);
        }
        if (!entry.language || typeof entry.language !== 'string') {
          throw new Error(`Entry ${i + 1}: Missing or invalid 'language' field`);
        }
        if (!entry.difficulty || typeof entry.difficulty !== 'string') {
          throw new Error(`Entry ${i + 1}: Missing or invalid 'difficulty' field`);
        }
        if (!['Beginner', 'Medium', 'Hard', 'Advanced'].includes(entry.difficulty)) {
          throw new Error(`Entry ${i + 1}: Invalid difficulty '${entry.difficulty}'. Must be: Beginner, Medium, Hard, or Advanced`);
        }
        if (!Array.isArray(entry.examples) || entry.examples.length === 0) {
          throw new Error(`Entry ${i + 1}: Missing or empty 'examples' array`);
        }
        if (entry.examples.length > 5) {
          throw new Error(`Entry ${i + 1}: Maximum 5 examples allowed`);
        }

        validatedEntries.push({
          english: entry.english.trim(),
          foreign: entry.foreign.trim(),
          language: entry.language.trim(),
          difficulty: entry.difficulty,
          examples: entry.examples.map((ex: string) => ex.trim()),
        });
      }

      setEntries(validatedEntries);
    } catch (error: any) {
      setValidationError(error.message || 'Failed to parse JSON file');
      setFile(null);
    }
  };

  const handleImport = () => {
    if (entries.length === 0) return;

    setProgress({ current: 0, total: entries.length });
    setImportComplete(false);

    bulkImportWords(
      {
        entries,
        onProgress: (current, total) => {
          setProgress({ current, total });
        },
      },
      {
        onSuccess: () => {
          setProgress(null);
          setImportComplete(true);
        },
        onError: () => {
          setProgress(null);
        },
      }
    );
  };

  const handleClose = () => {
    if (!isPending) {
      setFile(null);
      setEntries([]);
      setValidationError(null);
      setProgress(null);
      setImportComplete(false);
      onClose();
    }
  };

  const progressPercentage = progress ? (progress.current / progress.total) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5" />
            Import Vocabulary from JSON
          </DialogTitle>
          <DialogDescription>
            Upload a JSON file containing vocabulary entries. All parsing and validation happens on your device before sending to the backend in optimized batches.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isPending}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              {file ? 'Change File' : 'Select JSON File'}
            </Button>
            {file && (
              <p className="mt-2 text-sm text-muted-foreground">
                Selected: {file.name}
              </p>
            )}
          </div>

          {/* Validation Error */}
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {entries.length > 0 && !importComplete && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>Ready to import:</strong> {entries.length} vocabulary entries validated successfully.
                <div className="mt-2 text-xs">
                  Languages: {Array.from(new Set(entries.map(e => e.language))).join(', ')}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Will be sent in optimized batches of ~300 words per call.
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Progress */}
          {progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing vocabulary...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <Progress value={progressPercentage} />
              <p className="text-xs text-muted-foreground text-center">
                Processing in batches for optimal performance
              </p>
            </div>
          )}

          {/* Import Complete */}
          {importComplete && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>Import Complete!</strong>
                <div className="mt-1 text-sm">
                  All vocabulary has been imported successfully. Check the toast notification for details.
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* JSON Format Example */}
          <details className="text-sm">
            <summary className="cursor-pointer font-medium mb-2">
              View JSON Format Example
            </summary>
            <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs">
{`[
  {
    "english": "hello",
    "foreign": "merhaba",
    "language": "Turkish",
    "difficulty": "Beginner",
    "examples": [
      "Hello, how are you?",
      "She said hello to everyone."
    ]
  },
  {
    "english": "beautiful",
    "foreign": "güzel",
    "language": "Turkish",
    "difficulty": "Medium",
    "examples": [
      "What a beautiful day!",
      "She has a beautiful smile."
    ]
  }
]`}
            </pre>
          </details>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            {importComplete ? 'Close' : 'Cancel'}
          </Button>
          {!importComplete && (
            <Button
              onClick={handleImport}
              disabled={entries.length === 0 || isPending}
            >
              {isPending ? 'Importing...' : `Import ${entries.length} Words`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
