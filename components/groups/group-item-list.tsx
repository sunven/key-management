'use client';

import { Check, Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { GroupItem, ItemTag } from '@/lib/generated/prisma/client';
import { GroupItemDialog } from './group-item-dialog';
import { TagFilter } from './tag-filter';

interface GroupItemWithTags extends GroupItem {
  tags: ItemTag[];
}

interface GroupItemListProps {
  groupId: number;
  items: GroupItemWithTags[];
  onRefresh: () => void;
}

export function GroupItemList({
  groupId,
  items,
  onRefresh,
}: GroupItemListProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Get all unique tags from items
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach((item) => {
      item.tags.forEach((tag) => tagSet.add(tag.tag));
    });
    return Array.from(tagSet).sort();
  }, [items]);

  // Filter items by selected tags
  const filteredItems = useMemo(() => {
    if (selectedTags.length === 0) return items;
    return items.filter((item) =>
      selectedTags.some((tag) => item.tags.some((t) => t.tag === tag)),
    );
  }, [items, selectedTags]);

  const handleDelete = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete item');

      onRefresh();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item. Please try again.');
    }
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

  return (
    <div className="h-full flex flex-col space-y-4 p-6">
      <div className="flex justify-between items-start gap-4 flex-shrink-0">
        <TagFilter
          availableTags={availableTags}
          selectedTags={selectedTags}
          onTagSelect={setSelectedTags}
        />
        <GroupItemDialog
          groupId={groupId}
          trigger={
            <Button
              size="sm"
              className="bg-card/50 text-foreground0 border border/50 hover:bg-cyan-950/50 hover:text-primary hover:border-cyan-500 font-mono text-xs transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              <Plus className="mr-2 h-4 w-4" />
              ADD_ITEM
            </Button>
          }
          onSuccess={onRefresh}
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex-1 flex items-center justify-center border border-dashed border/50 rounded-lg bg-card/20 m-1">
          <p className="text-cyan-900/50 font-mono text-sm animate-pulse">
            {items.length === 0 ? 'NO_ITEMS_DETECTED' : 'FILTER_MATCH_FAILED'}
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto border border/50 rounded-lg bg-card/20 shadow-[0_0_30px_rgba(6,182,212,0.05)] custom-scrollbar">
          <Table>
            <TableHeader className="bg-background/80 sticky top-0 z-10 backdrop-blur-md shadow-sm">
              <TableRow className="border-b-cyan-800/50 hover:bg-transparent">
                <TableHead className="w-[200px] text-foreground0/70 font-mono text-xs uppercase pl-4 tracking-wider">
                  Key
                </TableHead>
                <TableHead className="text-foreground0/70 font-mono text-xs uppercase tracking-wider">
                  Value
                </TableHead>
                <TableHead className="w-[200px] text-foreground0/70 font-mono text-xs uppercase tracking-wider">
                  Tags
                </TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow
                  key={item.id}
                  className="border-b-cyan-900/30 hover:bg-cyan-950/20 transition-colors group"
                >
                  <TableCell className="font-medium font-mono text-sm text-fuchsia-400 pl-4 drop-shadow-[0_0_3px_rgba(232,121,249,0.3)]">
                    {item.key}
                  </TableCell>
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
                      {item.tags.length > 0 ? (
                        item.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="outline"
                            className="text-[10px] font-mono bg-cyan-950/30 text-primary border/50 shadow-[0_0_5px_rgba(6,182,212,0.1)]"
                          >
                            {tag.tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      <GroupItemDialog
                        groupId={groupId}
                        item={item}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-cyan-600 hover:text-primary hover:bg-cyan-950/50 hover:shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                        onSuccess={onRefresh}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-rose-600 hover:text-rose-400 hover:bg-rose-950/30 hover:shadow-[0_0_10px_rgba(244,63,94,0.3)] transition-all"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
