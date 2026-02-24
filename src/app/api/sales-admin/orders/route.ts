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
    console.log('Orders API: Request received');

    // Auth Check
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.user_id || (token.role !== 'sales_admin' && token.role !== 'superadmin')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await mysql.createConnection(dbConfig);

    const query = `
      SELECT bp.*,
             m.company_name ,
             m.email,
             m.phone,
             m.whatsapp,
             m.address,
             bp2.client_name,
             bp2.client_gstin,
             bp2.client_phone,
             bp2.payment_type,
             bp2.transaction_id,
             bp2.delivery_type,
             bp2.site_address,
             bp2.extra_trsnsport_cost as extra_transport_cost,
             bp2.advance,
             bp2.due,
             COALESCE(pi.images, JSON_ARRAY()) as images
      FROM buy_product bp
      LEFT JOIN manufacturer m ON bp.dealer_id = m.dealer_id
      LEFT JOIN \`bought-product\` bp2 ON bp.o_id = bp2.o_id
      LEFT JOIN (
        SELECT product_id,
               JSON_ARRAYAGG(
                 JSON_OBJECT(
                   'image_id', image_id,
                   'image_url', image_url,
                   'image_alt_text', image_alt_text,
                   'is_primary', is_primary,
                   'sort_order', sort_order
                 )
               ) as images
        FROM product_images
        GROUP BY product_id
      ) pi ON bp.product_id = pi.product_id
      WHERE bp.booking_status != 'pending'
      ORDER BY bp.created_at DESC
    `;

    const [rows] = await connection.execute(query);
    const orders = rows as any[];

    await connection.end();
 // 🔹 Fetch entire bought-product table data
    const connection2 = await mysql.createConnection(dbConfig);

    const [boughtProductRows] = await connection2.execute(`
      SELECT
        o_id,
        dealer_id,
        client_name,
        client_phone,
        client_gstin,
        
        order_list,
        payment_type,
        total_amount,
        advance,
        due,
        transaction_id,
        delivery_type,
        site_address,
        extra_trsnsport_cost,
        status,
        company_total_payment,
        company_paid,
        company_due,
        created_at,
        updated_at
      FROM \`bought-product\`
    `);

    await connection2.end();
    // ✅ DATA NORMALIZATION (CRITICAL FIX)
    const safeOrders = orders.map(order => ({
      ...order,

      // 💰 Numbers – never NULL
      final_product_cost: Number(order.final_product_cost ?? 0),
      discount_percentage: Number(order.discount_percentage ?? 0),
      discounted_amount: Number(order.discounted_ammount ?? 0),
      changed_price: Number(order.changed_price ?? 0),
      quantity: Number(order.quantity ?? 0),
      advance: Number(order.advance ?? 0),
      due: Number(order.due ?? 0),

      // 📅 Dates – allow null, frontend checks
      billed_date: order.billed_date ? new Date(order.billed_date) : null,
      delivery_date: order.delivery_date ? new Date(order.delivery_date) : null,

      // 🕒 Timestamps
      created_at: order.created_at ? new Date(order.created_at) : null,
      updated_at: order.updated_at ? new Date(order.updated_at) : null,

      // Client details
      client_gstin: order.client_gstin || "",
    }));

    return NextResponse.json({
      orders: safeOrders,
      boughtProducts: boughtProductRows
    });

  } catch (error: any) {
    console.error('Orders API: Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.user_id || (token.role !== 'sales_admin' && token.role !== 'superadmin')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { order_id, booking_status, action } = body;

    if (!order_id || !booking_status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    // 🔹 existing update (UNCHANGED)
    await connection.execute(
      'UPDATE buy_product SET booking_status = ?, updated_at = NOW() WHERE order_id = ?',
      [booking_status, order_id]
    );

    // 🔹 NEW: action update (ADDED ONLY)
    if (action !== undefined) {
      console.log('Orders API: Updating action to:', action, 'for order_id:', order_id);
      const [result] = await connection.execute(
        'UPDATE buy_product SET action = ?, updated_at = NOW() WHERE order_id = ?',
        [action, order_id]
      );
      console.log('Orders API: Action update result:', result);
    }

    await connection.end();

    return NextResponse.json({ message: "Booking status updated successfully" });
  } catch (error: any) {
    console.error('Orders API: Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
