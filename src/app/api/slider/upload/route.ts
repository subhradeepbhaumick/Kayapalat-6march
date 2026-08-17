// File: src/app/api/slider/upload/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { writeFile, stat, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'slider');
    try { 
        await stat(uploadDir); 
    }catch (e: any) {
        if (e.code === 'ENOENT') {
            await mkdir(uploadDir, { recursive: true });
        } else {
            console.error('Error while trying to create directory:', e);
            return NextResponse.json({ error: 'Failed to create upload directory.' }, { status: 500 });
        }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const newFileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const path = join(uploadDir, newFileName);
    
    await writeFile(path, buffer);

    const publicPath = `/uploads/slider/${newFileName}`;
    return NextResponse.json({ success: true, path: publicPath }, { status: 201 });
  }catch (error: any) {
    console.error('Image Upload API Error:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ error: 'An unexpected error occurred during file upload.' }, { status: 500 });
  }
}