import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

// Types for SiPatrol application
export type UserRole = 'admin' | 'security';

export interface Unit {
  id: string;
  name: string;
  district: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  assigned_unit_id: string | null;
  phone_number?: string;
  username?: string;
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  unit_id: string;
  image_path?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  category_id?: string;
  location_id?: string;
  captured_at: string;
  is_offline_submission: boolean;
  created_at: string;
  // Joined fields from related tables
  profiles?: {
    full_name: string;
  };
  units?: {
    name: string;
  };
  report_categories?: {
    name: string;
    color?: string;
  };
  unit_locations?: {
    name: string;
  };
}

// Unit operations
export async function getAllUnits(): Promise<Unit[]> {
  try {
    const units = await prisma.unit.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    // Convert Prisma model to interface format
    return units.map(unit => ({
      id: unit.id,
      name: unit.name,
      district: unit.district,
      created_at: unit.createdAt.toISOString()
    }));
  } catch (error) {
    console.error('Error fetching units:', error);
    throw new Error('Failed to fetch units');
  }
}

export async function createUnit(unitData: Omit<Unit, 'id' | 'created_at'>): Promise<Unit> {
  try {
    const unit = await prisma.unit.create({
      data: {
        name: unitData.name,
        district: unitData.district
      }
    });

    return {
      id: unit.id,
      name: unit.name,
      district: unit.district,
      created_at: unit.createdAt.toISOString()
    };
  } catch (error) {
    console.error('Error creating unit:', error);
    throw new Error('Failed to create unit');
  }
}

export async function updateUnit(id: string, unitData: Partial<Omit<Unit, 'id' | 'created_at'>>): Promise<Unit> {
  try {
    const unit = await prisma.unit.update({
      where: { id },
      data: {
        name: unitData.name,
        district: unitData.district
      }
    });

    return {
      id: unit.id,
      name: unit.name,
      district: unit.district,
      created_at: unit.createdAt.toISOString()
    };
  } catch (error) {
    console.error('Error updating unit:', error);
    throw new Error('Failed to update unit');
  }
}

export async function deleteUnit(id: string): Promise<void> {
  try {
    await prisma.unit.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Error deleting unit:', error);
    throw new Error('Failed to delete unit');
  }
}

// Profile operations
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const session = await getServerSession();

    if (!session || !session.user) {
      return null;
    }

    const userId = session.user.id as string;

    if (!userId) {
      return null;
    }

    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      include: {
        assignedUnit: true
      }
    });

    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      full_name: profile.fullName,
      role: profile.role,
      assigned_unit_id: profile.assignedUnitId,
      phone_number: profile.phoneNumber || undefined,
      username: profile.username || undefined,
      created_at: profile.createdAt.toISOString()
    };
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

export async function createUserProfile(profileData: Omit<UserProfile, 'created_at'>): Promise<UserProfile> {
  try {
    const profile = await prisma.profile.create({
      data: {
        id: profileData.id,
        username: profileData.username,
        password: profileData.username ? 'default_password' : null, // In production, ensure proper password handling
        fullName: profileData.full_name,
        role: profileData.role,
        assignedUnitId: profileData.assigned_unit_id,
        phoneNumber: profileData.phone_number
      },
      include: {
        assignedUnit: true
      }
    });

    return {
      id: profile.id,
      full_name: profile.fullName,
      role: profile.role,
      assigned_unit_id: profile.assignedUnitId,
      phone_number: profile.phoneNumber || undefined,
      username: profile.username || undefined,
      created_at: profile.createdAt.toISOString()
    };
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    throw new Error('Failed to create user profile');
  }
}

