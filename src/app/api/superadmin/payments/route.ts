  import { NextRequest, NextResponse } from 'next/server';
  import { executeQuery } from '@/lib/db';

  export async function GET() {
    try {
      const query = `
        SELECT
          p.appointment_id as id,
          p.agent_id,
          a.agent_name,
          p.client_name,
          p.project_name,
          COALESCE(p.project_value, 0) as client_estimate,
          COALESCE(p.commission, 0) as commission,
          COALESCE(p.agent_share, 0) as agent_share,
          COALESCE(p.agent_paid, 0) as agent_paid,
          COALESCE(p.agent_due, 0) as due,
          COALESCE(p.payment_status, 'Due') as payment_status,
          p.booking_status,
          b.account_holder_name,
          b.upi_id,
          b.bank_name,
          b.account_number,
          b.ifsc_code,
          b.qr_code as upi_qr
        FROM projects p
        LEFT JOIN agents a ON p.agent_id = a.agent_id
        LEFT JOIN agent_bank_details b ON p.agent_id = b.agent_id
        ORDER BY p.created_at DESC
      `;

      const [rows] = await executeQuery(query);

      return NextResponse.json({
        success: true,
        data: rows
      });

    } catch (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      );
    }
  }

  export async function POST(request: NextRequest) {
    try {
      const { appointment_id, agent_share, agent_paid, payment_status } = await request.json();

      let updateFields = [];
      let updateValues = [];

      if (agent_share !== undefined) {
        updateFields.push('agent_share = ?');
        updateValues.push(agent_share);
      }

      if (agent_paid !== undefined) {
        updateFields.push('agent_paid = ?');
        updateValues.push(agent_paid);
      }

      if (payment_status !== undefined) {
        updateFields.push('payment_status = ?');
        updateValues.push(payment_status);
      }

      // Calculate and update agent_due if agent_share or agent_paid is being updated
      if (agent_share !== undefined || agent_paid !== undefined) {
        // First, get current values to calculate due
        const currentQuery = `SELECT agent_share, agent_paid FROM projects WHERE appointment_id = ?`;
        const [currentResult] = await executeQuery(currentQuery, [appointment_id]);
        if (currentResult.length > 0) {
          const currentAgentShare = agent_share !== undefined ? agent_share : currentResult[0].agent_share;
          const currentAgentPaid = agent_paid !== undefined ? agent_paid : currentResult[0].agent_paid;
          const calculatedDue = Math.max(currentAgentShare - currentAgentPaid, 0);
          updateFields.push('agent_due = ?');
          updateValues.push(calculatedDue);
        }
      }

      if (updateFields.length === 0) {
        return NextResponse.json(
          { error: 'No fields to update' },
          { status: 400 }
        );
      }

      const updateQuery = `
        UPDATE projects
        SET ${updateFields.join(', ')}
        WHERE appointment_id = ?
      `;

      updateValues.push(appointment_id);

      await executeQuery(updateQuery, updateValues);

      // Only insert into invoice table if agent_share is being updated
      if (agent_share !== undefined) {
        const nextIdQuery = `SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM invoice`;
        const [nextIdResult] = await executeQuery(nextIdQuery);
        const nextId = nextIdResult[0].next_id;
        const invoiceId = `I${nextId}`;

        const insertInvoiceQuery = `
          INSERT INTO invoice (invoice_id, appointment_id, agent_share, payment_status)
          VALUES (?, ?, ?, ?)
        `;

        const insertValues = [invoiceId, appointment_id, agent_share, payment_status || 'Due'];

        await executeQuery(insertInvoiceQuery, insertValues);
      }

      return NextResponse.json({
        success: true,
        message: agent_share !== undefined ? 'Payment updated and invoice created successfully' : 'Payment updated successfully'
      });

    } catch (error) {
      console.error('Error updating payment:', error);
      return NextResponse.json(
        { error: 'Failed to update payment' },
        { status: 500 }
      );
    }
  }

  export async function PUT(request: NextRequest) {
    try {
      const { appointment_id, payment_status } = await request.json();

      if (!appointment_id || !payment_status) {
        return NextResponse.json(
          { error: 'Appointment ID and payment status are required' },
          { status: 400 }
        );
      }

      const updateInvoiceQuery = `
        UPDATE invoice
        SET payment_status = ?
        WHERE appointment_id = ?
      `;

      await executeQuery(updateInvoiceQuery, [payment_status, appointment_id]);

      return NextResponse.json({
        success: true,
        message: 'Invoice updated successfully'
      });

    } catch (error) {
      console.error('Error updating invoice:', error);
      return NextResponse.json(
        { error: 'Failed to update invoice' },
        { status: 500 }
      );
    }
  }
