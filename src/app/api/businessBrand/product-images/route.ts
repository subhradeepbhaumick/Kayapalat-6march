import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.user_id || token.role !== 'businessBrand') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const businessBrandId = token.user_id;

    console.log('Product Images API: Request received');
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('product_id');
    const orderId = searchParams.get('order_id');
    console.log('Product Images API: productId:', productId, 'orderId:', orderId);

    if (!productId && !orderId) {
      console.log('Product Images API: No productId or orderId provided');
      return NextResponse.json({ error: 'Either Product ID or Order ID is required' }, { status: 400 });
    }

    let targetProductId = productId;
    console.log('Product Images API: Initial targetProductId:', targetProductId);

    // If order_id is provided, look up the product_id from buy_product table
    // Ensure the order belongs to the authenticated business brand
    if (orderId && !productId) {
      console.log('Product Images API: Looking up product_id for orderId:', orderId);
      const [orderResult] = await executeQuery(
        'SELECT product_id FROM buy_product WHERE order_id = ? AND dealer_id = ?',
        [orderId, businessBrandId]
      );
      console.log('Product Images API: orderResult:', orderResult);

      if (!orderResult || orderResult.length === 0) {
        console.log('Product Images API: Order not found or unauthorized');
        return NextResponse.json({ error: 'Order not found or unauthorized', debug: { orderId, businessBrandId } }, { status: 404 });
      }

      targetProductId = orderResult[0].product_id;
      console.log('Product Images API: Updated targetProductId:', targetProductId);

      // Validate that targetProductId is valid
      if (!targetProductId) {
        console.log('Product Images API: Product ID is null/undefined in order');
        return NextResponse.json({ error: 'Invalid product ID in order', debug: { orderId, targetProductId } }, { status: 400 });
      }
    }

    // If productId is provided directly, ensure it belongs to the business brand
    if (productId) {
      const [productCheck] = await executeQuery(
        'SELECT product_id FROM product_details WHERE product_id = ? AND dealer_id = ?',
        [productId, businessBrandId]
      );
      if (!productCheck || productCheck.length === 0) {
        return NextResponse.json({ error: 'Product not found or unauthorized', debug: { productId, businessBrandId } }, { status: 404 });
      }
    }

    // Validate targetProductId is set before querying images
    if (!targetProductId) {
      console.log('Product Images API: targetProductId is still not set');
      return NextResponse.json({ error: 'Unable to determine product ID', debug: { productId, orderId } }, { status: 400 });
    }

    console.log('Product Images API: Fetching images for productId:', targetProductId);
    const [images] = await executeQuery(
      'SELECT image_id, image_url, image_alt_text, is_primary, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order ASC',
      [targetProductId]
    );
    console.log('Product Images API: Raw images from DB:', images);

    // Process image URLs to ensure they are correctly formatted for Next.js public folder
    // Handle various formats: absolute, relative, with/without product_images prefix
    if (!Array.isArray(images)) {
      console.log('Product Images API: Images is not an array, received:', typeof images, images);
      return NextResponse.json({ images: [] });
    }

    const processedImages = images
      .map((img: any) => {
        if (!img || !img.image_url) {
          console.log('Product Images API: Skipping image with no URL:', img);
          return null;
        }
        return {
          image_id: img.image_id,
          image_url: img.image_url.startsWith('http') 
            ? img.image_url 
            : img.image_url.startsWith('/') 
            ? img.image_url 
            : img.image_url.startsWith('product_images') 
            ? `/${img.image_url}` 
            : `/product_images/${img.image_url}`,
          image_alt_text: img.image_alt_text || '',
          is_primary: img.is_primary || false,
          sort_order: img.sort_order || 0
        };
      })
      .filter((img): img is NonNullable<typeof img> => img !== null);
    
    console.log('Product Images API: Processed images count:', processedImages.length, processedImages);

    return NextResponse.json({ images: processedImages });
  } catch (error) {
    console.error('Error fetching product images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}