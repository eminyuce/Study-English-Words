import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useCreateLanguage, useGetAllLanguages } from '../../hooks/useQueries';
import { TextDirection } from '../../backend';
import { toast } from 'sonner';

interface AddLanguageModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AddLanguageModal({ open, onClose }: AddLanguageModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [flag, setFlag] = useState('');
  const [direction, setDirection] = useState<TextDirection>(TextDirection.ltr);
  const [startColor, setStartColor] = useState('#667EEA');
  const [endColor, setEndColor] = useState('#764BA2');
  const [ordering, setOrdering] = useState('');

  const { data: languages } = useGetAllLanguages();
  const { mutate: createLanguage, isPending } = useCreateLanguage();

  useEffect(() => {
    if (languages && languages.length > 0) {
      const maxOrdering = Math.max(...languages.map(l => Number(l.ordering)));
      setOrdering(String(maxOrdering + 1));
    } else {
      setOrdering('1');
    }
  }, [languages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLanguage(
      {
        name: name.trim(),
        code: code.trim().toLowerCase(),
        flag: flag.trim(),
        direction,
        startColor,
        endColor,
        ordering: BigInt(ordering || '1'),
      },
      {
        onSuccess: () => {
          toast.success('Language created successfully');
          onClose();
          setName('');
          setCode('');
          setFlag('');
          setDirection(TextDirection.ltr);
          setStartColor('#667EEA');
          setEndColor('#764BA2');
          setOrdering('');
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to create language');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-modal max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl glass-text">Add New Language</DialogTitle>
          <DialogDescription className="glass-text-muted">
            Add a new target language with custom styling and properties.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="glass-text">Language Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Italian"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="glass-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code" className="glass-text">Language Code *</Label>
            <Input
              id="code"
              placeholder="e.g., it"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={3}
              required
              className="glass-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="flag" className="glass-text">Flag Emoji *</Label>
            <Input
              id="flag"
              placeholder="e.g., 🇮🇹"
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              required
              className="glass-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direction" className="glass-text">Text Direction *</Label>
            <Select value={direction} onValueChange={(value) => setDirection(value as TextDirection)}>
              <SelectTrigger className="glass-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-modal">
                <SelectItem value={TextDirection.ltr}>Left to Right (LTR)</SelectItem>
                <SelectItem value={TextDirection.rtl}>Right to Left (RTL)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ordering" className="glass-text">Display Order *</Label>
            <Input
              id="ordering"
              type="number"
              min="1"
              placeholder="e.g., 1"
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
              required
              className="glass-input"
            />
            <p className="text-xs glass-text-muted">
              Lower numbers appear first. Turkish is 1.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startColor" className="glass-text">Gradient Start</Label>
              <div className="flex gap-2">
                <Input
                  id="startColor"
                  type="color"
                  value={startColor}
                  onChange={(e) => setStartColor(e.target.value)}
                  className="w-16 h-10 p-1 glass-input"
                />
                <Input
                  value={startColor}
                  onChange={(e) => setStartColor(e.target.value)}
                  placeholder="#667EEA"
                  className="glass-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endColor" className="glass-text">Gradient End</Label>
              <div className="flex gap-2">
                <Input
                  id="endColor"
                  type="color"
                  value={endColor}
                  onChange={(e) => setEndColor(e.target.value)}
                  className="w-16 h-10 p-1 glass-input"
                />
                <Input
                  value={endColor}
                  onChange={(e) => setEndColor(e.target.value)}
                  placeholder="#764BA2"
                  className="glass-input"
                />
              </div>
            </div>
          </div>

          <div 
            className="h-24 rounded-lg flex items-center justify-center text-4xl"
            style={{
              background: `linear-gradient(135deg, ${startColor}, ${endColor})`,
            }}
          >
            {flag || '🌍'}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 glass-button-outline">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1 glass-button">
              {isPending ? 'Creating...' : 'Add Language'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
