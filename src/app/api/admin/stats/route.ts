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
    const [totalUsers, totalReports, recentReports] = await Promise.all([
      prisma.profile.count(),
      prisma.report.count(),
      prisma.report.findMany({
        take: 5,
        orderBy: { capturedAt: 'desc' },
        include: {
          user: { select: { fullName: true } },
          unit: { select: { name: true } }
        }
      })
    ]);

    // 3. Calculate "Reports Today" manually to avoid timezone complexity for now
    // (Or use a simple JS date filter if needed, but count is safer)
    const startOfDay = new Date();
    startOfDay.setHours(0,0,0,0);
    
    const reportsToday = await prisma.report.count({
        where: {
            capturedAt: {
                gte: startOfDay
            }
        }
    });

    // 4. Return Data
    return NextResponse.json({
      totalUsers,
      totalReports,
      reportsToday,
      recentReports
    });

  } catch (error) {
    console.error("[API_ADMIN_STATS_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}