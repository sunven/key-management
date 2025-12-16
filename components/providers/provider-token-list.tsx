'use client';

import { useState, useEffect, Fragment } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Eye, EyeOff, Copy, Check } from 'lucide-react';
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
      toast.error('Failed to copy token to clipboard');
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
      toast.error(`Failed to delete ${deleteTarget.type}. Please try again.`);
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-cyan-500/80 font-mono text-sm animate-pulse">
        <div className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.8)] mr-2"></div>
        LOADING_PROVIDERS...
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-xl border border-cyan-800/50 backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.05)]">
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-mono text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)] flex items-center gap-2">
              <span className="text-fuchsia-500">::</span> PROVIDERS & TOKENS
            </h2>
            <p className="text-slate-400 font-mono text-sm mt-1">MANAGE_YOUR_API_PROVIDERS_AND_TOKENS</p>
          </div>
          <ProviderDialog
            trigger={
              <Button className="bg-cyan-600 hover:bg-cyan-500 text-white font-mono shadow-[0_0_10px_rgba(8,145,178,0.5)] hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] transition-all duration-300 border border-cyan-400/50">
                <Plus className="mr-2 h-4 w-4" />
                ADD_PROVIDER
              </Button>
            }
            onSuccess={fetchProviders}
          />
        </div>

      {providers.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-cyan-800/50 rounded-xl bg-slate-900/30">
          <p className="text-slate-500 mb-4 font-mono">NO_PROVIDERS_DETECTED</p>
          <ProviderDialog
            trigger={
              <Button variant="outline" className="border-cyan-600 text-cyan-400 hover:bg-cyan-950/50 font-mono">
                <Plus className="mr-2 h-4 w-4" />
                INITIALIZE_FIRST_PROVIDER
              </Button>
            }
            onSuccess={fetchProviders}
          />
        </div>
      ) : (
        <div className="border border-cyan-800/50 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.05)] bg-slate-900/80 backdrop-blur-sm">
          <Table>
            <TableHeader className="bg-slate-950/90">
              <TableRow className="border-b-cyan-800/50 hover:bg-transparent">
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="text-cyan-500/70 font-mono text-xs uppercase tracking-wider">Name</TableHead>
                <TableHead className="text-cyan-500/70 font-mono text-xs uppercase tracking-wider">Base URL</TableHead>
                <TableHead className="text-cyan-500/70 font-mono text-xs uppercase tracking-wider">Description</TableHead>
                <TableHead className="text-cyan-500/70 font-mono text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-cyan-500/70 font-mono text-xs uppercase tracking-wider">Tokens</TableHead>
                <TableHead className="text-cyan-500/70 font-mono text-xs uppercase tracking-wider">Created At</TableHead>
                <TableHead className="text-cyan-500/70 font-mono text-xs uppercase tracking-wider">Updated At</TableHead>
                <TableHead className="text-right text-cyan-500/70 font-mono text-xs uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((provider) => (
                <Fragment key={provider.id}>
                  <TableRow className="border-b-cyan-900/30 hover:bg-cyan-950/20 transition-colors group">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-cyan-600 hover:text-cyan-400 hover:bg-cyan-950/50"
                        onClick={() => toggleProvider(provider.id)}
                      >
                        {expandedProviders.has(provider.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium font-mono text-cyan-300 drop-shadow-[0_0_3px_rgba(6,182,212,0.3)]">{provider.name}</TableCell>
                    <TableCell className="max-w-xs truncate font-mono text-sm text-slate-400">{provider.baseUrl}</TableCell>
                    <TableCell className="text-slate-500 font-mono text-sm">
                      {provider.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-mono text-xs ${provider.active ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800 shadow-[0_0_5px_rgba(16,185,129,0.2)]' : 'bg-slate-800/50 text-slate-400 border-slate-700'}`}>
                        {provider.active ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-cyan-100">{provider.tokens?.length || 0}</TableCell>
                    <TableCell className="text-slate-500 text-xs font-mono">
                      {formatDateTime(provider.createdAt)}
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs font-mono">
                      {formatDateTime(provider.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ProviderDialog
                          provider={provider}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-cyan-600 hover:text-cyan-400 hover:bg-cyan-950/50">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                          onSuccess={fetchProviders}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-600 hover:text-rose-400 hover:bg-rose-950/30"
                          onClick={() => handleDeleteProvider(provider.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {expandedProviders.has(provider.id) && (
                    <TableRow className="bg-slate-950/50 hover:bg-slate-950/50">
                      <TableCell colSpan={9} className="p-0 border-b border-cyan-900/30">
                        <div className="p-6 space-y-4 bg-slate-950/30 shadow-inner">
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold font-mono text-fuchsia-400 flex items-center gap-2">
                              <span className="text-cyan-600">TOKENS_FOR</span> :: {provider.name}
                            </h3>
                            <TokenDialog
                              preSelectedProviderId={provider.id}
                              trigger={
                                <Button size="sm" className="bg-cyan-900/30 hover:bg-cyan-800/50 text-cyan-400 border border-cyan-700/50 font-mono text-xs">
                                  <Plus className="mr-2 h-3 w-3" />
                                  ADD_TOKEN
                                </Button>
                              }
                              onSuccess={fetchProviders}
                            />
                          </div>

                          {provider.tokens && provider.tokens.length > 0 ? (
                            <div className="border border-cyan-900/30 rounded-lg bg-slate-900/50 overflow-hidden">
                              <Table>
                                <TableHeader className="bg-slate-950/80">
                                  <TableRow className="border-b-cyan-900/30 hover:bg-transparent">
                                    <TableHead className="font-mono text-xs text-cyan-600">Token</TableHead>
                                    <TableHead className="font-mono text-xs text-cyan-600">Description</TableHead>
                                    <TableHead className="font-mono text-xs text-cyan-600">Created At</TableHead>
                                    <TableHead className="font-mono text-xs text-cyan-600">Updated At</TableHead>
                                    <TableHead className="text-right font-mono text-xs text-cyan-600">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {provider.tokens.map((token) => (
                                    <TableRow key={token.id} className="border-b-cyan-900/10 hover:bg-cyan-950/10 transition-colors group/token">
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <code className="font-mono text-sm text-amber-400 bg-amber-950/10 px-2 py-1 rounded border border-amber-900/20">
                                            {visibleTokens.has(token.id) ? token.token : maskToken(token.token)}
                                          </code>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-slate-500 hover:text-cyan-400"
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
                                            className="h-6 w-6 text-slate-500 hover:text-cyan-400"
                                            onClick={() => copyToken(token.token, token.id)}
                                          >
                                            {copiedTokenId === token.id ? (
                                              <Check className="h-3 w-3 text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                                            ) : (
                                              <Copy className="h-3 w-3" />
                                            )}
                                          </Button>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-slate-400 font-mono text-sm">
                                        {token.description || '-'}
                                      </TableCell>
                                      <TableCell className="text-slate-600 text-xs font-mono">
                                        {formatDateTime(token.createdAt)}
                                      </TableCell>
                                      <TableCell className="text-slate-600 text-xs font-mono">
                                        {formatDateTime(token.updatedAt)}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex justify-end gap-2 opacity-0 group-hover/token:opacity-100 transition-opacity duration-300">
                                          <TokenDialog
                                            token={{ ...token, provider }}
                                            trigger={
                                              <Button variant="ghost" size="icon" className="h-8 w-8 text-cyan-600 hover:text-cyan-400 hover:bg-cyan-950/50">
                                                <Pencil className="h-4 w-4" />
                                              </Button>
                                            }
                                            onSuccess={fetchProviders}
                                          />
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-rose-600 hover:text-rose-400 hover:bg-rose-950/30"
                                            onClick={() => handleDeleteToken(token.id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <div className="text-center py-6 border border-dashed border-cyan-900/30 rounded-lg bg-slate-900/20">
                              <p className="text-sm text-slate-500 mb-2 font-mono">NO_TOKENS_FOUND</p>
                              <TokenDialog
                                preSelectedProviderId={provider.id}
                                trigger={
                                  <Button size="sm" variant="outline" className="border-cyan-800/50 text-cyan-500 hover:bg-cyan-950/30 font-mono text-xs">
                                    <Plus className="mr-2 h-3 w-3" />
                                    ADD_FIRST_TOKEN
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
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      </div>

      {/* Unified Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-slate-900 border-cyan-800 text-cyan-100 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-cyan-400">
              {deleteTarget?.type === 'provider' ? 'DELETE_PROVIDER' : 'DELETE_TOKEN'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-mono text-sm">
              {deleteTarget?.type === 'provider'
                ? (deleteTarget.provider.tokens.length > 0
                    ? `Are you sure you want to delete "${deleteTarget.provider.name}"? All ${deleteTarget.provider.tokens.length} associated token(s) will be deleted. This action cannot be undone.`
                    : `Are you sure you want to delete "${deleteTarget.provider.name}"? This action cannot be undone.`)
                : 'Are you sure you want to delete this token? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white font-mono">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-rose-900/80 text-rose-100 hover:bg-rose-800 border border-rose-800/50 font-mono shadow-[0_0_10px_rgba(244,63,94,0.2)]">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
