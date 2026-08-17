import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = token.user_id;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (projectId) {
      // Fetch ledger for specific project
      const [charges] = await executeQuery(`
        SELECT id, 'charge' as type, amount, base_amount, description, status, created_at, gst_rate, gst_amount, total_amount
        FROM interior_billing_charges
        WHERE project_id = ?
        ORDER BY created_at DESC
      `, [projectId]);

      const badCharge = (charges as any[]).find(c => Number(c.gst_rate) > 0 && (c.base_amount === null || c.base_amount === undefined));
      if (badCharge) {
        console.warn('[client-ledger] GST rate present without base_amount', { id: badCharge.id, projectId });
      }

      const [payments] = await executeQuery(`
SELECT
    pt.id,
    pt.project_id,
    'payment' as type,
    pt.amount,
    pt.payment_method,
    pt.transaction_proof_path,
    pt.status,
    pt.created_at,
    u.user_id as client_id,
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

      const ledger = [
        ...((charges as any[]).map(c => ({ ...c, description: c.description || 'Billing charge' }))),
        ...((payments as any[]).map(p => ({ ...p, description: `Payment via ${p.payment_method}` }))),
        ...((adjustments as any[]).map(a => ({ ...a, description: a.description || (a.type === 'extra_work' ? 'Extra work' : 'Adjustment') })))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return NextResponse.json({ ledger });
    } else {
      // Fetch projects summary for client
      // Accounting model: Outstanding = SUM(approved charges) + SUM(approved positive adjustments) - SUM(approved payments) - SUM(approved negative adjustments)
      const [projects] = await executeQuery(`
        SELECT
          p.id,
          p.project_name,
          p.delivery_days_total,
          p.delivery_due_date,
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
        WHERE p.client_id = ?
        ORDER BY p.created_at DESC
      `, [clientId]);

      const projectsData = (projects as any[]).map(row => ({
        id: row.id,
        project_name: row.project_name,
        delivery_days_total: row.delivery_days_total ? Number(row.delivery_days_total) : null,
        delivery_due_date: row.delivery_due_date,
        base_total: Number(row.base_total || 0),
        gst_total: Number(row.gst_total || 0),
        gross_total: Number(row.gross_total || 0),
        paid: Number(row.paid),
        outstanding_including_gst: Number(row.outstanding),
      }));

      return NextResponse.json({ projects: projectsData });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = token.user_id;
    const formData = await request.formData();

    const project_id = formData.get('project_id') as string;
    const amount = formData.get('amount') as string;
    const payment_method = formData.get('payment_method') as string;
    const transaction_proof = formData.get('transaction_proof') as File;

    if (!project_id || !amount || !payment_method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (payment_method === 'online' && !transaction_proof) {
      return NextResponse.json({ error: 'Transaction proof required for online payment' }, { status: 400 });
    }

    // Verify project belongs to client
    const [projectCheck] = await executeQuery(`
      SELECT id FROM interior_projects WHERE id = ? AND client_id = ?
    `, [project_id, clientId]);

    if ((projectCheck as any[]).length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check outstanding amount to prevent overpayment
    // Use same accounting model for validation
    const [outstandingCheck] = await executeQuery(`
      SELECT
        (
          (SELECT COALESCE(SUM(COALESCE(total_amount, amount)), 0) FROM interior_billing_charges WHERE project_id = ? AND status = 'approved') +
          (SELECT COALESCE(SUM(CASE WHEN adjustment_type = 'credit' THEN COALESCE(total_amount, amount) ELSE -ABS(COALESCE(total_amount, amount)) END), 0) FROM interior_adjustments WHERE project_id = ? AND status = 'approved') -
          (SELECT COALESCE(SUM(amount), 0) FROM interior_payment_transactions WHERE project_id = ? AND status = 'approved')
        ) AS outstanding
      FROM dual
    `, [project_id, project_id, project_id]);

    const outstanding = Number((outstandingCheck as any[])[0]?.outstanding || 0);
    const paymentAmount = parseFloat(amount);

    if (paymentAmount > outstanding) {
      return NextResponse.json({
        error: `Payment amount (${paymentAmount}) exceeds outstanding balance (${outstanding})`
      }, { status: 400 });
    }

    let transactionProofPath = null;

    if (transaction_proof) {
      // Save the transaction proof file
      const uploadsDir = path.join(process.cwd(), 'public', 'transaction_proof');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const now = new Date();
      const fileName = `interior_${clientId}_${project_id}_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}.${transaction_proof.name.split('.').pop()}`;
      const filePath = path.join(uploadsDir, fileName);
      const buffer = Buffer.from(await transaction_proof.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      transactionProofPath = `/transaction_proof/${fileName}`;
    }

    // Insert new payment (no GST fields)
    await executeQuery(`
      INSERT INTO interior_payment_transactions (project_id, amount, payment_method, transaction_proof_path, status)
      VALUES (?, ?, ?, ?, 'pending')
    `, [project_id, amount, payment_method, transactionProofPath]);
    // 👉 AFTER inserting payment, update installment schedule

// 1. Fetch schedule
const [scheduleRows] = await executeQuery(
  `SELECT * FROM interior_payment_schedule WHERE project_id = ?`,
  [project_id]
);

if ((scheduleRows as any[]).length > 0) {
  const schedule = (scheduleRows as any[])[0];
  const today = new Date();
  const amt = parseFloat(amount);

  const getStatus = (dueDate: any) => {
    if (!dueDate) return "Pending";

    const due = new Date(dueDate);
    const diffDays = Math.ceil(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays > 7) return "Early";
    if (diffDays < 0) return "Late";
    return "On Time";
  };

  let query = "";
  let values: any[] = [];

  // 2. Match installment by amount
  if (amt === Number(schedule.first_amount)) {
    query = `
      UPDATE interior_payment_schedule
      SET first_paid_amount = ?, first_paid_date = ?, first_status = ?
      WHERE project_id = ?
    `;
    values = [amt, today, getStatus(schedule.first_payment_date), project_id];

  } else if (amt === Number(schedule.second_amount)) {
    query = `
      UPDATE interior_payment_schedule
      SET second_paid_amount = ?, second_paid_date = ?, second_status = ?
      WHERE project_id = ?
    `;
    values = [amt, today, getStatus(schedule.second_payment_date), project_id];

  } else if (amt === Number(schedule.third_amount)) {
    query = `
      UPDATE interior_payment_schedule
      SET third_paid_amount = ?, third_paid_date = ?, third_status = ?
      WHERE project_id = ?
    `;
    values = [amt, today, getStatus(schedule.third_payment_date), project_id];

  } else if (amt === Number(schedule.fourth_amount)) {
    query = `
      UPDATE interior_payment_schedule
      SET fourth_paid_amount = ?, fourth_paid_date = ?, fourth_status = ?
      WHERE project_id = ?
    `;
    values = [amt, today, getStatus(schedule.fourth_payment_date), project_id];

  } else if (amt === Number(schedule.fifth_amount)) {
    query = `
      UPDATE interior_payment_schedule
      SET fifth_paid_amount = ?, fifth_paid_date = ?, fifth_status = ?
      WHERE project_id = ?
    `;
    values = [amt, today, getStatus(schedule.fifth_payment_date), project_id];
  }

  // 3. Execute update
  if (query) {
    await executeQuery(query, values);
  }
}

    return NextResponse.json({ message: 'Payment submitted successfully' });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit payment' },
      { status: 500 }
    );
  }
}
