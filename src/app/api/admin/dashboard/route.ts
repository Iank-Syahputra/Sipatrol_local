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

    // Fetch latest reports
    const { data: reports, error: reportsError } = await supabaseAdmin
      .from('reports')
      .select(`
        *,
        profiles(full_name),
        units(name),
        report_categories(name, color),
        unit_locations(name)
      `)
      .order('captured_at', { ascending: false })
      .limit(5);

    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
      return Response.json({ error: reportsError.message }, { status: 500 });
    }

    // Fetch all units
    const { data: units, error: unitsError } = await supabaseAdmin
      .from('units')
      .select('*');

    if (unitsError) {
      console.error('Error fetching units:', unitsError);
      return Response.json({ error: unitsError.message }, { status: 500 });
    }

    // Calculate total security officers
    const { count: securityCount, error: securityError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'security');

    if (securityError) {
      console.error('Error counting security officers:', securityError);
      return Response.json({ error: securityError.message }, { status: 500 });
    }

    // Calculate total reports
    const { count: reportCount, error: reportError } = await supabaseAdmin
      .from('reports')
      .select('*', { count: 'exact', head: true });

    if (reportError) {
      console.error('Error counting reports:', reportError);
      return Response.json({ error: reportError.message }, { status: 500 });
    }

    // Calculate total units
    const { count: unitCount, error: unitError } = await supabaseAdmin
      .from('units')
      .select('*', { count: 'exact', head: true });

    if (unitError) {
      console.error('Error counting units:', unitError);
      return Response.json({ error: unitError.message }, { status: 500 });
    }

    return Response.json({
      reports,
      units,
      stats: {
        totalSecurity: securityCount || 0,
        totalReports: reportCount || 0,
        totalUnits: unitCount || 0
      }
    });
  } catch (error) {
    console.error('Unexpected error in dashboard API:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}