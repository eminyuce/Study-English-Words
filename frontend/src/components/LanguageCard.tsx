import type { Language } from '../backend';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { BookOpen } from 'lucide-react';

interface LanguageCardProps {
  language: Language;
  onSelect: () => void;
}

export default function LanguageCard({ language, onSelect }: LanguageCardProps) {
  return (
    <Card 
      className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
      onClick={onSelect}
    >
      <div 
        className="h-20 flex items-center justify-center text-4xl"
        style={{
          background: `linear-gradient(135deg, ${language.gradientStart}, ${language.gradientEnd})`,
        }}
      >
        {language.flagEmoji}
      </div>
      <CardContent className="p-3">
        <h3 className="text-base font-bold mb-2 text-center truncate">{language.name}</h3>
        <Button 
          size="sm"
          className="w-full gap-1 text-xs group-hover:gap-2 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          <BookOpen className="w-3 h-3" />
          Start Learning
        </Button>
      </CardContent>
    </Card>
  );
}
