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

    const updateFields: string[] = [];
const values: any[] = [];

// ✅ Only update if value is present

if (client_name !== undefined) {
  updateFields.push("client_name = ?");
  values.push(client_name);
}

if (client_phone !== undefined) {
  updateFields.push("client_phone = ?");
  values.push(client_phone);
}

if (client_gstin !== undefined) {
  updateFields.push("client_gstin = ?");
  values.push(client_gstin);
}

if (order_list !== undefined) {
  updateFields.push("order_list = ?");
  values.push(order_list);
}

if (payment_type !== undefined) {
  updateFields.push("payment_type = ?");
  values.push(payment_type);
}

if (total_amount !== undefined) {
  updateFields.push("total_amount = ?");
  values.push(total_amount);
}

if (advance !== undefined) {
  updateFields.push("advance = ?");
  values.push(advance);
}

if (due !== undefined) {
  updateFields.push("due = ?");
  values.push(due);
}

if (transaction_id !== undefined) {
  updateFields.push("transaction_id = ?");
  values.push(transaction_id);
}

if (delivery_type !== undefined) {
  updateFields.push("delivery_type = ?");
  values.push(delivery_type);
}

if (site_address !== undefined) {
  updateFields.push("site_address = ?");
  values.push(site_address);
}

if (extra_trsnsport_cost !== undefined) {
  updateFields.push("extra_trsnsport_cost = ?");
  values.push(extra_trsnsport_cost);
}

if (status !== undefined) {
  updateFields.push("status = ?");
  values.push(status);
}

if (company_total_payment !== undefined) {
  updateFields.push("company_total_payment = ?");
  values.push(company_total_payment);
}

if (company_paid !== undefined) {
  updateFields.push("company_paid = ?");
  values.push(company_paid);
}

if (company_due !== undefined) {
  updateFields.push("company_due = ?");
  values.push(company_due);
}

// Always update time
updateFields.push("updated_at = NOW()");

values.push(o_id);

const query = `
  UPDATE \`bought-product\`
  SET ${updateFields.join(", ")}
  WHERE o_id = ?
`;

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
