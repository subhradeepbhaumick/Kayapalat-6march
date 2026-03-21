import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

export async function GET(req: NextRequest) {
  try {
    console.log('Products API: Request received');

    // --------------------------------------------------
    // Auth Check - Middleware handles authentication
    // --------------------------------------------------
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    console.log('Products API: Retrieved token:', token);

    if (!token || !token.user_id || !token.role) {
      console.log('Products API: Token validation failed - missing user_id or role');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = token;
    console.log('Products API: Decoded token:', decoded);

    if (!decoded || !decoded.user_id || (decoded.role !== 'sales_admin' && decoded.role !== 'superadmin' && token.role !== 'supervisor')) {
      console.log('Products API: Role validation failed - invalid role or missing user_id');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('Products API: Authentication successful for user:', decoded.user_id, 'role:', decoded.role);

    // Get base URL for image URLs
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const connection = await mysql.createConnection(dbConfig);

    // First, get products with manufacturer details
    const [productsResult] = await connection.execute(`
      SELECT
        pd.product_id,
        pd.dealer_id,
        pd.category,
        pd.product_name,
        pd.short_description,
        pd.about_product,
        pd.mrp,
        pd.sell_mrp,
        pd.commission_percentage,
        pd.commission_amount,
        pd.gst_percentage,
        pd.gst_exclude,
        pd.gst_amount,
        pd.transportation_cost,
        pd.transport_exclude,
        pd.base_mrp,
        pd.final_product_cost,
        pd.is_active,
        pd.created_at,
        pd.updated_at,
        m.owner_name as manufacturer_name,
        m.email as manufacturer_email,
        m.phone as manufacturer_phone,
        m.company_name,
        m.address as manufacturer_address
      FROM product_details pd
      LEFT JOIN manufacturer m ON pd.dealer_id = m.dealer_id
      ORDER BY pd.created_at DESC
    `) as [mysql.RowDataPacket[], any];

    const products = productsResult;

    // Then, get images for each product
    const productsWithImages = await Promise.all(
      products.map(async (product: any) => {
        const [images] = await connection.execute(`
          SELECT
            image_id,
            product_id,
            dealer_id,
            image_url,
            image_alt_text,
            is_primary,
            sort_order,
            created_at
          FROM product_images
          WHERE product_id = ?
          ORDER BY sort_order ASC
        `, [product.product_id]) as [mysql.RowDataPacket[], any];

        return {
          ...product,
          images: (images || [])
            .map((img: any) => ({
              ...img,
              image_url: (img.image_url && img.image_url.startsWith('http'))
                ? img.image_url
                : (img.image_url && img.image_url.startsWith('/'))
                  ? img.image_url
                  : (img.image_url ? `/product_images/${img.image_url}` : '')
            }))
            .filter((img: any) => img.image_url) // Filter out images with empty URLs
        };
      })
    );

    await connection.end();

    return NextResponse.json(productsWithImages);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
export async function PUT(req: NextRequest) {
  try {
    console.log('Products PUT API: Request received');

    // --------------------------------------------------
    // Auth Check
    // --------------------------------------------------
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.user_id || !token.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (token.role !== 'sales_admin' && token.role !== 'superadmin' && token.role !== 'supervisor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('PUT request body:', body);

    const {
      product_id,
      sell_mrp,
      mrp,
      commission_percentage,
      commission_amount,
      gst_percentage,
      gst_amount,
      transportation_cost,
      transport_exclude,
      base_mrp,
      final_product_cost,
    } = body;

    if (!product_id) {
      return NextResponse.json(
        { error: 'product_id is required' },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection(dbConfig);

    // Build the update query dynamically for partial updates
    const updateFields: string[] = [];
    const values: any[] = [];

    if (mrp !== undefined && mrp !== null && mrp !== '') {
      updateFields.push('mrp = ?');
      values.push(Number(mrp));
    }
    if (commission_percentage !== undefined && commission_percentage !== null && commission_percentage !== '') {
      updateFields.push('commission_percentage = ?');
      values.push(Number(commission_percentage));
    }
    if (commission_amount !== undefined && commission_amount !== null && commission_amount !== '') {
      updateFields.push('commission_amount = ?');
      values.push(Number(commission_amount));
    }
    if (gst_percentage !== undefined && gst_percentage !== null && gst_percentage !== '') {
      updateFields.push('gst_percentage = ?');
      values.push(Number(gst_percentage));
    }
    if (gst_amount !== undefined && gst_amount !== null && gst_amount !== '') {
      updateFields.push('gst_amount = ?');
      values.push(Number(gst_amount));
    }
    if (transportation_cost !== undefined && transportation_cost !== null && transportation_cost !== '') {
      updateFields.push('transportation_cost = ?');
      values.push(Number(transportation_cost));
    }
    if (transport_exclude !== undefined && transport_exclude !== null) {
      updateFields.push('transport_exclude = ?');
      values.push(transport_exclude ? 1 : 0);
    }
    if (base_mrp !== undefined && base_mrp !== null && base_mrp !== '') {
      updateFields.push('base_mrp = ?');
      values.push(Number(base_mrp));
    }
    if (final_product_cost !== undefined && final_product_cost !== null && final_product_cost !== '') {
      updateFields.push('final_product_cost = ?');
      values.push(Number(final_product_cost));
    }

    if (updateFields.length === 0) {
      await connection.end();
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Always update updated_at
    updateFields.push('updated_at = NOW()');

    console.log('Fields to update:', updateFields);
    console.log('Values:', values);

    const query = `
      UPDATE product_details SET
        ${updateFields.join(', ')}
      WHERE product_id = ?
    `;

    values.push(product_id);

    console.log('Final query:', query);
    console.log('Final values:', values);

    await connection.execute(query, values);
    await connection.end();

    console.log('Products PUT API: Updated pricing for product_id:', product_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Products PUT API: Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product pricing' },
      { status: 500 }
    );
  }
}
