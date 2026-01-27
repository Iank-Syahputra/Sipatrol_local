import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

    // Build Filter Conditions
    const whereClause: Prisma.ProfileWhereInput = {
      AND: [
        // Search Logic (Name or Username)
        search ? {
          OR: [
            { fullName: { contains: search } }, // Remove mode: 'insensitive' if using MySQL (it's default)
            { username: { contains: search } }
          ]
        } : {},
        // Unit Filter Logic
        unitsParam ? {
          assignedUnitId: { in: unitsParam.split(',') }
        } : {}
      ]
    };

    // Parallel Fetching: Users, Total Count, and All Units (for dropdown)
    const [users, totalCount, allUnits] = await Promise.all([
      prisma.profile.findMany({
        where: whereClause,
        include: { assignedUnit: true }, // Include Unit Name
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.profile.count({ where: whereClause }),
      prisma.unit.findMany({ orderBy: { name: 'asc' } })
    ]);

    // Construct Response
    return NextResponse.json({
      users: users.map(user => ({
        id: user.id,
        full_name: user.fullName, // Map to frontend expectation
        username: user.username,
        role: user.role,
        phone_number: user.phoneNumber,
        created_at: user.createdAt,
        email: user.username, // Fallback if no email field
        units: user.assignedUnit ? { name: user.assignedUnit.name } : null
      })),
      units: allUnits, // Send all units for the filter dropdown
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}