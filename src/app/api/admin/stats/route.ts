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
    const [totalUsers, totalReports, totalUnits, recentReports, allReports] = await Promise.all([
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
          unit: { select: { name: true } },
          category: { select: { name: true, color: true } } // Include category information
        }
      }),
      // Fetch all reports with category info to calculate stats
      prisma.report.findMany({
        include: {
          category: {
            select: {
              name: true
            }
          },
          unit: {
            select: {
              name: true
            }
          }
        }
      })
    ]);

    // 3. Process reports to calculate safety statistics
    let safeCount = 0;
    let unsafeActionCount = 0;
    let unsafeConditionCount = 0;

    const unitStatsMap: Record<string, { safe: number, unsafeAction: number, unsafeCondition: number }> = {};

    allReports.forEach(report => {
      const categoryName = report.category?.name?.toLowerCase() || '';

      if (categoryName.includes('safe')) {
        safeCount++;
        if (report.unit?.name) {
          if (!unitStatsMap[report.unit.name]) {
            unitStatsMap[report.unit.name] = { safe: 0, unsafeAction: 0, unsafeCondition: 0 };
          }
          unitStatsMap[report.unit.name].safe++;
        }
      } else if (categoryName.includes('unsafe') && categoryName.includes('action')) {
        unsafeActionCount++;
        if (report.unit?.name) {
          if (!unitStatsMap[report.unit.name]) {
            unitStatsMap[report.unit.name] = { safe: 0, unsafeAction: 0, unsafeCondition: 0 };
          }
          unitStatsMap[report.unit.name].unsafeAction++;
        }
      } else if (categoryName.includes('unsafe') && categoryName.includes('condition')) {
        unsafeConditionCount++;
        if (report.unit?.name) {
          if (!unitStatsMap[report.unit.name]) {
            unitStatsMap[report.unit.name] = { safe: 0, unsafeAction: 0, unsafeCondition: 0 };
          }
          unitStatsMap[report.unit.name].unsafeCondition++;
        }
      }
    });

    // 4. Convert unit stats map to array and sort by total reports
    const unitRanking = Object.entries(unitStatsMap)
      .map(([unitName, stats]) => ({
        name: unitName,
        safe: stats.safe,
        unsafeAction: stats.unsafeAction,
        unsafeCondition: stats.unsafeCondition
      }))
      .sort((a, b) =>
        (b.safe + b.unsafeAction + b.unsafeCondition) - (a.safe + a.unsafeAction + a.unsafeCondition)
      )
      .slice(0, 5); // Top 5 units

    // 5. Return Data
    return NextResponse.json({
      totalUsers,
      totalReports,
      totalUnits,
      recentReports,
      safetyStats: {
        safe: safeCount,
        unsafeAction: unsafeActionCount,
        unsafeCondition: unsafeConditionCount
      },
      unitRanking: unitRanking
    });

  } catch (error) {
    console.error("[API_ADMIN_STATS_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}