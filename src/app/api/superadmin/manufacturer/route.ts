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
    console.log('Manufacturer API: GET request received');

    // Auth Check
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.user_id || token.role !== 'superadmin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dealerId = searchParams.get('dealer_id');

    if (!dealerId) {
      return NextResponse.json({ error: "Dealer ID is required" }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    const query = `
      SELECT
        dealer_id,
        company_logo,
        user_name,
        phone,
        whatsapp,
        email,
        company_name,
        owner_name,
        address,
        gstin,
        pan,
        tan,
        bank_name,
        account_holder,
        account_number,
        ifsc_code,
        upi_id,
        created_at,
        updated_at
      FROM manufacturer
      WHERE dealer_id = ?
    `;

    const [rows] = await connection.execute(query, [dealerId]);
    const manufacturer = rows as any[];

    await connection.end();

    if (manufacturer.length === 0) {
      return NextResponse.json({ error: "Manufacturer not found" }, { status: 404 });
    }

    return NextResponse.json(manufacturer[0]);

  } catch (error: any) {
    console.error('Manufacturer API: Error fetching data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch manufacturer data' },
      { status: 500 }
    );
  }
}
