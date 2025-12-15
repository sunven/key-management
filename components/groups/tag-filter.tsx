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
        <span className="text-sm font-medium text-muted-foreground">
          Filter by tags:
        </span>
        {selectedTags.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilter}
            className="h-6 px-2 text-xs"
          >
            Clear filter
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => (
          <Badge
            key={tag}
            variant={selectedTags.includes(tag) ? 'default' : 'outline'}
            className="cursor-pointer"
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
