import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { groupItemUpdateSchema } from '@/lib/schemas';

// GET a specific item
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const { id, itemId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // First verify the group belongs to the user
    const group = await prisma.group.findFirst({
      where: {
        id: parseInt(id, 10),
        userId: session.user.id,
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const item = await prisma.groupItem.findFirst({
      where: {
        id: parseInt(itemId, 10),
        groupId: parseInt(id, 10),
      },
      include: {
        tags: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 },
    );
  }
}

// PUT update an item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const { id, itemId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // First verify the group belongs to the user
    const group = await prisma.group.findFirst({
      where: {
        id: parseInt(id, 10),
        userId: session.user.id,
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Verify item exists
    const existingItem = await prisma.groupItem.findFirst({
      where: {
        id: parseInt(itemId, 10),
        groupId: parseInt(id, 10),
      },
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = groupItemUpdateSchema.parse(body);

    // Check if new key already exists (excluding current item)
    if (validatedData.key && validatedData.key !== existingItem.key) {
      const duplicateKey = await prisma.groupItem.findFirst({
        where: {
          groupId: parseInt(id, 10),
          key: validatedData.key,
          id: { not: parseInt(itemId, 10) },
        },
      });

      if (duplicateKey) {
        return NextResponse.json(
          { error: 'Key already exists in this group' },
          { status: 400 },
        );
      }
    }

    // Update item and tags in a transaction
    const { tags, ...itemData } = validatedData;

    const updatedItem = await prisma.$transaction(async (tx) => {
      // Update item data
      await tx.groupItem.update({
        where: { id: parseInt(itemId, 10) },
        data: {
          ...itemData,
          updatedAt: new Date(),
        },
      });

      // If tags are provided, replace all existing tags
      if (tags !== undefined) {
        // Delete existing tags
        await tx.itemTag.deleteMany({
          where: { itemId: parseInt(itemId, 10) },
        });

        // Create new tags
        if (tags.length > 0) {
          await tx.itemTag.createMany({
            data: tags.map((tag) => ({
              itemId: parseInt(itemId, 10),
              tag,
            })),
          });
        }
      }

      // Return updated item with tags
      return tx.groupItem.findUnique({
        where: { id: parseInt(itemId, 10) },
        include: { tags: true },
      });
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 },
    );
  }
}

// DELETE an item
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const { id, itemId } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // First verify the group belongs to the user
    const group = await prisma.group.findFirst({
      where: {
        id: parseInt(id, 10),
        userId: session.user.id,
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Delete item (tags will be cascade deleted)
    const deletedItem = await prisma.groupItem.deleteMany({
      where: {
        id: parseInt(itemId, 10),
        groupId: parseInt(id, 10),
      },
    });

    if (deletedItem.count === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 },
    );
  }
}
