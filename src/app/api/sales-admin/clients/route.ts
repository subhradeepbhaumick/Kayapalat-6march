import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || (token.role !== 'sales_admin' && token.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [rows] = await executeQuery(`
      SELECT user_id, name, email
      FROM users_kp_db
      WHERE role = 'client'
      ORDER BY name ASC
    `);

    const clients = (rows as any[]).map(row => ({
      user_id: row.user_id,
      name: row.name || 'N/A',
      email: row.email || 'N/A',
    }));

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients', details: String(error) },
      { status: 500 }
    );
  }
}
