import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated using NextAuth
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id as string;

    // Fetch the user's profile to get assigned unit using Prisma
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: { assignedUnitId: true }
    });

    if (!profile || !profile.assignedUnitId) {
      return Response.json({ assignedUnit: null });
    }

    // Fetch the unit details using Prisma
    const unit = await prisma.unit.findUnique({
      where: { id: profile.assignedUnitId }
    });

    if (!unit) {
      return Response.json({ assignedUnit: null });
    }

    return Response.json({ assignedUnit: unit });
  } catch (error) {
    console.error('Unexpected error in unit API:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}