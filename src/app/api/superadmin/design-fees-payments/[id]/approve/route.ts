import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const transactionId = id;

    if (!transactionId || isNaN(Number(transactionId))) {
      return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 });
    }

    // Check if transaction exists and is pending
    const [existing] = await executeQuery(`
      SELECT id, status FROM design_fees_payments
      WHERE id = ?
    `, [transactionId]);

    if ((existing as any[]).length === 0) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const transaction = (existing as any[])[0];

    if (transaction.status === 'approved') {
      return NextResponse.json({ error: 'Transaction is already approved' }, { status: 400 });
    }

    // Update status to approved
    await executeQuery(`
      UPDATE design_fees_payments
      SET status = 'approved', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [transactionId]);

    return NextResponse.json({ message: 'Transaction approved successfully' });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to approve transaction' },
      { status: 500 }
    );
  }
}
