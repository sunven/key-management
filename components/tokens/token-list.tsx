'use client';

import { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
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
import { TokenDialog } from './token-dialog';
import type { Token, Provider } from '@/lib/db/schema';

interface TokenWithProvider extends Token {
  provider: Provider;
}

export function TokenList() {
  const [tokens, setTokens] = useState<TokenWithProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleTokens, setVisibleTokens] = useState<Set<number>>(new Set());

  const fetchTokens = async () => {
    try {
      const response = await fetch('/api/tokens');
      if (!response.ok) throw new Error('Failed to fetch tokens');
      const data = await response.json();
      setTokens(data);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this token?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tokens/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete token');

      fetchTokens();
    } catch (error) {
      console.error('Error deleting token:', error);
      alert('Failed to delete token. Please try again.');
    }
  };

  const toggleTokenVisibility = (id: number) => {
    setVisibleTokens((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const maskToken = (token: string) => {
    if (token.length <= 8) {
      return '***';
    }
    return `${'*'.repeat(token.length - 4)}${token.slice(-4)}`;
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading tokens...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tokens</h2>
          <p className="text-muted-foreground">Manage your API tokens</p>
        </div>
        <TokenDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Token
            </Button>
          }
          onSuccess={fetchTokens}
        />
      </div>

      {tokens.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">No tokens yet</p>
          <TokenDialog
            trigger={
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Token
              </Button>
            }
            onSuccess={fetchTokens}
          />
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell className="font-medium">{token.provider.name}</TableCell>
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
                    <Badge variant={token.provider.active ? 'default' : 'secondary'}>
                      {token.provider.active ? 'Active' : 'Inactive'}
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
                          token={token}
                          trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          }
                          onSuccess={fetchTokens}
                        />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(token.id)}
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
