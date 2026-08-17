import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entryId } = await params;
    console.log("FULL params:", await params);
    console.log("RAW entryId:", entryId);
    const entryIdNum = parseInt(entryId);

    if (isNaN(entryIdNum)) {
      return NextResponse.json({ error: 'Invalid entry ID' }, { status: 400 });
    }

    // Check all tables for the entry
    let tableName = '';
    let entryType = '';
    let existing: any[] = [];

    // Check payments
    [existing] = await executeQuery(`SELECT id, status FROM interior_payment_transactions WHERE id = ?`, [entryIdNum]);
    if ((existing as any[]).length > 0) {
      tableName = 'interior_payment_transactions';
      entryType = 'payment';
    } else {
      // Check charges
      [existing] = await executeQuery(`SELECT id, status FROM interior_billing_charges WHERE id = ?`, [entryIdNum]);
      if ((existing as any[]).length > 0) {
        tableName = 'interior_billing_charges';
        entryType = 'charge';
      } else {
        // Check adjustments
        [existing] = await executeQuery(`SELECT id, status FROM interior_adjustments WHERE id = ?`, [entryIdNum]);
        if ((existing as any[]).length > 0) {
          tableName = 'interior_adjustments';
          entryType = 'adjustment';
        }
      }
    }

    if (!tableName) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    const entry = (existing as any[])[0];

    if (entry.status === 'approved') {
      return NextResponse.json({ error: 'Entry is already approved' }, { status: 200 });
    }

    // Update status to approved
    await executeQuery(`
      UPDATE ${tableName}
      SET status = 'approved', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [entryIdNum]);

    // Log audit
    await executeQuery(`
      INSERT INTO interior_audit_logs (action, entry_id, entry_type, admin_id, details)
      VALUES ('approve_entry', ?, ?, ?, 'Entry approved')
    `, [entryIdNum, entryType, token.user_id]);

    return NextResponse.json({ message: 'Transaction confirmed successfully' });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to approve transaction' },
      { status: 500 }
    );
  }
}
