import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { decodeInvitationToken } from '@/lib/share-utils';

// POST accept an invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const session = await auth();
  const { shareId } = await params;

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Login required' }, { status: 401 });
  }

  try {
    // Get the token from query params
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    // If token is provided, verify it matches the user's email
    if (token) {
      const decoded = decodeInvitationToken(token);
      if (!decoded || decoded.shareId !== shareId) {
        return NextResponse.json({ error: 'Invalid invitation token' }, { status: 400 });
      }
      if (decoded.email !== session.user.email) {
        return NextResponse.json(
          { error: 'This invitation was sent to a different email address. Please login with the correct account.' },
          { status: 403 }
        );
      }
    }

    // Find the share
    const share = await prisma.share.findUnique({
      where: { id: shareId },
    });

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    if (share.type !== 'PRIVATE') {
      return NextResponse.json({ error: 'This share does not require acceptance' }, { status: 400 });
    }

    // Find the invitation
    const invitation = await prisma.shareInvitation.findUnique({
      where: {
        shareId_email: {
          shareId,
          email: session.user.email,
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'You have not been invited to this share' }, { status: 403 });
    }

    // Update invitation status to ACCEPTED
    await prisma.shareInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}
