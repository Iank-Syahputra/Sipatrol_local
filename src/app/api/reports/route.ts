import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { writeFile, readFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// ============================================
// ZOD SCHEMA VALIDATION (SRS-NF-006)
// ============================================

// Schema untuk report creation
const createReportSchema = z.object({
  image: z.instanceof(File, { message: 'Image file is required' }),
  notes: z.string().optional(),
  latitude: z.number({ message: 'Latitude is required' }),
  longitude: z.number({ message: 'Longitude is required' }),
  unitId: z.string().uuid({ message: 'Valid unit ID is required' }),
  categoryId: z.string().uuid({ message: 'Valid category ID is required' }),
  locationId: z.string().uuid({ message: 'Valid location ID is required' }),
  capturedAt: z.string().datetime().optional(),
  isOfflineSubmission: z.boolean().default(false)
});

// Type inference dari schema
type CreateReportInput = z.infer<typeof createReportSchema>;

/**
 * Validate image file for anti-fraud purposes
 * - Check file type is JPEG (camera default)
 * - Check file size is reasonable (not too small for camera photo)
 * - Check file has valid JPEG magic numbers
 * - Check filename pattern matches camera capture format
 */
async function validateImageForAntiFraud(image: File): Promise<{ valid: boolean; error?: string }> {
  // 1. Check file type - must be image/jpeg (camera default, not PNG from gallery)
  if (image.type !== 'image/jpeg' && image.type !== 'image/jpg') {
    return { 
      valid: false, 
      error: 'Foto harus berupa JPEG. Upload dari galeri tidak diizinkan.' 
    };
  }

  // 2. Check file size - camera photos are typically > 100KB
  // Minimum 10KB to allow lower-resolution camera captures
  const MIN_FILE_SIZE = 10 * 1024; // 10KB
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  
  if (image.size < MIN_FILE_SIZE) {
    return { 
      valid: false, 
      error: 'Ukuran foto terlalu kecil. Pastikan foto diambil dari kamera, bukan galeri.' 
    };
  }

  if (image.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: 'Ukuran foto melebihi 10MB.' 
    };
  }

  // 3. Check JPEG magic numbers (first bytes should be FF D8 FF)
  const arrayBuffer = await image.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  if (buffer.length < 3) {
    return { valid: false, error: 'File gambar tidak valid.' };
  }

  // JPEG files start with FF D8 FF
  if (buffer[0] !== 0xFF || buffer[1] !== 0xD8 || buffer[2] !== 0xFF) {
    return { 
      valid: false, 
      error: 'Format file tidak valid. Foto harus diambil langsung dari kamera.' 
    };
  }

  // 4. Check filename pattern - should match camera capture format: photo_timestamp.jpg
  const filenamePattern = /^photo_\d+\.jpg$/i;
  if (!filenamePattern.test(image.name)) {
    return { 
      valid: false, 
      error: 'Nama file tidak sesuai format. Foto harus diambil dari kamera aplikasi.' 
    };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting report creation...');

    // Verify the user is authenticated using NextAuth
    const session = await getServerSession(authOptions);
    console.log('Session retrieved:', !!session, session?.user?.id);

    if (!session || !session.user) {
      console.log('Unauthorized access - no session or user');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id as string;
    console.log('User ID from session:', userId);

    // Parse form data
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const notes = formData.get('notes') as string;
    const latitudeStr = formData.get('latitude') as string;
    const longitudeStr = formData.get('longitude') as string;
    const unitId = formData.get('unitId') as string;
    const categoryId = formData.get('categoryId') as string;
    const locationId = formData.get('locationId') as string;
    const capturedAtStr = formData.get('capturedAt') as string;
    const isOfflineSubmission = formData.get('is_offline_submission') === 'true';

    console.log('Form data received:', {
      hasImage: !!image,
      notes: notes?.substring(0, 20) + '...',
      latitudeStr,
      longitudeStr,
      unitId,
      categoryId,
      locationId,
      capturedAtStr,
      isOfflineSubmission
    });

    // ============================================
    // ZOD VALIDATION (SRS-NF-006)
    // ============================================
    
    // Parse dan validate dengan Zod
    const validationResult = createReportSchema.safeParse({
      image: image || null,
      notes: notes || undefined,
      latitude: parseFloat(latitudeStr),
      longitude: parseFloat(longitudeStr),
      unitId: unitId || '',
      categoryId: categoryId || '',
      locationId: locationId || '',
      capturedAt: capturedAtStr || new Date().toISOString(),
      isOfflineSubmission
    });

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }));
      console.log('Zod validation failed:', errors);
      return Response.json({ 
        error: 'Validation failed', 
        details: errors 
      }, { status: 400 });
    }

    // ============================================
    // ANTI-FRAUD VALIDATION (SRS-F-OUT-010)
    // ============================================
    const imageValidation = await validateImageForAntiFraud(image);
    if (!imageValidation.valid) {
      console.log('Anti-fraud validation failed:', imageValidation.error);
      return Response.json({ error: imageValidation.error }, { status: 400 });
    }
    console.log('Anti-fraud validation passed');

    // Additional validation: Check GPS coordinates are within valid range
    if (latitudeStr) {
      const lat = parseFloat(latitudeStr);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return Response.json({ error: 'Invalid latitude. Must be between -90 and 90.' }, { status: 400 });
      }
    }

    if (longitudeStr) {
      const lng = parseFloat(longitudeStr);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        return Response.json({ error: 'Invalid longitude. Must be between -180 and 180.' }, { status: 400 });
      }
    }

    // Note: We trust the session user ID and don't validate against form data for security
    // The userIdFromForm is ignored as we use the authenticated session user ID

    // Generate unique filename for local storage
    const fileName = `${uuidv4()}_${image.name}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'evidence');

    // Ensure upload directory exists
    try {
      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
        console.log('Upload directory created:', uploadDir);
      }
    } catch (mkdirError) {
      console.error('Error creating upload directory:', mkdirError);
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
        unitId: validationResult.data.unitId, // Prisma model field name
        imagePath: `/uploads/evidence/${fileName}`, // Store relative path for serving from Next.js (Prisma model field name)
        notes: validationResult.data.notes,
        latitude: validationResult.data.latitude,
        longitude: validationResult.data.longitude,
        categoryId: validationResult.data.categoryId, // Prisma model field name
        locationId: validationResult.data.locationId, // Prisma model field name
        capturedAt: validationResult.data.capturedAt ? new Date(validationResult.data.capturedAt) : new Date(), // Use capturedAt from form data if available (Prisma model field name)
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