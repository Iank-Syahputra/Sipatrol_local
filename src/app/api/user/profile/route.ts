import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile from the database
    const profile = await prisma.profile.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
        assignedUnit: {
          select: {
            name: true
          }
        }
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Return profile data with consistent field names
    return NextResponse.json({
      id: profile.id,
      full_name: profile.fullName, // Use the Prisma field name (fullName) which maps to full_name in DB
      username: profile.username,
      phone_number: profile.phoneNumber, // Use the Prisma field name (phoneNumber) which maps to phone_number in DB
      role: profile.role,
      assigned_unit_id: profile.assignedUnitId, // Use the Prisma field name (assignedUnitId) which maps to assigned_unit_id in DB
      assignedUnit: profile.assignedUnit
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone_number } = await request.json();

    // Update phone number in the database
    const updatedProfile = await prisma.profile.update({
      where: {
        id: session.user.id,
      },
      data: {
        phoneNumber: phone_number || null, // Use the Prisma field name (phoneNumber) which maps to phone_number in DB
      },
      include: {
        assignedUnit: {
          select: {
            name: true
          }
        }
      },
    });

    // Return profile data with consistent field names
    return NextResponse.json({
      id: updatedProfile.id,
      full_name: updatedProfile.fullName, // Use the Prisma field name (fullName) which maps to full_name in DB
      username: updatedProfile.username,
      phone_number: updatedProfile.phoneNumber, // Use the Prisma field name (phoneNumber) which maps to phone_number in DB
      role: updatedProfile.role,
      assigned_unit_id: updatedProfile.assignedUnitId, // Use the Prisma field name (assignedUnitId) which maps to assigned_unit_id in DB
      assignedUnit: updatedProfile.assignedUnit
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}