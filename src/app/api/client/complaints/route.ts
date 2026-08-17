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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = await pool.getConnection();

    try {
      const [complaints] = await connection.execute(
        'SELECT * FROM client_complaints WHERE client_id = ? ORDER BY created_at DESC',
        [session.user.id]
      );

      return NextResponse.json(complaints);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, details, images } = await request.json();

    if (!title || !details) {
      return NextResponse.json({ error: 'Title and details are required' }, { status: 400 });
    }

    if (images && (!Array.isArray(images) || images.length > 20)) {
      return NextResponse.json({ error: 'Maximum 20 images allowed' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      const [result] = await connection.execute(
        'INSERT INTO client_complaints (client_id, title, details, images) VALUES (?, ?, ?, ?)',
        [session.user.id, title, details, JSON.stringify(images || [])]
      ) as [mysql.ResultSetHeader, any];

      return NextResponse.json({
        id: result.insertId,
        message: 'Complaint submitted successfully'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating complaint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Complaint ID is required' }, { status: 400 });
    }

    const allowedFields: Array<'title'|'details'|'images'> = ['title','details','images'];

    if (body.images && (!Array.isArray(body.images) || body.images.length > 20)) {
      return NextResponse.json({ error: 'Maximum 20 images allowed' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      // Check if complaint exists and belongs to user
      const [complaints] = await connection.execute(
        'SELECT * FROM client_complaints WHERE id = ? AND client_id = ?',
        [id, session.user.id]
      ) as [any[], any];

      if (complaints.length === 0) {
        return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
      }

      const complaint = complaints[0];

      // Check 4-day edit window
      const createdAt = new Date(complaint.created_at);
      const now = new Date();
      const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff > 4) {
        return NextResponse.json({ error: 'Edit window has expired (4 days)' }, { status: 400 });
      }

      // Build dynamic update
      const updateFields: string[] = [];
      const params: any[] = [];

      for (const key of Object.keys(body)) {
        if (key === 'id') continue;
        if (!allowedFields.includes(key as any)) continue;

        if (key === 'images') {
          updateFields.push('images = ?');
          params.push(JSON.stringify(body.images || []));
        } else if (key === 'title') {
          updateFields.push('title = ?');
          params.push(body.title);
        } else if (key === 'details') {
          updateFields.push('details = ?');
          params.push(body.details);
        }
      }

      if (updateFields.length === 0) {
        return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
      }

      updateFields.push('edited_at = NOW()');

      const query = `UPDATE client_complaints SET ${updateFields.join(', ')} WHERE id = ? AND client_id = ?`;
      params.push(id, session.user.id);

      await connection.execute(query, params);

      return NextResponse.json({ message: 'Complaint updated successfully' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating complaint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Complaint ID is required' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      // Check if complaint exists and belongs to user
      const [complaints] = await connection.execute(
        'SELECT * FROM client_complaints WHERE id = ? AND client_id = ?',
        [id, session.user.id]
      ) as [any[], any];

      if (complaints.length === 0) {
        return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
      }

      const complaint = complaints[0];

      // Check 4-day edit window
      const createdAt = new Date(complaint.created_at);
      const now = new Date();
      const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff > 4) {
        return NextResponse.json({ error: 'Delete window has expired (4 days)' }, { status: 400 });
      }

      await connection.execute(
        'DELETE FROM client_complaints WHERE id = ? AND client_id = ?',
        [id, session.user.id]
      );

      return NextResponse.json({ message: 'Complaint deleted successfully' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting complaint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
