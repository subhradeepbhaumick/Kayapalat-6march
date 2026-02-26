import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedUrl } from '@/lib/uploadController.js';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const expiresIn = searchParams.get('expiresIn');

    if (!key) {
      return NextResponse.json({
        success: false,
        error: 'File key is required'
      }, { status: 400 });
    }

    // Validate and parse expiresIn (optional, defaults to 1 hour)
    let expiresInSeconds = 3600; // 1 hour default
    if (expiresIn) {
      const parsed = parseInt(expiresIn);
      if (isNaN(parsed) || parsed < 300 || parsed > 604800) { // 5 minutes to 7 days
        return NextResponse.json({
          success: false,
          error: 'expiresIn must be between 300 and 604800 seconds (5 minutes to 7 days)'
        }, { status: 400 });
      }
      expiresInSeconds = parsed;
    }

    const signedUrl = await generatePresignedUrl(key, expiresInSeconds);

    return NextResponse.json({
      success: true,
      signedUrl,
      key,
      expiresIn: expiresInSeconds,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString()
    });
  } catch (error: any) {
    console.error('[SIGNED_URL_ERROR]', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate signed URL'
    }, { status: 500 });
  }
}
