import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { prisma } from '@/lib/db/prisma';

// DELETE revoke a share
export const DELETE = withAuth<{ shareId: string }>(
  async (_request, { params, session }) => {
    try {
      const { shareId } = await params;
      const userId = session.user.id;

      // Find the share and verify ownership
      const share = await prisma.share.findUnique({
        where: {
          id: shareId,
        },
      });

      if (!share) {
        return NextResponse.json({ error: 'Share not found' }, { status: 404 });
      }

      if (share.userId !== userId) {
        return NextResponse.json({ error: 'Share not found' }, { status: 404 });
      }

      // Delete the share (invitations will be cascade deleted)
      await prisma.share.delete({
        where: {
          id: shareId,
        },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting share:', error);
      return NextResponse.json(
        { error: 'Failed to delete share' },
        { status: 500 },
      );
    }
  },
);

// GET a single share (for management purposes)
export const GET = withAuth<{ shareId: string }>(
  async (_request, { params, session }) => {
    try {
      const { shareId } = await params;
      const userId = session.user.id;

      const share = await prisma.share.findUnique({
        where: {
          id: shareId,
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
      });

      if (!share) {
        return NextResponse.json({ error: 'Share not found' }, { status: 404 });
      }

      if (share.userId !== userId) {
        return NextResponse.json({ error: 'Share not found' }, { status: 404 });
      }

      return NextResponse.json(share);
    } catch (error) {
      console.error('Error fetching share:', error);
      return NextResponse.json(
        { error: 'Failed to fetch share' },
        { status: 500 },
      );
    }
  },
);
