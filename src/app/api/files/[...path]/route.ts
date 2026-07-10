import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(_req: Request, { params }: { params: { path: string[] } }) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'uploads', ...params.path);
    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === '.png' ? 'image/png' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400'
      },
    });
  } catch {
    return new NextResponse('File not found', { status: 404 });
  }
}
