  import { NextRequest, NextResponse } from 'next/server';
  import { getToken } from 'next-auth/jwt';
  import { executeQuery } from '@/lib/db';
  import fs from 'fs';
  import path from 'path';

  export async function POST(request: NextRequest) {
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (!token || token.role !== 'superadmin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const formData = await request.formData();
      const entryType = formData.get('entry_type') as string; // 'charge', 'payment', 'adjustment', 'work', 'extra_work'
      const projectId = formData.get('project_id') as string;
      const amount = formData.get('amount') as string;
      const description = formData.get('description') as string;
      const paymentMethod = formData.get('payment_method') as string;
      const adjustmentTypeRaw = formData.get('adjustment_type') as string; // 'credit', 'debit'
      const adjustmentCategory = formData.get('adjustment_category') as string; // 'adjustment', 'work'
      const gstRateRaw = formData.get('gst_rate') as string;
      const gstIncludedRaw = formData.get('gst_included') as string;
      const transactionProof = formData.get('transaction_proof') as File;

      if (!entryType || !projectId || !amount) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Verify project exists
      const [projectCheck] = await executeQuery(`
        SELECT id FROM interior_projects WHERE id = ?
      `, [projectId]);

      if ((projectCheck as any[]).length === 0) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      let transactionProofPath = null;

      if (entryType === 'payment' && paymentMethod === 'online' && transactionProof) {
        // Save transaction proof
        const uploadsDir = path.join(process.cwd(), 'public', 'transaction_proof');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const now = new Date();
        const fileName = `interior_admin_${projectId}_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}.${transactionProof.name.split('.').pop()}`;
        const filePath = path.join(uploadsDir, fileName);
        const buffer = Buffer.from(await transactionProof.arrayBuffer());
        fs.writeFileSync(filePath, buffer);

        transactionProofPath = `/transaction_proof/${fileName}`;
      }

      if (entryType === 'charge') {
        const gstRate = gstRateRaw ? Number(gstRateRaw) : 18;
        const gstIncluded = gstIncludedRaw === '1';
        const amountInput = parseFloat(amount);
        if (!Number.isFinite(amountInput) || amountInput <= 0) {
          return NextResponse.json({ error: 'Valid amount required' }, { status: 400 });
        }

        let baseAmount, gstAmount, totalAmount;
        if (gstIncluded) {
          totalAmount = amountInput;
          baseAmount = Number((totalAmount / (1 + gstRate / 100)).toFixed(2));
          gstAmount = Number((totalAmount - baseAmount).toFixed(2));
        } else {
          baseAmount = amountInput;
          gstAmount = Number((baseAmount * (gstRate / 100)).toFixed(2));
          totalAmount = Number((baseAmount + gstAmount).toFixed(2));
        }

        // Add billing charge
        await executeQuery(`
          INSERT INTO interior_billing_charges (project_id, amount, base_amount, description, status, gst_rate, gst_amount, total_amount, gst_included)
          VALUES (?, ?, ?, ?, 'approved', ?, ?, ?, ?)
        `, [projectId, gstIncluded ? totalAmount : baseAmount, baseAmount, description || 'Billing charge added by admin', gstRate || 0, gstAmount, totalAmount, gstIncluded ? 1 : 0]);

      } else if (entryType === 'payment') {
        // Add payment (auto-approved for admin)
        if (!paymentMethod) {
          return NextResponse.json({ error: 'Payment method required for payments' }, { status: 400 });
        }

        // Check outstanding amount to prevent overpayment
        const [outstandingCheck] = await executeQuery(`
          SELECT
            (
              (SELECT COALESCE(SUM(COALESCE(total_amount, amount)), 0) FROM interior_billing_charges WHERE project_id = ? AND status = 'approved') +
              (SELECT COALESCE(SUM(CASE WHEN adjustment_type = 'credit' THEN COALESCE(total_amount, amount) ELSE -ABS(COALESCE(total_amount, amount)) END), 0) FROM interior_adjustments WHERE project_id = ? AND status = 'approved') -
              (SELECT COALESCE(SUM(amount), 0) FROM interior_payment_transactions WHERE project_id = ? AND status = 'approved')
            ) AS outstanding
          FROM interior_projects p
          WHERE p.id = ?
        `, [projectId, projectId, projectId, projectId]);

        const outstanding = Number((outstandingCheck as any[])[0]?.outstanding || 0);
        const paymentAmount = parseFloat(amount);

        if (paymentAmount > outstanding) {
          return NextResponse.json({
            error: `Payment amount (${paymentAmount}) exceeds outstanding balance (${outstanding})`
          }, { status: 400 });
        }

        await executeQuery(`
          INSERT INTO interior_payment_transactions (project_id, amount, payment_method, transaction_proof_path, status)
          VALUES (?, ?, ?, ?, 'approved')
        `, [projectId, amount, paymentMethod, transactionProofPath]);

      } else if (entryType === 'adjustment' || entryType === 'work' || entryType === 'extra_work') {
        // Add adjustment
        const adjustmentType = entryType === 'adjustment'
          ? 'debit'
          : entryType === 'extra_work'
            ? 'credit'
            : adjustmentTypeRaw;
        if (!adjustmentType || !['credit', 'debit'].includes(adjustmentType)) {
          return NextResponse.json({ error: 'Valid adjustment type required' }, { status: 400 });
        }

        const gstRate = gstRateRaw ? Number(gstRateRaw) : 18;
        const gstIncluded = entryType === 'adjustment' ? false : gstIncludedRaw === '1';
        const amountInput = parseFloat(amount);
        if (!Number.isFinite(amountInput) || amountInput <= 0) {
          return NextResponse.json({ error: 'Valid amount required' }, { status: 400 });
        }

        let baseAmount, gstAmount, totalAmount;
        if (gstIncluded) {
          totalAmount = amountInput;
          baseAmount = Number((totalAmount / (1 + gstRate / 100)).toFixed(2));
          gstAmount = Number((totalAmount - baseAmount).toFixed(2));
        } else {
          baseAmount = amountInput;
          gstAmount = Number((baseAmount * (gstRate / 100)).toFixed(2));
          totalAmount = Number((baseAmount + gstAmount).toFixed(2));
        }

        await executeQuery(`
          INSERT INTO interior_adjustments (project_id, amount, base_amount, gst_rate, gst_amount, total_amount, gst_included, description, adjustment_type, status, category)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?)
        `, [
          projectId,
          gstIncluded ? totalAmount : baseAmount,
          baseAmount,
          gstRate,
          gstAmount,
          totalAmount,
          gstIncluded ? 1 : 0,
          description || (entryType === 'extra_work' ? 'Extra work added by admin' : entryType === 'work' ? 'Work entry added by admin' : 'Adjustment added by admin'),
          adjustmentType,
          adjustmentCategory || (entryType === 'extra_work' ? 'work' : entryType === 'work' ? 'work' : 'adjustment')
        ]);

      } else {
        return NextResponse.json({ error: 'Invalid entry type' }, { status: 400 });
      }

      return NextResponse.json({ message: `${entryType} added successfully` });

    } catch (error) {
      console.error('API Error:', error);
      return NextResponse.json(
        { error: 'Failed to add ledger entry' },
        { status: 500 }
      );
    }
  }
