'use client';

import { useState, useEffect } from 'react';
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
    }
  }, [open, item, reset]);

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
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Update the key-value configuration below.'
                : 'Add a new key-value pair to this group.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="key">Key</Label>
              <Input id="key" placeholder="api_endpoint" {...register('key')} />
              {errors.key && (
                <p className="text-sm text-destructive">{errors.key.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="value">Value</Label>
              <Textarea
                id="value"
                placeholder="https://api.openai.com/v1"
                rows={3}
                {...register('value')}
              />
              {errors.value && (
                <p className="text-sm text-destructive">{errors.value.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Tags (Optional)</Label>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <TagInput
                    value={field.value || []}
                    onChange={field.onChange}
                    placeholder="Type and press Enter to add tag"
                  />
                )}
              />
              {errors.tags && (
                <p className="text-sm text-destructive">
                  {errors.tags.message || (errors.tags as unknown as { root?: { message?: string } })?.root?.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
