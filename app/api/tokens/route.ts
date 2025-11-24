import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { tokens, providers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const tokenSchema = z.object({
  providerId: z.number().int().positive('Provider ID is required'),
  token: z.string().min(1, 'Token is required'),
});

// GET all tokens for the authenticated user
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all tokens for user's providers
    const userTokens = await db.query.tokens.findMany({
      with: {
        provider: true,
      },
    });

    // Filter tokens to only include those belonging to the user's providers
    const filteredTokens = userTokens.filter(
      (token) => token.provider.userId === parseInt(session.user.id)
    );

    return NextResponse.json(filteredTokens);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 });
  }
}

// POST create a new token
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = tokenSchema.parse(body);

    // Verify that the provider belongs to the user
    const provider = await db.query.providers.findFirst({
      where: and(
        eq(providers.id, validatedData.providerId),
        eq(providers.userId, parseInt(session.user.id))
      ),
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const [newToken] = await db
      .insert(tokens)
      .values(validatedData)
      .returning();

    return NextResponse.json(newToken, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating token:', error);
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
  }
}
