'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface CategoryOption {
  value: string;
  label: string;
}

export interface LocationOption {
  value: string;
  label: string;
}

export async function getReportCategories(): Promise<CategoryOption[]> {
  try {
    const categories = await prisma.reportCategory.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map(cat => ({
      value: cat.id,
      label: cat.name,
    }));
  } catch (error) {
    console.error('Unexpected error in getReportCategories:', error);
    return [];
  }
}

export async function getUnitLocations(userId: string | undefined): Promise<LocationOption[]> {
  try {
    if (!userId) {
      // Return empty array if userId is undefined
      return [];
    }

    // First, get the user's assigned unit
    const profile = await prisma.profile.findUnique({
      where: {
        id: userId,
      },
      select: {
        assignedUnitId: true,
      },
    });

    if (!profile || !profile.assignedUnitId) {
      // Return empty array if user has no assigned unit
      return [];
    }

    // Fetch unit locations for the user's assigned unit
    const locations = await prisma.unitLocation.findMany({
      where: {
        unitId: profile.assignedUnitId,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return locations.map(loc => ({
      value: loc.id,
      label: loc.name,
    }));
  } catch (error) {
    console.error('Unexpected error in getUnitLocations:', error);
    return [];
  }
}

export async function deleteReport(reportId: string): Promise<boolean> {
  try {
    await prisma.report.delete({
      where: {
        id: reportId,
      },
    });

    // Revalidate the reports page to reflect the deletion
    revalidatePath('/admin/reports');
    return true;
  } catch (error) {
    console.error('Unexpected error in deleteReport:', error);
    return false;
  }
}

export async function deleteMultipleReports(reportIds: string[]): Promise<boolean> {
  try {
    await prisma.report.deleteMany({
      where: {
        id: {
          in: reportIds,
        },
      },
    });

    // Revalidate the reports page to reflect the deletion
    revalidatePath('/admin/reports');
    return true;
  } catch (error) {
    console.error('Unexpected error in deleteMultipleReports:', error);
    return false;
  }
}