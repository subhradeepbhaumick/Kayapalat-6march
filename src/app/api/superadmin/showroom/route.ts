import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    // ✅ Proper token validation
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Fetch all showroom spaces with all details
    const [rows] = await connection.execute(`
      SELECT space_id, space_type, size, price, dealer_id, client_name, advance,due,special_discount,discounted_price,deal_price, booking_cost, time_period, transaction_proof, booking_status, booking_date, expire_date, updated_at
      FROM \`showroom a\`
      ORDER BY space_type
    `);

    await connection.end();

    const showroomSpaces = (rows as any[]).map(row => ({
      space_id: Number(row.space_id),
      space_type: row.space_type,
      size: row.size.toString(),
      price: Number(row.price),
      dealer_id: row.dealer_id,
      client_name: row.client_name,
      advance: row.advance ? Number(row.advance) : null,
      booking_cost: row.booking_cost ? Number(row.booking_cost) : null,
      due: row.due ? Number(row.due) : null,
      special_discount: row.special_discount,
      discounted_price: row.discounted_price ? Number(row.discounted_price) : null,
      deal_price: row.deal_price ? Number(row.deal_price) : null,
      time_period: row.time_period ? Number(row.time_period) : null,
      transaction_proof: row.transaction_proof,
      booking_status: row.booking_status,
      booking_date: row.booking_date ? new Date(row.booking_date).toISOString().split('T')[0] : null,
      expire_date: row.expire_date ? new Date(row.expire_date).toISOString().split('T')[0] : null,
      updated_at: row.updated_at,
    }));

    return NextResponse.json(showroomSpaces);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch showroom spaces' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // ✅ Proper token validation
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { space_id, ...updates } = body;

    if (!space_id) {
      return NextResponse.json({ error: 'space_id is required' }, { status: 400 });
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Build dynamic update query
    const updateFields = Object.keys(updates).filter(key => updates[key] !== undefined);
    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const setClause = updateFields.map(field => `\`${field}\` = ?`).join(', ');
    const values = updateFields.map(field => updates[field]);

    const query = `
      UPDATE \`showroom a\`
      SET ${setClause}, updated_at = NOW()
      WHERE space_id = ?
    `;

    values.push(space_id);

    const [result] = await connection.execute(query, values);

    await connection.end();

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Space updated successfully' });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to update showroom space' },
      { status: 500 }
    );
  }
}
