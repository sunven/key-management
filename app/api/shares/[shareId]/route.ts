import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

// DELETE revoke a share
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { shareId } = await params;
    const userId = parseInt(session.user.id);

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
    return NextResponse.json({ error: 'Failed to delete share' }, { status: 500 });
  }
}

// GET a single share (for management purposes)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { shareId } = await params;
    const userId = parseInt(session.user.id);

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
    return NextResponse.json({ error: 'Failed to fetch share' }, { status: 500 });
  }
}
