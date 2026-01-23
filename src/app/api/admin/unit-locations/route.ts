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

    // Parse Multi-Select Param
    const unitIds = url.searchParams.get('units')?.split(',').filter(Boolean) || [];

    // Build the query
    let query = supabaseAdmin
      .from('unit_locations')
      .select(`
        *,
        units (id, name)
      `)
      .order('name', { ascending: true });

    // Apply search filter if provided
    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`);
    }

    // Apply Multi-Select Unit Filter
    if (unitIds.length > 0) {
      query = query.in('unit_id', unitIds);
    }

    const { data: locations, error: locationsError } = await query;

    if (locationsError) {
      console.error('Error fetching unit locations:', locationsError);
      return Response.json({ error: locationsError.message }, { status: 500 });
    }

    // Fetch Units for Dropdown
    const { data: units, error: unitsError } = await supabaseAdmin
      .from('units')
      .select('id, name')
      .order('name', { ascending: true });

    if (unitsError) {
      console.error('Error fetching units:', unitsError);
      return Response.json({ error: unitsError.message }, { status: 500 });
    }

    return Response.json({
      locations,
      units
    });
  } catch (error) {
    console.error('Unexpected error in unit locations API:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const { unit_id, name } = await request.json();

    // Validate required fields
    if (!unit_id || !name) {
      return Response.json({ error: 'Unit ID and name are required' }, { status: 400 });
    }

    // Check if the combination of unit_id and name already exists
    const { data: existingLocation, error: checkError } = await supabaseAdmin
      .from('unit_locations')
      .select('id')
      .eq('unit_id', unit_id)
      .eq('name', name)
      .single();

    if (existingLocation) {
      return Response.json({ error: 'Location with this name already exists in this unit' }, { status: 400 });
    }

    // Insert the new unit location
    const { data: location, error: locationError } = await supabaseAdmin
      .from('unit_locations')
      .insert([{ unit_id, name }])
      .select(`
        *,
        units (name)
      `)
      .single();

    if (locationError) {
      console.error('Error creating unit location:', locationError);
      return Response.json({ error: locationError.message }, { status: 500 });
    }

    return Response.json({ location });
  } catch (error) {
    console.error('Unexpected error in unit locations API (POST):', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    const { id, unit_id, name } = await request.json();

    // Validate required fields
    if (!id || !unit_id || !name) {
      return Response.json({ error: 'ID, unit ID, and name are required' }, { status: 400 });
    }

    // Check if the combination of unit_id and name already exists (excluding current record)
    const { data: existingLocation, error: checkError } = await supabaseAdmin
      .from('unit_locations')
      .select('id')
      .eq('unit_id', unit_id)
      .eq('name', name)
      .neq('id', id)
      .single();

    if (existingLocation) {
      return Response.json({ error: 'Location with this name already exists in this unit' }, { status: 400 });
    }

    // Update the unit location
    const { data: location, error: locationError } = await supabaseAdmin
      .from('unit_locations')
      .update({ unit_id, name })
      .eq('id', id)
      .select(`
        *,
        units (name)
      `)
      .single();

    if (locationError) {
      console.error('Error updating unit location:', locationError);
      return Response.json({ error: locationError.message }, { status: 500 });
    }

    return Response.json({ location });
  } catch (error) {
    console.error('Unexpected error in unit locations API (PUT):', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    // Parse the request body to get the location ID
    const { id } = await request.json();

    // Validate required field
    if (!id) {
      return Response.json({ error: 'Location ID is required' }, { status: 400 });
    }

    // Check if there are any reports associated with this location
    const { count: reportCount, error: reportCheckError } = await supabaseAdmin
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('location_id', id);

    if (reportCheckError) {
      console.error('Error checking reports associated with location:', reportCheckError);
      return Response.json({ error: reportCheckError.message }, { status: 500 });
    }

    if (reportCount && reportCount > 0) {
      return Response.json({ 
        error: 'Cannot delete location: there are reports associated with this location.' 
      }, { status: 400 });
    }

    // Delete the unit location
    const { error: locationError } = await supabaseAdmin
      .from('unit_locations')
      .delete()
      .eq('id', id);

    if (locationError) {
      console.error('Error deleting unit location:', locationError);
      return Response.json({ error: locationError.message }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Unexpected error in unit locations API (DELETE):', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}