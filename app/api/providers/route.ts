import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { providers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const providerSchema = z.object({
  baseUrl: z.string().url('Invalid URL format'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

// GET all providers for the authenticated user
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userProviders = await db.query.providers.findMany({
      where: eq(providers.userId, parseInt(session.user.id)),
      orderBy: (providers, { desc }) => [desc(providers.createdAt)],
      with: {
        tokens: true,
      },
    });

    return NextResponse.json(userProviders);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
  }
}

// POST create a new provider
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = providerSchema.parse(body);

    const [newProvider] = await db
      .insert(providers)
      .values({
        ...validatedData,
        userId: parseInt(session.user.id),
      })
      .returning();

    return NextResponse.json(newProvider, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating provider:', error);
    return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 });
  }
}
