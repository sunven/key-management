import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { decodeInvitationToken } from '@/lib/share-utils';

// POST reject an invitation (no login required)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> },
) {
  const { shareId } = await params;

  try {
    // Get the token from query params
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 },
      );
    }

    // Verify the token
    const decoded = decodeInvitationToken(token);
    if (!decoded || decoded.shareId !== shareId) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 400 },
      );
    }

    // Find the share
    const share = await prisma.share.findUnique({
      where: { id: shareId },
    });

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    if (share.type !== 'PRIVATE') {
      return NextResponse.json(
        { error: 'This share does not require rejection' },
        { status: 400 },
      );
    }

    // Find the invitation
    const invitation = await prisma.shareInvitation.findUnique({
      where: {
        shareId_email: {
          shareId,
          email: decoded.email,
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 },
      );
    }

    // Update invitation status to REJECTED
    await prisma.shareInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'REJECTED',
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rejecting invitation:', error);
    return NextResponse.json(
      { error: 'Failed to reject invitation' },
      { status: 500 },
    );
  }
}
