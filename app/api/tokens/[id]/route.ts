import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { tokens, providers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const tokenSchema = z.object({
  token: z.string().min(1, 'Token is required').optional(),
  providerId: z.number().int().positive().optional(),
});

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
    const token = await db.query.tokens.findFirst({
      where: eq(tokens.id, parseInt(id)),
      with: {
        provider: true,
      },
    });

    if (!token || token.provider.userId !== parseInt(session.user.id)) {
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
    const validatedData = tokenSchema.parse(body);

    // Verify ownership
    const existing = await db.query.tokens.findFirst({
      where: eq(tokens.id, parseInt(id)),
      with: {
        provider: true,
      },
    });

    if (!existing || existing.provider.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // If updating providerId, verify the new provider belongs to the user
    if (validatedData.providerId) {
      const provider = await db.query.providers.findFirst({
        where: and(
          eq(providers.id, validatedData.providerId),
          eq(providers.userId, parseInt(session.user.id))
        ),
      });

      if (!provider) {
        return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
      }
    }

    const [updatedToken] = await db
      .update(tokens)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(tokens.id, parseInt(id)))
      .returning();

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
    // Verify ownership
    const existing = await db.query.tokens.findFirst({
      where: eq(tokens.id, parseInt(id)),
      with: {
        provider: true,
      },
    });

    if (!existing || existing.provider.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    await db.delete(tokens).where(eq(tokens.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting token:', error);
    return NextResponse.json({ error: 'Failed to delete token' }, { status: 500 });
  }
}
