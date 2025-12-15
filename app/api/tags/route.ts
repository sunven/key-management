import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

// GET all unique tags for the authenticated user (for autocomplete)
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = parseInt(session.user.id);

    // Get all unique tags from user's groups
    const tags = await prisma.itemTag.findMany({
      where: {
        item: {
          group: {
            userId,
          },
        },
      },
      select: {
        tag: true,
      },
      distinct: ['tag'],
      orderBy: {
        tag: 'asc',
      },
    });

    return NextResponse.json(tags.map((t) => t.tag));
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}
