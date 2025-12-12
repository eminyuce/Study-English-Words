import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import type { UserProfile } from '../backend';
import { CheckCircle2 } from 'lucide-react';

export default function ProfileSetupModal() {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { mutate: saveProfile } = useSaveCallerUserProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !isSaving) {
      setIsSaving(true);
      
      const profile: UserProfile = {
        name: name.trim(),
        preferredLanguages: [],
        joinedAt: BigInt(Date.now() * 1000000),
      };
      
      // Trigger the mutation with optimistic update
      saveProfile(profile);
      
      // Show brief success animation before the modal closes automatically
      // The modal will close when the optimistic update sets the profile in cache
      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to VocabChain! 🎉</DialogTitle>
          <DialogDescription>
            Let's get started by setting up your profile. What should we call you?
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
              disabled={isSaving}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full relative" 
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 animate-pulse" />
                Saved!
              </span>
            ) : (
              'Get Started'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
