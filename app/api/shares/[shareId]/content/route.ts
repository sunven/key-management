import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

interface AccessResult {
  canView: boolean;
  reason?: string;
  needsLogin?: boolean;
  needsAcceptance?: boolean;
  share?: {
    id: string;
    type: string;
    group: {
      id: number;
      name: string;
      description: string | null;
      items: Array<{
        id: number;
        key: string;
        value: string;
        tags: Array<{ id: number; tag: string }>;
      }>;
    };
    owner: {
      name: string | null;
      email: string;
    };
  };
}

// GET share content (public or authorized access)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const session = await auth();
  const { shareId } = await params;

  try {
    // Find the share with full group data
    const share = await prisma.share.findUnique({
      where: {
        id: shareId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        group: {
          include: {
            items: {
              include: {
                tags: {
                  select: {
                    id: true,
                    tag: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
        },
      },
    });

    if (!share) {
      const result: AccessResult = {
        canView: false,
        reason: 'Share not found',
      };
      return NextResponse.json(result, { status: 404 });
    }

    // PUBLIC shares: anyone can access
    if (share.type === 'PUBLIC') {
      const result: AccessResult = {
        canView: true,
        share: {
          id: share.id,
          type: share.type,
          group: {
            id: share.group.id,
            name: share.group.name,
            description: share.group.description,
            items: share.group.items,
          },
          owner: {
            name: share.user.name,
            email: share.user.email,
          },
        },
      };
      return NextResponse.json(result);
    }

    // PRIVATE shares: need to verify access
    if (!session?.user?.email) {
      const result: AccessResult = {
        canView: false,
        reason: 'Login required to view this share',
        needsLogin: true,
      };
      return NextResponse.json(result, { status: 403 });
    }

    // Check if the user is the owner
    if (session.user.id && parseInt(session.user.id) === share.userId) {
      const result: AccessResult = {
        canView: true,
        share: {
          id: share.id,
          type: share.type,
          group: {
            id: share.group.id,
            name: share.group.name,
            description: share.group.description,
            items: share.group.items,
          },
          owner: {
            name: share.user.name,
            email: share.user.email,
          },
        },
      };
      return NextResponse.json(result);
    }

    // Check if user has been invited
    const invitation = await prisma.shareInvitation.findUnique({
      where: {
        shareId_email: {
          shareId,
          email: session.user.email,
        },
      },
    });

    if (!invitation) {
      const result: AccessResult = {
        canView: false,
        reason: 'You have not been invited to view this share',
      };
      return NextResponse.json(result, { status: 403 });
    }

    if (invitation.status === 'REJECTED') {
      const result: AccessResult = {
        canView: false,
        reason: 'You have rejected this invitation',
      };
      return NextResponse.json(result, { status: 403 });
    }

    if (invitation.status === 'PENDING') {
      const result: AccessResult = {
        canView: false,
        reason: 'Please accept the invitation first',
        needsAcceptance: true,
      };
      return NextResponse.json(result, { status: 403 });
    }

    // ACCEPTED - return the content
    const result: AccessResult = {
      canView: true,
      share: {
        id: share.id,
        type: share.type,
        group: {
          id: share.group.id,
          name: share.group.name,
          description: share.group.description,
          items: share.group.items,
        },
        owner: {
          name: share.user.name,
          email: share.user.email,
        },
      },
    };
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching share content:', error);
    return NextResponse.json({ error: 'Failed to fetch share content' }, { status: 500 });
  }
}
