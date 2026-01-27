import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET Single User
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.profile.findUnique({
      where: { id },
      include: { assignedUnit: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      full_name: user.fullName,
      username: user.username,
      role: user.role,
      phone_number: user.phoneNumber,
      assigned_unit_id: user.assignedUnitId,
      created_at: user.createdAt
    });
  } catch (error: any) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// UPDATE User
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate required fields
    const { fullName, username, phoneNumber, role, unitId } = body;

    if (!fullName || !role) {
      return NextResponse.json({ error: 'Full name and role are required' }, { status: 400 });
    }

    // Check if username already exists (excluding current user)
    if (username) {
      const existingUser = await prisma.profile.findFirst({
        where: {
          username,
          id: { not: id } // Exclude current user from check
        }
      });

      if (existingUser) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
      }
    }

    // Update the user
    const updatedUser = await prisma.profile.update({
      where: { id },
      data: {
        fullName,
        username: username || null,
        phoneNumber: phoneNumber || null,
        role,
        assignedUnitId: unitId || null
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        full_name: updatedUser.fullName,
        username: updatedUser.username,
        role: updatedUser.role,
        phone_number: updatedUser.phoneNumber,
        assigned_unit_id: updatedUser.assignedUnitId,
        created_at: updatedUser.createdAt
      }
    });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE User
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if the user is trying to delete themselves
    if (id === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Check if there are any reports associated with this user
    const reportCount = await prisma.report.count({
      where: { userId: id }
    });

    if (reportCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete user: there are reports associated with this user.'
      }, { status: 400 });
    }

    // Delete the user
    await prisma.profile.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}