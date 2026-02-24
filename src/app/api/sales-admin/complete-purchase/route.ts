import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import mysql from 'mysql2/promise';


const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

export async function POST(req: NextRequest) {
  try {
    console.log('Complete Purchase API: Request received');

    // Auth Check
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.user_id || (token.role !== 'sales_admin' && token.role !== 'superadmin')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log('Complete Purchase API: Received body:', body);
    const {
      client_name,
      client_phone,
      client_gstin,
      order_ids,
      payment_type,
      transaction_id,
      total_amount,
      advance_amount,
      due_amount,
      siteNameAddress,
      deliveryType,
      extraTransportationCost
    } = body;

    // Validation
    if (!client_name || !client_phone || !order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return NextResponse.json({ error: 'Client name, client phone, and order IDs are required' }, { status: 400 });
    }
    if (payment_type === 'UPI' && !transaction_id) {
      return NextResponse.json({ error: 'Transaction ID is required for UPI payment' }, { status: 400 });
    }

    // Total amount already includes extra transportation cost from frontend
    const adjustedTotalAmount = total_amount;
    const adjustedDueAmount = total_amount - advance_amount;

    const connection = await mysql.createConnection(dbConfig);

    // Fetch dealer_id from buy_product based on the first order_id
    const [productRows] = await connection.execute(
      'SELECT dealer_id FROM buy_product WHERE order_id = ?',
      [order_ids[0]]
    );
    const products = productRows as any[];
    if (products.length === 0) {
      await connection.end();
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    const dealer_id = products[0].dealer_id;

    // Generate unique datetime o_id for bought-product table
    const o_id = `O-${new Date()
        .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
        .replace(/[-: ]/g, "")}`;
    
    //YYYYMMDDHHMMSS format

    // Update buy_product table for each order_id first to set o_id
    for (const orderId of order_ids) {
      await connection.execute(
        `UPDATE buy_product SET booking_status = 'booked', client_name = ?, action = 'finally booked', o_id = ?, updated_at = NOW() WHERE order_id = ?`,
        [client_name, o_id, orderId]
      );
    }
    console.log('Complete Purchase API: Updated buy_product table for order_ids:', order_ids);

    // Insert into bought-product table
    const insertQuery = `
      INSERT INTO \`bought-product\` (
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
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const orderListJson = JSON.stringify(order_ids);

    const insertValues = [
      o_id,
      dealer_id,
      client_name,
      client_phone,
      client_gstin || null,
      orderListJson,
      payment_type,
      adjustedTotalAmount,
      advance_amount,
      adjustedDueAmount,
      transaction_id || null,
      deliveryType,
      siteNameAddress || null,
      extraTransportationCost || 0
    ];

    await connection.execute(insertQuery, insertValues);
    console.log('Complete Purchase API: Inserted into bought-product table');

    await connection.end();

    return NextResponse.json({
      success: true,
      o_id,
      message: 'Purchase completed successfully'
    });
  } catch (error) {
    console.error('Complete Purchase API: Error:', error);
    return NextResponse.json({ error: 'Failed to complete purchase' }, { status: 500 });
  }
}
