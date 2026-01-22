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
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build the query
    let query = supabaseAdmin
      .from('units')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply search filter if provided
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,district.ilike.%${searchTerm}%`);
    }

    const { data: units, error: unitsError, count } = await query;

    if (unitsError) {
      console.error('Error fetching units:', unitsError);
      return Response.json({ error: unitsError.message }, { status: 500 });
    }

    return Response.json({
      units,
      count,
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    });
  } catch (error) {
    console.error('Unexpected error in units API:', error);
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

    const { name, district } = await request.json();

    // Validate required fields
    if (!name || !district) {
      return Response.json({ error: 'Name and district are required' }, { status: 400 });
    }

    // Insert the new unit
    const { data: unit, error: unitError } = await supabaseAdmin
      .from('units')
      .insert([{ name, district }])
      .select()
      .single();

    if (unitError) {
      console.error('Error creating unit:', unitError);
      return Response.json({ error: unitError.message }, { status: 500 });
    }

    return Response.json({ unit });
  } catch (error) {
    console.error('Unexpected error in units API (POST):', error);
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

    const { id, name, district } = await request.json();

    // Validate required fields
    if (!id || !name || !district) {
      return Response.json({ error: 'ID, name, and district are required' }, { status: 400 });
    }

    // Update the unit
    const { data: unit, error: unitError } = await supabaseAdmin
      .from('units')
      .update({ name, district })
      .eq('id', id)
      .select()
      .single();

    if (unitError) {
      console.error('Error updating unit:', unitError);
      return Response.json({ error: unitError.message }, { status: 500 });
    }

    return Response.json({ unit });
  } catch (error) {
    console.error('Unexpected error in units API (PUT):', error);
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

    // Parse the request body to get the unit ID
    const { id } = await request.json();

    // Validate required field
    if (!id) {
      return Response.json({ error: 'Unit ID is required' }, { status: 400 });
    }

    // Check if there are any users assigned to this unit
    // Using a simple select with limit to avoid potential policy recursion
    const { data: assignedUsers, error: userCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('assigned_unit_id', id)
      .limit(1);

    if (userCheckError) {
      console.error('Error checking users assigned to unit:', userCheckError);
      return Response.json({ error: userCheckError.message }, { status: 500 });
    }

    if (assignedUsers && assignedUsers.length > 0) {
      return Response.json({
        error: 'Cannot delete unit: there are users assigned to this unit. Reassign them first.'
      }, { status: 400 });
    }

    // Check if there are any reports associated with this unit
    const { data: associatedReports, error: reportCheckError } = await supabaseAdmin
      .from('reports')
      .select('id')
      .eq('unit_id', id)
      .limit(1);

    if (reportCheckError) {
      console.error('Error checking reports associated with unit:', reportCheckError);
      return Response.json({ error: reportCheckError.message }, { status: 500 });
    }

    if (associatedReports && associatedReports.length > 0) {
      return Response.json({
        error: 'Cannot delete unit: there are reports associated with this unit.'
      }, { status: 400 });
    }

    // Delete the unit
    const { error: unitError } = await supabaseAdmin
      .from('units')
      .delete()
      .eq('id', id);

    if (unitError) {
      console.error('Error deleting unit:', unitError);
      return Response.json({ error: unitError.message }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Unit deleted successfully' });
  } catch (error) {
    console.error('Unexpected error in units API (DELETE):', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}