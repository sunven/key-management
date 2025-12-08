import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { tokenUpdateSchema } from '@/lib/schemas';
import { z } from 'zod';

// GET a specific token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = await prisma.token.findFirst({
      where: {
        id: parseInt(id),
        provider: {
          userId: parseInt(session.user.id),
        },
      },
      include: {
        provider: true,
      },
    });

    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    return NextResponse.json(token);
  } catch (error) {
    console.error('Error fetching token:', error);
    return NextResponse.json({ error: 'Failed to fetch token' }, { status: 500 });
  }
}

// PUT update a token
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = tokenUpdateSchema.parse(body);

    // Verify ownership
    const existing = await prisma.token.findFirst({
      where: {
        id: parseInt(id),
        provider: {
          userId: parseInt(session.user.id),
        },
      },
      include: {
        provider: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // If updating providerId, verify the new provider belongs to the user
    if (validatedData.providerId) {
      const provider = await prisma.provider.findFirst({
        where: {
          id: validatedData.providerId,
          userId: parseInt(session.user.id),
        },
      });

      if (!provider) {
        return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
      }
    }

    // Separate providerId from other fields
    const { providerId, ...updateData } = validatedData;

    const updatedToken = await prisma.token.update({
      where: { id: parseInt(id) },
      data: {
        ...updateData,
        ...(providerId && {
          provider: {
            connect: { id: providerId },
          },
        }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedToken);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error updating token:', error);
    return NextResponse.json({ error: 'Failed to update token' }, { status: 500 });
  }
}

// DELETE a token
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Delete with ownership check in one operation
    const deletedToken = await prisma.token.deleteMany({
      where: {
        id: parseInt(id),
        provider: {
          userId: parseInt(session.user.id),
        },
      },
    });

    if (deletedToken.count === 0) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting token:', error);
    return NextResponse.json({ error: 'Failed to delete token' }, { status: 500 });
  }
}
