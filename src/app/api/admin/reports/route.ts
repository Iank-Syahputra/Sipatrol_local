import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const { userId } = await auth();
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Supabase client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Extract query parameters
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('search') || '';
    const unitFilter = url.searchParams.get('unit') || 'all';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build the query
    let query = supabaseAdmin
      .from('reports')
      .select(`
        *,
        profiles(full_name),
        units(name),
        report_categories(name, color),
        unit_locations(name)
      `)
      .order('captured_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply search filter if provided
    if (searchTerm) {
      query = query.or(
        `profiles.full_name.ilike.%${searchTerm}%,units.name.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`
      );
    }

    // Apply unit filter if provided and not 'all'
    if (unitFilter !== 'all') {
      query = query.eq('unit_id', unitFilter);
    }

    const { data: reports, error: reportsError, count } = await query;

    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
      return Response.json({ error: reportsError.message }, { status: 500 });
    }

    // Fetch all units for filter options
    const { data: units, error: unitsError } = await supabaseAdmin
      .from('units')
      .select('id, name');

    if (unitsError) {
      console.error('Error fetching units:', unitsError);
      return Response.json({ error: unitsError.message }, { status: 500 });
    }

    return Response.json({
      reports,
      units,
      count,
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    });
  } catch (error) {
    console.error('Unexpected error in reports API:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}