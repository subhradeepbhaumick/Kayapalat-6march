import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.user_id || token.role !== 'businessBrand') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const businessBrandId = token.user_id;

    const body = await request.json();
    const { productId, inStock_sts } = body;

    if (!productId || typeof inStock_sts !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Update stock status
    await executeQuery(`
      UPDATE product_details SET
        is_active = ?, updated_at = NOW()
      WHERE product_id = ? AND dealer_id = ?
    `, [inStock_sts ? 1 : 0, productId, businessBrandId]);

    return NextResponse.json({
      message: 'Stock status updated successfully'
    });

  } catch (error) {
    console.error('Error updating stock status:', error);
    return NextResponse.json(
      { error: 'Failed to update stock status' },
      { status: 500 }
    );
  }
}
