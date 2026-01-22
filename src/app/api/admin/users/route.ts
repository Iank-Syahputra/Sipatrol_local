import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const { userId: currentUserId } = await auth();

    if (!currentUserId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Supabase client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { id, full_name, username, role, phone_number, assigned_unit_id } = await request.json();

    // Validate required fields
    if (!id || !full_name || !role) {
      return Response.json({ error: 'ID, full_name, and role are required' }, { status: 400 });
    }

    // Check if the current user is an admin
    const { data: currentUserProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', currentUserId)
      .single();

    if (profileError || !currentUserProfile || currentUserProfile.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Update the user
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        full_name, 
        username: username || null, 
        role, 
        phone_number: phone_number || null, 
        assigned_unit_id: assigned_unit_id || null 
      })
      .eq('id', id)
      .select()
      .single();

    if (userError) {
      console.error('Error updating user:', userError);
      return Response.json({ error: userError.message }, { status: 500 });
    }

    return Response.json({ user });
  } catch (error) {
    console.error('Unexpected error in users API (PUT):', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const { userId: currentUserId } = await auth();

    if (!currentUserId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Supabase client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Parse the request body to get the user ID
    const { id } = await request.json();

    // Validate required field
    if (!id) {
      return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if the current user is an admin
    const { data: currentUserProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', currentUserId)
      .single();

    if (profileError || !currentUserProfile || currentUserProfile.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Check if the user is trying to delete themselves
    if (id === currentUserId) {
      return Response.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Check if there are any reports associated with this user
    const { count: reportCount, error: reportCheckError } = await supabaseAdmin
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id);

    if (reportCheckError) {
      console.error('Error checking reports associated with user:', reportCheckError);
      return Response.json({ error: reportCheckError.message }, { status: 500 });
    }

    if (reportCount && reportCount > 0) {
      return Response.json({ 
        error: 'Cannot delete user: there are reports associated with this user.' 
      }, { status: 400 });
    }

    // Delete the user from profiles table
    const { error: userError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id);

    if (userError) {
      console.error('Error deleting user:', userError);
      return Response.json({ error: userError.message }, { status: 500 });
    }

    return Response.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Unexpected error in users API (DELETE):', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}