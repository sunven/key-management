'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { groupItemSchema, type GroupItemFormData } from '@/lib/schemas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { TagInput } from './tag-input';
import type { GroupItem, ItemTag } from '@prisma/client';

interface GroupItemWithTags extends GroupItem {
  tags: ItemTag[];
}

interface GroupItemDialogProps {
  groupId: number;
  item?: GroupItemWithTags;
  trigger: React.ReactNode;
  onSuccess: () => void;
}

export function GroupItemDialog({
  groupId,
  item,
  trigger,
  onSuccess,
}: GroupItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const isEdit = !!item;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setError,
  } = useForm<GroupItemFormData>({
    resolver: zodResolver(groupItemSchema),
    defaultValues: item
      ? {
          key: item.key,
          value: item.value,
          tags: item.tags.map((t) => t.tag),
        }
      : {
          key: '',
          value: '',
          tags: [],
        },
  });

  // Fetch all available tags for autocomplete
  const fetchTagSuggestions = useCallback(async () => {
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const tags = await response.json();
        setTagSuggestions(tags);
      }
    } catch (error) {
      console.error('Error fetching tag suggestions:', error);
    }
  }, []);

  // Reset form when dialog opens with different item
  useEffect(() => {
    if (open) {
      reset(
        item
          ? {
              key: item.key,
              value: item.value,
              tags: item.tags.map((t) => t.tag),
            }
          : {
              key: '',
              value: '',
              tags: [],
            }
      );
      // Fetch suggestions when dialog opens
      fetchTagSuggestions();
    }
  }, [open, item, reset, fetchTagSuggestions]);

  const onSubmit = async (data: GroupItemFormData) => {
    setLoading(true);
    try {
      const url = isEdit
        ? `/api/groups/${groupId}/items/${item.id}`
        : `/api/groups/${groupId}/items`;
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'Key already exists in this group') {
          setError('key', { message: 'This key already exists in this group' });
          return;
        }
        throw new Error('Failed to save item');
      }

      setOpen(false);
      reset();
      onSuccess();
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Failed to save item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-background/90 border/50 text-foreground backdrop-blur-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/20">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-primary font-mono tracking-wider uppercase drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">
              {isEdit ? 'MODIFY_CONFIG_ITEM' : 'INSERT_NEW_ITEM'}
            </DialogTitle>
            <DialogDescription className="text-cyan-600/70 font-mono text-xs">
              {isEdit
                ? '// Update the key-value configuration below.'
                : '// Add a new key-value pair to this group.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="key" className="text-foreground0 font-mono text-xs uppercase tracking-wider">Key</Label>
              <Input 
                id="key" 
                placeholder="CONFIG_KEY_NAME" 
                {...register('key')} 
                className="bg-card/50 border/50 text-foreground placeholder:text-cyan-900/50 font-mono focus:border-cyan-500 focus:ring-cyan-500/20 transition-all duration-300 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              />
              {errors.key && (
                <p className="text-sm text-rose-500 font-mono drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]">{errors.key.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="value" className="text-foreground0 font-mono text-xs uppercase tracking-wider">Value</Label>
              <Textarea
                id="value"
                placeholder="// Configuration value..."
                rows={3}
                {...register('value')}
                className="bg-card/50 border/50 text-foreground placeholder:text-cyan-900/50 font-mono focus:border-cyan-500 focus:ring-cyan-500/20 transition-all duration-300 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              />
              {errors.value && (
                <p className="text-sm text-rose-500 font-mono drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]">{errors.value.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label className="text-foreground0 font-mono text-xs uppercase tracking-wider">Tags</Label>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <TagInput
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder="ADD_TAGS..."
                    suggestions={tagSuggestions}
                    onFetchSuggestions={fetchTagSuggestions}
                  />
                )}
              />
              {errors.tags && (
                <p className="text-sm text-rose-500 font-mono drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]">
                  {errors.tags.message || (errors.tags as unknown as { root?: { message?: string } })?.root?.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-cyan-950/50 text-primary border border/50 hover:bg-cyan-900/50 hover:text-primary hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all font-mono uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-r-transparent mr-2 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                  PROCESSING...
                </>
              ) : (
                isEdit ? 'UPDATE_ITEM' : 'INSERT_ITEM'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