export async function getAllProfiles(): Promise<UserProfile[]> {
  try {
    const profiles = await prisma.profile.findMany({
      include: {
        assignedUnit: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return profiles.map(profile => ({
      id: profile.id,
      full_name: profile.fullName,
      role: profile.role,
      assigned_unit_id: profile.assignedUnitId,
      phone_number: profile.phoneNumber || undefined,
      username: profile.username || undefined,
      created_at: profile.createdAt.toISOString()
    }));
  } catch (error) {
    console.error('Error in getAllProfiles:', error);
    throw new Error('Failed to fetch all profiles');
  }
}

export async function updateUserProfile(userId: string, profileData: Partial<Omit<UserProfile, 'id' | 'created_at'>>): Promise<UserProfile> {
  try {
    const profile = await prisma.profile.update({
      where: { id: userId },
      data: {
        username: profileData.username,
        fullName: profileData.full_name,
        role: profileData.role as UserRole,
        assignedUnitId: profileData.assigned_unit_id,
        phoneNumber: profileData.phone_number
      },
      include: {
        assignedUnit: true
      }
    });

    return {
      id: profile.id,
      full_name: profile.fullName,
      role: profile.role,
      assigned_unit_id: profile.assignedUnitId,
      phone_number: profile.phoneNumber || undefined,
      username: profile.username || undefined,
      created_at: profile.createdAt.toISOString()
    };
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw new Error('Failed to update user profile');
  }
}

// Report operations
export async function getLatestReports(limit: number = 5): Promise<Report[]> {
  try {
    const reports = await prisma.report.findMany({
      take: limit,
      orderBy: {
        captured_at: 'desc'
      },
      include: {
        user: {
          select: {
            fullName: true
          }
        },
        unit: {
          select: {
            name: true
          }
        },
        category: {
          select: {
            name: true,
            color: true
          }
        },
        location: {
          select: {
            name: true
          }
        }
      }
    });

    return reports.map(report => ({
      id: report.id,
      user_id: report.userId,
      unit_id: report.unitId,
      image_path: report.imagePath || undefined,
      notes: report.notes || undefined,
      latitude: report.latitude || undefined,
      longitude: report.longitude || undefined,
      category_id: report.categoryId || undefined,
      location_id: report.locationId || undefined,
      captured_at: report.capturedAt.toISOString(),
      is_offline_submission: report.isOfflineSubmission,
      created_at: report.createdAt.toISOString(),
      profiles: report.user ? { full_name: report.user.fullName } : undefined,
      units: report.unit ? { name: report.unit.name } : undefined,
      report_categories: report.category ? { name: report.category.name, color: report.category.color || undefined } : undefined,
      unit_locations: report.location ? { name: report.location.name } : undefined
    }));
  } catch (error) {
    console.error('Error in getLatestReports:', error);
    throw new Error('Failed to fetch latest reports');
  }
}

export async function getReportsByFilters(
  unitId?: string,
  dateFrom?: string,
  dateTo?: string,
  userId?: string
): Promise<Report[]> {
  try {
    const whereClause: any = {};

    if (unitId) whereClause.unitId = unitId;
    if (userId) whereClause.userId = userId;
    if (dateFrom) whereClause.capturedAt = { ...whereClause.capturedAt, gte: new Date(dateFrom) };
    if (dateTo) whereClause.capturedAt = { ...whereClause.capturedAt, lte: new Date(dateTo) };

    const reports = await prisma.report.findMany({
      where: whereClause,
      orderBy: {
        captured_at: 'desc'
      },
      include: {
        user: {
          select: {
            fullName: true
          }
        },
        unit: {
          select: {
            name: true
          }
        },
        category: {
          select: {
            name: true,
            color: true
          }
        },
        location: {
          select: {
            name: true
          }
        }
      }
    });

    return reports.map(report => ({
      id: report.id,
      user_id: report.userId,
      unit_id: report.unitId,
      image_path: report.imagePath || undefined,
      notes: report.notes || undefined,
      latitude: report.latitude || undefined,
      longitude: report.longitude || undefined,
      category_id: report.categoryId || undefined,
      location_id: report.locationId || undefined,
      captured_at: report.capturedAt.toISOString(),
      is_offline_submission: report.isOfflineSubmission,
      created_at: report.createdAt.toISOString(),
      profiles: report.user ? { full_name: report.user.fullName } : undefined,
      units: report.unit ? { name: report.unit.name } : undefined,
      report_categories: report.category ? { name: report.category.name, color: report.category.color || undefined } : undefined,
      unit_locations: report.location ? { name: report.location.name } : undefined
    }));
  } catch (error) {
    console.error('Error in getReportsByFilters:', error);
    throw new Error('Failed to fetch reports with filters');
  }
}

export async function createReport(reportData: Omit<Report, 'id' | 'created_at'>): Promise<Report> {
  try {
    const report = await prisma.report.create({
      data: {
        userId: reportData.user_id,
        unitId: reportData.unit_id,
        imagePath: reportData.image_path,
        notes: reportData.notes,
        latitude: reportData.latitude,
        longitude: reportData.longitude,
        categoryId: reportData.category_id,
        locationId: reportData.location_id,
        capturedAt: new Date(reportData.captured_at),
        isOfflineSubmission: reportData.is_offline_submission
      }
    });

    return {
      id: report.id,
      user_id: report.userId,
      unit_id: report.unitId,
      image_path: report.imagePath || undefined,
      notes: report.notes || undefined,
      latitude: report.latitude || undefined,
      longitude: report.longitude || undefined,
      category_id: report.categoryId || undefined,
      location_id: report.locationId || undefined,
      captured_at: report.capturedAt.toISOString(),
      is_offline_submission: report.isOfflineSubmission,
      created_at: report.createdAt.toISOString()
    };
  } catch (error) {
    console.error('Error in createReport:', error);
    throw new Error('Failed to create report');
  }
}

export async function getUserReports(
  userId: string,
  options?: { page?: number; limit?: number; startDate?: string; endDate?: string }
): Promise<{ data: Report[]; totalCount: number }> {
  try {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const whereClause: any = { userId };

    if (options?.startDate) whereClause.capturedAt = { ...whereClause.capturedAt, gte: new Date(options.startDate) };
    if (options?.endDate) whereClause.capturedAt = { ...whereClause.capturedAt, lte: new Date(options.endDate) };

    const [reports, totalCount] = await Promise.all([
      prisma.report.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          capturedAt: 'desc'
        },
        include: {
          unit: {
            select: { name: true }
          },
          category: {
            select: { name: true, color: true }
          },
          location: {
            select: { name: true }
          },
          user: {
            select: { fullName: true }
          }
        }
      }),
      prisma.report.count({ where: whereClause })
    ]);

    const mappedReports = reports.map(report => ({
      id: report.id,
      user_id: report.userId,
      unit_id: report.unitId,
      image_path: report.imagePath || undefined,
      notes: report.notes || undefined,
      latitude: report.latitude || undefined,
      longitude: report.longitude || undefined,
      category_id: report.categoryId || undefined,
      location_id: report.locationId || undefined,
      captured_at: report.capturedAt.toISOString(),
      is_offline_submission: report.isOfflineSubmission,
      created_at: report.createdAt.toISOString(),
      units: report.unit ? { name: report.unit.name } : undefined,
      report_categories: report.category ? { name: report.category.name, color: report.category.color || undefined } : undefined,
      unit_locations: report.location ? { name: report.location.name } : undefined,
      profiles: report.user ? { full_name: report.user.fullName } : undefined
    }));

    return { data: mappedReports, totalCount };
  } catch (error) {
    console.error('Error in getUserReports:', error);
    return { data: [], totalCount: 0 }; // Return empty result instead of throwing
  }
}

// Helper function to check if user is admin
export async function isAdmin(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.role === 'admin';
}

// Helper function to get current user's assigned unit
export async function getCurrentUserAssignedUnit(): Promise<Unit | null> {
  const profile = await getUserProfile();
  if (!profile?.assigned_unit_id) {
    return null;
  }

  try {
    const unit = await prisma.unit.findUnique({
      where: { id: profile.assigned_unit_id }
    });

    if (!unit) {
      return null;
    }

    return {
      id: unit.id,
      name: unit.name,
      district: unit.district,
      created_at: unit.createdAt.toISOString()
    };
  } catch (error) {
    console.error('Error in getCurrentUserAssignedUnit:', error);
    return null;
  }
}