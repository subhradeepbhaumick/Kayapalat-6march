import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_id, project_name, delivery_days_total } = await request.json();

    if (!client_id || !project_name) {
      return NextResponse.json({ error: 'Client ID and project name required' }, { status: 400 });
    }

    // Verify client exists
    const [clientCheck] = await executeQuery(`
      SELECT user_id FROM users_kp_db WHERE user_id = ?
    `, [client_id]);

    if ((clientCheck as any[]).length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const deliveryDays = Number(delivery_days_total);
    const hasDeliveryDays = Number.isFinite(deliveryDays) && deliveryDays > 0;

    // Insert new project
    const [result] = await executeQuery(`
      INSERT INTO interior_projects (client_id, project_name, delivery_days_total, delivery_due_date)
      VALUES (?, ?, ?, ${hasDeliveryDays ? 'DATE_ADD(CURDATE(), INTERVAL ? DAY)' : 'NULL'})
    `, hasDeliveryDays
      ? [client_id, project_name, deliveryDays, deliveryDays]
      : [client_id, project_name, null]
    );

    return NextResponse.json({ message: 'Project created successfully', id: (result as any).insertId });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    // Fetch projects with client info and summaries (filter by client if provided)
    // total_bill = approved charges (GST total if available) + approved credits - approved debits
    // paid = approved payments
    // outstanding = total_bill - paid
    const [rows] = await executeQuery(`
      SELECT
        p.id,
        p.client_id,
        p.project_name,
        p.delivery_days_total,
        p.delivery_due_date,
        u.name as client_name,
        (SELECT COALESCE(SUM(COALESCE(base_amount, amount)), 0) FROM interior_billing_charges WHERE project_id = p.id AND status = 'approved') +
        (SELECT COALESCE(SUM(CASE WHEN adjustment_type = 'credit' THEN COALESCE(base_amount, amount) ELSE -ABS(COALESCE(base_amount, amount)) END), 0) FROM interior_adjustments WHERE project_id = p.id AND status = 'approved') AS base_total,
        (SELECT COALESCE(SUM(COALESCE(gst_amount, 0)), 0) FROM interior_billing_charges WHERE project_id = p.id AND status = 'approved') +
        (SELECT COALESCE(SUM(CASE WHEN adjustment_type = 'credit' THEN COALESCE(gst_amount, 0) ELSE -ABS(COALESCE(gst_amount, 0)) END), 0) FROM interior_adjustments WHERE project_id = p.id AND status = 'approved') AS gst_total,
        (SELECT COALESCE(SUM(COALESCE(total_amount, amount)), 0) FROM interior_billing_charges WHERE project_id = p.id AND status = 'approved') +
        (SELECT COALESCE(SUM(CASE WHEN adjustment_type = 'credit' THEN COALESCE(total_amount, amount) ELSE -ABS(COALESCE(total_amount, amount)) END), 0) FROM interior_adjustments WHERE project_id = p.id AND status = 'approved') AS gross_total,
        (SELECT COALESCE(SUM(COALESCE(total_amount, amount)), 0) FROM interior_billing_charges WHERE project_id = p.id AND status = 'approved') +
        (SELECT COALESCE(SUM(CASE WHEN adjustment_type = 'credit' THEN COALESCE(total_amount, amount) ELSE -ABS(COALESCE(total_amount, amount)) END), 0) FROM interior_adjustments WHERE project_id = p.id AND status = 'approved') AS total_bill,
        (SELECT COALESCE(SUM(amount), 0) FROM interior_payment_transactions WHERE project_id = p.id AND status = 'approved') AS paid,
        (
          (SELECT COALESCE(SUM(COALESCE(total_amount, amount)), 0) FROM interior_billing_charges WHERE project_id = p.id AND status = 'approved') +
          (SELECT COALESCE(SUM(CASE WHEN adjustment_type = 'credit' THEN COALESCE(total_amount, amount) ELSE -ABS(COALESCE(total_amount, amount)) END), 0) FROM interior_adjustments WHERE project_id = p.id AND status = 'approved') -
          (SELECT COALESCE(SUM(amount), 0) FROM interior_payment_transactions WHERE project_id = p.id AND status = 'approved')
        ) AS outstanding
      FROM interior_projects p
      LEFT JOIN users_kp_db u ON p.client_id = u.user_id
      ${clientId ? 'WHERE p.client_id = ?' : ''}
      ORDER BY p.created_at DESC
    `, clientId ? [clientId] : []);

    const projects = (rows as any[]).map(row => ({
      id: row.id,
      client_id: row.client_id,
      client_name: row.client_name || 'N/A',
      project_name: row.project_name,
      delivery_days_total: row.delivery_days_total ? Number(row.delivery_days_total) : null,
      delivery_due_date: row.delivery_due_date,
      base_total: Number(row.base_total || 0),
      gst_total: Number(row.gst_total || 0),
      gross_total: Number(row.gross_total || 0),
      paid: Number(row.paid),
      outstanding_including_gst: Number(row.outstanding),
    }));

    return NextResponse.json({ projects });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
