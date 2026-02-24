import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const query = `
      SELECT
        i.invoice_id,
        i.appointment_id,
        i.agent_share as amount,
        i.payment_date as generated_date,
        i.payment_status as status,
        i.agent_id,
        p.client_name,
        p.project_name,
        p.location,
        p.project_value,
        p.commission,
        p.details,
        p.property_type,
        u1.name as agent_name,
        u2.name as admin_name,
        u1.phone as agent_phone,
        u2.phone as admin_phone
      FROM invoice i
      JOIN projects p ON i.appointment_id = p.appointment_id
      LEFT JOIN users_kp_db u1 ON i.agent_id = u1.user_id
      LEFT JOIN users_kp_db u2 ON p.admin_id = u2.user_id
      WHERE i.invoice_id = ?
    `;

    const [rows] = await connection.execute(query, [params.id]);
    await connection.end();

    const rowsArray = rows as any[];

    if (rowsArray.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const invoice = rowsArray[0];

    // Generate HTML content for viewing
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoice_id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #295A47; padding-bottom: 20px; }
          .invoice-details { margin-bottom: 30px; background: #f9f9f9; padding: 15px; border-radius: 5px; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .table th { background-color: #295A47; color: white; font-weight: bold; }
          .total { text-align: right; font-weight: bold; font-size: 18px; margin-top: 20px; color: #295A47; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
          .print-btn { background: #295A47; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px; }
          .print-btn:hover { background: #3a6b58; }
          @media print {
            .print-btn { display: none; }
            body { background: white; }
            .container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #295A47; margin: 0;">KAYAPALAT</h1>
            <h2 style="margin: 10px 0;">INVOICE</h2>
            <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoice.invoice_id}</p>
            <p style="margin: 5px 0;"><strong>Generated Date:</strong> ${new Date(invoice.generated_date).toLocaleDateString()}</p>
          </div>

          <div class="invoice-details">
            <h3>Invoice Details</h3>
            <p><strong>Status:</strong> <span style="color: ${invoice.status === 'Paid' ? 'green' : 'red'};">${invoice.status}</span></p>
            <p><strong>Appointment ID:</strong> ${invoice.appointment_id}</p>
          </div>

          <table class="table">
            <tr>
              <th colspan="2">Agent Information</th>
            </tr>
            <tr>
              <td><strong>Name:</strong></td>
              <td>${invoice.agent_name} (${invoice.agent_id})</td>
            </tr>
            <tr>
              <td><strong>Phone:</strong></td>
              <td>${invoice.agent_phone}</td>
            </tr>
          </table>

          <table class="table">
            <tr>
              <th colspan="2">Admin Information</th>
            </tr>
            <tr>
              <td><strong>Name:</strong></td>
              <td>${invoice.admin_name}</td>
            </tr>
            <tr>
              <td><strong>Phone:</strong></td>
              <td>${invoice.admin_phone}</td>
            </tr>
          </table>

          <table class="table">
            <tr>
              <th colspan="2">Client Information</th>
            </tr>
            <tr>
              <td><strong>Name:</strong></td>
              <td>${invoice.client_name}</td>
            </tr>
          </table>

          <table class="table">
            <tr>
              <th colspan="2">Project Details</th>
            </tr>
            <tr>
              <td><strong>Project Name:</strong></td>
              <td>${invoice.project_name}</td>
            </tr>
            <tr>
              <td><strong>Location:</strong></td>
              <td>${invoice.location}</td>
            </tr>
            <tr>
              <td><strong>Property Type:</strong></td>
              <td>${invoice.property_type}</td>
            </tr>
            <tr>
              <td><strong>Project Value:</strong></td>
              <td>₹${invoice.project_value?.toLocaleString()}</td>
            </tr>
            <tr>
              <td><strong>Commission:</strong></td>
              <td>${invoice.commission}%</td>
            </tr>
            <tr>
              <td><strong>Details:</strong></td>
              <td>${invoice.details}</td>
            </tr>
          </table>

          <div class="total">
            <p>Agent Share Amount: ₹${invoice.amount?.toLocaleString()}</p>
          </div>

          <div style="text-align: center;">
            <button class="print-btn" onclick="window.print()">Print Invoice</button>
          </div>

          <div class="footer">
            <p>This is a computer generated invoice. No signature required.</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error viewing invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to view invoice' },
      { status: 500 }
    );
  }
}
