import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated using NextAuth
    const session = await getServerSession();

    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // 1. PARSE MULTI-SELECT PARAMS
    // Convert "id1,id2" string into ['id1', 'id2']
    const unitIds = searchParams.get('units')?.split(',').filter(Boolean) || [];
    const categoryIds = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    // 1. PARSE NEW PARAM
    const locationIds = searchParams.get('locations')?.split(',').filter(Boolean) || [];
    const search = searchParams.get('search') || '';
    const startDateParam = searchParams.get('startDate') || '';
    const endDateParam = searchParams.get('endDate') || '';

    // PAGINATION PARAMETERS
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 10); // Maximum 10 rows per page
    const skip = (page - 1) * limit;

    // BUILD WHERE CLAUSE
    const whereClause: any = {};

    // Search by Name
    if (search) {
      whereClause.user = {
        fullName: {
          contains: search,
          mode: 'insensitive'
        }
      };
    }

    // Filter by Date Range
    if (startDateParam && endDateParam) {
      whereClause.capturedAt = {
        gte: new Date(startDateParam),
        lte: new Date(`${endDateParam}T23:59:59.999Z`)
      };
    }

    // Filter by Unit
    if (unitIds.length > 0) {
      whereClause.unitId = { in: unitIds };
    }

    // Filter by Category
    if (categoryIds.length > 0) {
      whereClause.categoryId = { in: categoryIds };
    }

    // Filter by Location
    if (locationIds.length > 0) {
      whereClause.locationId = { in: locationIds };
    }

    // COUNT TOTAL REPORTS WITH FILTERS
    const totalReports = await prisma.report.count({
      where: whereClause
    });

    // CALCULATE TOTAL PAGES
    const totalPages = Math.ceil(totalReports / limit);

    // FETCH REPORTS WITH FILTERS AND PAGINATION
    const reports = await prisma.report.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            fullName: true
          }
        },
        unit: {
          select: {
            id: true,
            name: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        location: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        capturedAt: 'desc'
      },
      skip,
      take: limit
    });

    // FETCH DROPDOWN OPTIONS
    const units = await prisma.unit.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    const categories = await prisma.reportCategory.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Fetch all locations for the filter dropdown
    const locations = await prisma.unitLocation.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      reports,
      units,
      categories,
      locations,
      totalPages,
      totalCount: totalReports
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}