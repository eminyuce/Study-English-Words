import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Upload, FileText, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useBulkImportWords, type VocabEntry } from '../../hooks/useQueries';
import { ScrollArea } from '../ui/scroll-area';

interface CsvImportModalProps {
  open: boolean;
  onClose: () => void;
}

interface CsvRow {
  English_Word: string;
  Translation: string;
  Level: string;
  Target_Language: string;
  Example_Sentence: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  row: CsvRow;
  rowNumber: number;
}

interface ImportSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importedCount: number;
  skippedCount: number;
  duration: string;
  rowErrors: Array<{ rowNumber: number; errors: string[] }>;
}

export default function CsvImportModal({ open, onClose }: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [validEntries, setValidEntries] = useState<VocabEntry[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: bulkImportWords, isPending } = useBulkImportWords();

  const validateRow = (row: CsvRow, rowNumber: number): ValidationResult => {
    const errors: string[] = [];

    // Validate English_Word
    if (!row.English_Word || row.English_Word.trim() === '') {
      errors.push('English_Word is required and cannot be empty');
    }

    // Validate Translation
    if (!row.Translation || row.Translation.trim() === '') {
      errors.push('Translation is required and cannot be empty');
    }

    // Validate Level
    if (!row.Level || row.Level.trim() === '') {
      errors.push('Level is required and cannot be empty');
    } else {
      const normalizedLevel = row.Level.trim();
      const validLevels = ['Beginner', 'Medium', 'Hard', 'Advanced'];
      const matchedLevel = validLevels.find(
        level => level.toLowerCase() === normalizedLevel.toLowerCase()
      );
      if (!matchedLevel) {
        errors.push(`Invalid Level value "${row.Level}". Must be one of: Beginner, Medium, Hard, Advanced`);
      }
    }

    // Validate Target_Language
    if (!row.Target_Language || row.Target_Language.trim() === '') {
      errors.push('Target_Language is required and cannot be empty');
    }

    // Validate Example_Sentence
    if (!row.Example_Sentence || row.Example_Sentence.trim() === '') {
      errors.push('Example_Sentence is required and cannot be empty');
    } else if (row.English_Word && row.English_Word.trim() !== '') {
      // Check if example sentence contains the English word (case-insensitive)
      const englishWord = row.English_Word.trim().toLowerCase();
      const exampleSentence = row.Example_Sentence.trim().toLowerCase();
      if (!exampleSentence.includes(englishWord)) {
        errors.push(`Example_Sentence must contain the English_Word "${row.English_Word}" (case-insensitive)`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      row,
      rowNumber,
    };
  };

  const parseCSV = (text: string): CsvRow[] => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim());
    const expectedHeaders = ['English_Word', 'Translation', 'Level', 'Target_Language', 'Example_Sentence'];
    
    // Validate header format
    if (header.length !== expectedHeaders.length) {
      throw new Error(`Invalid CSV format. Expected ${expectedHeaders.length} columns: ${expectedHeaders.join(', ')}`);
    }

    for (let i = 0; i < expectedHeaders.length; i++) {
      if (header[i] !== expectedHeaders[i]) {
        throw new Error(`Invalid header at column ${i + 1}. Expected "${expectedHeaders[i]}", got "${header[i]}"`);
      }
    }

    // Parse rows
    const rows: CsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = line.split(',').map(v => v.trim());
      
      if (values.length !== expectedHeaders.length) {
        throw new Error(`Row ${i + 1}: Expected ${expectedHeaders.length} columns, got ${values.length}`);
      }

      rows.push({
        English_Word: values[0],
        Translation: values[1],
        Level: values[2],
        Target_Language: values[3],
        Example_Sentence: values[4],
      });
    }

    return rows;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setValidationError(null);
    setImportSummary(null);
    setValidationResults([]);
    setValidEntries([]);

    try {
      const text = await selectedFile.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        throw new Error('CSV file contains no data rows');
      }

      // Validate each row independently
      const results: ValidationResult[] = rows.map((row, index) => 
        validateRow(row, index + 2) // +2 because row 1 is header, data starts at row 2
      );

      setValidationResults(results);

      // Filter valid rows
      const validRows = results.filter(r => r.valid);

      if (validRows.length === 0) {
        setValidationError(`All ${rows.length} rows are invalid. Please fix the errors and try again.`);
        return;
      }

      // Group valid rows by (English_Word + Target_Language)
      const wordMap = new Map<string, {
        english: string;
        foreign: string;
        language: string;
        difficulty: string;
        examples: string[];
      }>();

      for (const result of validRows) {
        const row = result.row;
        
        // Normalize difficulty level
        const normalizedLevel = row.Level.trim();
        const validLevels = ['Beginner', 'Medium', 'Hard', 'Advanced'];
        const matchedLevel = validLevels.find(
          level => level.toLowerCase() === normalizedLevel.toLowerCase()
        )!;

        // Create composite key
        const key = `${row.English_Word.trim().toLowerCase()}|${row.Target_Language.trim()}`;

        if (!wordMap.has(key)) {
          wordMap.set(key, {
            english: row.English_Word.trim(),
            foreign: row.Translation.trim(),
            language: row.Target_Language.trim(),
            difficulty: matchedLevel,
            examples: [],
          });
        }

        // Add example sentence (up to 5)
        const wordEntry = wordMap.get(key)!;
        if (row.Example_Sentence && wordEntry.examples.length < 5) {
          wordEntry.examples.push(row.Example_Sentence.trim());
        }
      }

      // Convert map to array
      const entries: VocabEntry[] = Array.from(wordMap.values());

      setValidEntries(entries);

      const invalidCount = results.filter(r => !r.valid).length;
      if (invalidCount > 0) {
        setValidationError(
          `${validRows.length} valid rows ready for import. ${invalidCount} invalid rows will be skipped.`
        );
      }
    } catch (error: any) {
      setValidationError(error.message || 'Failed to parse CSV file');
      setFile(null);
    }
  };

  const handleImport = () => {
    if (validEntries.length === 0) return;

    const totalRows = validationResults.length;
    const validRows = validationResults.filter(r => r.valid).length;
    const invalidRows = validationResults.filter(r => !r.valid).length;

    setProgress({ current: 0, total: validEntries.length });
    setImportSummary(null);

    bulkImportWords(
      {
        entries: validEntries,
        onProgress: (current, total) => {
          setProgress({ current, total });
        },
      },
      {
        onSuccess: (result) => {
          setProgress(null);
          
          // Collect row errors from validation results
          const rowErrors = validationResults
            .filter(r => !r.valid)
            .map(r => ({
              rowNumber: r.rowNumber,
              errors: r.errors,
            }));

          setImportSummary({
            totalRows,
            validRows,
            invalidRows,
            importedCount: result.added,
            skippedCount: result.skipped,
            duration: result.duration,
            rowErrors,
          });
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
      setValidEntries([]);
      setValidationResults([]);
      setValidationError(null);
      setProgress(null);
      setImportSummary(null);
      onClose();
    }
  };

  const progressPercentage = progress ? (progress.current / progress.total) * 100 : 0;
  const invalidResults = validationResults.filter(r => !r.valid);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Import Vocabulary from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file with strict per-row validation. Each row is validated independently before import. Invalid rows are skipped with detailed error reasons.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
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
              {file ? 'Change File' : 'Select CSV File'}
            </Button>
            {file && (
              <p className="mt-2 text-sm text-muted-foreground">
                Selected: {file.name}
              </p>
            )}
          </div>

          {/* Validation Summary */}
          {validationError && (
            <Alert variant={validEntries.length > 0 ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {/* Validation Results Preview */}
          {validationResults.length > 0 && !importSummary && (
            <div className="space-y-2">
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <strong>Validation Complete:</strong>
                  <div className="mt-2 space-y-1 text-sm">
                    <div>✅ <strong>Valid rows:</strong> {validationResults.filter(r => r.valid).length}</div>
                    <div>❌ <strong>Invalid rows:</strong> {invalidResults.length}</div>
                    <div>📦 <strong>Unique words to import:</strong> {validEntries.length}</div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Only valid rows will be imported. Duplicate words (same English term per language) will be skipped automatically.
                  </div>
                </AlertDescription>
              </Alert>

              {/* Invalid Rows Details */}
              {invalidResults.length > 0 && (
                <details className="border rounded-lg p-3">
                  <summary className="cursor-pointer font-medium text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-destructive" />
                    View {invalidResults.length} Invalid Row{invalidResults.length !== 1 ? 's' : ''} with Errors
                  </summary>
                  <ScrollArea className="h-48 mt-3">
                    <div className="space-y-3 pr-4">
                      {invalidResults.map((result) => (
                        <div key={result.rowNumber} className="border-l-2 border-destructive pl-3 py-1">
                          <div className="font-medium text-sm">Row {result.rowNumber}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            English: {result.row.English_Word || '(empty)'} | 
                            Translation: {result.row.Translation || '(empty)'} | 
                            Level: {result.row.Level || '(empty)'}
                          </div>
                          <ul className="mt-1 space-y-0.5">
                            {result.errors.map((error, idx) => (
                              <li key={idx} className="text-xs text-destructive">• {error}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </details>
              )}
            </div>
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
                Processing validated rows in batches with duplicate detection
              </p>
            </div>
          )}

          {/* Import Complete Summary */}
          {importSummary && (
            <div className="space-y-3">
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <strong>Import Complete!</strong>
                  <div className="mt-2 space-y-1 text-sm">
                    <div>📊 <strong>Total rows processed:</strong> {importSummary.totalRows}</div>
                    <div>✅ <strong>Valid rows:</strong> {importSummary.validRows}</div>
                    <div>❌ <strong>Invalid rows skipped:</strong> {importSummary.invalidRows}</div>
                    <div className="border-t pt-1 mt-2">
                      <div>➕ <strong>New words imported:</strong> {importSummary.importedCount}</div>
                      <div>⏭️ <strong>Duplicates skipped:</strong> {importSummary.skippedCount}</div>
                    </div>
                    <div>⏱️ <strong>Duration:</strong> {importSummary.duration}s</div>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Per-Row Error Details */}
              {importSummary.rowErrors.length > 0 && (
                <details className="border rounded-lg p-3">
                  <summary className="cursor-pointer font-medium text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    View Per-Row Error Details ({importSummary.rowErrors.length} rows)
                  </summary>
                  <ScrollArea className="h-48 mt-3">
                    <div className="space-y-3 pr-4">
                      {importSummary.rowErrors.map((rowError) => (
                        <div key={rowError.rowNumber} className="border-l-2 border-orange-600 pl-3 py-1">
                          <div className="font-medium text-sm">Row {rowError.rowNumber}</div>
                          <ul className="mt-1 space-y-0.5">
                            {rowError.errors.map((error, idx) => (
                              <li key={idx} className="text-xs text-orange-600">• {error}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </details>
              )}
            </div>
          )}

          {/* CSV Format Example */}
          <details className="text-sm">
            <summary className="cursor-pointer font-medium mb-2">
              View CSV Format & Validation Rules
            </summary>
            <div className="space-y-3">
              <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs">
{`English_Word, Translation, Level, Target_Language, Example_Sentence
hello, merhaba, Beginner, Turkish, Hello, how are you?
hello, merhaba, Beginner, Turkish, She said hello to everyone.
beautiful, güzel, Medium, Turkish, What a beautiful day!
beautiful, güzel, Medium, Turkish, She has a beautiful smile.
book, kitap, Beginner, Turkish, I love reading books.`}
              </pre>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p><strong>Strict Validation Rules (per row):</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>English_Word:</strong> Text, non-empty (required)</li>
                  <li><strong>Translation:</strong> Text, non-empty (required)</li>
                  <li><strong>Level:</strong> Must be one of: Beginner, Medium, Hard, Advanced (case-insensitive, required)</li>
                  <li><strong>Target_Language:</strong> Text, non-empty (required)</li>
                  <li><strong>Example_Sentence:</strong> Text, non-empty, must contain the English_Word case-insensitively (required)</li>
                </ul>
                <p className="mt-2"><strong>Processing Rules:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Each row is validated independently before import</li>
                  <li>Invalid rows are skipped entirely without failing the import</li>
                  <li>Valid rows with same English_Word + Target_Language are grouped together</li>
                  <li>Up to 5 example sentences per word (additional rows ignored)</li>
                  <li>Duplicate detection uses composite key (language, english) with case-insensitive comparison</li>
                  <li>Detailed error reasons provided for each invalid row</li>
                </ul>
              </div>
            </div>
          </details>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            {importSummary ? 'Close' : 'Cancel'}
          </Button>
          {!importSummary && (
            <Button
              onClick={handleImport}
              disabled={validEntries.length === 0 || isPending}
            >
              {isPending ? 'Importing...' : `Import ${validEntries.length} Words`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
