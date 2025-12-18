import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { prisma } from '@/lib/db/prisma';
import { groupSchema } from '@/lib/schemas';

// GET all groups for the authenticated user
export const GET = withAuth(async (_request, { session }) => {
  try {
    const userGroups = await prisma.group.findMany({
      where: {
        userId: session.user.id,
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
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 },
    );
  }
});

// POST create a new group
export const POST = withAuth(async (request: NextRequest, { session }) => {
  try {
    const body = await request.json();
    const validatedData = groupSchema.parse(body);

    const newGroup = await prisma.group.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
    });

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 },
    );
  }
});
