import { createClient } from '@supabase/supabase-js';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getCurrentUser } from '@/lib/user';

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
  captured_at: string;
  is_offline_submission: boolean;
  created_at: string;
}

// Unit operations
export async function getAllUnits(): Promise<Unit[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('units')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching units:', error);
    throw new Error('Failed to fetch units');
  }

  return data || [];
}

export async function createUnit(unitData: Omit<Unit, 'id' | 'created_at'>): Promise<Unit> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('units')
    .insert([unitData])
    .select()
    .single();

  if (error) {
    console.error('Error creating unit:', error);
    throw new Error('Failed to create unit');
  }

  return data;
}

export async function updateUnit(id: string, unitData: Partial<Omit<Unit, 'id' | 'created_at'>>): Promise<Unit> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('units')
    .update(unitData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating unit:', error);
    throw new Error('Failed to update unit');
  }

  return data;
}

export async function deleteUnit(id: string): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from('units')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting unit:', error);
    throw new Error('Failed to delete unit');
  }
}

// Profile operations
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    // Initialize Admin Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Try to fetch existing profile
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // If found, return it immediately
    if (!error && data) {
      return data;
    }

    // 2. If Not Found (PGRST116), Auto-Create the Profile
    if (error && error.code === 'PGRST116') {
      console.log(`Profile not found for ${userId}, creating new one...`);

      const clerkUser = await currentUser();
      if (!clerkUser) return null;

      // Construct a name from Clerk data
      const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || "Security Officer";

      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert([
          {
            id: userId,
            full_name: fullName,
            // role will default to 'security' based on DB schema
          }
        ])
        .select()
        .single();

      if (createError) {
        console.error("Failed to auto-create profile:", JSON.stringify(createError, null, 2));
        return null;
      }

      console.log("✓ New profile created successfully.");
      return newProfile;
    }

    // Handle other real errors
    console.error('Supabase Error:', JSON.stringify(error, null, 2));
    return null;

  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

export async function createUserProfile(profileData: Omit<UserProfile, 'created_at'>): Promise<UserProfile> {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert([profileData])
      .select()
      .single();

    if (error) {
      console.error('Supabase Error Detail:', JSON.stringify(error, null, 2));
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    throw new Error('Failed to create user profile');
  }
}

export async function updateUserProfile(userId: string, profileData: Partial<Omit<UserProfile, 'id' | 'created_at'>>): Promise<UserProfile> {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase Error Detail:', JSON.stringify(error, null, 2));
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw new Error('Failed to update user profile');
  }
}

// Report operations
export async function getLatestReports(limit: number = 5): Promise<Report[]> {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('reports')
      .select(`
        *,
        profiles(full_name),
        units(name)
      `)
      .order('captured_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Supabase Error Detail:', JSON.stringify(error, null, 2));
      throw error;
    }

    return data || [];
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
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let query = supabaseAdmin
      .from('reports')
      .select(`
        *,
        profiles(full_name),
        units(name)
      `)
      .order('captured_at', { ascending: false });

    if (unitId) {
      query = query.eq('unit_id', unitId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (dateFrom) {
      query = query.gte('captured_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('captured_at', dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase Error Detail:', JSON.stringify(error, null, 2));
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getReportsByFilters:', error);
    throw new Error('Failed to fetch reports with filters');
  }
}

export async function createReport(reportData: Omit<Report, 'id' | 'created_at'>): Promise<Report> {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('reports')
      .insert([reportData])
      .select()
      .single();

    if (error) {
      console.error('Supabase Error Detail:', JSON.stringify(error, null, 2));
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createReport:', error);
    throw new Error('Failed to create report');
  }
}

export async function getUserReports(userId: string): Promise<Report[]> {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('reports')
      .select(`
        *,
        units(name)
      `)
      .eq('user_id', userId)
      .order('captured_at', { ascending: false });

    if (error) {
      console.error('Supabase Error Detail:', JSON.stringify(error, null, 2));
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserReports:', error);
    throw new Error('Failed to fetch user reports');
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
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: unit, error } = await supabaseAdmin
      .from('units')
      .select('*')
      .eq('id', profile.assigned_unit_id)
      .single();

    if (error) {
      console.error('Supabase Error Detail:', JSON.stringify(error, null, 2));
      return null;
    }

    return unit;
  } catch (error) {
    console.error('Error in getCurrentUserAssignedUnit:', error);
    return null;
  }
}