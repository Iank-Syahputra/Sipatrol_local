import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated using NextAuth
    const session = await getServerSession();

    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all units using Prisma
    const units = await prisma.unit.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return Response.json({ units });
  } catch (error) {
    console.error('Unexpected error in units API:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}