import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // Get the session
  const session = await getServerSession(authOptions);

  // CRITICAL VALIDATION STEP: Check if session exists AND if session.user.id exists
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized: No User ID found" }, { status: 401 });
  }

  // ONLY after validation, proceed with Prisma
  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      full_name: true,
      username: true,
      role: true,
      assigned_unit_id: true,
      phone_number: true
    }
  });

  // Handle "Profile Not Found"
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Return JSON success
  return NextResponse.json(profile);
}