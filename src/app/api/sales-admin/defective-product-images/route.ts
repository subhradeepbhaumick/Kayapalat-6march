import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Function to generate a timestamp-based filename (ddmmyyhhmmss-random 2digit)
const generateFilename = (originalName: string): string => {
  const now = new Date();
  const d = now.getDate().toString().padStart(2, '0');
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const y = now.getFullYear().toString().slice(-2);
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  const ss = now.getSeconds().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 90) + 10; // 2-digit random number (10-99)
  const extension = path.extname(originalName);

  return `${d}${m}${y}${hh}${mm}${ss}-${random}${extension}`;
};

export async function GET(req: NextRequest) {
  try {
    console.log('Defective Product Images API: Request received');

    // Auth Check
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.user_id || (token.role !== 'sales_admin' && token.role !== 'superadmin' && token.role !== 'businessBrand')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const orderId = url.searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    const query = `
      SELECT id, order_id, product_id, image_url, image_alt_text, is_primary, sort_order, created_at
      FROM defective_product_images
      WHERE order_id = ?
      ORDER BY sort_order ASC, created_at DESC
    `;

    const [rows] = await connection.execute(query, [orderId]);
    await connection.end();

    return NextResponse.json({ images: rows });

  } catch (error: any) {
    console.error('Defective Product Images API: Error fetching images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('Defective Product Images API: Upload request received');

    // Auth Check
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.user_id || (token.role !== 'sales_admin' && token.role !== 'superadmin' && token.role !== 'businessBrand')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const orderId = formData.get('order_id') as string;
    const productId = formData.get('product_id') as string;
    const files = formData.getAll('images') as File[];

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "At least one image is required" }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'product_issue_images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uploadedImages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Generate filename with requested format
      const filename = generateFilename(file.name);
      const filePath = path.join(uploadDir, filename);

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await fs.promises.writeFile(filePath, buffer);

      // Save to database
      const imageUrl = `/product_issue_images/${filename}`;
      const imageAltText = `Defective product image ${i + 1} for order ${orderId}`;

      const [result] = await connection.execute(
        `INSERT INTO defective_product_images
         (order_id, product_id, image_url, image_alt_text, is_primary, sort_order, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [orderId, productId || null, imageUrl, imageAltText, i === 0 ? 1 : 0, i + 1] // First image is primary
      );

      uploadedImages.push({
        id: (result as any).insertId,
        order_id: orderId,
        product_id: productId,
        image_url: imageUrl,
        image_alt_text: imageAltText,
        is_primary: i === 0 ? 1 : 0,
        sort_order: i + 1,
        created_at: new Date()
      });
    }

    await connection.end();

    return NextResponse.json({
      message: "Images uploaded successfully",
      images: uploadedImages
    });

  } catch (error: any) {
    console.error('Defective Product Images API: Error uploading images:', error);
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    console.log('Defective Product Images API: Update request received');

    // Auth Check
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.user_id || (token.role !== 'sales_admin' && token.role !== 'superadmin' && token.role !== 'businessBrand')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, image_alt_text, is_primary, sort_order } = body;

    if (!id) {
      return NextResponse.json({ error: "Image ID is required" }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    // If setting as primary, unset other primary images for this product
    if (is_primary) {
      // First get the product_id for this image
      const [imageRows] = await connection.execute(
        'SELECT product_id FROM defective_product_images WHERE id = ?',
        [id]
      );

      if ((imageRows as any[]).length > 0) {
        const productId = (imageRows as any[])[0].product_id;

        // Unset other primary images
        await connection.execute(
          'UPDATE defective_product_images SET is_primary = 0 WHERE product_id = ? AND id != ?',
          [productId, id]
        );
      }
    }

    // Update the image
    await connection.execute(
      `UPDATE defective_product_images
       SET image_alt_text = ?, is_primary = ?, sort_order = ?
       WHERE id = ?`,
      [image_alt_text || '', is_primary ? 1 : 0, sort_order || 1, id]
    );

    await connection.end();

    return NextResponse.json({ message: "Image updated successfully" });

  } catch (error: any) {
    console.error('Defective Product Images API: Error updating image:', error);
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    console.log('Defective Product Images API: Delete request received');

    // Auth Check
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.user_id || (token.role !== 'sales_admin' && token.role !== 'superadmin' && token.role !== 'businessBrand')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    // 1. Get the image URL before deleting the record
    const [rows]: [any[], any] = await connection.execute(
      'SELECT image_url FROM defective_product_images WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      await connection.end();
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const imageUrl = rows[0].image_url;

    // 2. Delete the database record
    await connection.execute('DELETE FROM defective_product_images WHERE id = ?', [id]);
    await connection.end();

    // 3. Delete the file from the filesystem
    if (imageUrl) {
      try {
        const filePath = path.join(process.cwd(), 'public', imageUrl);
        await fs.promises.unlink(filePath);
      } catch (fileError: any) {
        if (fileError.code !== 'ENOENT') {
          console.error(`Failed to delete file ${imageUrl}:`, fileError);
        }
      }
    }

    return NextResponse.json({ message: 'Image deleted successfully' });
  } catch (error: any) {
    console.error('Defective Product Images API: Error deleting image:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
