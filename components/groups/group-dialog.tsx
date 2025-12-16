'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { groupSchema, type GroupFormData } from '@/lib/schemas';
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
import type { Group } from '@prisma/client';

interface GroupDialogProps {
  group?: Group;
  trigger: React.ReactNode;
  onSuccess: () => void;
}

export function GroupDialog({ group, trigger, onSuccess }: GroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!group;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: group
      ? {
          name: group.name,
          description: group.description || '',
        }
      : {
          name: '',
          description: '',
        },
  });

  const onSubmit = async (data: GroupFormData) => {
    setLoading(true);
    try {
      const url = isEdit ? `/api/groups/${group.id}` : '/api/groups';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save group');
      }

      setOpen(false);
      reset();
      onSuccess();
    } catch (error) {
      console.error('Error saving group:', error);
      toast.error('Failed to save group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white border-cyan-200 text-slate-900 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-cyan-600 font-mono tracking-wider uppercase">
              {isEdit ? 'EDIT_SYSTEM_GROUP' : 'INIT_NEW_GROUP'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-mono text-xs">
              {isEdit
                ? '// Update group configuration parameters.'
                : '// Initialize a new configuration node cluster.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-cyan-600/80 font-mono text-xs uppercase">Name</Label>
              <Input 
                id="name" 
                placeholder="SYSTEM_NODE_01" 
                {...register('name')} 
                className="bg-white border-cyan-200 text-cyan-700 placeholder:text-cyan-600/50 font-mono focus:border-cyan-400 focus:ring-cyan-400/20"
              />
              {errors.name && (
                <p className="text-sm text-rose-500 font-mono">{errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-cyan-600/80 font-mono text-xs uppercase">Description</Label>
              <Textarea
                id="description"
                placeholder="// Optional system description"
                {...register('description')}
                className="bg-white border-cyan-200 text-cyan-700 placeholder:text-cyan-600/50 font-mono focus:border-cyan-400 focus:ring-cyan-400/20 min-h-[100px]"
              />
              {errors.description && (
                <p className="text-sm text-rose-500 font-mono">{errors.description.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-white text-cyan-600 border border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 transition-all font-mono uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-r-transparent mr-2" />
                  PROCESSING...
                </>
              ) : (
                isEdit ? 'UPDATE_NODE' : 'INITIALIZE_NODE'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
