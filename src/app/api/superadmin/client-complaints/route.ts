import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mysql from 'mysql2/promise';

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';

    const connection = await pool.getConnection();

    try {
      let query = `
        SELECT
          c.*,
          u.name as client_name,
          u.email as client_email,
          u.phone as client_phone
        FROM client_complaints c
        JOIN users_kp_db u ON c.client_id = u.user_id
      `;

      const conditions = [];
      const params = [];

      if (clientId) {
        conditions.push('c.client_id = ?');
        params.push(clientId);
      }

      if (status) {
        conditions.push('c.status = ?');
        params.push(status);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` ORDER BY c.${sortBy} ${sortOrder}`;

      const [complaints] = await connection.execute(query, params);

      // Also fetch clients for filter dropdown
      const [clients] = await connection.execute(
        'SELECT DISTINCT u.user_id, u.name, u.email FROM users_kp_db u JOIN client_complaints c ON u.user_id = c.client_id ORDER BY u.name'
      );

      return NextResponse.json({
        complaints,
        clients
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status, admin_comments } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Complaint ID is required' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      let updateFields = [];
      let params = [];

      if (status) {
        updateFields.push('status = ?');
        params.push(status);
      }

      if (admin_comments !== undefined) {
        updateFields.push('admin_comments = ?');
        updateFields.push('admin_commented_at = NOW()');
        params.push(admin_comments);
      }

      if (updateFields.length === 0) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      }

      params.push(id);

      await connection.execute(
        `UPDATE client_complaints SET ${updateFields.join(', ')} WHERE id = ?`,
        params
      );

      return NextResponse.json({ message: 'Complaint updated successfully' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating complaint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
