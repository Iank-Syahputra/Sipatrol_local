import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Auth Check (Must be Admin)
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch Stats (Parallel execution for performance)
    const [totalUsers, totalReports, totalUnits, recentReports] = await Promise.all([
      prisma.profile.count(),
      prisma.report.count(),
      prisma.unit.count(), // Count total units
      prisma.report.findMany({
        take: 5,
        orderBy: { capturedAt: 'desc' },
        select: {
          id: true,
          notes: true,
          capturedAt: true,
          latitude: true,
          longitude: true,
          imagePath: true, // Include the image path
          user: { select: { fullName: true } },
          unit: { select: { name: true } }
        }
      })
    ]);

    // 3. Return Data
    return NextResponse.json({
      totalUsers,
      totalReports,
      totalUnits,
      recentReports
    });

  } catch (error) {
    console.error("[API_ADMIN_STATS_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}