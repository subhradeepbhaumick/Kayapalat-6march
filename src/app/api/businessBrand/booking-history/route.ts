import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dealerId = token.sub; // Assuming user ID is in token.sub

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const [rows] = await connection.execute(`
      SELECT space_type, client_name, advance, booking_cost,due, time_period, transaction_proof, booking_status, booking_date, expire_date
      FROM \`showroom a\`
      WHERE dealer_id = ?
      ORDER BY booking_date DESC
    `, [dealerId]);

    await connection.end();

    const bookings = (rows as any[]).map(row => ({
      space_type: row.space_type,
      client_name: row.client_name,
      advance: Number(row.advance),
      booking_cost: Number(row.booking_cost),
      due: Number(row.due),
      time_period: Number(row.time_period),
      transaction_proof: row.transaction_proof,
      booking_status: row.booking_status,
      booking_date: row.booking_date,
      expire_date: row.expire_date,
    }));

    return NextResponse.json(bookings);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking history' },
      { status: 500 }
    );
  }
}
