// This file handles GET and PUT requests for Referuser & sales admin projects
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // --------------------------------------------------
    // Auth Check
    // --------------------------------------------------
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (
      !token ||
      !token.user_id ||
      ![
        "sales_admin",
        "superadmin",
        "referuser",
        "client",
        "metro_client",
        "metro-superadmin",
        "metro",
      ].includes(token.role as string)
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = token.user_id as string;
    const role = token.role as string;

    // --------------------------------------------------
    // Fetch Metro Property Visits
    // --------------------------------------------------

    let query: string;
    let params: any[] = [];

    // Superadmin and Metro Superadmin can see ALL leads
    if (
      role === "superadmin" ||
      role === "metro-superadmin"
    ) {
      query = `
        SELECT *
        FROM metro_property_visit
        ORDER BY created_at DESC
      `;
    } else {
      // Other users can only see their own leads
      query = `
        SELECT *
        FROM metro_property_visit
        WHERE admin_id = ?
        ORDER BY created_at DESC
      `;

      params = [userId];
    }

    const [rows] = await executeQuery(query, params);

    return NextResponse.json({
      projects: rows,
    });

  } catch (error) {
    console.error(
      "Error fetching metro property visits:",
      error
    );

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // --------------------------------------------------
    // Auth Check
    // --------------------------------------------------
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.user_id || (token.role !== 'sales_admin' && token.role !== 'superadmin' && token.role !== 'metro-superadmin' && token.role !== 'metro_client' && token.role !== 'metro')) {
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
      'SELECT * FROM metro_property_visit WHERE appointment_id = ? AND admin_id = ?',
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
    if (updates.lead_id !== undefined) fields.push('lead_id = ?'), values.push(updates.lead_id);
    if (updates.admin_id !== undefined) fields.push('admin_id = ?'), values.push(updates.admin_id);
    if (updates.budget !== undefined) { fields.push('budget = ?'); values.push(updates.budget); }
    // if (updates.commission !== undefined) fields.push('commission = ?'), values.push(updates.commission);
    // if (updates.agent_share !== undefined) fields.push('agent_share = ?'), values.push(updates.agent_share);
    if (updates.details !== undefined) fields.push('details = ?'), values.push(updates.details);
    if (updates.property_type !== undefined) fields.push('property_type = ?'), values.push(updates.property_type);
    if (updates.cold_call_from !== undefined) { fields.push('cold_call_from = ?'); values.push(updates.cold_call_from); }
    if (updates.cold_call_to !== undefined) { fields.push('cold_call_to = ?'); values.push(updates.cold_call_to); }
    if (updates.cold_call_status !== undefined) fields.push('cold_call_status = ?'), values.push(updates.cold_call_status);
    // Site Visit
    if (updates.site_visit_from !== undefined) { fields.push('site_visit_from = ?'); values.push(updates.site_visit_from); }
    if (updates.site_visit_to !== undefined) { fields.push('site_visit_to = ?'); values.push(updates.site_visit_to); }
    if (updates.site_visit_status !== undefined) fields.push('site_visit_status = ?'), values.push(updates.site_visit_status);
    if (updates.booking_date_from !== undefined) { fields.push('booking_date_from = ?'); values.push(updates.booking_date_from); }
    if (updates.booking_time_to !== undefined) { fields.push('booking_time_to = ?'); values.push(updates.booking_time_to); }
    if (updates.booking_status !== undefined) fields.push('booking_status = ?'), values.push(updates.booking_status);
    if (updates.booking_id !== undefined) fields.push('booking_id = ?'), values.push(updates.booking_id);
    if (updates.booked_in_next !== undefined) fields.push('bookedInNext = ?'), values.push(updates.booked_in_next);
    if (updates.client_name !== undefined) fields.push('client_name = ?'), values.push(updates.client_name);
    if (updates.client_phone !== undefined) fields.push('client_phone = ?'), values.push(updates.client_phone);

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // // Recalculate agent_share if project_value or commission is updated
    // const project = (projectRows as any[])[0];
    // let agentShare = project.agent_share;
    // if (updates.budget !== undefined || updates.commission !== undefined) {
    //   const projectValue = updates.budget !== undefined ? updates.budget : project.budget;
    //   const commission = updates.commission !== undefined ? updates.commission : project.commission;
    //   agentShare = (projectValue * commission) / 100;
    //   if (!fields.includes('agent_share = ?')) {
    //     fields.push('agent_share = ?');
    //     values.push(agentShare);
    //   } else {
    //     // Update the value in values array
    //     const index = fields.indexOf('agent_share = ?');
    //     values[index] = agentShare;
    //   }
    // }

    const updateQuery = `UPDATE metro_property_visit SET ${fields.join(', ')} WHERE appointment_id = ?`;
    values.push(appointment_id);

    await executeQuery(updateQuery, values);

    // After updating, check if the project has agent_id and ensure the lead exists in leads table
    const [updatedProject] = await executeQuery('SELECT * FROM metro_property_visit WHERE appointment_id = ?', [appointment_id]);
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