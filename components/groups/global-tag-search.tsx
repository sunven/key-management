'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, X, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TagSearchResult {
  id: number;
  key: string;
  value: string;
  tags: { id: number; tag: string }[];
  group: { id: number; name: string };
}

export function GlobalTagSearch() {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<TagSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [tagFilter, setTagFilter] = useState('');

  // Fetch all available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/tags');
        if (response.ok) {
          const tags = await response.json();
          setAllTags(tags);
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };
    fetchTags();
  }, []);

  // Search when tags are selected
  useEffect(() => {
    if (selectedTags.length === 0) {
      setSearchResults([]);
      return;
    }

    const searchByTags = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/tags/search?tags=${selectedTags.join(',')}`
        );
        if (response.ok) {
          const items = await response.json();
          setSearchResults(items);
        }
      } catch (error) {
        console.error('Error searching by tags:', error);
      } finally {
        setLoading(false);
      }
    };
    searchByTags();
  }, [selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearSelection = () => {
    setSelectedTags([]);
  };

  const handleCopyValue = async (itemId: number, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(itemId);
      toast.success('Value copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy value');
    }
  };

  // Filter tags based on input
  const filteredTags = useMemo(() => {
    if (!tagFilter) return allTags;
    return allTags.filter((tag) =>
      tag.toLowerCase().includes(tagFilter.toLowerCase())
    );
  }, [allTags, tagFilter]);

  if (allTags.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium">Cross-Group Tag Search</h3>
      </div>

      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Filter tags..."
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {filteredTags.map((tag) => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleTag(tag)}
            >
              {tag}
              {selectedTags.includes(tag) && <X className="ml-1 h-3 w-3" />}
            </Badge>
          ))}
        </div>
      </div>

      {selectedTags.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Selected: {selectedTags.join(', ')}
          </span>
          <Button variant="ghost" size="sm" onClick={clearSelection}>
            Clear
          </Button>
        </div>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground">Searching...</p>
      )}

      {!loading && selectedTags.length > 0 && searchResults.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No items found with the selected tags.
        </p>
      )}

      {searchResults.length > 0 && (
        <div className="border rounded-lg bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.group.name}</TableCell>
                  <TableCell className="font-mono text-sm">{item.key}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-mono text-sm text-muted-foreground">
                        {item.value}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => handleCopyValue(item.id, item.value)}
                      >
                        {copiedId === item.id ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant={
                            selectedTags.includes(tag.tag)
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {tag.tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
