import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { prisma } from '@/lib/db/prisma';
import { sendInvitationEmail } from '@/lib/email';
import {
  createInvitationToken,
  getInvitationAcceptUrl,
  getInvitationRejectUrl,
} from '@/lib/share-utils';

// POST resend invitation email
export const POST = withAuth<{ shareId: string; email: string }>(
  async (_request, { params, session }) => {
    if (!session.user.email || !session.user.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { shareId, email: encodedEmail } = await params;
      const email = decodeURIComponent(encodedEmail);
      const userId = session.user.id;

      // Find the share and verify ownership
      const share = await prisma.share.findUnique({
        where: { id: shareId },
        include: {
          group: {
            select: { name: true },
          },
        },
      });

      if (!share) {
        return NextResponse.json({ error: 'Share not found' }, { status: 404 });
      }

      if (share.userId !== userId) {
        return NextResponse.json({ error: 'Share not found' }, { status: 404 });
      }

      if (share.type !== 'PRIVATE') {
        return NextResponse.json(
          { error: 'Cannot resend invitation for public share' },
          { status: 400 },
        );
      }

      // Find the invitation
      const invitation = await prisma.shareInvitation.findUnique({
        where: {
          shareId_email: {
            shareId,
            email,
          },
        },
      });

      if (!invitation) {
        return NextResponse.json(
          { error: 'Invitation not found' },
          { status: 404 },
        );
      }

      if (invitation.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Can only resend pending invitations' },
          { status: 400 },
        );
      }

      // Send the invitation email
      const token = createInvitationToken(email, shareId);
      const result = await sendInvitationEmail(email, {
        inviterName: session.user.name || 'A user',
        inviterEmail: session.user.email,
        groupName: share.group.name,
        acceptUrl: getInvitationAcceptUrl(shareId, token),
        rejectUrl: getInvitationRejectUrl(shareId, token),
      });

      if (!result.success) {
        return NextResponse.json(
          { error: `Failed to send email: ${result.error}` },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error resending invitation:', error);
      return NextResponse.json(
        { error: 'Failed to resend invitation' },
        { status: 500 },
      );
    }
  },
);
