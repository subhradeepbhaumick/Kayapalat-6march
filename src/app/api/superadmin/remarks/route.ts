import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.user_id || token.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = token.user_id;

    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('appointment_id');

    if (!appointmentId) {
      return NextResponse.json({ error: 'appointment_id is required' }, { status: 400 });
    }

    // Check if user has access to this appointment (superadmin has global access, but to match sales-admin logic, add check)
    const [accessRows] = await executeQuery('SELECT appointment_id FROM projects WHERE appointment_id = ?', [appointmentId]);
    if ((accessRows as any[]).length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch remarks
    const [rows] = await executeQuery(
      'SELECT remark_id, remarks, created_at FROM remarks WHERE appointment_id = ? ORDER BY created_at DESC',
      [appointmentId]
    );

    const remarks = (rows as any[]).map(row => ({
      id: row.remark_id,
      date: row.created_at.toISOString().split('T')[0], // YYYY-MM-DD
      time: row.created_at.toTimeString().split(' ')[0], // HH:MM:SS
      comment: row.remarks,
    }));

    return NextResponse.json({ remarks });
  } catch (error) {
    console.error('Error fetching remarks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.user_id || token.role !== 'superadmin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = token.user_id;

    const body = await request.json();
    const { appointment_id, remark } = body;

    if (!appointment_id || !remark) {
      return NextResponse.json({ error: 'appointment_id and remark are required' }, { status: 400 });
    }

    // Check if user has access to this appointment (superadmin has global access, but to match sales-admin logic, add check)
    const [accessRows] = await executeQuery('SELECT appointment_id FROM projects WHERE appointment_id = ?', [appointment_id]);
    if ((accessRows as any[]).length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Insert new remark
    await executeQuery(
      'INSERT INTO remarks (appointment_id, remarks, created_at) VALUES (?, ?, NOW())',
      [appointment_id, remark]
    );

    return NextResponse.json({ message: 'Remark added successfully' });
  } catch (error) {
    console.error('Error adding remark:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.user_id || token.role !== 'superadmin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = token.user_id;

    const body = await request.json();
    const { remark_id, remark } = body;

    if (!remark_id || !remark) {
      return NextResponse.json({ error: 'remark_id and remark are required' }, { status: 400 });
    }

    // Check if user has access to this remark (superadmin has global access, but to match sales-admin logic, add check)
    const [accessRows] = await executeQuery('SELECT r.remark_id FROM remarks r JOIN projects p ON r.appointment_id = p.appointment_id WHERE r.remark_id = ?', [remark_id]);
    if ((accessRows as any[]).length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update the remark
    await executeQuery(
      'UPDATE remarks SET remarks = ? WHERE remark_id = ?',
      [remark, remark_id]
    );

    return NextResponse.json({ message: 'Remark updated successfully' });
  } catch (error) {
    console.error('Error updating remark:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
