import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useGetAllLanguages, useRemoveLanguage, useUpdateLanguageOrdering } from '../../hooks/useQueries';
import { Trash2, GripVertical, Save } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface LanguageManagementModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LanguageManagementModal({ open, onClose }: LanguageManagementModalProps) {
  const { data: languages, isLoading } = useGetAllLanguages();
  const { mutate: removeLanguage, isPending: isRemoving } = useRemoveLanguage();
  const { mutate: updateOrdering, isPending: isUpdating } = useUpdateLanguageOrdering();
  const [editingOrdering, setEditingOrdering] = useState<Record<string, string>>({});

  const handleRemoveLanguage = (languageName: string) => {
    removeLanguage(languageName);
  };

  const handleOrderingChange = (languageName: string, value: string) => {
    setEditingOrdering(prev => ({
      ...prev,
      [languageName]: value,
    }));
  };

  const handleSaveOrdering = (languageName: string) => {
    const newOrdering = editingOrdering[languageName];
    if (newOrdering && !isNaN(Number(newOrdering))) {
      updateOrdering({
        name: languageName,
        newOrdering: BigInt(newOrdering),
      });
      setEditingOrdering(prev => {
        const updated = { ...prev };
        delete updated[languageName];
        return updated;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Manage Languages</DialogTitle>
          <DialogDescription>
            Edit language ordering or remove languages. Removing a language will also delete all associated words.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !languages || languages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No languages available.</p>
          ) : (
            languages.map((language) => (
              <div
                key={language.name}
                className="flex items-center gap-4 p-4 border rounded-lg bg-white dark:bg-gray-800"
              >
                <GripVertical className="w-5 h-5 text-muted-foreground" />
                
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${language.gradientStart}, ${language.gradientEnd})`,
                  }}
                >
                  {language.flagEmoji}
                </div>

                <div className="flex-1">
                  <h4 className="font-semibold">{language.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {language.code.toUpperCase()} • {language.textDirection === 'rtl' ? 'RTL' : 'LTR'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor={`order-${language.name}`} className="text-sm whitespace-nowrap">
                    Order:
                  </Label>
                  <Input
                    id={`order-${language.name}`}
                    type="number"
                    min="1"
                    className="w-20"
                    value={editingOrdering[language.name] ?? String(language.ordering)}
                    onChange={(e) => handleOrderingChange(language.name, e.target.value)}
                  />
                  {editingOrdering[language.name] && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSaveOrdering(language.name)}
                      disabled={isUpdating}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isRemoving}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove {language.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the language "{language.name}" and all associated words. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleRemoveLanguage(language.name)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remove Language
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
