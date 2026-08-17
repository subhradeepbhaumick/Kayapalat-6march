import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let imagePath = searchParams.get('path');

  if (!imagePath) {
    return NextResponse.json({ error: 'Image path is required.' }, { status: 400 });
  }

  // Normalize the key: remove leading slash if it exists for backward compatibility.
  const normalizedKey = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;

  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const isClientUser = token?.role === 'Client';
    const isClientDesign = normalizedKey.startsWith('clientdesigns/');

    // Serve from local public directory
    const localPath = join(process.cwd(), 'public', normalizedKey);

    try {
      const imageBuffer = await readFile(localPath);

      // Watermark client-specific designs for client users
      if (isClientUser && isClientDesign) {
        const watermarkSvg = `
          <svg width="300" height="100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <style>
                .watermark { font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; fill: rgba(255,255,255,0.7); stroke: rgba(0,0,0,0.5); stroke-width: 1; }
              </style>
            </defs>
            <text x="150" y="50" text-anchor="middle" class="watermark" transform="rotate(-30)">KAYAPALAT</text>
          </svg>
        `;

        // Apply watermark using Sharp
        const watermarkedImage = await sharp(imageBuffer)
          .composite([{
            input: Buffer.from(watermarkSvg),
            gravity: 'center'
          }])
          .jpeg({ quality: 90 })
          .toBuffer();

        return new NextResponse(watermarkedImage as any, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          },
        });
      } else {
        // Serve without watermark for non-clients or non-client-designs
        let contentType = 'image/jpeg';
        if (normalizedKey.endsWith('.png')) {
          contentType = 'image/png';
        } else if (normalizedKey.endsWith('.webp')) {
          contentType = 'image/webp';
        } else if (normalizedKey.endsWith('.bmp')) {
          contentType = 'image/bmp';
        }

        return new NextResponse(imageBuffer, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
    } catch (fileError) {
      console.error(`[LOCAL_IMAGE_ERROR] Failed to read local file: ${localPath}`, fileError);
      return NextResponse.json({ error: 'Image not found.' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`[IMAGE_RESOLVER_FAILURE] Failed to resolve image for key: ${normalizedKey} (original key: ${imagePath})`, error);
    return NextResponse.json({ error: 'Failed to resolve image.', details: error.message }, { status: 500 });
  }
}
