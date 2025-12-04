import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
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
    const userTokens = await prisma.token.findMany({
      where: {
        provider: {
          userId: parseInt(session.user.id),
        },
      },
      include: {
        provider: true,
      },
    });

    return NextResponse.json(userTokens);
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
    const provider = await prisma.provider.findFirst({
      where: {
        id: validatedData.providerId,
        userId: parseInt(session.user.id),
      },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const newToken = await prisma.token.create({
      data: validatedData,
    });

    return NextResponse.json(newToken, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating token:', error);
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
  }
}
