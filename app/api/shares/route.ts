import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { prisma } from '@/lib/db/prisma';
import { sendInvitationEmail } from '@/lib/email';
import { shareSchema } from '@/lib/schemas';
import {
  createInvitationToken,
  getInvitationAcceptUrl,
  getInvitationRejectUrl,
  getShareUrl,
} from '@/lib/share-utils';

// GET all shares for the authenticated user
export const GET = withAuth(async (_request, { session }) => {
  try {
    const userShares = await prisma.share.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        invitations: {
          select: {
            id: true,
            email: true,
            status: true,
            invitedAt: true,
            respondedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Add share URL to each share
    const sharesWithUrls = userShares.map((share) => ({
      ...share,
      shareUrl: getShareUrl(share.id),
    }));

    return NextResponse.json(sharesWithUrls);
  } catch (error) {
    console.error('Error fetching shares:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shares' },
      { status: 500 },
    );
  }
});

// POST create a new share
export const POST = withAuth(async (request: NextRequest, { session }) => {
  if (!session.user.email || !session.user.name) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = shareSchema.parse(body);
    const userId = session.user.id;

    // Verify group ownership
    const group = await prisma.group.findFirst({
      where: {
        id: validatedData.groupId,
        userId,
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if group already has a share
    const existingShare = await prisma.share.findUnique({
      where: {
        groupId: validatedData.groupId,
      },
    });

    if (existingShare) {
      return NextResponse.json(
        {
          error:
            'This group already has an active share. Please revoke it first.',
        },
        { status: 400 },
      );
    }

    // Create the share
    const newShare = await prisma.share.create({
      data: {
        userId,
        groupId: validatedData.groupId,
        type: validatedData.type,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    // For PRIVATE shares, create invitations and send emails
    const invitations: { email: string; status: string }[] = [];

    if (
      validatedData.type === 'PRIVATE' &&
      validatedData.emails &&
      validatedData.emails.length > 0
    ) {
      for (const email of validatedData.emails) {
        // Create invitation record
        const invitation = await prisma.shareInvitation.create({
          data: {
            shareId: newShare.id,
            email,
          },
        });

        invitations.push({
          email: invitation.email,
          status: invitation.status,
        });

        // Send invitation email (async, don't wait)
        const token = createInvitationToken(email, newShare.id);
        sendInvitationEmail(email, {
          inviterName: session.user.name || 'A user',
          inviterEmail: session.user.email,
          groupName: group.name,
          acceptUrl: getInvitationAcceptUrl(newShare.id, token),
          rejectUrl: getInvitationRejectUrl(newShare.id, token),
        }).catch((err) => {
          console.error(`Failed to send invitation email to ${email}:`, err);
        });
      }
    }

    return NextResponse.json(
      {
        id: newShare.id,
        type: newShare.type,
        group: newShare.group,
        shareUrl: getShareUrl(newShare.id),
        invitations,
        createdAt: newShare.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating share:', error);
    return NextResponse.json(
      { error: 'Failed to create share' },
      { status: 500 },
    );
  }
});
