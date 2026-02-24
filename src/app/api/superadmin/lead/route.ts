import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET });
    console.log('Token:', token);
    if (!token || !token.user_id || token.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all leads with admin info (cold calling, site visit, booking, booked)
    const query = `
      SELECT p.*, a.agent_name as agent_name, u.name as admin_name
      FROM projects p
      LEFT JOIN agents a ON p.agent_id = a.agent_id
      LEFT JOIN users_kp_db u ON a.admin_id = u.user_id
      ORDER BY p.appointment_id DESC
    `;
    const [rows] = await executeQuery(query);

    // Fetch remarks for all leads
    const appointmentIds = (rows as any[]).map(row => row.appointment_id);
    let remarksMap: { [key: string]: any[] } = {};
    if (appointmentIds.length > 0) {
      const placeholders = appointmentIds.map(() => '?').join(',');
      const remarksQuery = `SELECT remark_id, appointment_id, remarks, created_at FROM remarks WHERE appointment_id IN (${placeholders}) ORDER BY created_at DESC`;
      const [remarksRows] = await executeQuery(remarksQuery, appointmentIds);
      (remarksRows as any[]).forEach(row => {
        if (!remarksMap[row.appointment_id]) {
          remarksMap[row.appointment_id] = [];
        }
        remarksMap[row.appointment_id].push({
          id: row.remark_id,
          date: row.created_at.toISOString().slice(0, 10), // YYYY-MM-DD
          time: row.created_at.toTimeString().split(' ')[0], // HH:MM:SS
          comment: row.remarks,
        });
      });
    }

    // Attach remarks to leads
    const leadsWithRemarks = (rows as any[]).map(row => ({
      ...row,
      remarks: remarksMap[row.appointment_id] || [],
    }));

    return NextResponse.json({ leads: leadsWithRemarks });
  } catch (error) {
    console.error('Error fetching projects:', error);
    console.error('Error stack:', (error as Error).stack);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // --------------------------------------------------
    // Auth Check
    // --------------------------------------------------
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET });
    console.log('Token:', token);
    if (!token || !token.user_id || token.role !== 'superadmin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminId = token.user_id;

    const body = await request.json();
    const { appointment_id, ...updates } = body;

    if (!appointment_id) {
      return NextResponse.json({ error: 'Missing appointment_id' }, { status: 400 });
    }

    // Verify the project belongs to the admin (via agent)
    const [projectRows] = await executeQuery(
      'SELECT * FROM projects WHERE appointment_id = ?',
      [appointment_id]
    );

    if ((projectRows as any[]).length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = (projectRows as any[])[0];

    // --------------------------------------------------
    // Prepare update query
    // --------------------------------------------------
    const fields: string[] = [];
    const values: any[] = [];

    const updatableFields = [
      'location', 'project_name', 'project_value', 'commission', 'agent_share',
      'details', 'property_type', 'cold_call_date', 'cold_call_time', 'cold_call_status',
      'site_visit_date', 'site_visit_time', 'site_visit_status',
      'booking_date', 'booking_time', 'booking_status', 'booking_id', 'bookedInNext'
    ];

    for (const field of updatableFields) {
      if (updates[field] !== undefined) {
        if (['project_value', 'commission', 'agent_share'].includes(field)) {
          values.push(Number(updates[field]));
        } else {
          values.push(updates[field]);
        }
        fields.push(`${field} = ?`);
      }
    }

    // Recalculate agent_share if needed
    if (updates.agent_share === undefined && (updates.project_value !== undefined || updates.commission !== undefined)) {
      const projectValue = updates.project_value !== undefined ? updates.project_value : project.project_value;
      const commission = updates.commission !== undefined ? updates.commission : project.commission;
      const agentShare = (projectValue * commission) / 100;

      if (!fields.includes('agent_share = ?')) {
        fields.push('agent_share = ?');
        values.push(agentShare);
      } else {
        const index = fields.indexOf('agent_share = ?');
        values[index] = agentShare;
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updateQuery = `UPDATE projects SET ${fields.join(', ')} WHERE appointment_id = ?`;
    values.push(appointment_id);

    await executeQuery(updateQuery, values);

    // --------------------------------------------------
    // Insert lead if not exists
    // --------------------------------------------------
    const [updatedProjectRows] = await executeQuery('SELECT * FROM projects WHERE appointment_id = ?', [appointment_id]);
    const updatedProject = (updatedProjectRows as any[])[0];

    if (updatedProject.agent_id) {
      const [agentRow] = await executeQuery('SELECT admin_id FROM agents WHERE agent_id = ?', [updatedProject.agent_id]);
      const admin_id = (agentRow as any[])[0]?.admin_id;

      if (admin_id) {
        const [leadRow] = await executeQuery('SELECT lead_id FROM leads WHERE lead_id = ?', [updatedProject.lead_id]);
        if ((leadRow as any[]).length === 0 && updatedProject.lead_id) {
          const insertLeadsQuery = `
            INSERT INTO leads
            (lead_id, admin_id, client_name, client_phone, email, whatsapp, address, city, state, pincode, lead_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          const today = new Date().toISOString().slice(0, 10);
          await executeQuery(insertLeadsQuery, [
            updatedProject.lead_id,
            admin_id,
            updatedProject.client_name || '',
            updatedProject.client_phone || '',
            null,
            '',
            updatedProject.location || '',
            '',
            '',
            '',
            today,
          ]);
        }
      }
    }

    return NextResponse.json({ message: 'Project updated successfully' });

  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}



