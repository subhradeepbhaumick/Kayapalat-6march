import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

export async function PUT(req: NextRequest) {
  try {
    console.log('Place Order API (PUT): Request received');
    console.log('Place Order API (PUT): Request URL:', req.url);
    console.log('Place Order API (PUT): Request method:', req.method);

    // Auth Check
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    console.log('Place Order API (PUT): Token retrieved:', token ? 'Present' : 'Null');
    console.log('Place Order API (PUT): Token user_id:', token?.user_id);
    console.log('Place Order API (PUT): Token role:', token?.role);

    if (!token || !token.user_id || !token.role) {
      console.log('Place Order API (PUT): Unauthorized - missing token data');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!token || !token.user_id || (token.role !== 'sales_admin' && token.role !== 'superadmin')) {
      console.log('Place Order API (PUT): Unauthorized - invalid role');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log('Place Order API (PUT): Request body received:', JSON.stringify(body, null, 2));

    const { order_ids } = body;
    console.log('Place Order API (PUT): order_ids:', order_ids);

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      console.log('Place Order API (PUT): Invalid or missing order_ids');
      return NextResponse.json({ error: 'Order IDs are required' }, { status: 400 });
    }

    console.log('Place Order API (PUT): Connecting to database');
    const connection = await mysql.createConnection(dbConfig);
    console.log('Place Order API (PUT): Database connection established');

    // Set booking_status to 'booked' and action to 'finally booked' for selected orders
    const query = `UPDATE buy_product SET booking_status = 'booked', action = 'finally booked' WHERE order_id IN (?)`;
    console.log('Place Order API (PUT): Executing update query:', query);
    console.log('Place Order API (PUT): Query parameters:', [order_ids]);

    const [result] = await connection.execute(query, [order_ids]);
    console.log('Place Order API (PUT): Update result:', result);

    await connection.end();
    console.log('Place Order API (PUT): Database connection closed');

    const affectedRows = (result as any).affectedRows;
    console.log('Place Order API (PUT): Orders updated successfully, affected rows:', affectedRows);

    return NextResponse.json({
      success: true,
      updated: affectedRows,
      message: `${affectedRows} orders placed successfully`
    });
  } catch (error) {
    console.error('Place Order API (PUT): Error placing orders:', error);
    console.error('Place Order API (PUT): Error stack:', error instanceof Error ? error.stack : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to place orders' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('Place Order API: Request received');
    console.log('Place Order API: Request URL:', req.url);
    console.log('Place Order API: Request method:', req.method);

    // Auth Check
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    console.log('Place Order API: Token retrieved:', token ? 'Present' : 'Null');
    console.log('Place Order API: Token user_id:', token?.user_id);
    console.log('Place Order API: Token role:', token?.role);

    if (!token || !token.user_id || !token.role) {
      console.log('Place Order API: Unauthorized - missing token data');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!token || !token.user_id || (token.role !== 'sales_admin' && token.role !== 'superadmin')) {
      console.log('Place Order API: Unauthorized - invalid role');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log('Place Order API: Request body received:', JSON.stringify(body, null, 2));

    const { order_ids } = body;
    console.log('Place Order API: order_ids:', order_ids);

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      console.log('Place Order API: Invalid or missing order_ids');
      return NextResponse.json({ error: 'Order IDs are required' }, { status: 400 });
    }

    console.log('Place Order API: Connecting to database');
    const connection = await mysql.createConnection(dbConfig);
    console.log('Place Order API: Database connection established');

    // Set booking_status to 'booked' for selected orders
    const query = `UPDATE buy_product SET booking_status = 'booked' WHERE order_id IN (?) AND action = 'Added to cart'`;
    console.log('Place Order API: Executing update query:', query);
    console.log('Place Order API: Query parameters:', [order_ids]);

    const [result] = await connection.execute(query, [order_ids]);
    console.log('Place Order API: Update result:', result);

    await connection.end();
    console.log('Place Order API: Database connection closed');

    const affectedRows = (result as any).affectedRows;
    console.log('Place Order API: Orders updated successfully, affected rows:', affectedRows);

    return NextResponse.json({
      success: true,
      updated: affectedRows,
      message: `${affectedRows} orders placed successfully`
    });
  } catch (error) {
    console.error('Place Order API: Error placing orders:', error);
    console.error('Place Order API: Error stack:', error instanceof Error ? error.stack : 'Unknown error');
    return NextResponse.json(
      { error: 'Failed to place orders' },
      { status: 500 }
    );
  }
}
