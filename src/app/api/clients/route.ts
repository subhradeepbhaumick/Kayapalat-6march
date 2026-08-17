import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only allow designers to fetch clients
    if (token.role !== 'designer') {
      return NextResponse.json(
        { error: 'Access denied. Designer role required.' },
        { status: 403 }
      );
    }

    const designerId = token.user_id as string;

    // Fetch clients assigned to this designer. This is additive-only and
    // is backfilled from existing uploads to preserve visibility.
    const clients = await db.query(`
      SELECT u.user_id, u.name, u.email, u.phone, u.whatsapp, u.role
      FROM designer_client_assignments dca
      JOIN users_kp_db u ON dca.client_id = u.user_id
      WHERE dca.designer_id = ?
      ORDER BY u.name ASC
    `, [designerId]);

    return NextResponse.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}
