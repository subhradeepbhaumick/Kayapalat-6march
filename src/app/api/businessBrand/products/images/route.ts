import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.user_id || token.role !== 'businessBrand') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const businessBrandId = token.user_id;
    const { image_id, product_id } = await request.json();

    if (!image_id || !product_id) {
      return NextResponse.json({ error: 'image_id and product_id are required' }, { status: 400 });
    }

    // Check total images for this product
    const [countResult] = await executeQuery(
      `SELECT COUNT(*) as count FROM product_images WHERE product_id = ? AND dealer_id = ?`,
      [product_id, businessBrandId]
    );
    const totalImages = countResult[0]?.count || 0;

    // Rule 1: Block deletion if only one image exists
    if (totalImages <= 1) {
      return NextResponse.json(
        { error: 'LAST_IMAGE', message: 'At least one image is required for every product.' },
        { status: 400 }
      );
    }

    // Fetch the image to be deleted
    const [imageResult] = await executeQuery(
      `SELECT * FROM product_images WHERE image_id = ? AND dealer_id = ?`,
      [image_id, businessBrandId]
    );
    if (!imageResult || imageResult.length === 0) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    const imageToDelete = imageResult[0];
    const wasPrimary = imageToDelete.is_primary === 1;

    // Delete the image file from disk
    try {
      const filePath = path.join(process.cwd(), 'public', imageToDelete.image_url);
      await fs.unlink(filePath);
    } catch {
      // File might not exist on disk, continue anyway
    }

    // Delete from DB
    await executeQuery(
      `DELETE FROM product_images WHERE image_id = ? AND dealer_id = ?`,
      [image_id, businessBrandId]
    );

    // Rule 2: If deleted image was primary, promote the next image
    if (wasPrimary) {
      // Get remaining images sorted by sort_order
      const [remaining] = await executeQuery(
        `SELECT * FROM product_images WHERE product_id = ? AND dealer_id = ? ORDER BY sort_order ASC`,
        [product_id, businessBrandId]
      );

      if (remaining.length > 0) {
        // Promote first remaining image to primary with sort_order = 1
        await executeQuery(
          `UPDATE product_images SET is_primary = 1, sort_order = 1 WHERE image_id = ?`,
          [remaining[0].image_id]
        );

        // Re-number the rest sequentially starting from 2
        for (let i = 1; i < remaining.length; i++) {
          await executeQuery(
            `UPDATE product_images SET sort_order = ? WHERE image_id = ?`,
            [i + 1, remaining[i].image_id]
          );
        }
      }
    } else {
      // Just re-number remaining images to keep sort_order clean
      const [remaining] = await executeQuery(
        `SELECT * FROM product_images WHERE product_id = ? AND dealer_id = ? ORDER BY sort_order ASC`,
        [product_id, businessBrandId]
      );
      for (let i = 0; i < remaining.length; i++) {
        await executeQuery(
          `UPDATE product_images SET sort_order = ? WHERE image_id = ?`,
          [i + 1, remaining[i].image_id]
        );
      }
    }

    return NextResponse.json({ message: 'Image deleted successfully' });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}