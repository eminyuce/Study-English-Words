import { useState } from 'react';
import { useGetAllFeedback } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { MessageSquare, Eye } from 'lucide-react';
import type { Feedback } from '../../backend';

export default function FeedbackManagement() {
  const { data: feedbackList, isLoading } = useGetAllFeedback();
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const handleViewDetails = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setShowDetailDialog(true);
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000); // Convert nanoseconds to milliseconds
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'bug':
        return 'destructive';
      case 'issue':
        return 'secondary';
      case 'idea':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <>
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            User Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading feedback...</p>
            </div>
          ) : !feedbackList || feedbackList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No feedback submitted yet.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Who</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbackList.map((feedback) => (
                    <TableRow key={feedback.id.toString()}>
                      <TableCell className="font-medium">
                        {feedback.authorName}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {feedback.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getCategoryColor(feedback.category)}>
                          {feedback.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(feedback.createdAt)}</TableCell>
                      <TableCell>{formatTime(feedback.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => handleViewDetails(feedback)}
                          size="sm"
                          variant="ghost"
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Feedback Details
            </DialogTitle>
            <DialogDescription>
              Submitted by {selectedFeedback?.authorName} on{' '}
              {selectedFeedback && formatDate(selectedFeedback.createdAt)} at{' '}
              {selectedFeedback && formatTime(selectedFeedback.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedFeedback && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1 flex items-center gap-2">
                  Category
                  <Badge variant={getCategoryColor(selectedFeedback.category)}>
                    {selectedFeedback.category}
                  </Badge>
                </h4>
              </div>

              <div>
                <h4 className="font-semibold mb-1">Title</h4>
                <p className="text-sm">{selectedFeedback.title}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-1">Message</h4>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedFeedback.message}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={() => setShowDetailDialog(false)}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
