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

    // Fetch the user's profile to get assigned unit
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('assigned_unit_id')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return Response.json({ error: profileError.message }, { status: 500 });
    }

    if (!profile || !profile.assigned_unit_id) {
      return Response.json({ assignedUnit: null });
    }

    // Fetch the unit details
    const { data: unit, error: unitError } = await supabaseAdmin
      .from('units')
      .select('*')
      .eq('id', profile.assigned_unit_id)
      .single();

    if (unitError) {
      console.error('Error fetching unit:', unitError);
      return Response.json({ error: unitError.message }, { status: 500 });
    }

    return Response.json({ assignedUnit: unit });
  } catch (error) {
    console.error('Unexpected error in unit API:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}