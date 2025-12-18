'use client';

import {
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Globe,
  Lock,
  Send,
  Share2,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  const t = useTranslations('shares');
  const tCommon = useTranslations('common');

  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedShareId, setExpandedShareId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareToDelete, setShareToDelete] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);

  const fetchShares = useCallback(async () => {
    try {
      const response = await fetch('/api/shares');
      if (!response.ok) throw new Error('Failed to fetch shares');
      const data = await response.json();
      setShares(data);
    } catch (error) {
      console.error('Error fetching shares:', error);
      toast.error(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  const handleCopyLink = async (shareId: string, shareUrl: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(shareId);
      toast.success(tCommon('copiedToClipboard'));
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error(tCommon('copyFailed'));
    }
  };

  const handleDeleteShare = async () => {
    if (!shareToDelete) return;

    try {
      const response = await fetch(`/api/shares/${shareToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to revoke share');

      toast.success(t('revokeSuccess'));
      fetchShares();
    } catch (error) {
      console.error('Error revoking share:', error);
      toast.error(t('revokeError'));
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
        { method: 'POST' },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resend invitation');
      }

      toast.success(t('resendSuccess', { email }));
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error(
        error instanceof Error ? error.message : t('resendError'),
      );
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
          <div className="text-cyan-600 font-mono text-sm animate-pulse">
            {t('loading')}
          </div>
        </div>
      </div>
    );
  }

  if (shares.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-card/50 border border/30 flex items-center justify-center mb-4">
          <Share2 className="w-8 h-8 text-cyan-900" />
        </div>
        <h3 className="text-primary font-mono text-lg mb-2">{t('noSharesTitle')}</h3>
        <p className="text-cyan-600/70 font-mono text-sm max-w-md">
          {t('noSharesDescription')}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border/50 overflow-hidden bg-background/50">
        <Table>
          <TableHeader>
            <TableRow className="border/50 hover:bg-transparent">
              <TableHead className="text-foreground0 font-mono text-xs uppercase">
                {t('columnGroup')}
              </TableHead>
              <TableHead className="text-foreground0 font-mono text-xs uppercase">
                {t('columnType')}
              </TableHead>
              <TableHead className="text-foreground0 font-mono text-xs uppercase">
                {t('columnCreated')}
              </TableHead>
              <TableHead className="text-foreground0 font-mono text-xs uppercase">
                {t('columnStatus')}
              </TableHead>
              <TableHead className="text-foreground0 font-mono text-xs uppercase text-right">
                {t('columnActions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shares.map((share) => (
              <React.Fragment key={share.id}>
                <TableRow
                  key={share.id}
                  className="border/30 hover:bg-cyan-950/20 transition-colors"
                >
                  <TableCell className="font-mono text-foreground">
                    {share.group.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`font-mono text-xs ${
                        share.type === 'PUBLIC'
                          ? 'border-cyan-500/50 text-primary bg-cyan-950/30'
                          : 'border-fuchsia-500/50 text-fuchsia-400 bg-fuchsia-950/30'
                      }`}
                    >
                      {share.type === 'PUBLIC' ? (
                        <Globe className="h-3 w-3 mr-1" />
                      ) : (
                        <Lock className="h-3 w-3 mr-1" />
                      )}
                      {share.type === 'PUBLIC' ? t('typePublic') : t('typePrivate')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-cyan-600">
                    {formatDate(share.createdAt)}
                  </TableCell>
                  <TableCell>
                    {share.type === 'PRIVATE' ? (
                      <button
                        onClick={() =>
                          setExpandedShareId(
                            expandedShareId === share.id ? null : share.id,
                          )
                        }
                        className="flex items-center gap-2 text-primary hover:text-primary transition-colors"
                      >
                        <span className="font-mono text-xs">
                          {t('acceptedCount', {
                            accepted: share.invitations.filter(
                              (i) => i.status === 'ACCEPTED',
                            ).length,
                            total: share.invitations.length,
                          })}
                        </span>
                        {expandedShareId === share.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    ) : (
                      <span className="font-mono text-xs text-cyan-600">
                        {t('publicAccess')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(share.id, share.shareUrl)}
                        className="h-8 text-foreground0 hover:text-primary hover:bg-cyan-950/50"
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
                  <TableRow className="border/30 bg-card/30">
                    <TableCell colSpan={5} className="p-4">
                      <div className="space-y-2">
                        <h4 className="text-primary font-mono text-xs uppercase mb-3">
                          {t('invitations')}
                        </h4>
                        {share.invitations.map((invitation) => (
                          <div
                            key={invitation.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border/30"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm text-foreground">
                                {invitation.email}
                              </span>
                              <Badge
                                variant="outline"
                                className={`font-mono text-xs ${getStatusColor(invitation.status)}`}
                              >
                                {getStatusIcon(invitation.status)}
                                <span className="ml-1">
                                  {t(`status${invitation.status.charAt(0) + invitation.status.slice(1).toLowerCase()}`)}
                                </span>
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
                                  onClick={() =>
                                    handleResendInvitation(
                                      share.id,
                                      invitation.email,
                                    )
                                  }
                                  disabled={resendingEmail === invitation.email}
                                  className="h-7 text-foreground0 hover:text-primary hover:bg-cyan-950/50 font-mono text-xs"
                                >
                                  {resendingEmail === invitation.email ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border border-cyan-500 border-r-transparent" />
                                  ) : (
                                    <Send className="h-3 w-3 mr-1" />
                                  )}
                                  {t('resend')}
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
        <AlertDialogContent className="bg-background/90 border/50 text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary font-mono">
              {t('revokeTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-cyan-600/70 font-mono text-sm">
              {t('revokeDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent text-cyan-600 border/50 hover:bg-card/50 font-mono">
              {tCommon('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteShare}
              className="bg-rose-950/50 text-rose-400 border border-rose-800/50 hover:bg-rose-900/50 font-mono"
            >
              {t('revokeButton')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
