'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TagFilterProps {
  availableTags: string[];
  selectedTags: string[];
  onTagSelect: (tags: string[]) => void;
}

export function TagFilter({
  availableTags,
  selectedTags,
  onTagSelect,
}: TagFilterProps) {
  const t = useTranslations('tagFilter');

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagSelect(selectedTags.filter((t) => t !== tag));
    } else {
      onTagSelect([...selectedTags, tag]);
    }
  };

  const clearFilter = () => {
    onTagSelect([]);
  };

  if (availableTags.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-foreground0/70 uppercase tracking-wider">
          {t('filterByTags')}
        </span>
        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilter}
            className="h-6 px-2 text-xs text-rose-500 hover:text-rose-400 hover:bg-rose-950/30 font-mono"
          >
            {t('clearFilter')}
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className={`cursor-pointer transition-all duration-300 font-mono text-xs ${
              selectedTags.includes(tag)
                ? 'bg-cyan-950/50 text-primary border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                : 'bg-card/50 text-muted-foreground border hover:border-cyan-500/50 hover:text-primary hover:shadow-[0_0_5px_rgba(6,182,212,0.3)]'
            }`}
            onClick={() => toggleTag(tag)}
          >
            {tag}
            {selectedTags.includes(tag) && <X className="ml-1 h-3 w-3" />}
          </Badge>
        ))}
      </div>
    </div>
  );
}
