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
    console.log('PayToDealer API: GET request received');

    // Auth Check
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.user_id || token.role !== 'superadmin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await mysql.createConnection(dbConfig);

    const query = `
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
      ORDER BY created_at DESC
    `;

    const [rows] = await connection.execute(query);
    const data = rows as any[];

    await connection.end();

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('PayToDealer API: Error fetching data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bought-product data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('PayToDealer API: POST request received');

    // Auth Check
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.user_id || token.role !== 'superadmin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
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
      company_due
    } = body;

    if (!o_id || !dealer_id) {
      return NextResponse.json({ error: "Missing required fields: o_id and dealer_id" }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    const query = `
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
        status,
        company_total_payment,
        company_paid,
        company_due,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const values = [
      o_id,
      dealer_id,
      client_name || null,
      client_phone || null,
      client_gstin || null,
      order_list || null,
      payment_type || null,
      total_amount || 0,
      advance || 0,
      due || 0,
      transaction_id || null,
      delivery_type || null,
      site_address || null,
      extra_trsnsport_cost || 0,
      status || null,
      company_total_payment || 0,
      company_paid || 0,
      company_due || 0
    ];

    await connection.execute(query, values);

    await connection.end();

    return NextResponse.json({ message: "Record created successfully" });

  } catch (error: any) {
    console.error('PayToDealer API: Error creating record:', error);
    return NextResponse.json(
      { error: 'Failed to create record' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    console.log('PayToDealer API: PUT request received');

    // Auth Check
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.user_id || token.role !== 'superadmin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
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
      company_due
    } = body;

    if (!o_id) {
      return NextResponse.json({ error: "Missing required field: o_id" }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    const query = `
      UPDATE \`bought-product\` SET
        dealer_id = ?,
        client_name = ?,
        client_phone = ?,
        client_gstin = ?,
        order_list = ?,
        payment_type = ?,
        total_amount = ?,
        advance = ?,
        due = ?,
        transaction_id = ?,
        delivery_type = ?,
        site_address = ?,
        extra_trsnsport_cost = ?,
        status = ?,
        company_total_payment = ?,
        company_paid = ?,
        company_due = ?,
        updated_at = NOW()
      WHERE o_id = ?
    `;

    const values = [
      dealer_id || null,
      client_name || null,
      client_phone || null,
      client_gstin || null,
      order_list || null,
      payment_type || null,
      total_amount || 0,
      advance || 0,
      due || 0,
      transaction_id || null,
      delivery_type || null,
      site_address || null,
      extra_trsnsport_cost || 0,
      status || null,
      company_total_payment || 0,
      company_paid || 0,
      company_due || 0,
      o_id
    ];

    const [result] = await connection.execute(query, values);

    await connection.end();

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Record updated successfully" });

  } catch (error: any) {
    console.error('PayToDealer API: Error updating record:', error);
    return NextResponse.json(
      { error: 'Failed to update record' },
      { status: 500 }
    );
  }
}
