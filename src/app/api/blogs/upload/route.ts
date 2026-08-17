// File: src/app/api/blogs/upload/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { stat, mkdir } from 'fs/promises';

/**
 * @description Handles POST requests to upload a blog post image.
 * The file is saved to the server's public directory.
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // --- Create Upload Directory if it doesn't exist ---
    // This ensures the target directory is available before saving the file.
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'blogs');
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

    // --- Sanitize filename and create a unique name ---
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '-');
    // const newFileName = `${sanitizedFileName}`;
     const newFileName = `${Date.now()}-${sanitizedFileName}`;
    const path = join(uploadDir, newFileName);

    // --- Write file to the server ---
    await writeFile(path, buffer);

    // --- Return the public URL path ---
    // This is the path that will be stored in the database.
    const publicPath = `/uploads/blogs/${newFileName}`;
    
    return NextResponse.json({ success: true, path: publicPath }, { status: 201 });

  } catch (error: any) {
    console.error('Image Upload API Error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'An unexpected error occurred during file upload.' }, { status: 500 });
  }
}
