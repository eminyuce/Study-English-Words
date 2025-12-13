import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSubmitFeedback } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { ArrowLeft, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import { FeedbackCategory } from '../backend';

interface FeedbackPageProps {
  onBack: () => void;
}

export default function FeedbackPage({ onBack }: FeedbackPageProps) {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const submitFeedback = useSubmitFeedback();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; message?: string }>({});

  const isAuthenticated = !!identity;

  const validateForm = () => {
    const newErrors: { title?: string; message?: string } = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!message.trim()) {
      newErrors.message = 'Message is required';
    } else if (message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await submitFeedback.mutateAsync({
        authorName: userProfile?.name || 'Anonymous',
        category: FeedbackCategory.idea,
        title: title.trim(),
        message: message.trim(),
      });
      
      setSubmitted(true);
      setTitle('');
      setMessage('');
      setErrors({});
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto">
        <Button onClick={onBack} variant="ghost" size="sm" className="gap-2 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>

        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              Share Your Feedback
            </CardTitle>
            <CardDescription>
              Please log in to share your feedback with us.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to be logged in to submit feedback. Please log in using the button in the header.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Button onClick={onBack} variant="ghost" size="sm" className="gap-2 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>

        <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-6 h-6" />
              Feedback Submitted Successfully!
            </CardTitle>
            <CardDescription>
              Thank you for sharing your feedback with us. We appreciate your input!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your feedback helps us improve VocabChain and create a better learning experience for everyone.
            </p>
            <div className="flex gap-2">
              <Button onClick={onBack} variant="default">
                Return to Home
              </Button>
              <Button 
                onClick={() => setSubmitted(false)} 
                variant="outline"
              >
                Submit Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Button onClick={onBack} variant="ghost" size="sm" className="gap-2 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Button>

      <Card className="border-2 border-primary/20 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Share Your Feedback
          </CardTitle>
          <CardDescription>
            Help us improve VocabChain by sharing your thoughts, reporting bugs, or suggesting new features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Brief summary of your feedback"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors({ ...errors, title: undefined });
                }}
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                Detailed Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="message"
                placeholder="Please provide as much detail as possible..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (errors.message) setErrors({ ...errors, message: undefined });
                }}
                rows={8}
                className={errors.message ? 'border-destructive' : ''}
              />
              {errors.message && (
                <p className="text-sm text-destructive">{errors.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your feedback will be reviewed by our team. We appreciate your contribution to making VocabChain better!
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={submitFeedback.isPending}
                className="gap-2"
              >
                {submitFeedback.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Submit Feedback
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onBack}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
