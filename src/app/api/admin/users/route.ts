import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id as string;

    // Check if the current user is an admin
    const currentUserProfile = await prisma.profile.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUserProfile || currentUserProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 10); // Maximum 10 rows per page
    const offset = (page - 1) * limit;

    // Parse Multi-Select Param
    const unitIds = searchParams.get('units')?.split(',').filter(Boolean) || [];

    // 1. Count Query
    let countQuery = prisma.profile.count({
      where: {
        ...(search && {
          OR: [
            { fullName: { contains: search } },
            { username: { contains: search } }
          ]
        }),
        ...(unitIds.length > 0 && { assignedUnitId: { in: unitIds } })
      }
    });

    const totalUsers = await countQuery;

    // Calculate total pages
    const totalPages = Math.ceil(totalUsers / limit);

    // 2. Fetch Users with assigned units
    let users = await prisma.profile.findMany({
      where: {
        ...(search && {
          OR: [
            { fullName: { contains: search } },
            { username: { contains: search } }
          ]
        }),
        ...(unitIds.length > 0 && { assignedUnitId: { in: unitIds } })
      },
      include: {
        assignedUnit: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit
    });

    // 4. Fetch Units for Dropdown
    const units = await prisma.unit.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      users,
      units,
      totalPages,
      totalCount: totalUsers
    });

  } catch (error: any) {
    console.error('Error in GET users API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id as string;

    // Check if the current user is an admin
    const currentUserProfile = await prisma.profile.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUserProfile || currentUserProfile.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { fullName, username, password, phoneNumber, unitId } = body;

    // 1. VALIDATION
    if (!fullName || !username || !password || !unitId) {
      return Response.json({ error: 'Full name, username, password, and unit ID are required' }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return Response.json({ error: 'Password minimal 8 karakter!' }, { status: 400 });
    }

    // 2. PREPARE DATA
    // Convert empty string to null explicitly
    const validPhone = (!phoneNumber || phoneNumber.trim() === "") ? null : phoneNumber;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. CREATE USER IN DATABASE
    const newUser = await prisma.profile.create({
      data: {
        username: username,
        password: hashedPassword,
        fullName: fullName,
        role: 'security',
        assignedUnitId: unitId,
        phoneNumber: validPhone, // This will be null if empty
      }
    });

    return Response.json({ success: true, userId: newUser.id });
  } catch (error) {
    console.error("General API Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id as string;

    // Check if the current user is an admin
    const currentUserProfile = await prisma.profile.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUserProfile || currentUserProfile.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id, full_name, username, role, phone_number, assigned_unit_id } = await request.json();

    // Validate required fields
    if (!id || !full_name || !role) {
      return Response.json({ error: 'ID, full_name, and role are required' }, { status: 400 });
    }

    // Update the user
    const user = await prisma.profile.update({
      where: { id },
      data: {
        fullName: full_name,
        username: username || null,
        role,
        phoneNumber: phone_number || null,
        assignedUnitId: assigned_unit_id || null
      }
    });

    return Response.json({ user });
  } catch (error) {
    console.error('Unexpected error in users API (PUT):', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = session.user.id as string;

    // Check if the current user is an admin
    const currentUserProfile = await prisma.profile.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUserProfile || currentUserProfile.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Parse the request body to get the user ID
    const { id } = await request.json();

    // Validate required field
    if (!id) {
      return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if the user is trying to delete themselves
    if (id === currentUserId) {
      return Response.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Check if there are any reports associated with this user
    const reportCount = await prisma.report.count({
      where: { userId: id }
    });

    if (reportCount > 0) {
      return Response.json({
        error: 'Cannot delete user: there are reports associated with this user.'
      }, { status: 400 });
    }

    // Delete the user from profiles table
    await prisma.profile.delete({
      where: { id }
    });

    return Response.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Unexpected error in users API (DELETE):', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}