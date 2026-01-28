import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  // 1. Auth Check
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Parse Query Parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Extract filter parameters
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const search = searchParams.get('search') || '';
    const unitsParam = searchParams.get('units') || '';
    const categoriesParam = searchParams.get('categories') || '';
    const locationsParam = searchParams.get('locations') || '';

    // Build where clause for filtering
    const whereClause: any = {};

    // Date filter
    if (startDate && endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      whereClause.capturedAt = {
        gte: new Date(startDate),
        lte: end
      };
    } else if (startDate) {
      whereClause.capturedAt = { gte: new Date(startDate) };
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      whereClause.capturedAt = { lte: end };
    }

    // Search filter (for officer name)
    if (search) {
      whereClause.user = {
        fullName: {
          contains: search,
          mode: 'insensitive'
        }
      };
    }

    // Units filter
    if (unitsParam) {
      const unitIds = unitsParam.split(',');
      whereClause.unitId = { in: unitIds };
    }

    // Categories filter
    if (categoriesParam) {
      const categoryIds = categoriesParam.split(',');
      whereClause.categoryId = { in: categoryIds };
    }

    // Locations filter
    if (locationsParam) {
      const locationIds = locationsParam.split(',');
      whereClause.locationId = { in: locationIds };
    }

    // 3. Fetch Reports with Relations and Pagination
    // We include User, Unit, and Location details for the table display
    const reports = await prisma.report.findMany({
      skip: skip,
      take: limit,
      where: whereClause,
      orderBy: { capturedAt: 'desc' },
      include: {
        user: {
          select: { fullName: true, username: true }
        },
        unit: {
          select: { name: true }
        },
        location: {
          select: { name: true }
        },
        category: {
          select: { name: true, color: true }
        }
      }
    });

    // 4. Get Total Count for Pagination Info (with same filters)
    const totalCount = await prisma.report.count({
      where: whereClause
    });

    // 5. Calculate Pagination Info
    const totalPages = Math.ceil(totalCount / limit);

    // 6. Return Data with Pagination Info
    return NextResponse.json({
      reports,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalReports: totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}