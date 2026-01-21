'use server';

import { createClient } from '@supabase/supabase-js';
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
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from('report_categories')
      .select('id, name, color')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching report categories:', error);
      return [];
    }

    return data.map(cat => ({
      value: cat.id,
      label: cat.name,
    }));
  } catch (error) {
    console.error('Unexpected error in getReportCategories:', error);
    return [];
  }
}

export async function getUnitLocations(userId: string): Promise<LocationOption[]> {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // First, get the user's assigned unit
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('assigned_unit_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return [];
    }

    if (!profileData || !profileData.assigned_unit_id) {
      // Return empty array if user has no assigned unit
      return [];
    }

    // Fetch unit locations for the user's assigned unit
    const { data, error: locationsError } = await supabaseAdmin
      .from('unit_locations')
      .select('id, name')
      .eq('unit_id', profileData.assigned_unit_id)
      .order('name', { ascending: true });

    if (locationsError) {
      console.error('Error fetching unit locations:', locationsError);
      return [];
    }

    return data.map(loc => ({
      value: loc.id,
      label: loc.name,
    }));
  } catch (error) {
    console.error('Unexpected error in getUnitLocations:', error);
    return [];
  }
}