import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated using NextAuth
    const session = await getServerSession();

    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id as string;

    // Fetch the user's profile using Prisma
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: {
        id: true,
        full_name: true,
        role: true,
        assigned_unit_id: true,
        phone_number: true,
        username: true
      }
    });

    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    return Response.json(profile);
  } catch (error) {
    console.error('Unexpected error in profile API:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}