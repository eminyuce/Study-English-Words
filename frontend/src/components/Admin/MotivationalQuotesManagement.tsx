import { useState } from 'react';
import {
  useGetAllQuotes,
  useGetQuotesCount,
  useAddMotivationalQuotes,
  useEditQuote,
  useDeleteQuote,
} from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Sparkles, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { MotivationalQuote } from '../../backend';

export default function MotivationalQuotesManagement() {
  const { data: quotes, isLoading } = useGetAllQuotes();
  const { data: quotesCount } = useGetQuotesCount();
  const addQuotes = useAddMotivationalQuotes();
  const editQuote = useEditQuote();
  const deleteQuote = useDeleteQuote();

  const [bulkText, setBulkText] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingQuote, setEditingQuote] = useState<MotivationalQuote | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<MotivationalQuote | null>(null);
  const [editText, setEditText] = useState('');

  const handleBulkAdd = async () => {
    if (!bulkText.trim()) {
      toast.error('Please enter at least one quote');
      return;
    }

    const quotesArray = bulkText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (quotesArray.length === 0) {
      toast.error('No valid quotes found');
      return;
    }

    try {
      await addQuotes.mutateAsync(quotesArray);
      setBulkText('');
      toast.success(`Added ${quotesArray.length} quotes successfully!`);
    } catch (error) {
      console.error('Error adding quotes:', error);
    }
  };

  const handleEdit = (quote: MotivationalQuote) => {
    setEditingQuote(quote);
    setEditText(quote.text);
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingQuote || !editText.trim()) {
      toast.error('Quote text cannot be empty');
      return;
    }

    try {
      await editQuote.mutateAsync({
        id: editingQuote.id,
        newText: editText.trim(),
      });
      setShowEditDialog(false);
      setEditingQuote(null);
      setEditText('');
    } catch (error) {
      console.error('Error editing quote:', error);
    }
  };

  const handleDelete = (quote: MotivationalQuote) => {
    setDeletingQuote(quote);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingQuote) return;

    try {
      await deleteQuote.mutateAsync(deletingQuote.id);
      setShowDeleteDialog(false);
      setDeletingQuote(null);
    } catch (error) {
      console.error('Error deleting quote:', error);
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
      <div className="space-y-6">
        <Card className="border-2 shadow-soft-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              Motivational Quotes Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl p-5 border-2 shadow-soft">
              <p className="text-sm text-muted-foreground mb-2 font-medium">
                <strong className="text-foreground">Total Quotes:</strong> {quotesCount || 0}
              </p>
              <p className="text-sm text-muted-foreground font-medium">
                These quotes are displayed to users when they achieve ≥80% success rate in games.
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="bulkQuotes" className="text-base font-semibold">Bulk Add Quotes (one per line)</Label>
              <Textarea
                id="bulkQuotes"
                placeholder="Enter motivational quotes, one per line...&#10;Example:&#10;Great job! Keep up the excellent work!&#10;You're making amazing progress!&#10;Your dedication is inspiring!"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={6}
                className="font-mono text-sm shadow-soft"
              />
              <Button
                onClick={handleBulkAdd}
                disabled={addQuotes.isPending || !bulkText.trim()}
                className="w-full gap-2 h-11 shadow-soft hover:shadow-soft-md transition-all"
              >
                <Plus className="w-4 h-4" />
                {addQuotes.isPending ? 'Adding...' : 'Add Quotes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-soft-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">All Quotes ({quotes?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4 shadow-soft"></div>
                <p className="text-sm text-muted-foreground font-medium">Loading quotes...</p>
              </div>
            ) : quotes && quotes.length > 0 ? (
              <div className="border-2 rounded-2xl overflow-hidden shadow-soft">
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-gradient-to-r from-muted/80 to-muted/60 backdrop-blur-sm z-10 shadow-soft">
                      <TableRow className="border-b-2">
                        <TableHead className="w-[100px] font-bold text-base h-14">ID</TableHead>
                        <TableHead className="font-bold text-base h-14">Quote Text</TableHead>
                        <TableHead className="text-right w-[220px] font-bold text-base h-14">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotes.map((quote) => (
                        <TableRow key={quote.id.toString()} className="hover:bg-muted/40 transition-colors h-16">
                          <TableCell className="font-mono text-sm font-semibold">
                            {quote.id.toString()}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">{truncateText(quote.text)}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                onClick={() => handleEdit(quote)}
                                size="sm"
                                variant="ghost"
                                className="gap-2 hover:bg-primary/10 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </Button>
                              <Button
                                onClick={() => handleDelete(quote)}
                                size="sm"
                                variant="ghost"
                                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg font-semibold">No quotes yet. Add some motivational quotes above!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="shadow-soft-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Quote</DialogTitle>
            <DialogDescription className="text-base">
              Update the motivational quote text below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editText" className="text-base font-semibold">Quote Text</Label>
              <Textarea
                id="editText"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={4}
                placeholder="Enter quote text..."
                className="shadow-soft"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setEditingQuote(null);
                setEditText('');
              }}
              className="shadow-soft"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={editQuote.isPending || !editText.trim()}
              className="shadow-soft"
            >
              {editQuote.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="shadow-soft-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Delete Quote?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete this quote? This action cannot be undone.
              <div className="mt-3 p-4 bg-muted/50 rounded-xl text-sm italic border-2 shadow-soft">
                "{deletingQuote?.text}"
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletingQuote(null);
              }}
              className="shadow-soft"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-soft"
            >
              Delete Quote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
