import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Verify the user is authenticated using NextAuth
    const session = await getServerSession();

    if (!session || !session.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id as string;

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

    // Validate required fields
    if (!image || !latitude || !longitude || !unitId || !userIdFromForm || !categoryId || !locationId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the user ID matches the authenticated user
    if (userId !== userIdFromForm) {
      return Response.json({ error: 'Unauthorized: User ID mismatch' }, { status: 401 });
    }

    // Generate unique filename for local storage
    const fileName = `${uuidv4()}_${image.name}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'evidence');

    // Ensure upload directory exists
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);

    // Convert File to Buffer for saving
    const buffer = Buffer.from(await image.arrayBuffer());

    // Save image to local storage
    await writeFile(filePath, buffer);

    // Insert the report into the database using Prisma
    const report = await prisma.report.create({
      data: {
        user_id: userId,
        unit_id: unitId,
        image_path: `/uploads/evidence/${fileName}`, // Store relative path for serving from Next.js
        notes,
        latitude,
        longitude,
        category_id: categoryId,
        location_id: locationId,
        captured_at: new Date().toISOString(),
        is_offline_submission: false
      }
    });

    return Response.json({ success: true, data: report });
  } catch (error) {
    console.error('Unexpected error in report creation:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}