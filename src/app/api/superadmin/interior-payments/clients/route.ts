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

    // Fetch clients who have interior projects with their account summaries
    const [rows] = await executeQuery(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        COUNT(DISTINCT p.id) as total_projects,
        COALESCE(SUM(
          (SELECT COALESCE(SUM(COALESCE(total_amount, amount)), 0) FROM interior_billing_charges WHERE project_id = p.id AND status = 'approved') +
          (SELECT COALESCE(SUM(CASE WHEN adjustment_type = 'credit' THEN COALESCE(total_amount, amount) ELSE -ABS(COALESCE(total_amount, amount)) END), 0) FROM interior_adjustments WHERE project_id = p.id AND status = 'approved')
        ), 0) as total_bill,
        COALESCE(SUM(
          (SELECT COALESCE(SUM(amount), 0) FROM interior_payment_transactions WHERE project_id = p.id AND status = 'approved')
        ), 0) as total_paid,
        COALESCE(SUM(
          (SELECT COALESCE(SUM(COALESCE(total_amount, amount)), 0) FROM interior_billing_charges WHERE project_id = p.id AND status = 'approved') +
          (SELECT COALESCE(SUM(CASE WHEN adjustment_type = 'credit' THEN COALESCE(total_amount, amount) ELSE -ABS(COALESCE(total_amount, amount)) END), 0) FROM interior_adjustments WHERE project_id = p.id AND status = 'approved') -
          (SELECT COALESCE(SUM(amount), 0) FROM interior_payment_transactions WHERE project_id = p.id AND status = 'approved')
        ), 0) as total_outstanding
      FROM users_kp_db u
      INNER JOIN interior_projects p ON u.user_id = p.client_id
      GROUP BY u.user_id, u.name, u.email
      ORDER BY u.name
    `);

    const clients = (rows as any[]).map(row => ({
      user_id: row.user_id,
      name: row.name || 'N/A',
      email: row.email || 'N/A',
      total_projects: row.total_projects || 0,
      total_bill: Number(row.total_bill) || 0,
      total_paid: Number(row.total_paid) || 0,
      total_outstanding: Number(row.total_outstanding) || 0,
    }));

    return NextResponse.json({ clients });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}
