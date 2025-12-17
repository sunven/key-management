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
    <div className="space-y-4 p-4 border border/50 rounded-lg bg-card/80 backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.05)]">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-foreground0" />
        <h3 className="font-medium text-foreground0 font-mono tracking-wider uppercase text-sm drop-shadow-[0_0_5px_rgba(6,182,212,0.3)]">Cross-Group Tag Search</h3>
      </div>

      <div className="space-y-2">
        <Input
          type="text"
          placeholder="FILTER_TAGS..."
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="max-w-xs bg-background/50 border/50 text-foreground placeholder:text-cyan-900/50 font-mono text-sm focus:border-cyan-500 focus:ring-cyan-500/20 transition-all duration-300 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
        />
        <div className="flex flex-wrap gap-2">
          {filteredTags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className={`cursor-pointer transition-all duration-300 font-mono ${
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

      {selectedTags.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground0/70 font-mono">
            SELECTED: <span className="text-primary drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">{selectedTags.join(', ')}</span>
          </span>
          <Button variant="ghost" size="sm" onClick={clearSelection} className="text-rose-500 hover:text-rose-400 hover:bg-rose-950/30 h-6 text-xs uppercase font-mono tracking-wider">
            Clear
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-foreground0/80 font-mono text-sm animate-pulse">
          <div className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.8)]"></div>
          SEARCHING_DATABASE...
        </div>
      )}

      {!loading && selectedTags.length > 0 && searchResults.length === 0 && (
        <p className="text-sm text-rose-500/80 font-mono">
          ERROR: NO_MATCHING_ITEMS_FOUND
        </p>
      )}

      {searchResults.length > 0 && (
        <div className="border border/50 rounded-lg bg-card/50 overflow-hidden mt-4 shadow-[0_0_20px_rgba(6,182,212,0.05)]">
          <Table>
            <TableHeader className="bg-background/80">
              <TableRow className="border-b-cyan-800/50 hover:bg-transparent">
                <TableHead className="text-foreground0/70 font-mono text-xs uppercase tracking-wider">Group</TableHead>
                <TableHead className="text-foreground0/70 font-mono text-xs uppercase tracking-wider">Key</TableHead>
                <TableHead className="text-foreground0/70 font-mono text-xs uppercase tracking-wider">Value</TableHead>
                <TableHead className="text-foreground0/70 font-mono text-xs uppercase tracking-wider">Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchResults.map((item) => (
                <TableRow key={item.id} className="border-b-cyan-900/30 hover:bg-cyan-950/20 transition-colors">
                  <TableCell className="font-medium text-muted-foreground">{item.group.name}</TableCell>
                  <TableCell className="font-mono text-sm text-fuchsia-400 drop-shadow-[0_0_3px_rgba(232,121,249,0.3)]">{item.key}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="flex items-center gap-2 group/value">
                      <span className="truncate font-mono text-sm text-muted-foreground group-hover/value:text-slate-300 transition-colors">
                        {item.value}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 text-cyan-600 hover:text-primary hover:bg-cyan-950/50 opacity-0 group-hover/value:opacity-100 transition-all duration-300"
                        onClick={() => handleCopyValue(item.id, item.value)}
                      >
                        {copiedId === item.id ? (
                          <Check className="h-3 w-3 text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
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
                          variant="outline"
                          className={`text-xs font-mono border/50 ${
                            selectedTags.includes(tag.tag)
                              ? 'bg-cyan-950/50 text-primary border-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.2)]'
                              : 'bg-cyan-950/30 text-primary'
                          }`}
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
