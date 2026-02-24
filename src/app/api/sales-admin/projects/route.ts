// This file handles GET and PUT requests for Referuser & sales admin projects
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // --------------------------------------------------
    // Auth Check
    // --------------------------------------------------
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.user_id || (token.role !== 'sales_admin' && token.role !== 'superadmin' && token.role !== 'referuser')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.user_id;

    // Check if user is an agent
    const [agentRows] = await executeQuery('SELECT agent_id FROM agents WHERE agent_id = ?', [userId]);
    const isAgent = (agentRows as any[]).length > 0;

    let query;
    let params;
    if (isAgent) {
      // Filter by agent_id
      query = `
        SELECT p.*, a.agent_name as agent_name
        FROM projects p
        LEFT JOIN agents a ON p.agent_id = a.agent_id
        WHERE p.agent_id = ?
        ORDER BY p.appointment_id DESC
      `;
      params = [userId];
    } else {
      // Filter by admin_id
      query = `
        SELECT p.*, a.agent_name as agent_name
        FROM projects p
        LEFT JOIN agents a ON p.agent_id = a.agent_id
        WHERE p.admin_id = ?
        ORDER BY p.appointment_id DESC
      `;
      params = [userId];
    }

    const [rows] = await executeQuery(query, params);

    return NextResponse.json({ projects: rows });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // --------------------------------------------------
    // Auth Check
    // --------------------------------------------------
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.user_id || (token.role !== 'sales_admin' && token.role !== 'superadmin')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminId = token.user_id;

    const body = await request.json();
    const { appointment_id, updates } = body;

    if (!appointment_id || !updates) {
      return NextResponse.json({ error: 'Missing appointment_id or updates' }, { status: 400 });
    }

    // Verify the project belongs to the admin
    const [projectRows] = await executeQuery(
      'SELECT * FROM projects WHERE appointment_id = ? AND admin_id = ?',
      [appointment_id, adminId]
    );

    if ((projectRows as any[]).length === 0) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
    }

    // Prepare update query
    const fields = [];
    const values = [];

    if (updates.location !== undefined) fields.push('location = ?'), values.push(updates.location);
    if (updates.project_name !== undefined) fields.push('project_name = ?'), values.push(updates.project_name);
    if (updates.project_value !== undefined) fields.push('project_value = ?'), values.push(updates.project_value);
    if (updates.commission !== undefined) fields.push('commission = ?'), values.push(updates.commission);
    if (updates.agent_share !== undefined) fields.push('agent_share = ?'), values.push(updates.agent_share);
    if (updates.details !== undefined) fields.push('details = ?'), values.push(updates.details);
    if (updates.property_type !== undefined) fields.push('property_type = ?'), values.push(updates.property_type);
    if (updates.cold_call_date !== undefined) fields.push('cold_call_date = ?'), values.push(updates.cold_call_date);
    if (updates.cold_call_time !== undefined) fields.push('cold_call_time = ?'), values.push(updates.cold_call_time);
    if (updates.cold_call_status !== undefined) fields.push('cold_call_status = ?'), values.push(updates.cold_call_status);
    if (updates.site_visit_date !== undefined) fields.push('site_visit_date = ?'), values.push(updates.site_visit_date);
    if (updates.site_visit_time !== undefined) fields.push('site_visit_time = ?'), values.push(updates.site_visit_time);
    if (updates.site_visit_status !== undefined) fields.push('site_visit_status = ?'), values.push(updates.site_visit_status);
    if (updates.booking_date !== undefined) fields.push('booking_date = ?'), values.push(updates.booking_date);
    if (updates.booking_time !== undefined) fields.push('booking_time = ?'), values.push(updates.booking_time);
    if (updates.booking_status !== undefined) fields.push('booking_status = ?'), values.push(updates.booking_status);
    if (updates.booking_id !== undefined) fields.push('booking_id = ?'), values.push(updates.booking_id);
    if (updates.booked_in_next !== undefined) fields.push('bookedInNext = ?'), values.push(updates.booked_in_next);
    if (updates.client_name !== undefined) fields.push('client_name = ?'), values.push(updates.client_name);
    if (updates.client_phone !== undefined) fields.push('client_phone = ?'), values.push(updates.client_phone);

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Recalculate agent_share if project_value or commission is updated
    const project = (projectRows as any[])[0];
    let agentShare = project.agent_share;
    if (updates.project_value !== undefined || updates.commission !== undefined) {
      const projectValue = updates.project_value !== undefined ? updates.project_value : project.project_value;
      const commission = updates.commission !== undefined ? updates.commission : project.commission;
      agentShare = (projectValue * commission) / 100;
      if (!fields.includes('agent_share = ?')) {
        fields.push('agent_share = ?');
        values.push(agentShare);
      } else {
        // Update the value in values array
        const index = fields.indexOf('agent_share = ?');
        values[index] = agentShare;
      }
    }

    const updateQuery = `UPDATE projects SET ${fields.join(', ')} WHERE appointment_id = ?`;
    values.push(appointment_id);

    await executeQuery(updateQuery, values);

    // After updating, check if the project has agent_id and ensure the lead exists in leads table
    const [updatedProject] = await executeQuery('SELECT * FROM projects WHERE appointment_id = ?', [appointment_id]);
    const updatedProjectData = (updatedProject as any[])[0];

    if (updatedProjectData.agent_id) {
      // Get admin_id from agents table
      const [agentRow] = await executeQuery('SELECT admin_id FROM agents WHERE agent_id = ?', [updatedProjectData.agent_id]);
      const admin_id = (agentRow as any[])[0]?.admin_id;

      if (admin_id) {
        // Check if lead exists in leads table
        const [leadRow] = await executeQuery('SELECT lead_id FROM leads WHERE lead_id = ?', [updatedProjectData.lead_id]);
        if ((leadRow as any[]).length === 0) {
          // Insert into leads table
          const insertLeadsQuery = `
            INSERT INTO leads
            (lead_id, admin_id, client_name, client_phone, email, whatsapp, address, city, state, pincode, lead_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          const today = new Date().toISOString().slice(0, 10);
          await executeQuery(insertLeadsQuery, [
            updatedProjectData.lead_id,
            admin_id,
            updatedProjectData.client_name || '',
            updatedProjectData.client_phone || '',
            null, // email
            '', // whatsapp
            updatedProjectData.location || '',
            '', // city
            '', // state
            '', // pincode
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