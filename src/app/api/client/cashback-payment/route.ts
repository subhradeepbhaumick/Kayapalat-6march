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

        // Fetch existing payments for this client
        const [rows] = await executeQuery(`
      SELECT id, plan_type, amount, gst_amount, total_amount, payment_method, status, created_at, updated_at
      FROM design_fees_payments
      WHERE client_id = ?
      ORDER BY created_at DESC
    `, [clientId]);

        const payments = (rows as any[]).map(row => ({
            id: row.id,
            plan_type: row.plan_type,
            amount: Number(row.amount),
            gst_amount: Number(row.gst_amount),
            total_amount: Number(row.total_amount),
            payment_method: row.payment_method,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }));

        return NextResponse.json({ payments });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch payments' },
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

        const plan_type = formData.get('plan_type') as string;
        const contact = formData.get('contact_number') as string;
        const amount = formData.get('amount') as string;
        const gst_amount = "0";
        const total_amount = amount;
        const payment_method = formData.get('payment_method') as string;
        const transaction_proof = formData.get('transaction_proof') as File;

        if (!plan_type || !amount || !gst_amount || !total_amount || !payment_method) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (payment_method === 'online' && !transaction_proof) {
            return NextResponse.json({ error: 'Transaction proof required for online payment' }, { status: 400 });
        }

        let transactionProofPath = null;

        if (transaction_proof) {
            // Save the transaction proof file
            const uploadsDir = path.join(process.cwd(), 'public', 'transaction_proof');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const now = new Date();
            const fileName = `design_fee_${clientId}_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}.${transaction_proof.name.split('.').pop()}`;
            const filePath = path.join(uploadsDir, fileName);
            const buffer = Buffer.from(await transaction_proof.arrayBuffer());
            fs.writeFileSync(filePath, buffer);

            transactionProofPath = `/transaction_proof/${fileName}`;
        }

        // Check if there's an approved payment within the last 24 hours for this plan
        const [existing] = await executeQuery(`
      SELECT id, status, updated_at FROM design_fees_payments
      WHERE client_id = ? AND plan_type = ?
      ORDER BY updated_at DESC LIMIT 1
    `, [clientId, plan_type]);

        if ((existing as any[]).length > 0) {
            const payment = (existing as any[])[0];
            if (payment.status === 'approved') {
                const approvedTime = new Date(payment.updated_at).getTime();
                const now = Date.now();
                const twentyFourHours = 24 * 60 * 60 * 1000;
                if ((now - approvedTime) < twentyFourHours) {
                    return NextResponse.json({ error: 'This plan is temporarily blocked. Please try again after 24 hours from approval.' }, { status: 409 });
                }
            } else if (payment.status === 'pending') {
                return NextResponse.json({ error: 'Payment already submitted for this plan' }, { status: 409 });
            }
        }

        // Insert new payment
        await executeQuery(`
      INSERT INTO design_fees_payments (client_id, plan_type,contact, amount, gst_amount, total_amount, payment_method, transaction_proof_path, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [clientId, plan_type, contact, amount, gst_amount, total_amount, payment_method, transactionProofPath]);

        return NextResponse.json({ message: 'Payment submitted successfully' });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to submit payment' },
            { status: 500 }
        );
    }
}
