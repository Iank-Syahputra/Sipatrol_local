import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated using NextAuth
    const session = await getServerSession();

    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id as string;

    const { id, full_name, role, assigned_unit_id } = await request.json();

    // Verify that the user ID matches the authenticated user
    if (id !== userId) {
      return Response.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Insert the profile into the database using Prisma
    const profile = await prisma.profile.create({
      data: {
        id,
        full_name,
        role,
        assigned_unit_id
      }
    });

    return Response.json({ success: true, data: profile });
  } catch (error) {
    console.error('Unexpected error in profile creation:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}