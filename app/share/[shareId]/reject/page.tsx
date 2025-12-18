'use client';

import { AlertTriangle, Home, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function RejectInvitationContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const _router = useRouter();
  const shareId = params.shareId as string;
  const token = searchParams.get('token');
  const success = searchParams.get('success');

  const [loading, setLoading] = useState(!success);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>(
    success ? 'success' : 'processing',
  );
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // If already marked as success (redirected from accept page), don't process
    if (success) return;

    // Auto-reject if token is present
    const rejectInvitation = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/shares/${shareId}/reject?token=${encodeURIComponent(token)}`,
          { method: 'POST' },
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to reject invitation');
        }

        setStatus('success');
        toast.success('Invitation rejected');
      } catch (error) {
        console.error('Error rejecting invitation:', error);
        setStatus('error');
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Failed to reject invitation',
        );
      } finally {
        setLoading(false);
      }
    };

    rejectInvitation();
  }, [shareId, token, success]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-background/90 border/50 text-foreground">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-center mb-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-r-transparent" />
            </div>
            <CardTitle className="text-primary font-mono">
              PROCESSING...
            </CardTitle>
            <CardDescription className="text-cyan-600/70 font-mono text-sm">
              Processing your response to the invitation
            </CardDescription>
          </CardHeader>
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
                <Home className="mr-2 h-4 w-4" />
                RETURN_HOME
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-background/90 border/50 text-foreground">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-rose-400" />
          </div>
          <CardTitle className="text-rose-400 font-mono">
            INVITATION_REJECTED
          </CardTitle>
          <CardDescription className="text-cyan-600/70 font-mono text-sm">
            You have rejected this share invitation. You will not have access to
            the shared content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/">
            <Button className="w-full bg-cyan-950/50 text-primary border border/50 hover:bg-cyan-900/50 font-mono">
              <Home className="mr-2 h-4 w-4" />
              RETURN_HOME
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RejectInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-r-transparent" />
        </div>
      }
    >
      <RejectInvitationContent />
    </Suspense>
  );
}
