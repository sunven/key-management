'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Share2,
  Globe,
  Lock,
  Copy,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  Send,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

interface ShareInvitation {
  id: number;
  email: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  invitedAt: string;
  respondedAt: string | null;
}

interface Share {
  id: string;
  type: 'PUBLIC' | 'PRIVATE';
  shareUrl: string;
  createdAt: string;
  group: {
    id: number;
    name: string;
    description: string | null;
  };
  invitations: ShareInvitation[];
}

export function ShareList() {
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedShareId, setExpandedShareId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareToDelete, setShareToDelete] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);

  const fetchShares = async () => {
    try {
      const response = await fetch('/api/shares');
      if (!response.ok) throw new Error('Failed to fetch shares');
      const data = await response.json();
      setShares(data);
    } catch (error) {
      console.error('Error fetching shares:', error);
      toast.error('Failed to load shares');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, []);

  const handleCopyLink = async (shareId: string, shareUrl: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(shareId);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleDeleteShare = async () => {
    if (!shareToDelete) return;

    try {
      const response = await fetch(`/api/shares/${shareToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to revoke share');

      toast.success('Share revoked successfully');
      fetchShares();
    } catch (error) {
      console.error('Error revoking share:', error);
      toast.error('Failed to revoke share');
    } finally {
      setDeleteDialogOpen(false);
      setShareToDelete(null);
    }
  };

  const handleResendInvitation = async (shareId: string, email: string) => {
    setResendingEmail(email);
    try {
      const response = await fetch(
        `/api/shares/${shareId}/invitations/${encodeURIComponent(email)}/resend`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resend invitation');
      }

      toast.success(`Invitation resent to ${email}`);
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to resend invitation');
    } finally {
      setResendingEmail(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-3 w-3 text-amber-500" />;
      case 'ACCEPTED':
        return <CheckCircle className="h-3 w-3 text-emerald-500" />;
      case 'REJECTED':
        return <XCircle className="h-3 w-3 text-rose-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-950/30 text-amber-400 border-amber-500/30';
      case 'ACCEPTED':
        return 'bg-emerald-950/30 text-emerald-400 border-emerald-500/30';
      case 'REJECTED':
        return 'bg-rose-950/30 text-rose-400 border-rose-500/30';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-r-transparent"></div>
          <div className="text-cyan-600 font-mono text-sm animate-pulse">LOADING_SHARES...</div>
        </div>
      </div>
    );
  }

  if (shares.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-900/50 border border-cyan-900/30 flex items-center justify-center mb-4">
          <Share2 className="w-8 h-8 text-cyan-900" />
        </div>
        <h3 className="text-cyan-400 font-mono text-lg mb-2">NO_SHARES_FOUND</h3>
        <p className="text-cyan-600/70 font-mono text-sm max-w-md">
          You haven&apos;t shared any groups yet. Go to Groups and click the SHARE button to create
          your first share.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-cyan-800/50 overflow-hidden bg-slate-950/50">
        <Table>
          <TableHeader>
            <TableRow className="border-cyan-800/50 hover:bg-transparent">
              <TableHead className="text-cyan-500 font-mono text-xs uppercase">Group</TableHead>
              <TableHead className="text-cyan-500 font-mono text-xs uppercase">Type</TableHead>
              <TableHead className="text-cyan-500 font-mono text-xs uppercase">Created</TableHead>
              <TableHead className="text-cyan-500 font-mono text-xs uppercase">Status</TableHead>
              <TableHead className="text-cyan-500 font-mono text-xs uppercase text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shares.map((share) => (
              <React.Fragment key={share.id}>
                <TableRow
                  key={share.id}
                  className="border-cyan-800/30 hover:bg-cyan-950/20 transition-colors"
                >
                  <TableCell className="font-mono text-cyan-100">{share.group.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`font-mono text-xs ${
                        share.type === 'PUBLIC'
                          ? 'border-cyan-500/50 text-cyan-400 bg-cyan-950/30'
                          : 'border-fuchsia-500/50 text-fuchsia-400 bg-fuchsia-950/30'
                      }`}
                    >
                      {share.type === 'PUBLIC' ? (
                        <Globe className="h-3 w-3 mr-1" />
                      ) : (
                        <Lock className="h-3 w-3 mr-1" />
                      )}
                      {share.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-cyan-600">
                    {formatDate(share.createdAt)}
                  </TableCell>
                  <TableCell>
                    {share.type === 'PRIVATE' ? (
                      <button
                        onClick={() =>
                          setExpandedShareId(expandedShareId === share.id ? null : share.id)
                        }
                        className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <span className="font-mono text-xs">
                          {share.invitations.filter((i) => i.status === 'ACCEPTED').length}/
                          {share.invitations.length} accepted
                        </span>
                        {expandedShareId === share.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    ) : (
                      <span className="font-mono text-xs text-cyan-600">Public access</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(share.id, share.shareUrl)}
                        className="h-8 text-cyan-500 hover:text-cyan-300 hover:bg-cyan-950/50"
                      >
                        {copiedId === share.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShareToDelete(share.id);
                          setDeleteDialogOpen(true);
                        }}
                        className="h-8 text-rose-500/70 hover:text-rose-400 hover:bg-rose-950/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Expanded invitations */}
                {expandedShareId === share.id && share.type === 'PRIVATE' && (
                  <TableRow className="border-cyan-800/30 bg-slate-900/30">
                    <TableCell colSpan={5} className="p-4">
                      <div className="space-y-2">
                        <h4 className="text-cyan-400 font-mono text-xs uppercase mb-3">
                          Invitations
                        </h4>
                        {share.invitations.map((invitation) => (
                          <div
                            key={invitation.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-cyan-800/30"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm text-cyan-100">
                                {invitation.email}
                              </span>
                              <Badge
                                variant="outline"
                                className={`font-mono text-xs ${getStatusColor(invitation.status)}`}
                              >
                                {getStatusIcon(invitation.status)}
                                <span className="ml-1">{invitation.status}</span>
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-cyan-600">
                                {formatDate(invitation.invitedAt)}
                              </span>
                              {invitation.status === 'PENDING' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResendInvitation(share.id, invitation.email)}
                                  disabled={resendingEmail === invitation.email}
                                  className="h-7 text-cyan-500 hover:text-cyan-300 hover:bg-cyan-950/50 font-mono text-xs"
                                >
                                  {resendingEmail === invitation.email ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border border-cyan-500 border-r-transparent" />
                                  ) : (
                                    <Send className="h-3 w-3 mr-1" />
                                  )}
                                  Resend
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-950/90 border-cyan-800/50 text-cyan-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-cyan-400 font-mono">REVOKE_SHARE</AlertDialogTitle>
            <AlertDialogDescription className="text-cyan-600/70 font-mono text-sm">
              Are you sure you want to revoke this share? The share link will immediately stop
              working and all invited users will lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent text-cyan-600 border-cyan-800/50 hover:bg-slate-900/50 font-mono">
              CANCEL
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteShare}
              className="bg-rose-950/50 text-rose-400 border border-rose-800/50 hover:bg-rose-900/50 font-mono"
            >
              REVOKE
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
