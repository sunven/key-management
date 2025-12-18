'use client';

import {
  AlertTriangle,
  Check,
  CheckCircle,
  Copy,
  Globe,
  Info,
  Lock,
  LogIn,
  Share2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ShareItem {
  id: number;
  key: string;
  value: string;
  tags: Array<{ id: number; tag: string }>;
}

interface ShareData {
  id: string;
  type: string;
  group: {
    id: number;
    name: string;
    description: string | null;
    items: ShareItem[];
  };
  owner: {
    name: string | null;
    email: string;
  };
}

interface AccessResult {
  canView: boolean;
  reason?: string;
  needsLogin?: boolean;
  needsAcceptance?: boolean;
  share?: ShareData;
}

export default function ShareViewPage() {
  const t = useTranslations('shareView');
  const tCommon = useTranslations('common');

  const params = useParams();
  const router = useRouter();
  const shareId = params.shareId as string;

  const [loading, setLoading] = useState(true);
  const [accessResult, setAccessResult] = useState<AccessResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchShareContent = async () => {
      try {
        const response = await fetch(`/api/shares/${shareId}/content`);
        const data = await response.json();
        setAccessResult(data);
      } catch (error) {
        console.error('Error fetching share:', error);
        setAccessResult({
          canView: false,
          reason: t('defaultDeniedReason'),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchShareContent();
  }, [shareId, t]);

  const handleCopyValue = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      toast.success(tCommon('copiedToClipboard'));
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error(tCommon('copyFailed'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-r-transparent"></div>
          <div className="text-cyan-600 font-mono text-sm animate-pulse">
            {t('loading')}
          </div>
        </div>
      </div>
    );
  }

  // Handle access denied cases
  if (!accessResult?.canView) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-background/90 border/50 text-foreground">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-rose-400" />
            </div>
            <CardTitle className="text-rose-400 font-mono">
              {t('accessDenied')}
            </CardTitle>
            <CardDescription className="text-cyan-600/70 font-mono text-sm">
              {accessResult?.reason || t('defaultDeniedReason')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {accessResult?.needsLogin && (
              <Button
                onClick={() =>
                  router.push(`/auth/signin?callbackUrl=/share/${shareId}`)
                }
                className="w-full bg-cyan-950/50 text-primary border border/50 hover:bg-cyan-900/50 font-mono"
              >
                <LogIn className="mr-2 h-4 w-4" />
                {t('loginToView')}
              </Button>
            )}
            {accessResult?.needsAcceptance && (
              <Button
                onClick={() => router.push(`/share/${shareId}/accept`)}
                className="w-full bg-emerald-950/50 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/50 font-mono"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {t('acceptInvitation')}
              </Button>
            )}
            <Link href="/">
              <Button
                variant="outline"
                className="w-full bg-transparent text-cyan-600 border/50 hover:bg-card/50 font-mono"
              >
                {tCommon('returnHome')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { share } = accessResult;
  if (!share) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Read-only Alert */}
        <Alert className="mb-6 bg-cyan-950/30 border-cyan-500/50 text-primary">
          <Info className="h-4 w-4" />
          <AlertDescription className="font-mono text-sm">
            {t('readOnlyAlert')}
          </AlertDescription>
        </Alert>

        {/* Share Header */}
        <Card className="mb-6 bg-background/90 border/50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-950/50 border border/50">
                  <Share2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 font-mono">
                    {share.group.name}
                  </CardTitle>
                  <CardDescription className="text-cyan-600/70 font-mono text-sm">
                    {share.group.description || tCommon('noDescription')}
                  </CardDescription>
                </div>
              </div>
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
            </div>
            <div className="mt-4 text-cyan-600/70 font-mono text-xs">
              {t('sharedBy', { name: share.owner.name || share.owner.email })}
            </div>
          </CardHeader>
        </Card>

        {/* Items Table */}
        <Card className="bg-background/90 border/50">
          <CardHeader>
            <CardTitle className="text-primary font-mono text-lg">
              {t('itemsTitle', { count: share.group.items.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {share.group.items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-cyan-600/70 font-mono text-sm">
                  {t('noItemsInGroup')}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border/50 hover:bg-transparent">
                      <TableHead className="text-foreground0 font-mono text-xs uppercase">
                        {t('columnKey')}
                      </TableHead>
                      <TableHead className="text-foreground0 font-mono text-xs uppercase">
                        {t('columnValue')}
                      </TableHead>
                      <TableHead className="text-foreground0 font-mono text-xs uppercase">
                        {t('columnTags')}
                      </TableHead>
                      <TableHead className="text-foreground0 font-mono text-xs uppercase w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {share.group.items.map((item) => (
                      <TableRow
                        key={item.id}
                        className="border/30 hover:bg-cyan-950/20 transition-colors"
                      >
                        <TableCell className="font-mono text-foreground font-medium">
                          {item.key}
                        </TableCell>
                        <TableCell className="font-mono text-primary text-sm max-w-xs truncate">
                          {item.value}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((tag) => (
                              <Badge
                                key={tag.id}
                                variant="secondary"
                                className="bg-cyan-950/50 text-primary border border/50 font-mono text-xs"
                              >
                                {tag.tag}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCopyValue(item.key, item.value)
                            }
                            className="h-8 w-8 p-0 text-foreground0 hover:text-primary hover:bg-cyan-950/50"
                          >
                            {copiedKey === item.key ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
