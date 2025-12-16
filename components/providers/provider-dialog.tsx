'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { providerSchema, type ProviderFormData } from '@/lib/schemas';
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
import { Switch } from '@/components/ui/switch';
import type { Provider } from '@prisma/client';

interface ProviderDialogProps {
  provider?: Provider;
  trigger: React.ReactNode;
  onSuccess: () => void;
}

export function ProviderDialog({ provider, trigger, onSuccess }: ProviderDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!provider;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    defaultValues: provider ? {
      baseUrl: provider.baseUrl,
      name: provider.name,
      description: provider.description || '',
      active: provider.active,
    } : {
      baseUrl: '',
      name: '',
      description: '',
      active: true,
    },
  });

  const activeValue = watch('active');

  const onSubmit = async (data: ProviderFormData) => {
    setLoading(true);
    try {
      const url = isEdit ? `/api/providers/${provider.id}` : '/api/providers';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save provider');
      }

      setOpen(false);
      reset();
      onSuccess();
    } catch (error) {
      console.error('Error saving provider:', error);
      toast.error('Failed to save provider. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-cyan-800 text-cyan-100 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="font-mono text-cyan-400">{isEdit ? 'EDIT_PROVIDER' : 'ADD_NEW_PROVIDER'}</DialogTitle>
            <DialogDescription className="text-slate-400 font-mono text-sm">
              {isEdit
                ? 'Update the provider information below.'
                : 'Add a new API provider to manage tokens.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-cyan-600 font-mono text-xs uppercase">Name</Label>
              <Input id="name" placeholder="OpenAI" {...register('name')} className="bg-slate-950/50 border-cyan-900/50 text-cyan-100 focus:border-cyan-500 focus:ring-cyan-500/20 font-mono" />
              {errors.name && (
                <p className="text-sm text-rose-500 font-mono">{errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="baseUrl" className="text-cyan-600 font-mono text-xs uppercase">Base URL</Label>
              <Input
                id="baseUrl"
                placeholder="https://api.openai.com"
                {...register('baseUrl')}
                className="bg-slate-950/50 border-cyan-900/50 text-cyan-100 focus:border-cyan-500 focus:ring-cyan-500/20 font-mono"
              />
              {errors.baseUrl && (
                <p className="text-sm text-rose-500 font-mono">{errors.baseUrl.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-cyan-600 font-mono text-xs uppercase">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="API provider for AI services"
                {...register('description')}
                className="bg-slate-950/50 border-cyan-900/50 text-cyan-100 focus:border-cyan-500 focus:ring-cyan-500/20 font-mono"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-cyan-900/30 bg-slate-950/30">
              <Label htmlFor="active" className="text-cyan-600 font-mono text-xs uppercase">Active Status</Label>
              <Switch
                id="active"
                checked={activeValue}
                onCheckedChange={(checked) => setValue('active', checked)}
                className="data-[state=checked]:bg-cyan-600 data-[state=unchecked]:bg-slate-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white font-mono">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-cyan-600 hover:bg-cyan-500 text-white font-mono shadow-[0_0_10px_rgba(8,145,178,0.5)]">
              {loading ? 'SAVING...' : isEdit ? 'UPDATE_PROVIDER' : 'CREATE_PROVIDER'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
