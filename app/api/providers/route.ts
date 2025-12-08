import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { providerSchema } from '@/lib/schemas';
import { z } from 'zod';

// GET all providers for the authenticated user
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userProviders = await prisma.provider.findMany({
      where: {
        userId: parseInt(session.user.id),
      },
      include: {
        tokens: true,
      },
      orderBy: {
        createdAt: 'desc',
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

    const newProvider = await prisma.provider.create({
      data: {
        ...validatedData,
        userId: parseInt(session.user.id),
      },
    });

    return NextResponse.json(newProvider, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error creating provider:', error);
    return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 });
  }
}
