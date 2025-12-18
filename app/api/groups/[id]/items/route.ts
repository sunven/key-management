import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/with-auth';
import { prisma } from '@/lib/db/prisma';
import { groupItemSchema } from '@/lib/schemas';

// GET all items for a group (with optional tag filtering)
export const GET = withAuth<{ id: string }>(
  async (request: NextRequest, { params, session }) => {
    const { id } = await params;

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

      // Get tag filter from query params
      const url = new URL(request.url);
      const tagsParam = url.searchParams.get('tags');
      const filterTags = tagsParam ? tagsParam.split(',').filter(Boolean) : [];

      // Build the query
      const items = await prisma.groupItem.findMany({
        where: {
          groupId: parseInt(id, 10),
          ...(filterTags.length > 0 && {
            tags: {
              some: {
                tag: { in: filterTags },
              },
            },
          }),
        },
        include: {
          tags: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json(items);
    } catch (error) {
      console.error('Error fetching items:', error);
      return NextResponse.json(
        { error: 'Failed to fetch items' },
        { status: 500 },
      );
    }
  },
);

// POST create a new item in the group
export const POST = withAuth<{ id: string }>(
  async (request: NextRequest, { params, session }) => {
    const { id } = await params;

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

      const body = await request.json();
      const validatedData = groupItemSchema.parse(body);

      // Check if key already exists in this group
      const existingItem = await prisma.groupItem.findUnique({
        where: {
          groupId_key: {
            groupId: parseInt(id, 10),
            key: validatedData.key,
          },
        },
      });

      if (existingItem) {
        return NextResponse.json(
          { error: 'Key already exists in this group' },
          { status: 400 },
        );
      }

      // Create item with tags
      const { tags, ...itemData } = validatedData;
      const newItem = await prisma.groupItem.create({
        data: {
          ...itemData,
          groupId: parseInt(id, 10),
          tags: tags?.length
            ? {
                create: tags.map((tag) => ({ tag })),
              }
            : undefined,
        },
        include: {
          tags: true,
        },
      });

      return NextResponse.json(newItem, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.issues }, { status: 400 });
      }
      console.error('Error creating item:', error);
      return NextResponse.json(
        { error: 'Failed to create item' },
        { status: 500 },
      );
    }
  },
);
