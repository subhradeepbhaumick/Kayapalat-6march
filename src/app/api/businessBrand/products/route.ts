import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

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

    // Fetch products for this business brand
    const [productsResult] = await executeQuery(`
      SELECT * FROM product_details WHERE dealer_id = ? ORDER BY created_at DESC
    `, [businessBrandId]);

    // For each product, fetch associated images
    const productsWithImages = await Promise.all(productsResult.map(async (product: any) => {
      const [imagesResult] = await executeQuery(`
        SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC
      `, [product.product_id]);

      return {
        ...product,
        images: imagesResult
      };
    }));

    return NextResponse.json({
      products: productsWithImages
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.user_id || token.role !== 'businessBrand') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const businessBrandId = token.user_id;

    // Parse FormData
    const formData = await request.formData();

    // Extract fields
    const category = formData.get('category') as string;
    const productName = formData.get('productName') as string;
    const description = formData.get('description') as string;
    const aboutProduct = formData.get('aboutProduct') as string;
    const productType = formData.get('productType') as string || 'unit';
    const sellingMrp = parseFloat(formData.get('sellingMrp') as string) || 0;
    const mrp = parseFloat(formData.get('mrp') as string) || 0;

    // Pricing configuration
    const commissionPercentage = parseFloat(formData.get('commissionPercentage') as string) || 0;
    const gstIncluded = formData.get('gstIncluded') === 'true';
    const gstPercentage = parseFloat(formData.get('gstPercentage') as string) || 18;
    const transportationIncluded = formData.get('transportationIncluded') === 'true';
    const transportationCost = parseFloat(formData.get('transportationCost') as string) || 0;
    const transportExclude = formData.get('transportExclude') === '1' ? 1 : 0;

    // Calculate costs
    const commission_percentage = commissionPercentage;
    const commission = mrp * (commissionPercentage / 100);
    const gstOnCommission = commission * 0.18;
    const commission_amount = commission + gstOnCommission;
    const gst_percentage = gstPercentage;
    const gst_exclude = gstIncluded ? 0 : 1;
    const gst_amount = gstIncluded ? ((mrp * 100) / (100 + gstPercentage)) * (gstPercentage / 100) : mrp * (gstPercentage / 100);
    const transportation_cost = transportExclude ? 0 : (transportationIncluded ? 0 : transportationCost);
    const base_mrp = mrp;
    const final_product_cost = gstIncluded ? (mrp + commission_amount + transportation_cost) : (mrp + commission_amount + gst_amount + transportation_cost);

    // Insert product details
    const [insertResult] = await executeQuery(`
      INSERT INTO product_details (
        dealer_id, category, product_name, short_description, about_product, product_type, sell_mrp, mrp,
        commission_percentage, commission_amount, gst_percentage, gst_exclude, gst_amount,
        transportation_cost, transport_exclude, base_mrp, final_product_cost, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `, [
      businessBrandId, category, productName, description, aboutProduct, productType, sellingMrp, mrp,
      commission_percentage, commission_amount, gst_percentage, gst_exclude, gst_amount,
      transportation_cost, transportExclude, base_mrp, final_product_cost
    ]);

    const productId = (insertResult as any).insertId;

    // Handle image uploads
    const images = formData.getAll('images') as File[];
    if (images.length > 0) {
      // Ensure the product_images directory exists
      const dirPath = path.join(process.cwd(), 'public/product_images');
      await fs.mkdir(dirPath, { recursive: true });

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (image.size > 0) {
          // Generate unique filename
          const fileExtension = path.extname(image.name);
          const fileName = `${productId}_${i + 1}_${Date.now()}${fileExtension}`;
          const filePath = path.join(dirPath, fileName);

          // Convert file to buffer and save
          const buffer = Buffer.from(await image.arrayBuffer());
          await fs.writeFile(filePath, buffer);

          const imageUrl = `/product_images/${fileName}`;

          // Insert image record
          await executeQuery(`
            INSERT INTO product_images (
              product_id, dealer_id, image_url, image_alt_text, is_primary, sort_order, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())
          `, [
            productId,
            businessBrandId,
            imageUrl,
            `${productName} - Image ${i + 1}`,
            i === 0 ? 1 : 0, // First image is primary
            i + 1
          ]);
        }
      }
    }

    return NextResponse.json({
      message: 'Product added successfully',
      product_id: productId
    });

  } catch (error) {
    console.error('Error adding product:', error);
    return NextResponse.json(
      { error: 'Failed to add product' },
      { status: 500 }
    );
  }
}

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

    // Check if this is a stock status update
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const body = await request.json();
      const { productId, inStock_sts } = body;

      if (productId && typeof inStock_sts === 'boolean') {
        // Update only stock status
        await executeQuery(`
          UPDATE product_details SET
            inStock_sts = ?, updated_at = NOW()
          WHERE product_id = ? AND dealer_id = ?
        `, [inStock_sts ? 1 : 0, productId, businessBrandId]);

        return NextResponse.json({
          message: 'Stock status updated successfully'
        });
      }
    }

    // Parse FormData for full product update
    const formData = await request.formData();

    const productId = parseInt(formData.get('productId') as string);
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Verify product belongs to this business brand
    const [productCheck] = await executeQuery(`
      SELECT product_id FROM product_details WHERE product_id = ? AND dealer_id = ?
    `, [productId, businessBrandId]);

    if (productCheck.length === 0) {
      return NextResponse.json(
        { error: 'Product not found or unauthorized' },
        { status: 404 }
      );
    }

    // Extract fields
    const category = formData.get('category') as string;
    const productName = formData.get('productName') as string;
    const description = formData.get('description') as string;
    const aboutProduct = formData.get('aboutProduct') as string;
    const productType = formData.get('productType') as string || 'unit';
    const sellingMrp = parseFloat(formData.get('sellingMrp') as string) || 0;
    const mrp = parseFloat(formData.get('mrp') as string) || 0;

    // Pricing configuration
    const commissionPercentage = parseFloat(formData.get('commissionPercentage') as string) || 0;
    const gstIncluded = formData.get('gstIncluded') === 'true';
    const gstPercentage = parseFloat(formData.get('gstPercentage') as string) || 18;
    const transportationIncluded = formData.get('transportationIncluded') === 'true';
    const transportationCost = parseFloat(formData.get('transportationCost') as string) || 0;
    const transportExclude = formData.get('transportExclude') === '1' ? 1 : 0;

    // Calculate costs
    const commission_percentage = commissionPercentage;
    const commission = mrp * (commissionPercentage / 100);
    const gstOnCommission = commission * 0.18;
    const commission_amount = commission + gstOnCommission;
    const gst_percentage = gstPercentage;
    const gst_exclude = gstIncluded ? 0 : 1;
    const gst_amount = gstIncluded ? ((mrp * 100) / (100 + gstPercentage)) * (gstPercentage / 100) : mrp * (gstPercentage / 100);
    const transportation_cost = transportExclude ? 0 : (transportationIncluded ? 0 : transportationCost);
    const base_mrp = mrp;
    const final_product_cost = gstIncluded ? (mrp + commission_amount + transportation_cost) : (mrp + commission_amount + gst_amount + transportation_cost);

    // Update product details
    await executeQuery(`
      UPDATE product_details SET
        category = ?, product_name = ?, short_description = ?, about_product = ?, product_type = ?, sell_mrp = ?, mrp = ?,
        commission_percentage = ?, commission_amount = ?, gst_percentage = ?, gst_amount = ?,
        transportation_cost = ?, transport_exclude = ?, base_mrp = ?, final_product_cost = ?, updated_at = NOW()
      WHERE product_id = ? AND dealer_id = ?
    `, [
      category, productName, description, aboutProduct, productType, sellingMrp, mrp,
      commission_percentage, commission_amount, gst_percentage, gst_amount,
      transportation_cost, transportExclude, base_mrp, final_product_cost, productId, businessBrandId
    ]);

    // Handle new image uploads (optional)
    const images = formData.getAll('images') as File[];
    if (images.length > 0) {
      // Get current max sort_order
      const [maxSortResult] = await executeQuery(`
        SELECT MAX(sort_order) as max_sort FROM product_images WHERE product_id = ?
      `, [productId]);
      let nextSortOrder = (maxSortResult[0].max_sort || 0) + 1;

      // Ensure the product_images directory exists
      const dirPath = path.join(process.cwd(), 'public/product_images');
      await fs.mkdir(dirPath, { recursive: true });

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (image.size > 0) {
          // Generate unique filename
          const fileExtension = path.extname(image.name);
          const fileName = `${productId}_${nextSortOrder}_${Date.now()}${fileExtension}`;
          const filePath = path.join(dirPath, fileName);

          // Convert file to buffer and save
          const buffer = Buffer.from(await image.arrayBuffer());
          await fs.writeFile(filePath, buffer);

          const imageUrl = `/product_images/${fileName}`;

          // Insert image record
          await executeQuery(`
            INSERT INTO product_images (
              product_id, dealer_id, image_url, image_alt_text, is_primary, sort_order, created_at
            ) VALUES (?, ?, ?, ?, 0, ?, NOW())
          `, [
            productId,
            businessBrandId,
            imageUrl,
            `${productName} - Image ${nextSortOrder}`,
            nextSortOrder
          ]);

          nextSortOrder++;
        }
      }
    }

    return NextResponse.json({
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}
