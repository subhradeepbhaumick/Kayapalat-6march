import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';

export async function PUT(req: NextRequest) {
  try {
    // 🔐 Authenticate user
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.user_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 📥 Get data from frontend
    const { productId, showroom_stock } = await req.json();

    if (!productId ||![0, 1, 2].includes(Number(showroom_stock))) {
    return NextResponse.json(
      { error: 'Invalid showroom_stock value' },
      { status: 400 });}

    // 🛡️ Ensure product belongs to logged-in dealer
    const dealerId = token.user_id;

    const checkProduct: any = await executeQuery(
      `SELECT product_id FROM product_details 
       WHERE product_id = ? AND dealer_id = ?`,
      [productId, dealerId]
    );

    if (!checkProduct || checkProduct.length === 0) {
      return NextResponse.json(
        { error: 'Product not found or access denied' },
        { status: 403 }
      );
    }

    // 🔄 Update showroom_stock
    await executeQuery(
      `UPDATE product_details 
       SET showroom_stock = ?, updated_at = NOW() 
       WHERE product_id = ?`,
      [Number(showroom_stock), productId]
    );

    return NextResponse.json({
      success: true,
      message: 'Showroom stock updated successfully',
    });

  } catch (error) {
    console.error('Showroom Stock API Error:', error);

    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}