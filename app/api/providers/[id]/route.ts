import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { providers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const providerSchema = z.object({
  baseUrl: z.string().url('Invalid URL format').optional(),
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
});

// GET a specific provider
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
    const provider = await db.query.providers.findFirst({
      where: and(
        eq(providers.id, parseInt(id)),
        eq(providers.userId, parseInt(session.user.id))
      ),
      with: {
        tokens: true,
      },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json(provider);
  } catch (error) {
    console.error('Error fetching provider:', error);
    return NextResponse.json({ error: 'Failed to fetch provider' }, { status: 500 });
  }
}

// PUT update a provider
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
    const validatedData = providerSchema.parse(body);

    // Verify ownership
    const existing = await db.query.providers.findFirst({
      where: and(
        eq(providers.id, parseInt(id)),
        eq(providers.userId, parseInt(session.user.id))
      ),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const [updatedProvider] = await db
      .update(providers)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(providers.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedProvider);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error updating provider:', error);
    return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 });
  }
}

// DELETE a provider
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
    const existing = await db.query.providers.findFirst({
      where: and(
        eq(providers.id, parseInt(id)),
        eq(providers.userId, parseInt(session.user.id))
      ),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    await db.delete(providers).where(eq(providers.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting provider:', error);
    return NextResponse.json({ error: 'Failed to delete provider' }, { status: 500 });
  }
}
