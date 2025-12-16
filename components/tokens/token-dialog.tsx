'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { tokenFormSchema, type TokenFormData } from '@/lib/schemas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Token, Provider } from '@prisma/client';

interface TokenWithProvider extends Token {
  provider: Provider;
}

interface TokenDialogProps {
  token?: TokenWithProvider;
  trigger: React.ReactNode;
  onSuccess: () => void;
  preSelectedProviderId?: number;
}

export function TokenDialog({ token, trigger, onSuccess, preSelectedProviderId }: TokenDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const isEdit = !!token;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TokenFormData>({
    resolver: zodResolver(tokenFormSchema),
    defaultValues: token
      ? {
          providerId: token.providerId.toString(),
          token: token.token,
          description: token.description || '',
        }
      : {
          providerId: preSelectedProviderId?.toString() || '',
          token: '',
          description: '',
        },
  });

  const selectedProviderId = watch('providerId');

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/providers');
        if (!response.ok) throw new Error('Failed to fetch providers');
        const data = await response.json();
        setProviders(data.filter((p: Provider) => p.active));
      } catch (error) {
        console.error('Error fetching providers:', error);
      }
    };

    if (open && !preSelectedProviderId) {
      fetchProviders();
    }
  }, [open, preSelectedProviderId]);

  useEffect(() => {
    if (preSelectedProviderId && open) {
      setValue('providerId', preSelectedProviderId.toString());
    }
  }, [preSelectedProviderId, open, setValue]);

  const onSubmit = async (data: TokenFormData) => {
    setLoading(true);
    try {
      const url = isEdit ? `/api/tokens/${token.id}` : '/api/tokens';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: parseInt(data.providerId),
          token: data.token,
          description: data.description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save token');
      }

      setOpen(false);
      reset();
      onSuccess();
    } catch (error) {
      console.error('Error saving token:', error);
      toast.error('Failed to save token. Please try again.');
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
            <DialogTitle className="font-mono text-cyan-400">{isEdit ? 'EDIT_TOKEN' : 'ADD_NEW_TOKEN'}</DialogTitle>
            <DialogDescription className="text-slate-400 font-mono text-sm">
              {isEdit
                ? 'Update the token information below.'
                : 'Add a new API token for a provider.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!preSelectedProviderId && (
              <div className="grid gap-2">
                <Label htmlFor="providerId" className="text-cyan-600 font-mono text-xs uppercase">Provider</Label>
                <Select
                  value={selectedProviderId}
                  onValueChange={(value) => setValue('providerId', value)}
                >
                  <SelectTrigger id="providerId" className="bg-slate-950/50 border-cyan-900/50 text-cyan-100 focus:border-cyan-500 focus:ring-cyan-500/20 font-mono">
                    <SelectValue placeholder="SELECT_PROVIDER" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-cyan-800 text-cyan-100">
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id.toString()} className="focus:bg-cyan-950/50 focus:text-cyan-400 font-mono">
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.providerId && (
                  <p className="text-sm text-rose-500 font-mono">{errors.providerId.message}</p>
                )}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="token" className="text-cyan-600 font-mono text-xs uppercase">Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="sk-..."
                {...register('token')}
                className="bg-slate-950/50 border-cyan-900/50 text-cyan-100 focus:border-cyan-500 focus:ring-cyan-500/20 font-mono"
              />
              {errors.token && (
                <p className="text-sm text-rose-500 font-mono">{errors.token.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-cyan-600 font-mono text-xs uppercase">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a description for this token..."
                {...register('description')}
                className="bg-slate-950/50 border-cyan-900/50 text-cyan-100 focus:border-cyan-500 focus:ring-cyan-500/20 font-mono"
              />
              {errors.description && (
                <p className="text-sm text-rose-500 font-mono">{errors.description.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white font-mono">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-cyan-600 hover:bg-cyan-500 text-white font-mono shadow-[0_0_10px_rgba(8,145,178,0.5)]">
              {loading ? 'SAVING...' : isEdit ? 'UPDATE_TOKEN' : 'CREATE_TOKEN'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
