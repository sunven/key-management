'use client';

import { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
import { ProviderDialog } from './provider-dialog';
import type { Provider, Token } from '@prisma/client';

interface ProviderWithTokenCount extends Provider {
  tokens: Token[];
}

export function ProviderList() {
  const [providers, setProviders] = useState<ProviderWithTokenCount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/providers');
      if (!response.ok) throw new Error('Failed to fetch providers');
      const data = await response.json();
      setProviders(data);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this provider? All associated tokens will be deleted.')) {
      return;
    }

    try {
      const response = await fetch(`/api/providers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete provider');

      fetchProviders();
    } catch (error) {
      console.error('Error deleting provider:', error);
      alert('Failed to delete provider. Please try again.');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading providers...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Providers</h2>
          <p className="text-muted-foreground">Manage your API providers</p>
        </div>
        <ProviderDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Provider
            </Button>
          }
          onSuccess={fetchProviders}
        />
      </div>

      {providers.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No providers yet</p>
          <ProviderDialog
            trigger={
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Provider
              </Button>
            }
            onSuccess={fetchProviders}
          />
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Base URL</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">{provider.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{provider.baseUrl}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {provider.description || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={provider.active ? 'default' : 'secondary'}>
                      {provider.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{provider.tokens?.length || 0}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <ProviderDialog
                          provider={provider}
                          trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          }
                          onSuccess={fetchProviders}
                        />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(provider.id)}
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
