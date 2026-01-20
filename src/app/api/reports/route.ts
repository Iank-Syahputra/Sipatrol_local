import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const notes = formData.get('notes') as string;
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    const unitId = formData.get('unitId') as string;
    const userIdFromForm = formData.get('userId') as string;

    // Validate required fields
    if (!image || !latitude || !longitude || !unitId || !userIdFromForm) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the user ID matches the authenticated user
    if (userId !== userIdFromForm) {
      return Response.json({ error: 'Unauthorized: User ID mismatch' }, { status: 401 });
    }

    // Get Supabase client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate unique filename
    const fileName = `evidence/${userId}/${Date.now()}_${image.name}`;

    // Convert File to ArrayBuffer for upload
    const buffer = await image.arrayBuffer();

    // Upload image to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('evidence')
      .upload(fileName, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: image.type
      });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return Response.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL for the uploaded image
    const { data: publicUrlData } = supabaseAdmin
      .storage
      .from('evidence')
      .getPublicUrl(fileName);

    // Insert the report into the database
    const { data, error } = await supabaseAdmin
      .from('reports')
      .insert([
        {
          user_id: userId,
          unit_id: unitId,
          image_path: publicUrlData?.publicUrl, // This will be the public URL of the image in storage
          notes,
          latitude,
          longitude,
          captured_at: new Date().toISOString(),
          is_offline_submission: false
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating report:', error);

      // Clean up the uploaded image if DB insertion fails
      if (uploadData) {
        await supabaseAdmin.storage.from('evidence').remove([fileName]);
      }

      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Unexpected error in report creation:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}