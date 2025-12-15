'use client';

import { useState, useMemo } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GroupItemDialog } from './group-item-dialog';
import { TagFilter } from './tag-filter';
import type { GroupItem, ItemTag } from '@prisma/client';

interface GroupItemWithTags extends GroupItem {
  tags: ItemTag[];
}

interface GroupItemListProps {
  groupId: number;
  items: GroupItemWithTags[];
  onRefresh: () => void;
}

export function GroupItemList({ groupId, items, onRefresh }: GroupItemListProps) {
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
      selectedTags.some((tag) => item.tags.some((t) => t.tag === tag))
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
    <div className="space-y-4 pl-8 pr-4 pb-4">
      <div className="flex justify-between items-start gap-4">
        <TagFilter
          availableTags={availableTags}
          selectedTags={selectedTags}
          onTagSelect={setSelectedTags}
        />
        <GroupItemDialog
          groupId={groupId}
          trigger={
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          }
          onSuccess={onRefresh}
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">
            {items.length === 0
              ? 'No items in this group yet'
              : 'No items match the selected tags'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Key</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="w-[200px]">Tags</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium font-mono text-sm">
                    {item.key}
                  </TableCell>
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
                      {item.tags.length > 0 ? (
                        item.tags.map((tag) => (
                          <Badge key={tag.id} variant="secondary" className="text-xs">
                            {tag.tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <GroupItemDialog
                          groupId={groupId}
                          item={item}
                          trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          }
                          onSuccess={onRefresh}
                        />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
