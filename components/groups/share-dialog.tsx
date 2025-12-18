'use client';

import { AlertTriangle, Check, Copy, Globe, Lock, Share2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface ShareDialogProps {
  groupId: number;
  groupName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type ShareType = 'PUBLIC' | 'PRIVATE';

export function ShareDialog({ groupId, groupName, open, onOpenChange, onSuccess }: ShareDialogProps) {
  const t = useTranslations('shareDialog');
  const tCommon = useTranslations('common');

  const [shareType, setShareType] = useState<ShareType>('PUBLIC');
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareResult, setShareResult] = useState<{ shareUrl: string; id: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAddEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error(t('invalidEmail'));
      return;
    }

    if (emails.includes(email)) {
      toast.error(t('emailAlreadyAdded'));
      return;
    }

    setEmails([...emails, email]);
    setEmailInput('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter((e) => e !== emailToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleCopyLink = async () => {
    if (!shareResult?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareResult.shareUrl);
      setCopied(true);
      toast.success(tCommon('linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(tCommon('failedToCopyLink'));
    }
  };

  const handleCreateShare = async () => {
    if (shareType === 'PRIVATE' && emails.length === 0) {
      toast.error(t('atLeastOneEmail'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          type: shareType,
          emails: shareType === 'PRIVATE' ? emails : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create share');
      }

      const data = await response.json();
      setShareResult({ shareUrl: data.shareUrl, id: data.id });
      toast.success(t('createSuccess'));
      onSuccess();
    } catch (error) {
      console.error('Error creating share:', error);
      toast.error(error instanceof Error ? error.message : t('createError'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShareType('PUBLIC');
    setEmails([]);
    setEmailInput('');
    setShareResult(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-background/90 border/50 text-foreground backdrop-blur-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/20">
        <DialogHeader>
          <DialogTitle className="text-primary font-mono tracking-wider uppercase drop-shadow-[0_0_5px_rgba(6,182,212,0.5)] flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription className="text-cyan-600/70 font-mono text-xs">
            {t('sharingLabel')} <span className="text-primary">{groupName}</span>
          </DialogDescription>
        </DialogHeader>

        {shareResult ? (
          // Success state - show share link
          <div className="py-4 space-y-4">
            <Alert className="bg-emerald-950/30 border-emerald-500/50 text-emerald-400">
              <Check className="h-4 w-4" />
              <AlertDescription className="font-mono text-xs">
                {t('shareCreatedSuccess')}
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label className="text-foreground0 font-mono text-xs uppercase tracking-wider">
                {t('shareLink')}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={shareResult.shareUrl}
                  readOnly
                  className="bg-card/50 border/50 text-foreground font-mono text-sm"
                />
                <Button
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-cyan-950/50 text-primary border border/50 hover:bg-cyan-900/50"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={handleClose}
                className="bg-cyan-950/50 text-primary border border/50 hover:bg-cyan-900/50 font-mono uppercase tracking-wider"
              >
                {tCommon('close')}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // Create share form
          <div className="py-4 space-y-6">
            {/* Share Type Selection */}
            <div className="space-y-3">
              <Label className="text-foreground0 font-mono text-xs uppercase tracking-wider">
                {t('shareType')}
              </Label>
              <RadioGroup
                value={shareType}
                onValueChange={(value) => setShareType(value as ShareType)}
                className="space-y-3"
              >
                <div
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    shareType === 'PUBLIC'
                      ? 'border-cyan-500/50 bg-cyan-950/30'
                      : 'border-slate-700/50 bg-card/30 hover:border-slate-600/50'
                  }`}
                  onClick={() => setShareType('PUBLIC')}
                >
                  <RadioGroupItem value="PUBLIC" id="public" className="mt-0.5" />
                  <div className="space-y-1">
                    <Label
                      htmlFor="public"
                      className="text-primary font-mono text-sm cursor-pointer flex items-center gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      {t('publicShare')}
                    </Label>
                    <p className="text-cyan-600/70 font-mono text-xs">
                      {t('publicShareDescription')}
                    </p>
                  </div>
                </div>
                <div
                  className={`flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    shareType === 'PRIVATE'
                      ? 'border-cyan-500/50 bg-cyan-950/30'
                      : 'border-slate-700/50 bg-card/30 hover:border-slate-600/50'
                  }`}
                  onClick={() => setShareType('PRIVATE')}
                >
                  <RadioGroupItem value="PRIVATE" id="private" className="mt-0.5" />
                  <div className="space-y-1">
                    <Label
                      htmlFor="private"
                      className="text-primary font-mono text-sm cursor-pointer flex items-center gap-2"
                    >
                      <Lock className="h-4 w-4" />
                      {t('privateShare')}
                    </Label>
                    <p className="text-cyan-600/70 font-mono text-xs">
                      {t('privateShareDescription')}
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Email Input (only for PRIVATE) */}
            {shareType === 'PRIVATE' && (
              <div className="space-y-3">
                <Label className="text-foreground0 font-mono text-xs uppercase tracking-wider">
                  {t('inviteUsers')}
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="bg-card/50 border/50 text-foreground placeholder:text-cyan-900/50 font-mono"
                  />
                  <Button
                    type="button"
                    onClick={handleAddEmail}
                    className="bg-cyan-950/50 text-primary border border/50 hover:bg-cyan-900/50"
                  >
                    {tCommon('add')}
                  </Button>
                </div>
                {emails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {emails.map((email) => (
                      <Badge
                        key={email}
                        variant="secondary"
                        className="bg-cyan-950/50 text-primary border border/50 font-mono text-xs"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(email)}
                          className="ml-2 hover:text-rose-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Warning for PUBLIC shares */}
            {shareType === 'PUBLIC' && (
              <Alert className="bg-amber-950/30 border-amber-500/50 text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="font-mono text-xs">
                  {t('publicWarning')}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="bg-transparent text-cyan-600 border/50 hover:bg-card/50 font-mono uppercase tracking-wider"
              >
                {tCommon('cancel')}
              </Button>
              <Button
                type="button"
                onClick={handleCreateShare}
                disabled={loading || (shareType === 'PRIVATE' && emails.length === 0)}
                className="bg-cyan-950/50 text-primary border border/50 hover:bg-cyan-900/50 hover:text-primary hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all font-mono uppercase tracking-wider"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-r-transparent mr-2" />
                    {tCommon('processing')}
                  </>
                ) : (
                  t('createShare')
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
