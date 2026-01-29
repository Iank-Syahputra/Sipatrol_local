import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // 1. Auth Check (Must be Admin)
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Handle Date Filters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let dateFilter: any = {};
    if (startDate && endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      dateFilter = {
        capturedAt: {
          gte: new Date(startDate),
          lte: end
        }
      };
    }

    // 3. Get Total Counts
    const [totalUsers, totalReports, totalUnits] = await Promise.all([
      prisma.profile.count(),
      prisma.report.count({ where: dateFilter }),
      prisma.unit.count(),
    ]);

    // 4. Get Safety Stats
    const reportsByCategory = await prisma.report.groupBy({
      by: ['categoryId'],
      _count: { _all: true },
      where: {
        ...dateFilter,
        categoryId: { not: null }
      }
    });

    const categories = await prisma.reportCategory.findMany();

    // DEBUG: Log all category names to see what's in the database
    console.log("DEBUG: Categories in database:", categories.map(c => ({ id: c.id, name: c.name, color: c.color })));

    let safeCount = 0;
    let unsafeActionCount = 0;
    let unsafeConditionCount = 0;

    // --- HELPER FUNCTION FOR CONSISTENT LOGIC ---
    const classifyCategory = (name: string, color: string | null) => {
      const lowerName = name.toLowerCase();

      console.log(`DEBUG: Classifying category: "${name}", lowercase: "${lowerName}"`);

      // PRIORITY 1: Check for NEGATIVE keywords first (Unsafe / Tidak Aman)
      if (lowerName.includes('unsafe') || lowerName.includes('tidak aman') || lowerName.includes('bahaya')) {
        console.log(`DEBUG: Found negative keyword in: "${name}"`);
        // Decide: Action vs Condition
        if (lowerName.includes('action') || lowerName.includes('perilaku') || lowerName.includes('tindakan')) {
          console.log(`DEBUG: Classified as unsafe action: "${name}"`);
          return 'action';
        } else {
          console.log(`DEBUG: Classified as unsafe condition: "${name}"`);
          return 'condition'; // Default to condition if type is unspecified
        }
      }

      // PRIORITY 2: Only then check for POSITIVE keywords (Safe / Aman)
      if (lowerName.includes('safe') || lowerName.includes('aman')) {
        console.log(`DEBUG: Classified as safe: "${name}"`);
        return 'safe';
      }

      // PRIORITY 3: Fallback to Color
      if (color === 'red') {
        console.log(`DEBUG: Fallback to red color - classified as action: "${name}"`);
        return 'action';
      }
      if (color === 'yellow') {
        console.log(`DEBUG: Fallback to yellow color - classified as condition: "${name}"`);
        return 'condition';
      }
      if (color === 'green') {
        console.log(`DEBUG: Fallback to green color - classified as safe: "${name}"`);
        return 'safe';
      }

      console.log(`DEBUG: Ultimate fallback - classified as condition: "${name}"`);
      return 'condition'; // Ultimate fallback
    };
    // ---------------------------------------------

    // Apply Logic to Global Stats
    reportsByCategory.forEach(group => {
      const category = categories.find(c => c.id === group.categoryId);
      if (category) {
        const type = classifyCategory(category.name, category.color);
        const count = group._count._all;

        if (type === 'safe') {
          console.log(`DEBUG: Adding ${count} to safe count for category: "${category.name}"`);
          safeCount += count;
        } else if (type === 'action') {
          console.log(`DEBUG: Adding ${count} to unsafe action count for category: "${category.name}"`);
          unsafeActionCount += count;
        } else {
          console.log(`DEBUG: Adding ${count} to unsafe condition count for category: "${category.name}"`);
          unsafeConditionCount += count;
        }
      } else {
        console.log(`DEBUG: Category not found for categoryId: ${group.categoryId}`);
      }
    });

    // 4. Get Recent Reports
    const recentReports = await prisma.report.findMany({
      where: dateFilter,
      take: 5,
      orderBy: { capturedAt: 'desc' },
      include: {
        user: { select: { fullName: true } },
        unit: { select: { name: true } },
        category: true,
        location: { select: { name: true } }  // Include location information
      }
    });

    // 5. Get Unit Ranking (Using same helper logic)
    const units = await prisma.unit.findMany({
      include: {
        reports: {
          where: dateFilter,
          include: { category: true }
        }
      }
    });

    const unitRanking = units.map(unit => {
      let safe = 0;
      let unsafeAction = 0;
      let unsafeCondition = 0;

      unit.reports.forEach(r => {
        if (!r.category) return;

        const type = classifyCategory(r.category.name, r.category.color);

        if (type === 'safe') safe++;
        else if (type === 'action') unsafeAction++;
        else unsafeCondition++;
      });

      return {
        name: unit.name,
        safe,
        unsafeAction,
        unsafeCondition,
        total: unit.reports.length
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

    return NextResponse.json({
      totalUsers,
      totalReports,
      totalUnits,
      safetyStats: {
        safe: safeCount,
        unsafeAction: unsafeActionCount,
        unsafeCondition: unsafeConditionCount
      },
      recentReports,
      unitRanking
    });

  } catch (error: any) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}