import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface ProgressMotivationOverlayProps {
  message: string;
  isVisible: boolean;
  onDismiss: () => void;
}

export default function ProgressMotivationOverlay({
  message,
  isVisible,
  onDismiss,
}: ProgressMotivationOverlayProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        onDismiss();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-400 ease-out ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'
      }`}
    >
      <div className="material-snackbar bg-primary text-primary-foreground shadow-lg">
        <div className="px-8 py-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <p className="font-semibold text-center text-lg tracking-tight">{message}</p>
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
