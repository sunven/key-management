'use client';

import { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
      toast.error('Failed to delete provider. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-r-transparent shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
          <div className="text-cyan-600 font-mono text-sm animate-pulse uppercase tracking-widest">Loading Providers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-slate-900/30 p-4 rounded-lg border border-cyan-900/30 backdrop-blur-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 font-mono drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">Providers</h2>
          <p className="text-cyan-600/70 font-mono text-xs flex items-center gap-2">
            <span className="text-fuchsia-500">{'//'}</span>
            Manage your API providers
          </p>
        </div>
        <ProviderDialog
          trigger={
            <Button className="bg-slate-900/50 text-cyan-500 border border-cyan-800/50 hover:bg-cyan-950/50 hover:text-cyan-300 hover:border-cyan-500 font-mono text-xs transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Plus className="mr-2 h-4 w-4" />
              ADD_PROVIDER
            </Button>
          }
          onSuccess={fetchProviders}
        />
      </div>

      {providers.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-cyan-900/50 rounded-lg bg-slate-900/20 shadow-[0_0_20px_rgba(6,182,212,0.05)]">
          <p className="text-cyan-900/50 font-mono mb-4 animate-pulse">NO_PROVIDERS_DETECTED</p>
          <ProviderDialog
            trigger={
              <Button variant="outline" className="border-cyan-800/50 text-cyan-600 hover:bg-cyan-950/30 hover:text-cyan-400 font-mono">
                <Plus className="mr-2 h-4 w-4" />
                INIT_FIRST_PROVIDER
              </Button>
            }
            onSuccess={fetchProviders}
          />
        </div>
      ) : (
        <div className="border border-cyan-800/50 rounded-lg bg-slate-900/20 overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.05)]">
          <Table>
            <TableHeader className="bg-slate-950/80 backdrop-blur-md">
              <TableRow className="border-b-cyan-800/50 hover:bg-transparent">
                <TableHead className="text-cyan-500/70 font-mono text-xs uppercase tracking-wider pl-4">Name</TableHead>
                <TableHead className="text-cyan-500/70 font-mono text-xs uppercase tracking-wider">Base URL</TableHead>
                <TableHead className="text-cyan-500/70 font-mono text-xs uppercase tracking-wider">Description</TableHead>
                <TableHead className="text-cyan-500/70 font-mono text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-cyan-500/70 font-mono text-xs uppercase tracking-wider">Tokens</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((provider) => (
                <TableRow key={provider.id} className="border-b-cyan-900/30 hover:bg-cyan-950/20 transition-colors group">
                  <TableCell className="font-medium font-mono text-cyan-300 pl-4 drop-shadow-[0_0_3px_rgba(6,182,212,0.3)]">{provider.name}</TableCell>
                  <TableCell className="max-w-xs truncate font-mono text-xs text-slate-400">{provider.baseUrl}</TableCell>
                  <TableCell className="text-slate-500 font-mono text-xs">
                    {provider.description || '// No description'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={provider.active ? 'default' : 'secondary'} className={`font-mono text-[10px] ${provider.active ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/50 shadow-[0_0_5px_rgba(16,185,129,0.3)]' : 'bg-slate-900/50 text-slate-500 border-slate-800'}`}>
                      {provider.active ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-fuchsia-400">{provider.tokens?.length || 0}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-cyan-600 hover:text-cyan-400 hover:bg-cyan-950/50 hover:shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-950/95 border-cyan-800/50 backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                        <ProviderDialog
                          provider={provider}
                          trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-cyan-400 hover:text-cyan-200 focus:text-cyan-200 hover:bg-cyan-950/30 focus:bg-cyan-950/30 cursor-pointer font-mono text-xs uppercase tracking-wider">
                              <Pencil className="mr-2 h-3 w-3" />
                              Edit
                            </DropdownMenuItem>
                          }
                          onSuccess={fetchProviders}
                        />
                        <DropdownMenuItem
                          className="text-rose-500 hover:text-rose-300 focus:text-rose-300 hover:bg-rose-950/30 focus:bg-rose-950/30 cursor-pointer font-mono text-xs uppercase tracking-wider"
                          onClick={() => handleDelete(provider.id)}
                        >
                          <Trash2 className="mr-2 h-3 w-3" />
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
