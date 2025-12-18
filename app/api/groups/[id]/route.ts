import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { groupUpdateSchema } from '@/lib/schemas';

// GET a specific group
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const group = await prisma.group.findFirst({
      where: {
        id: parseInt(id, 10),
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            tags: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 },
    );
  }
}

// PUT update a group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = groupUpdateSchema.parse(body);

    // Verify ownership and update in one operation
    const updatedGroup = await prisma.group.updateMany({
      where: {
        id: parseInt(id, 10),
        userId: session.user.id,
      },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    });

    if (updatedGroup.count === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Fetch and return the updated group
    const group = await prisma.group.findUnique({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json(group);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error updating group:', error);
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 },
    );
  }
}

// DELETE a group
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Delete with ownership check in one operation
    const deletedGroup = await prisma.group.deleteMany({
      where: {
        id: parseInt(id, 10),
        userId: session.user.id,
      },
    });

    if (deletedGroup.count === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 },
    );
  }
}
