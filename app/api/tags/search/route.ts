import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// GET items across all groups filtered by tags
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const url = new URL(request.url);
    const tagsParam = url.searchParams.get('tags');

    if (!tagsParam) {
      return NextResponse.json(
        { error: 'Tags parameter is required' },
        { status: 400 },
      );
    }

    const filterTags = tagsParam.split(',').filter(Boolean);

    if (filterTags.length === 0) {
      return NextResponse.json(
        { error: 'At least one tag is required' },
        { status: 400 },
      );
    }

    // Find all items with matching tags across all user's groups
    const items = await prisma.groupItem.findMany({
      where: {
        group: {
          userId,
        },
        tags: {
          some: {
            tag: { in: filterTags },
          },
        },
      },
      include: {
        tags: true,
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ group: { name: 'asc' } }, { key: 'asc' }],
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error searching items by tags:', error);
    return NextResponse.json(
      { error: 'Failed to search items' },
      { status: 500 },
    );
  }
}
