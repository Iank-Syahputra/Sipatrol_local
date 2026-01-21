import { NextRequest } from 'next/server';
import { auth, createClerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated and is an admin
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is an admin by checking their profile in Supabase
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Parse request body
    const { fullName, username, password, phoneNumber, unitId } = await request.json();

    // Validate required fields
    if (!fullName || !username || !password || !phoneNumber || !unitId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify that the unit exists
    const { data: unit, error: unitError } = await supabaseAdmin
      .from('units')
      .select('id')
      .eq('id', unitId)
      .single();

    if (unitError || !unit) {
      return Response.json({ error: 'Invalid unit selected' }, { status: 400 });
    }

    try {
      // Create the Clerk client
      const clerkClient = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      // Create the user in Clerk
      const clerkUser = await clerkClient.users.createUser({
        username: username, // Use username directly
        firstName: fullName.split(' ').slice(0, -1).join(' ') || fullName, // Everything except last word as first name
        lastName: fullName.split(' ').pop(), // Last word as last name
        password,
        publicMetadata: {
          role: 'security',
          assignedUnitId: unitId
        }
      });

      // Create the profile in Supabase
      const { error: profileCreationError } = await supabaseAdmin
        .from('profiles')
        .insert([
          {
            id: clerkUser.id,
            full_name: fullName,
            role: 'security',
            assigned_unit_id: unitId,
            phone_number: phoneNumber,
            username: username
          }
        ]);

      if (profileCreationError) {
        // Rollback: Delete the user from Clerk if profile creation fails
        await clerkClient.users.deleteUser(clerkUser.id);
        console.error('Error creating profile:', profileCreationError);
        return Response.json({ error: 'Failed to create user profile' }, { status: 500 });
      }

      return Response.json({ 
        success: true, 
        message: 'User created successfully',
        userId: clerkUser.id
      });
    } catch (clerkError: any) {
      console.error('Error creating user in Clerk:', clerkError);
      return Response.json({ 
        error: clerkError.errors?.[0]?.message || 'Failed to create user in authentication system' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error in user creation:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}