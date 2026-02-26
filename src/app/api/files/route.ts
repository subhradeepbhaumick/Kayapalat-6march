import { NextRequest, NextResponse } from 'next/server';
import { writeFile, stat, mkdir } from 'fs/promises';
import { join } from 'path';

// Max per-image size (bytes)
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // Enforce size limit
    if (typeof file.size === 'number' && file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: `File exceeds maximum size of ${MAX_FILE_SIZE_BYTES} bytes` }, { status: 400 });
    }

    // Choose upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'files');
    try {
      await stat(uploadDir);
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        await mkdir(uploadDir, { recursive: true });
      } else {
        console.error('Error while trying to create directory:', e);
        return NextResponse.json({ error: 'Failed to create upload directory.' }, { status: 500 });
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '-');
    const newFileName = `${Date.now()}-${sanitizedFileName}`;
    const path = join(uploadDir, newFileName);

    await writeFile(path, buffer);

    const publicPath = `/uploads/files/${newFileName}`;

    // Return consistent payload with `path` key (frontend expects data.path)
    return NextResponse.json({ path: publicPath }, { status: 201 });
  } catch (error: any) {
    console.error('File Upload API Error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'An unexpected error occurred during file upload.' }, { status: 500 });
  }
}
