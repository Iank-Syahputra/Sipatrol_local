import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

// GET: Search, Filter, and Pagination (Keep existing logic)
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || "";
    const unitsParam = searchParams.get('units');
    const page = parseInt(searchParams.get('page') || "1");
    const limit = parseInt(searchParams.get('limit') || "10");
    const skip = (page - 1) * limit;

    const whereClause: Prisma.ProfileWhereInput = {
      AND: [
        search ? {
          OR: [
            { fullName: { contains: search } },
            { username: { contains: search } }
          ]
        } : {},
        unitsParam ? {
          assignedUnitId: { in: unitsParam.split(',') }
        } : {}
      ]
    };

    const [users, totalCount, allUnits] = await Promise.all([
      prisma.profile.findMany({
        where: whereClause,
        include: { assignedUnit: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.profile.count({ where: whereClause }),
      prisma.unit.findMany({ orderBy: { name: 'asc' } })
    ]);

    return NextResponse.json({
      users: users.map(user => ({
        id: user.id,
        full_name: user.fullName,
        username: user.username,
        role: user.role,
        phone_number: user.phoneNumber,
        created_at: user.createdAt,
        email: user.username,
        units: user.assignedUnit ? { name: user.assignedUnit.name } : null
      })),
      units: allUnits,
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Create New User (Security Officer)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fullName, username, password, phoneNumber, unitId } = body;

    // 1. Basic Validation
    if (!fullName || !username || !password || !unitId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Check if username exists
    const existingUser = await prisma.profile.findFirst({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }

    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create User
    const newUser = await prisma.profile.create({
      data: {
        fullName,
        username,
        password: hashedPassword, // Store hashed password
        phoneNumber,
        role: 'security', // Default role for created users
        assignedUnitId: unitId
      }
    });

    return NextResponse.json({ message: "User created successfully", userId: newUser.id }, { status: 201 });

  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}