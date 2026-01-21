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

    // Parse JSON data (for offline sync)
    const jsonData = await request.json();
    
    const { imageData, notes, latitude, longitude, unitId, userId: userIdFromData, categoryId, locationId, capturedAt } = jsonData;

    // Validate required fields
    if (!latitude || !longitude || !unitId || !userIdFromData || !categoryId || !locationId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the user ID matches the authenticated user
    if (userId !== userIdFromData) {
      return Response.json({ error: 'Unauthorized: User ID mismatch' }, { status: 401 });
    }

    // Get Supabase client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let imageUrl = null;

    // Upload image if it exists (from base64 data)
    if (imageData) {
      // Convert base64 image data to ArrayBuffer for upload
      const base64Response = await fetch(imageData);
      const blob = await base64Response.blob();
      const buffer = await blob.arrayBuffer();

      // Generate unique filename
      const fileName = `evidence/${userId}/${Date.now()}_offline.jpg`;

      // Upload image to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin
        .storage
        .from('evidence')
        .upload(fileName, buffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
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

      imageUrl = publicUrlData?.publicUrl;
    }

    // Insert the report into the database
    const { data, error } = await supabaseAdmin
      .from('reports')
      .insert([
        {
          user_id: userId,
          unit_id: unitId,
          image_path: imageUrl, // This will be the public URL of the image in storage
          notes: notes || '',
          latitude,
          longitude,
          category_id: categoryId,
          location_id: locationId,
          captured_at: capturedAt || new Date().toISOString(),
          is_offline_submission: true
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating report:', error);

      // Clean up the uploaded image if DB insertion fails
      if (imageUrl) {
        const fileName = `evidence/${userId}/${Date.now()}_offline.jpg`;
        await supabaseAdmin.storage.from('evidence').remove([fileName]);
      }

      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Unexpected error in offline report sync:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}