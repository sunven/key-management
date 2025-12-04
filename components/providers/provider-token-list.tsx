'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Eye, EyeOff, Copy, Check } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ProviderDialog } from './provider-dialog';
import { TokenDialog } from '@/components/tokens/token-dialog';
import type { Provider, Token } from '@prisma/client';

interface ProviderWithTokens extends Provider {
  tokens: Token[];
}

type DeleteTarget =
  | { type: 'provider'; provider: ProviderWithTokens }
  | { type: 'token'; tokenId: number }
  | null;

export function ProviderTokenList() {
  const [providers, setProviders] = useState<ProviderWithTokens[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProviders, setExpandedProviders] = useState<Set<number>>(new Set());
  const [visibleTokens, setVisibleTokens] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<number | null>(null);

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

  const copyToken = async (token: string, tokenId: number) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedTokenId(tokenId);
      setTimeout(() => setCopiedTokenId(null), 2000);
    } catch (error) {
      console.error('Failed to copy token:', error);
      alert('Failed to copy token to clipboard');
    }
  };

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
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
    if (!provider) return;
    setDeleteTarget({ type: 'provider', provider });
  };

  const handleDeleteToken = async (id: number) => {
    setDeleteTarget({ type: 'token', tokenId: id });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'provider') {
        const response = await fetch(`/api/providers/${deleteTarget.provider.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete provider');
      } else {
        const response = await fetch(`/api/tokens/${deleteTarget.tokenId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete token');
      }

      fetchProviders();
    } catch (error) {
      console.error('Error deleting:', error);
      alert(`Failed to delete ${deleteTarget.type}. Please try again.`);
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading providers...</div>;
  }

  return (
    <>
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
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDateTime(provider.createdAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDateTime(provider.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <ProviderDialog
                          provider={provider}
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                          onSuccess={fetchProviders}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProvider(provider.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {expandedProviders.has(provider.id) && (
                    <TableRow>
                      <TableCell colSpan={9} className="bg-muted/50">
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
                                    <TableHead>Created At</TableHead>
                                    <TableHead>Updated At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
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
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => copyToken(token.token, token.id)}
                                          >
                                            {copiedTokenId === token.id ? (
                                              <Check className="h-3 w-3 text-green-600" />
                                            ) : (
                                              <Copy className="h-3 w-3" />
                                            )}
                                          </Button>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-muted-foreground text-sm">
                                        {formatDateTime(token.createdAt)}
                                      </TableCell>
                                      <TableCell className="text-muted-foreground text-sm">
                                        {formatDateTime(token.updatedAt)}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex justify-end gap-2">
                                          <TokenDialog
                                            token={{ ...token, provider }}
                                            trigger={
                                              <Button variant="ghost" size="icon">
                                                <Pencil className="h-4 w-4" />
                                              </Button>
                                            }
                                            onSuccess={fetchProviders}
                                          />
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteToken(token.id)}
                                          >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                        </div>
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

      {/* Unified Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === 'provider' ? 'Delete Provider' : 'Delete Token'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'provider'
                ? (deleteTarget.provider.tokens.length > 0
                    ? `Are you sure you want to delete "${deleteTarget.provider.name}"? All ${deleteTarget.provider.tokens.length} associated token(s) will be deleted. This action cannot be undone.`
                    : `Are you sure you want to delete "${deleteTarget.provider.name}"? This action cannot be undone.`)
                : 'Are you sure you want to delete this token? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
