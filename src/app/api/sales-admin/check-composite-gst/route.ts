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
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dealerId = req.nextUrl.searchParams.get('dealer_id');
  if (!dealerId) return NextResponse.json({ error: "dealer_id required" }, { status: 400 });

  const connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.execute(
    'SELECT composite_gst_scheme, company_name, address, phone  FROM manufacturer WHERE dealer_id = ?',
    [dealerId]
  );
  await connection.end();

  const result = (rows as any[])[0];
return NextResponse.json({ 
  composite_gst_scheme: result?.composite_gst_scheme ?? 0,
  company_name: result?.company_name ?? null,
   address: result?.address ?? null,
  phone: result?.phone ?? null
});}