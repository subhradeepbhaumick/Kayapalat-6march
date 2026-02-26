import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all design fees payments with client info
    const [rows] = await executeQuery(`
      SELECT
        dfp.*,
        u.name as client_name,
        u.email as client_email
      FROM design_fees_payments dfp
      LEFT JOIN users_kp_db u ON dfp.client_id = u.user_id
      ORDER BY dfp.created_at DESC
    `);

    const transactions = (rows as any[]).map(row => ({
      id: row.id,
      client_id: row.client_id,
      client_name: row.client_name,
      client_email: row.client_email,
      plan_type: row.plan_type,
      amount: Number(row.amount),
      gst_amount: Number(row.gst_amount),
      total_amount: Number(row.total_amount),
      payment_method: row.payment_method,
      transaction_proof_path: row.transaction_proof_path,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return NextResponse.json({ transactions });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
