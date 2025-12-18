'use client';

import { AlertTriangle, CheckCircle, LogIn, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AcceptInvitationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const shareId = params.shareId as string;
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [status, setStatus] = useState<
    'pending' | 'success' | 'error' | 'needsLogin'
  >('pending');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check if user is logged in by making a simple request
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/shares');
        if (response.status === 401) {
          setStatus('needsLogin');
        }
      } catch {
        // Ignore errors
      }
    };
    checkAuth();
  }, []);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const url = token
        ? `/api/shares/${shareId}/accept?token=${encodeURIComponent(token)}`
        : `/api/shares/${shareId}/accept`;

      const response = await fetch(url, { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      setStatus('success');
      toast.success('Invitation accepted!');

      // Redirect to share view after a short delay
      setTimeout(() => {
        router.push(`/share/${shareId}`);
      }, 2000);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to accept invitation',
      );
      toast.error(
        error instanceof Error ? error.message : 'Failed to accept invitation',
      );
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      if (!token) {
        throw new Error('Invalid invitation link');
      }

      const response = await fetch(
        `/api/shares/${shareId}/reject?token=${encodeURIComponent(token)}`,
        { method: 'POST' },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reject invitation');
      }

      router.push(`/share/${shareId}/reject?success=true`);
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to reject invitation',
      );
    } finally {
      setLoading(false);
    }
  };

  if (status === 'needsLogin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-background/90 border/50 text-foreground">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-center mb-4">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-primary font-mono">
              LOGIN_REQUIRED
            </CardTitle>
            <CardDescription className="text-cyan-600/70 font-mono text-sm">
              Please login to accept this invitation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() =>
                router.push(
                  `/auth/signin?callbackUrl=/share/${shareId}/accept${token ? `?token=${encodeURIComponent(token)}` : ''}`,
                )
              }
              className="w-full bg-cyan-950/50 text-primary border border/50 hover:bg-cyan-900/50 font-mono"
            >
              <LogIn className="mr-2 h-4 w-4" />
              LOGIN_TO_CONTINUE
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-background/90 border/50 text-foreground">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <CardTitle className="text-emerald-400 font-mono">
              INVITATION_ACCEPTED
            </CardTitle>
            <CardDescription className="text-cyan-600/70 font-mono text-sm">
              You now have access to this shared group. Redirecting...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/share/${shareId}`}>
              <Button className="w-full bg-cyan-950/50 text-primary border border/50 hover:bg-cyan-900/50 font-mono">
                VIEW_SHARE_NOW
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-background/90 border/50 text-foreground">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-rose-400" />
            </div>
            <CardTitle className="text-rose-400 font-mono">ERROR</CardTitle>
            <CardDescription className="text-cyan-600/70 font-mono text-sm">
              {errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full bg-cyan-950/50 text-primary border border/50 hover:bg-cyan-900/50 font-mono">
                RETURN_HOME
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pending state - show accept/reject buttons
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-background/90 border/50 text-foreground">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-primary font-mono">
            SHARE_INVITATION
          </CardTitle>
          <CardDescription className="text-cyan-600/70 font-mono text-sm">
            You have been invited to view a shared group. Would you like to
            accept this invitation?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full bg-emerald-950/50 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/50 font-mono"
          >
            {accepting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-r-transparent mr-2" />
                PROCESSING...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                ACCEPT_INVITATION
              </>
            )}
          </Button>
          <Button
            onClick={handleReject}
            disabled={loading || accepting}
            variant="outline"
            className="w-full bg-transparent text-rose-400 border-rose-800/50 hover:bg-rose-950/30 font-mono"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-500 border-r-transparent mr-2" />
                PROCESSING...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                REJECT_INVITATION
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
