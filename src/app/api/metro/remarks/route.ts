import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = token.role as string;

    if (role !== 'metro' && role !== 'superadmin' && role !== 'metro-superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('appointment_id');

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'appointment_id is required' },
        { status: 400 }
      );
    }

    // Check appointment exists
    const [visit] = await executeQuery(
      `SELECT appointment_id
       FROM metro_property_visit
       WHERE appointment_id = ?`,
      [appointmentId]
    );

    if ((visit as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    const [rows] = await executeQuery(
      `SELECT remark_id, remarks, created_at
       FROM metro_remarks
       WHERE appointment_id = ?
       ORDER BY created_at DESC`,
      [appointmentId]
    );

    const remarks = (rows as any[]).map((row) => ({
      id: row.remark_id,
      date: new Date(row.created_at).toISOString().split('T')[0],
      time: new Date(row.created_at).toTimeString().split(' ')[0],
      comment: row.remarks,
    }));

    return NextResponse.json({ remarks });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
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

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = token.role as string;

    if (role !== 'metro' && role !== 'superadmin' && role !== 'metro-superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { appointment_id, remark } = body;

    if (!appointment_id || !remark) {
      return NextResponse.json(
        { error: 'appointment_id and remark are required' },
        { status: 400 }
      );
    }

    // Check appointment exists
    const [visit] = await executeQuery(
      `SELECT appointment_id
       FROM metro_property_visit
       WHERE appointment_id = ?`,
      [appointment_id]
    );

    if ((visit as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    await executeQuery(
      `INSERT INTO metro_remarks
      (appointment_id, remarks, created_at)
      VALUES (?, ?, NOW())`,
      [appointment_id, remark]
    );

    return NextResponse.json({
      message: 'Remark added successfully',
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = token.role as string;

    if (role !== 'metro' && role !== 'superadmin' && role !== 'metro-superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { remark_id, remark } = body;

    if (!remark_id || !remark) {
      return NextResponse.json(
        { error: 'remark_id and remark are required' },
        { status: 400 }
      );
    }

    // Check remark exists
    const [existing] = await executeQuery(
      `SELECT remark_id
       FROM metro_remarks
       WHERE remark_id = ?`,
      [remark_id]
    );

    if ((existing as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Remark not found' },
        { status: 404 }
      );
    }

    await executeQuery(
      `UPDATE metro_remarks
       SET remarks = ?
       WHERE remark_id = ?`,
      [remark, remark_id]
    );

    return NextResponse.json({
      message: 'Remark updated successfully',
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}