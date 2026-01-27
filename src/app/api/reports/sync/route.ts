import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated using NextAuth
    const session = await getServerSession();

    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id as string;

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

    let imagePath = null;

    // Save image if it exists (from base64 data)
    if (imageData) {
      // Generate unique filename for local storage
      const fileName = `${uuidv4()}_offline.jpg`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'evidence');

      // Ensure upload directory exists
      const fs = require('fs');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, fileName);

      // Extract base64 data (remove data:image/jpeg;base64, prefix)
      const base64Data = imageData.replace(/^data:image\/jpeg;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // Save image to local storage
      await writeFile(filePath, imageBuffer);

      imagePath = `/uploads/evidence/${fileName}`;
    }

    // Insert the report into the database using Prisma
    const report = await prisma.report.create({
      data: {
        userId: userId,
        unitId: unitId,
        imagePath: imagePath, // Store relative path for serving from Next.js
        notes: notes || '',
        latitude,
        longitude,
        categoryId: categoryId,
        locationId: locationId,
        capturedAt: capturedAt ? new Date(capturedAt) : new Date(),
        isOfflineSubmission: true
      }
    });

    return Response.json({ success: true, data: report });
  } catch (error) {
    console.error('Unexpected error in offline report sync:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}