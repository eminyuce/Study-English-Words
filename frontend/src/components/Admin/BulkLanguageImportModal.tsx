import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useBulkImportLanguages } from '../../hooks/useQueries';
import { TextDirection } from '../../backend';
import { toast } from 'sonner';
import { Upload, FileText, Loader2 } from 'lucide-react';

interface BulkLanguageImportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function BulkLanguageImportModal({ open, onClose }: BulkLanguageImportModalProps) {
  const [csvText, setCsvText] = useState('');
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('paste');
  const { mutate: bulkImport, isPending } = useBulkImportLanguages();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      setInputMode('paste');
    };
    reader.readAsText(file);
  };

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleImport = async () => {
    if (!csvText.trim()) {
      toast.error('Please provide CSV data');
      return;
    }

    const lines = csvText.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      toast.error('No data to import');
      return;
    }

    // Skip header if present
    const dataLines = lines[0].toLowerCase().includes('name') ? lines.slice(1) : lines;

    const languageRows: [string, string, string, TextDirection, string, string, bigint][] = [];
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const fields = parseCsvLine(line);

      if (fields.length < 7) {
        errors.push(`Line ${i + 1}: Insufficient fields (expected 7, got ${fields.length})`);
        continue;
      }

      const [name, code, flag, textDir, startColor, endColor, orderingStr] = fields;

      // Validate required fields
      if (!name || !code || !flag) {
        errors.push(`Line ${i + 1}: Missing required fields (name, code, or flag)`);
        continue;
      }

      // Validate text direction
      const direction = textDir.toLowerCase() === 'rtl' ? TextDirection.rtl : TextDirection.ltr;

      // Validate ordering
      const ordering = parseInt(orderingStr, 10);
      if (isNaN(ordering) || ordering < 1) {
        errors.push(`Line ${i + 1}: Invalid ordering value "${orderingStr}"`);
        continue;
      }

      languageRows.push([
        name.trim(),
        code.trim().toLowerCase(),
        flag.trim(),
        direction,
        startColor.trim() || '#667EEA',
        endColor.trim() || '#764BA2',
        BigInt(ordering)
      ]);
    }

    if (languageRows.length === 0) {
      toast.error('No valid languages to import');
      if (errors.length > 0) {
        console.error('Import errors:', errors);
      }
      return;
    }

    bulkImport(languageRows, {
      onSuccess: (result) => {
        const successCount = result.count;
        const errorCount = result.errors.length;
        
        if (successCount > 0) {
          toast.success(`Successfully imported ${successCount} language(s)`);
        }
        
        if (errorCount > 0) {
          toast.warning(`${errorCount} language(s) skipped (already exist)`);
          console.warn('Skipped languages:', result.errors);
        }

        if (errors.length > 0) {
          toast.warning(`${errors.length} row(s) had validation errors`);
          console.warn('Validation errors:', errors);
        }

        onClose();
        setCsvText('');
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to import languages');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-modal max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl glass-text">Bulk Import Languages (CSV)</DialogTitle>
          <DialogDescription className="glass-text-muted">
            Import multiple languages from CSV. Expected format: name,code,flag,textDirection,startColor,endColor,ordering
          </DialogDescription>
        </DialogHeader>

        <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'upload' | 'paste')} className="mt-4">
          <TabsList className="glass-card p-1 grid w-full grid-cols-2 gap-1">
            <TabsTrigger value="paste" className={inputMode === 'paste' ? 'admin-tab-active' : 'glass-tab'}>
              <FileText className="w-4 h-4 mr-2" />
              Paste CSV
            </TabsTrigger>
            <TabsTrigger value="upload" className={inputMode === 'upload' ? 'admin-tab-active' : 'glass-tab'}>
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="glass-text">CSV Data</Label>
              <Textarea
                placeholder="Turkish,tr,🇹🇷,ltr,#DC2626,#EA580C,1&#10;Spanish,es,🇪🇸,ltr,#36D1C4,#67F9D5,2"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="glass-input min-h-[300px] font-mono text-sm"
              />
              <p className="text-xs glass-text-muted">
                Each line: name,code,flag,textDirection(ltr/rtl),startColor,endColor,ordering
              </p>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="glass-text">Upload CSV File</Label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer glass-card-inner hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-12 h-12 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm glass-text">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs glass-text-muted">CSV file with language data</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
              {csvText && (
                <div className="p-3 rounded-lg glass-card-inner">
                  <p className="text-sm glass-text">
                    File loaded: {csvText.split('\n').filter(l => l.trim()).length} lines
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 glass-button-outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isPending || !csvText.trim()}
            className="flex-1 glass-button"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              'Import Languages'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
