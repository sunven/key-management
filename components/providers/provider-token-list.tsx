'use client';

import { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash2, ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
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
import { TokenDialog } from '@/components/tokens/token-dialog';
import type { Provider, Token } from '@prisma/client';

interface ProviderWithTokens extends Provider {
  tokens: Token[];
}

export function ProviderTokenList() {
  const [providers, setProviders] = useState<ProviderWithTokens[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProviders, setExpandedProviders] = useState<Set<number>>(new Set());
  const [visibleTokens, setVisibleTokens] = useState<Set<number>>(new Set());

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

  const toggleProvider = (id: number) => {
    setExpandedProviders(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleTokenVisibility = (id: number) => {
    setVisibleTokens(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const maskToken = (token: string) => {
    if (token.length <= 8) {
      return '***';
    }
    return `${'*'.repeat(token.length - 4)}${token.slice(-4)}`;
  };

  const handleDeleteProvider = async (id: number) => {
    const provider = providers.find(p => p.id === id);
    const tokenCount = provider?.tokens?.length || 0;

    const message = tokenCount > 0
      ? `Are you sure you want to delete this provider? All ${tokenCount} associated token(s) will be deleted.`
      : 'Are you sure you want to delete this provider?';

    if (!confirm(message)) {
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

  const handleDeleteToken = async (id: number) => {
    if (!confirm('Are you sure you want to delete this token?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tokens/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete token');

      fetchProviders();
    } catch (error) {
      console.error('Error deleting token:', error);
      alert('Failed to delete token. Please try again.');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading providers...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Providers & Tokens</h2>
          <p className="text-muted-foreground">Manage your API providers and tokens</p>
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
                <TableHead className="w-[50px]"></TableHead>
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
                <>
                  <TableRow key={provider.id}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleProvider(provider.id)}
                      >
                        {expandedProviders.has(provider.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
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
                            onClick={() => handleDeleteProvider(provider.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>

                  {expandedProviders.has(provider.id) && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/50">
                        <div className="p-4 space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold">Tokens for {provider.name}</h3>
                            <TokenDialog
                              preSelectedProviderId={provider.id}
                              trigger={
                                <Button size="sm">
                                  <Plus className="mr-2 h-3 w-3" />
                                  Add Token
                                </Button>
                              }
                              onSuccess={fetchProviders}
                            />
                          </div>

                          {provider.tokens && provider.tokens.length > 0 ? (
                            <div className="border rounded-lg bg-background">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Token</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="w-[70px]"></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {provider.tokens.map((token) => (
                                    <TableRow key={token.id}>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <code className="font-mono text-sm">
                                            {visibleTokens.has(token.id) ? token.token : maskToken(token.token)}
                                          </code>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => toggleTokenVisibility(token.id)}
                                          >
                                            {visibleTokens.has(token.id) ? (
                                              <EyeOff className="h-3 w-3" />
                                            ) : (
                                              <Eye className="h-3 w-3" />
                                            )}
                                          </Button>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant={provider.active ? 'default' : 'secondary'}>
                                          {provider.active ? 'Active' : 'Inactive'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-muted-foreground">
                                        {new Date(token.createdAt).toLocaleDateString()}
                                      </TableCell>
                                      <TableCell>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <TokenDialog
                                              token={{ ...token, provider }}
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
                                              onClick={() => handleDeleteToken(token.id)}
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
                          ) : (
                            <div className="text-center py-6 border-2 border-dashed rounded-lg bg-background">
                              <p className="text-sm text-muted-foreground mb-2">No tokens yet</p>
                              <TokenDialog
                                preSelectedProviderId={provider.id}
                                trigger={
                                  <Button size="sm" variant="outline">
                                    <Plus className="mr-2 h-3 w-3" />
                                    Add First Token
                                  </Button>
                                }
                                onSuccess={fetchProviders}
                              />
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
