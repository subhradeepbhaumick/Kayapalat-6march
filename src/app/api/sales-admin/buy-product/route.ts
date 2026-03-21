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
    console.log('Buy Product GET API: Request received');

    // Auth Check
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    console.log('Buy Product GET API: Token retrieved:', token ? 'Present' : 'Null');

    if (!token || !token.user_id || !token.role) {
      console.log('Buy Product GET API: Unauthorized - missing token data');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!token || !token.user_id || (token.role !== 'sales_admin' && token.role !== 'superadmin' && token.role !== 'supervisor')) {
      console.log('Buy Product GET API: Unauthorized - invalid role');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('Buy Product GET API: Authentication successful for user:', token.user_id, 'role:', token.role);

    const connection = await mysql.createConnection(dbConfig);

    // Fetch cart items where booking_status is 'pending', ordered by created_at DESC
    // Also fetch sell_mrp from product_details
    const [cartResult] = await connection.execute(`
      SELECT
        bp.id,
        bp.order_id,
        bp.product_id,
        bp.dealer_id,
        bp.company_name,
        bp.category,
        bp.product_name,
        bp.product_type,
        bp.product_mrp,
        bp.discount_percentage,
        bp.discount,
        bp.gst,
        bp.gst_amount,
        bp.changed_price,
        bp.quantity,
        bp.discounted_ammount as discounted_amount,
        bp.transport_exclude,
        bp.billed_date,
        bp.delivery_date,
        bp.booking_status,
        bp.client_name,
        bp.client_phone,
        bp.action,
        bp.agent_id,
        bp.created_at,
        bp.updated_at,
        bp.o_id
      , pd.sell_mrp
      FROM buy_product bp
      LEFT JOIN product_details pd ON bp.product_id = pd.product_id
      WHERE bp.booking_status = 'pending'
      ORDER BY bp.created_at DESC
    `);

    const cartItems = cartResult as mysql.RowDataPacket[];

    // Fetch images for each product
    const cartWithImages = await Promise.all(
      cartItems.map(async (item: any) => {
        const [images] = await connection.execute(`
          SELECT
            image_id,
            image_url,
            image_alt_text,
            is_primary,
            sort_order
          FROM product_images
          WHERE product_id = ?
          ORDER BY sort_order ASC
        `, [item.product_id]) as [mysql.RowDataPacket[], any];

        return {
          ...item,
          images: (images || []).map((img: any) => ({
            ...img,
            image_url: (img.image_url && (img.image_url.startsWith('http') || img.image_url.startsWith('/')))
              ? img.image_url
              : (img.image_url ? `/product_images/${img.image_url}` : '')
          }))
        };
      })
    );

    await connection.end();

    console.log('Buy Product GET API: Fetched cart items:', cartWithImages.length);

    return NextResponse.json({ cart: cartWithImages });
  } catch (error) {
    console.error('Buy Product GET API: Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart items' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('Buy Product API: Request received');
    console.log('Buy Product API: Request URL:', req.url);
    console.log('Buy Product API: Request method:', req.method);

    // Auth Check
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    console.log('Buy Product API: Token retrieved:', token ? 'Present' : 'Null');
    console.log('Buy Product API: Token user_id:', token?.user_id);
    console.log('Buy Product API: Token role:', token?.role);

    if (!token || !token.user_id || !token.role) {
      console.log('Buy Product API: Unauthorized - missing token data');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!token || !token.user_id || (token.role !== 'sales_admin' && token.role !== 'superadmin' && token.role !== 'supervisor')) {
      console.log('Buy Product API: Unauthorized - invalid role');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log('Buy Product API: Request body received:', JSON.stringify(body, null, 2));

    const {
      product_id,
      dealer_id,
      agent_id,
      company_name,
      category,
      product_name,
      product_mrp,
      discount_percentage,
      discount,
      gst,
      gst_amount,
      gst_exclude,
      quantity,
      discounted_ammount,
      changed_price,
      transport_exclude,
      billed_date,
      delivery_date,
      action,
      client_name
    } = body;

    console.log('Buy Product API: Extracted fields:');
    console.log('  product_id:', product_id);
    console.log('  dealer_id:', dealer_id);
    console.log('  company_name:', company_name);
    console.log('  category:', category);
    console.log('  product_name:', product_name);
    console.log('  product_mrp:', product_mrp);
    console.log('  discount_percentage:', discount_percentage);
    console.log('  discount:', discount);
    console.log('  gst:', gst);
    console.log('  gst_amount:', gst_amount);
    console.log('  quantity:', quantity);
    console.log('  discounted_ammount:', discounted_ammount);
    console.log('  changed_price:', changed_price);
    console.log('  billed_date:', billed_date);
    console.log('  delivery_date:', delivery_date);
    console.log('  action:', action);
    console.log('  client_name:', client_name);
    console.log('  agent_id:', agent_id);

    // Generate simple order_id
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const order_id = `ORD-${timestamp}-${random}`;
    console.log('Buy Product API: Generated order_id:', order_id);

    console.log('Buy Product API: Connecting to database');
    const connection = await mysql.createConnection(dbConfig);
    console.log('Buy Product API: Database connection established');

    const query = `
      INSERT INTO buy_product (
        order_id,
        product_id,
        dealer_id,
        agent_id,
        company_name,
        category,
        product_name,
        product_mrp,
        discount_percentage,
        discount,
        gst,
        gst_amount,
        quantity,
        discounted_ammount,
        changed_price,
        transport_exclude,
        billed_date,
        delivery_date,
        action,
        booking_status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
    `;

    const values = [
      order_id,
      product_id,
      dealer_id,
      agent_id,
      company_name,
      category,
      product_name,
      product_mrp,
      discount_percentage,
      discount,
      gst,
      gst_amount,
      quantity,
      discounted_ammount,
      changed_price,
      transport_exclude,
      billed_date || new Date().toISOString().split('T')[0], // current date if not provided
      delivery_date || null,
      action || 'Added to cart'
    ];

    console.log('Buy Product API: Executing insert query with values:', values);

    const [result] = await connection.execute(query, values);
    console.log('Buy Product API: Insert result:', result);

    await connection.end();
    console.log('Buy Product API: Database connection closed');

    console.log('Buy Product API: Product added to cart successfully, order_id:', order_id);
    return NextResponse.json({ success: true, order_id });
  } catch (error) {
    console.error('Buy Product API: Error inserting into buy_product:', error);
    console.error('Buy Product API: Error stack:', error instanceof Error ? error.stack : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to add product to buy_product table' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    console.log('Buy Product PUT API: Request received');

    // Auth Check
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.user_id || (token.role !== 'sales_admin' && token.role !== 'superadmin' && token.role !== 'supervisor')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { order_id, quantity, discounted_amount, client_name } = body;

    const connection = await mysql.createConnection(dbConfig);

    if (client_name) {
      // Update client_name for order_ids
      const orderIds = Array.isArray(order_id) ? order_id : [order_id];
      for (const id of orderIds) {
        await connection.execute(`UPDATE buy_product SET client_name = ?, updated_at = NOW() WHERE order_id = ? AND booking_status = 'pending'`, [client_name, id]);
      }
      console.log('Buy Product PUT: Updated client_name for order_ids:', orderIds);
    } else if (quantity != null) {
      // Update quantity and discounted_amount
      const orderIds = Array.isArray(order_id) ? order_id : [order_id];
      if (orderIds.length === 0 || quantity == null) {
        return NextResponse.json({ error: 'order_id and quantity are required' }, { status: 400 });
      }

      for (const id of orderIds) {
        if (quantity > 0) {
          const query = `UPDATE buy_product SET quantity = ?, discounted_ammount = ?, updated_at = NOW() WHERE order_id = ? AND booking_status = 'pending'`;
          const [result] = await connection.execute(query, [quantity, discounted_amount, id]);
          console.log('Buy Product PUT: Update result for', id, ':', result);
        } else {
          // Delete if quantity <= 0
          const query = `DELETE FROM buy_product WHERE order_id = ? AND booking_status = 'pending'`;
          const [result] = await connection.execute(query, [id]);
          console.log('Buy Product PUT: Delete result for', id, ':', result);
        }
      }
    } else {
      return NextResponse.json({ error: 'Either quantity or client_name must be provided' }, { status: 400 });
    }

    await connection.end();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Buy Product PUT API: Error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    console.log('Buy Product DELETE API: Request received');

    // Auth Check
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.user_id || (token.role !== 'sales_admin' && token.role !== 'superadmin' && token.role !== 'supervisor')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { product_id, order_id } = body;

    const connection = await mysql.createConnection(dbConfig);

    let query, params;
    if (order_id) {
      // Delete specific order
      query = `DELETE FROM buy_product WHERE order_id = ? AND booking_status = 'pending'`;
      params = [order_id];
    } else if (product_id) {
      // Delete all for product
      query = `DELETE FROM buy_product WHERE product_id = ? AND booking_status = 'pending'`;
      params = [product_id];
    } else {
      return NextResponse.json({ error: 'product_id or order_id required' }, { status: 400 });
    }

    const [result] = await connection.execute(query, params);
    console.log('Buy Product DELETE: Result:', result);

    await connection.end();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Buy Product DELETE API: Error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}