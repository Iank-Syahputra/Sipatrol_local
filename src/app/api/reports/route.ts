import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route'; // Import the auth options
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting report creation...'); // Debug log

    // Verify the user is authenticated using NextAuth
    const session = await getServerSession(authOptions);
    console.log('Session retrieved:', !!session, session?.user?.id); // Debug log

    if (!session || !session.user) {
      console.log('Unauthorized access - no session or user'); // Debug log
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id as string;
    console.log('User ID from session:', userId); // Debug log

    // Parse form data
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const notes = formData.get('notes') as string;
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    const unitId = formData.get('unitId') as string;
    const userIdFromForm = formData.get('userId') as string;
    const categoryId = formData.get('categoryId') as string;
    const locationId = formData.get('locationId') as string;
    const capturedAtStr = formData.get('capturedAt') as string;
    const isOfflineSubmission = formData.get('is_offline_submission') === 'true';

    console.log('Form data received:', { // Debug log
      hasImage: !!image,
      notes: notes?.substring(0, 20) + '...',
      latitude,
      longitude,
      unitId,
      userIdFromForm,
      categoryId,
      locationId,
      capturedAtStr,
      isOfflineSubmission
    });

    // Validate required fields (userId comes from session, not form)
    if (!image || !latitude || !longitude || !unitId || !categoryId || !locationId) {
      console.log('Validation failed - missing required fields'); // Debug log
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Note: We trust the session user ID and don't validate against form data for security
    // The userIdFromForm is ignored as we use the authenticated session user ID

    // Generate unique filename for local storage
    const fileName = `${uuidv4()}_${image.name}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'evidence');

    // Ensure upload directory exists
    const fs = require('fs');
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('Upload directory created:', uploadDir); // Debug log
      }
    } catch (mkdirError) {
      console.error('Error creating upload directory:', mkdirError); // Debug log
      throw new Error('Failed to create upload directory: ' + (mkdirError as Error).message);
    }

    const filePath = path.join(uploadDir, fileName);

    // Convert File to Buffer for saving
    const buffer = Buffer.from(await image.arrayBuffer());

    // Save image to local storage
    try {
      await writeFile(filePath, buffer);
      console.log('Image saved successfully:', fileName); // Debug log
    } catch (fileError) {
      console.error('Error saving image file:', fileError); // Debug log
      throw new Error('Failed to save image file: ' + (fileError as Error).message);
    }

    console.log('Attempting to create report in database...'); // Debug log
    // Insert the report into the database using Prisma
    const report = await prisma.report.create({
      data: {
        userId: userId, // Use the session user ID, not from form (Prisma model field name)
        unitId: unitId, // Prisma model field name
        imagePath: `/uploads/evidence/${fileName}`, // Store relative path for serving from Next.js (Prisma model field name)
        notes,
        latitude,
        longitude,
        categoryId: categoryId, // Prisma model field name
        locationId: locationId, // Prisma model field name
        capturedAt: capturedAtStr ? new Date(capturedAtStr) : new Date(), // Use capturedAt from form data if available (Prisma model field name)
        isOfflineSubmission: isOfflineSubmission // Prisma model field name
      }
    });

    console.log('Report created successfully:', report.id); // Debug log
    return Response.json({ success: true, data: report });
  } catch (error) {
    console.error('Unexpected error in report creation:', error); // Debug log
    return Response.json({ error: 'Internal server error: ' + (error as Error).message }, { status: 500 });
  }
}