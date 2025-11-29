'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Label } from '@/components/ui/label';
import type { Token, Provider } from '@/lib/db/schema';

const tokenSchema = z.object({
  providerId: z.string().min(1, 'Provider is required'),
  token: z.string().min(1, 'Token is required'),
});

type TokenFormData = z.infer<typeof tokenSchema>;

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
    resolver: zodResolver(tokenSchema),
    defaultValues: token
      ? {
          providerId: token.providerId.toString(),
          token: token.token,
        }
      : {
          providerId: preSelectedProviderId?.toString() || '',
          token: '',
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
          ...data,
          providerId: parseInt(data.providerId),
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
      alert('Failed to save token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Token' : 'Add New Token'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Update the token information below.'
                : 'Add a new API token for a provider.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!preSelectedProviderId && (
              <div className="grid gap-2">
                <Label htmlFor="providerId">Provider</Label>
                <Select
                  value={selectedProviderId}
                  onValueChange={(value) => setValue('providerId', value)}
                >
                  <SelectTrigger id="providerId">
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id.toString()}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.providerId && (
                  <p className="text-sm text-destructive">{errors.providerId.message}</p>
                )}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="token">Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="sk-..."
                {...register('token')}
              />
              {errors.token && (
                <p className="text-sm text-destructive">{errors.token.message}</p>
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
