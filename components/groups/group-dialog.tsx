'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Group } from '@/lib/generated/prisma/client';
import { type GroupFormData, groupSchema } from '@/lib/schemas';

interface GroupDialogProps {
  group?: Group;
  trigger: React.ReactNode;
  onSuccess: () => void;
}

export function GroupDialog({ group, trigger, onSuccess }: GroupDialogProps) {
  const t = useTranslations('groupDialog');
  const tCommon = useTranslations('common');
  const tGroups = useTranslations('groups');

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
      toast.error(tGroups('saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-background/90 border/50 text-foreground backdrop-blur-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/20">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="text-primary font-mono tracking-wider uppercase drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">
              {isEdit ? t('editTitle') : t('createTitle')}
            </DialogTitle>
            <DialogDescription className="text-cyan-600/70 font-mono text-xs">
              {isEdit ? t('editDescription') : t('createDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label
                htmlFor="name"
                className="text-foreground0 font-mono text-xs uppercase tracking-wider"
              >
                {t('nameLabel')}
              </Label>
              <Input
                id="name"
                placeholder={t('namePlaceholder')}
                {...register('name')}
                className="bg-card/50 border/50 text-foreground placeholder:text-cyan-900/50 font-mono focus:border-cyan-500 focus:ring-cyan-500/20 transition-all duration-300 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              />
              {errors.name && (
                <p className="text-sm text-rose-500 font-mono drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="description"
                className="text-foreground0 font-mono text-xs uppercase tracking-wider"
              >
                {t('descriptionLabel')}
              </Label>
              <Textarea
                id="description"
                placeholder={t('descriptionPlaceholder')}
                {...register('description')}
                className="bg-card/50 border/50 text-foreground placeholder:text-cyan-900/50 font-mono focus:border-cyan-500 focus:ring-cyan-500/20 min-h-[100px] transition-all duration-300 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              />
              {errors.description && (
                <p className="text-sm text-rose-500 font-mono drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]">
                  {errors.description.message}
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
                  {tCommon('processing')}
                </>
              ) : isEdit ? (
                t('updateButton')
              ) : (
                t('createButton')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
