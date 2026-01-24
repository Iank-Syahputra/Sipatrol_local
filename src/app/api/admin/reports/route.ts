import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Supabase client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);

    // 1. PARSE MULTI-SELECT PARAMS
    // Convert "id1,id2" string into ['id1', 'id2']
    const unitIds = searchParams.get('units')?.split(',').filter(Boolean) || [];
    const categoryIds = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    // 1. PARSE NEW PARAM
    const locationIds = searchParams.get('locations')?.split(',').filter(Boolean) || [];
    const search = searchParams.get('search') || '';
    const date = searchParams.get('date') || ''; // YYYY-MM-DD

    // 1. QUERY BUILDER
    let query = supabaseAdmin
      .from('reports')
      .select(`
        *,
        profiles!inner(full_name),
        units(name, id),
        report_categories(id, name, color),
        unit_locations(id, name)
      `)
      .order('captured_at', { ascending: false });

    // 2. APPLY FILTERS

    // Search by Name
    if (search) {
      query = query.ilike('profiles.full_name', `%${search}%`);
    }

    // Filter by Date
    if (date) {
      const startDate = `${date}T00:00:00.000Z`;
      const endDate = `${date}T23:59:59.999Z`;
      query = query.gte('captured_at', startDate).lte('captured_at', endDate);
    }

    // Filter by Unit
    if (unitIds.length > 0) {
      query = query.in('unit_id', unitIds);
    }

    // Filter by Category (CORRECTED based on DB Screenshot)
    if (categoryIds.length > 0) {
      query = query.in('category_id', categoryIds); // <--- Using 'category_id'
    }

    // 3. APPLY LOCATION FILTER
    if (locationIds.length > 0) {
      query = query.in('location_id', locationIds);
    }

    const { data: reports, error: reportsError } = await query;

    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
      return NextResponse.json({ error: reportsError.message }, { status: 500 });
    }

    // 4. FETCH DROPDOWN OPTIONS
    const { data: units, error: unitsError } = await supabaseAdmin
      .from('units')
      .select('id, name')
      .order('name', { ascending: true });

    if (unitsError) {
      console.error('Error fetching units:', unitsError);
      return NextResponse.json({ error: unitsError.message }, { status: 500 });
    }

    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('report_categories')
      .select('id, name')
      .order('name', { ascending: true });

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return NextResponse.json({ error: categoriesError.message }, { status: 500 });
    }

    // Fetch all locations for the filter dropdown
    const { data: locations, error: locationsError } = await supabaseAdmin
      .from('unit_locations')
      .select('id, name')
      .order('name', { ascending: true });

    if (locationsError) {
      console.error('Error fetching locations:', locationsError);
      return NextResponse.json({ error: locationsError.message }, { status: 500 });
    }

    return NextResponse.json({ reports, units, categories, locations });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}