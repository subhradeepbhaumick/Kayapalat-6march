import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const designerId = searchParams.get('designer_id');
    const clientId = searchParams.get('client_id');

    let query = `
      SELECT dca.*, d.name AS designer_name, d.email AS designer_email,
             c.name AS client_name, c.email AS client_email
      FROM designer_client_assignments dca
      LEFT JOIN users_kp_db d ON dca.designer_id = d.user_id
      LEFT JOIN users_kp_db c ON dca.client_id = c.user_id
    `;
    const params: any[] = [];

    const conditions: string[] = [];
    if (designerId) {
      conditions.push('dca.designer_id = ?');
      params.push(designerId);
    }
    if (clientId) {
      conditions.push('dca.client_id = ?');
      params.push(clientId);
    }
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY dca.created_at DESC';

    const [rows] = await executeQuery(query, params);

    return NextResponse.json({ assignments: rows });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments', details: String(error) },
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

    if (!token || token.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { designer_id, client_id } = body || {};

    if (!designer_id || !client_id) {
      return NextResponse.json({ error: 'designer_id and client_id are required' }, { status: 400 });
    }

    // Validate roles
    const [designerRows] = await executeQuery(
      'SELECT user_id FROM users_kp_db WHERE user_id = ? AND role = "designer"',
      [designer_id]
    );
    if ((designerRows as any[]).length === 0) {
      return NextResponse.json({ error: 'Designer not found' }, { status: 404 });
    }

    const [clientRows] = await executeQuery(
      'SELECT user_id FROM users_kp_db WHERE user_id = ? AND role = "client"',
      [client_id]
    );
    if ((clientRows as any[]).length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    await executeQuery(
      `INSERT IGNORE INTO designer_client_assignments (designer_id, client_id, assigned_by)
       VALUES (?, ?, ?)`,
      [designer_id, client_id, token.user_id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Assignment id is required' }, { status: 400 });
    }

    await executeQuery('DELETE FROM designer_client_assignments WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment', details: String(error) },
      { status: 500 }
    );
  }
}
