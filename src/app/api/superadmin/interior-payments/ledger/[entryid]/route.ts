import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';

type EditableEntryType = 'charge' | 'adjustment' | 'extra_work' | 'work';

const isEditableEntryType = (value: string): value is EditableEntryType =>
  value === 'charge' || value === 'adjustment' || value === 'extra_work' || value === 'work';

export async function PATCH(
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
    const entryIdNum = Number(entryId);
    if (!Number.isFinite(entryIdNum) || entryIdNum <= 0) {
      return NextResponse.json({ error: 'Invalid entry ID' }, { status: 400 });
    }

    const body = await request.json();
    const entryType = String(body?.entry_type || '').trim();
    const amountRaw = Number(body?.amount);
    const descriptionRaw = body?.description;

    if (!isEditableEntryType(entryType)) {
      return NextResponse.json({ error: 'Invalid or unsupported entry type for edit' }, { status: 400 });
    }
    if (!Number.isFinite(amountRaw) || amountRaw <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }
    if (descriptionRaw !== undefined && typeof descriptionRaw !== 'string') {
      return NextResponse.json({ error: 'Description must be a string' }, { status: 400 });
    }

    const amount = Number(amountRaw.toFixed(2));
    const description = String(descriptionRaw ?? '').trim();

    if (entryType === 'charge') {
      const [rows] = await executeQuery(`
        SELECT id, project_id, amount, base_amount, gst_rate, gst_amount, total_amount, description, status, gst_included
        FROM interior_billing_charges
        WHERE id = ?
        LIMIT 1
      `, [entryIdNum]);

      const existing = (rows as Array<{
        id: number;
        project_id: number;
        amount: number;
        base_amount: number | null;
        gst_rate: number | null;
        gst_amount: number | null;
        total_amount: number | null;
        description: string | null;
        status: string;
        gst_included?: number | null;
      }>)[0];

      if (!existing) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
      }
      if (existing.status === 'declined') {
        return NextResponse.json({ error: 'Declined entries cannot be edited' }, { status: 400 });
      }

      const gstRate = Number(existing.gst_rate ?? 0);
      const gstAmount = Number((amount * (gstRate / 100)).toFixed(2));
      const totalAmount = Number((amount + gstAmount).toFixed(2));
      const gstIncluded = Number(existing.gst_included ?? 0) === 1;

      await executeQuery(`
        UPDATE interior_billing_charges
        SET amount = ?, base_amount = ?, gst_amount = ?, total_amount = ?, description = ?
        WHERE id = ?
      `, [gstIncluded ? totalAmount : amount, amount, gstAmount, totalAmount, description, entryIdNum]);

      const oldDetails = {
        amount: Number(existing.base_amount ?? existing.amount),
        description: existing.description || '',
        gst_rate: gstRate,
        gst_amount: Number(existing.gst_amount ?? 0),
        total_amount: Number(existing.total_amount ?? existing.amount),
      };
      const newDetails = {
        amount,
        description,
        gst_rate: gstRate,
        gst_amount: gstAmount,
        total_amount: totalAmount,
      };

      await executeQuery(`
        INSERT INTO interior_audit_logs (action, entry_id, entry_type, admin_id, details)
        VALUES ('edit_entry', ?, 'charge', ?, ?)
      `, [entryIdNum, token.user_id, JSON.stringify({ old: oldDetails, new: newDetails })]);

      return NextResponse.json({
        message: 'Entry updated successfully',
        updated: {
          id: entryIdNum,
          type: 'charge',
          amount: gstIncluded ? totalAmount : amount,
          base_amount: amount,
          gst_rate: gstRate,
          gst_amount: gstAmount,
          total_amount: totalAmount,
          description,
        },
      });
    }

    const [rows] = await executeQuery(`
      SELECT id, project_id, amount, base_amount, gst_rate, gst_amount, total_amount, description, status, adjustment_type, COALESCE(category, 'adjustment') as category
      FROM interior_adjustments
      WHERE id = ?
      LIMIT 1
    `, [entryIdNum]);

    const existing = (rows as Array<{
      id: number;
      project_id: number;
      amount: number;
      base_amount: number | null;
      gst_rate: number | null;
      gst_amount: number | null;
      total_amount: number | null;
      description: string | null;
      status: string;
      adjustment_type: 'credit' | 'debit';
      category: string;
    }>)[0];

    if (!existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }
    if (existing.status === 'declined') {
      return NextResponse.json({ error: 'Declined entries cannot be edited' }, { status: 400 });
    }

    const normalizedCategory = existing.category || 'adjustment';
    if (entryType === 'adjustment' && normalizedCategory !== 'adjustment') {
      return NextResponse.json({ error: 'Entry type/category mismatch' }, { status: 400 });
    }
    if (entryType === 'extra_work' && normalizedCategory !== 'work') {
      return NextResponse.json({ error: 'Entry type/category mismatch' }, { status: 400 });
    }
    if (entryType === 'work' && normalizedCategory !== 'work') {
      return NextResponse.json({ error: 'Entry type/category mismatch' }, { status: 400 });
    }

    const gstRate = Number(existing.gst_rate ?? 0);
    const gstAmount = Number((amount * (gstRate / 100)).toFixed(2));
    const totalAmount = Number((amount + gstAmount).toFixed(2));

    await executeQuery(`
      UPDATE interior_adjustments
      SET amount = ?, base_amount = ?, gst_amount = ?, total_amount = ?, description = ?
      WHERE id = ?
    `, [amount, amount, gstAmount, totalAmount, description, entryIdNum]);

    const oldDetails = {
      amount: Number(existing.base_amount ?? existing.amount),
      description: existing.description || '',
      gst_rate: gstRate,
      gst_amount: Number(existing.gst_amount ?? 0),
      total_amount: Number(existing.total_amount ?? existing.amount),
      category: normalizedCategory,
      adjustment_type: existing.adjustment_type,
    };
    const newDetails = {
      amount,
      description,
      gst_rate: gstRate,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      category: normalizedCategory,
      adjustment_type: existing.adjustment_type,
    };

    await executeQuery(`
      INSERT INTO interior_audit_logs (action, entry_id, entry_type, admin_id, details)
      VALUES ('edit_entry', ?, 'adjustment', ?, ?)
    `, [entryIdNum, token.user_id, JSON.stringify({ old: oldDetails, new: newDetails })]);

    return NextResponse.json({
      message: 'Entry updated successfully',
      updated: {
        id: entryIdNum,
        type: normalizedCategory === 'work' ? 'extra_work' : 'adjustment',
        amount,
        base_amount: amount,
        gst_rate: gstRate,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        description,
        adjustment_type: existing.adjustment_type,
        category: normalizedCategory,
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to update ledger entry' },
      { status: 500 }
    );
  }
}
