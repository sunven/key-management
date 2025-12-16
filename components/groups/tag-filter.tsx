'use client';

import { X } from 'lucide-react';
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
        <span className="text-xs font-mono text-cyan-600/80 uppercase tracking-wider">
          FILTER_BY_TAGS:
        </span>
        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilter}
            className="h-6 px-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-100 font-mono"
          >
            CLEAR_FILTER
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
                ? 'bg-cyan-100 text-cyan-700 border-cyan-400 shadow-[0_0_5px_rgba(6,182,212,0.2)]'
                : 'bg-white text-slate-500 border-cyan-200 hover:border-cyan-300 hover:text-cyan-600'
            }`}
            onClick={() => toggleTag(tag)}
          >
            {tag}
            {selectedTags.includes(tag) && (
              <X className="ml-1 h-3 w-3" />
            )}
          </Badge>
        ))}
      </div>
    </div>
  );
}
