import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery, pool } from '@/lib/db';
import type { PoolConnection } from 'mysql2/promise';

type ChargeRow = {
  id: number;
  gst_rate?: number | null;
  base_amount?: number | null;
  description?: string | null;
  created_at: string;
};

type PaymentRow = {
  id: number;
  payment_method?: string | null;
  description?: string | null;
  created_at: string;
};

type AdjustmentRow = {
  id: number;
  type: 'adjustment' | 'extra_work';
  description?: string | null;
  created_at: string;
};

type ProjectInfoRow = {
  project_name: string;
  delivery_days_total?: number | null;
  delivery_due_date?: string | null;
  client_name?: string | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;

    // Fetch ledger for specific project
    const [charges] = await executeQuery(`
      SELECT id, 'charge' as type, amount, base_amount, description, status, created_at, gst_rate, gst_amount, total_amount
      FROM interior_billing_charges
      WHERE project_id = ?
      ORDER BY created_at DESC
    `, [projectId]);

    const typedCharges = charges as unknown as ChargeRow[];

    const badCharge = typedCharges.find(c => Number(c.gst_rate) > 0 && (c.base_amount === null || c.base_amount === undefined));
    if (badCharge) {
      console.warn('[ledger] GST rate present without base_amount', { id: badCharge.id, projectId });
    }

    const [payments] = await executeQuery(`
SELECT
  pt.id,
  'payment' as type,
  pt.project_id,
  pt.amount,
  pt.payment_method,
  pt.transaction_proof_path,
  pt.status,
  pt.created_at,

  ip.project_name,
  ip.client_id,

  u.name AS customer_name,
  u.phone AS customer_phone

FROM interior_payment_transactions pt
INNER JOIN interior_projects ip
  ON pt.project_id = ip.id
INNER JOIN users_kp_db u
  ON ip.client_id = u.user_id

WHERE pt.project_id = ?
ORDER BY pt.created_at DESC
    `, [projectId]);

    const [adjustments] = await executeQuery(`
      SELECT id,
        CASE
          WHEN COALESCE(category, 'adjustment') = 'work' THEN 'extra_work'
          ELSE 'adjustment'
        END as type,
        amount, base_amount, gst_rate, gst_amount, total_amount, gst_included, description, status, adjustment_type, created_at, COALESCE(category, 'adjustment') as category
      FROM interior_adjustments
      WHERE project_id = ?
      ORDER BY created_at DESC
    `, [projectId]);

    const typedPayments = payments as unknown as PaymentRow[];
    const typedAdjustments = adjustments as unknown as AdjustmentRow[];

    const ledger = [
      ...(typedCharges.map(c => ({ ...c, description: c.description || 'Billing charge', entry_id: c.id }))),
      ...(typedPayments.map(p => ({ ...p, description: `Payment via ${p.payment_method}`, entry_id: p.id }))),
      ...(typedAdjustments.map(a => ({
        ...a,
        description: a.description || (a.type === 'extra_work' ? 'Extra work' : 'Adjustment'),
        entry_id: a.id
      })))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const [projectInfo] = await executeQuery(`
      SELECT p.project_name, p.delivery_days_total, p.delivery_due_date, u.name as client_name
      FROM interior_projects p
      LEFT JOIN users_kp_db u ON p.client_id = u.user_id
      WHERE p.id = ?
      LIMIT 1
    `, [projectId]);

    const typedProjectInfo = projectInfo as unknown as ProjectInfoRow[];
    return NextResponse.json({ ledger, project: typedProjectInfo[0] || null });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project ledger' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const { delivery_days_total } = await request.json();
    const deliveryDays = Number(delivery_days_total);

    if (!Number.isFinite(deliveryDays) || deliveryDays <= 0) {
      return NextResponse.json({ error: 'Valid delivery days required' }, { status: 400 });
    }

    await executeQuery(`
      UPDATE interior_projects
      SET delivery_days_total = ?, delivery_due_date = DATE_ADD(CURDATE(), INTERVAL ? DAY)
      WHERE id = ?
    `, [deliveryDays, deliveryDays, projectId]);

    return NextResponse.json({ message: 'Delivery time updated' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery time' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  let connection: PoolConnection | null = null;
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const projectIdNum = Number(projectId);
    if (!Number.isFinite(projectIdNum) || projectIdNum <= 0) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [projectRows] = await connection.query(
      `
      SELECT p.id, p.project_name, COALESCE(u.name, 'N/A') as client_name
      FROM interior_projects p
      LEFT JOIN users_kp_db u ON p.client_id = u.user_id
      WHERE p.id = ?
      LIMIT 1
      `,
      [projectIdNum]
    );

    if (!Array.isArray(projectRows) || projectRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const [chargeRows] = await connection.query(
      `SELECT id FROM interior_billing_charges WHERE project_id = ?`,
      [projectIdNum]
    );
    const [paymentRows] = await connection.query(
      `SELECT id FROM interior_payment_transactions WHERE project_id = ?`,
      [projectIdNum]
    );
    const [adjustmentRows] = await connection.query(
      `SELECT id FROM interior_adjustments WHERE project_id = ?`,
      [projectIdNum]
    );

    const chargeIds = (chargeRows as Array<{ id: number | string }>).map(r => Number(r.id)).filter(Boolean);
    const paymentIds = (paymentRows as Array<{ id: number | string }>).map(r => Number(r.id)).filter(Boolean);
    const adjustmentIds = (adjustmentRows as Array<{ id: number | string }>).map(r => Number(r.id)).filter(Boolean);

    if (chargeIds.length > 0) {
      await connection.query(
        `DELETE FROM interior_audit_logs WHERE entry_type = 'charge' AND entry_id IN (${chargeIds.map(() => '?').join(',')})`,
        chargeIds
      );
    }
    if (paymentIds.length > 0) {
      await connection.query(
        `DELETE FROM interior_audit_logs WHERE entry_type = 'payment' AND entry_id IN (${paymentIds.map(() => '?').join(',')})`,
        paymentIds
      );
    }
    if (adjustmentIds.length > 0) {
      await connection.query(
        `DELETE FROM interior_audit_logs WHERE entry_type = 'adjustment' AND entry_id IN (${adjustmentIds.map(() => '?').join(',')})`,
        adjustmentIds
      );
    }

    await connection.query(`DELETE FROM interior_payment_transactions WHERE project_id = ?`, [projectIdNum]);
    await connection.query(`DELETE FROM interior_adjustments WHERE project_id = ?`, [projectIdNum]);
    await connection.query(`DELETE FROM interior_billing_charges WHERE project_id = ?`, [projectIdNum]);
    await connection.query(`DELETE FROM interior_projects WHERE id = ?`, [projectIdNum]);

    await connection.commit();

    return NextResponse.json({ message: 'Project and ledger deleted successfully' });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
