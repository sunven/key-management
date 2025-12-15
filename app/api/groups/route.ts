import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { groupSchema } from '@/lib/schemas';
import { z } from 'zod';

// GET all groups for the authenticated user
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userGroups = await prisma.group.findMany({
      where: {
        userId: parseInt(session.user.id),
      },
      include: {
        items: {
          include: {
            tags: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(userGroups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

// POST create a new group
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = groupSchema.parse(body);

    const newGroup = await prisma.group.create({
      data: {
        ...validatedData,
        userId: parseInt(session.user.id),
      },
    });

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
