import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.user_id || token.role !== 'sales_admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const dealerId = token.user_id;

    // Fetch composite_gst_scheme from manufacturer table
    const [manufacturerResult] = await executeQuery(`
      SELECT composite_gst_scheme FROM manufacturer WHERE dealer_id = ?
    `, [dealerId]);

    if (manufacturerResult.length === 0) {
      return NextResponse.json(
        { error: 'Manufacturer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      composite_gst_scheme: manufacturerResult[0].composite_gst_scheme
    });

  } catch (error) {
    console.error('Error fetching manufacturer GST scheme:', error);
    return NextResponse.json(
      { error: 'Failed to fetch manufacturer data' },
      { status: 500 }
    );
  }
}
