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

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const unitId = searchParams.get('unit') || 'all';
    const date = searchParams.get('date') || ''; // YYYY-MM-DD

    // 1. Base Query with Joins
    // We use !inner for profiles to filter reports based on the profile name
    let query = supabaseAdmin
      .from('reports')
      .select(`
        *,
        profiles!inner(full_name),
        units(name, id),
        report_categories(name, color),
        unit_locations(name)
      `)
      .order('captured_at', { ascending: false });

    // 2. Apply Unit Filter
    if (unitId !== 'all') {
      query = query.eq('unit_id', unitId);
    }

    // 3. Apply Name Search Filter
    if (search) {
      query = query.ilike('profiles.full_name', `%${search}%`);
    }

    // 4. Apply Date Filter
    if (date) {
      // Create start and end of the selected day
      const startDate = `${date}T00:00:00.000Z`;
      const endDate = `${date}T23:59:59.999Z`;

      // Filter captured_at between start and end of that day
      query = query.gte('captured_at', startDate).lte('captured_at', endDate);
    }

    const { data: reports, error: reportsError } = await query;

    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
      return NextResponse.json({ error: reportsError.message }, { status: 500 });
    }

    // Fetch units for the dropdown
    const { data: units, error: unitsError } = await supabaseAdmin
      .from('units')
      .select('id, name')
      .order('name', { ascending: true });

    if (unitsError) {
      console.error('Error fetching units:', unitsError);
      return NextResponse.json({ error: unitsError.message }, { status: 500 });
    }

    return NextResponse.json({ reports, units });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}