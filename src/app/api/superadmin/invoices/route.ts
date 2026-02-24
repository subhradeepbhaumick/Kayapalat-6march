import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import mysql from 'mysql2/promise';

export async function GET() {
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
        a.agent_name,
        p.client_name,
        p.project_name,
        u.name as admin_name,
        i.paid,
        i.due,
        i.payment_status,
        i.payment_date,
        i.proof
      FROM invoice i
      LEFT JOIN projects p ON i.appointment_id = p.appointment_id
      LEFT JOIN agents a ON i.agent_id = a.agent_id
      LEFT JOIN users_kp_db u ON p.admin_id = u.user_id
      ORDER BY i.payment_date DESC
    `;

    const [rows] = await connection.execute(query);

    // Calculate total due from projects table
    const totalDueQuery = `SELECT SUM(COALESCE(agent_due, 0)) as total_due FROM projects`;
    const [totalDueResult] = await connection.execute(totalDueQuery);
    const totalDue = (totalDueResult as any[])[0]?.total_due || 0;

    await connection.end();

    const rowsArray = rows as any[];

    return NextResponse.json({
      success: true,
      data: rowsArray,
      totalDue: totalDue,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
