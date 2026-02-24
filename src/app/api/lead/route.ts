import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import mysql from "mysql2/promise";

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Utility to generate incremental IDs
async function generateIncrementalId(prefix: string, table: string, column: string) {
  const [rows] = await pool.query(`SELECT ${column} FROM ${table} ORDER BY ${column} DESC LIMIT 1`);
  
  let nextNumber = 1;

  if ((rows as any).length > 0) {
    const lastId = (rows as any)[0][column]; // e.g., "C00012"
    const number = parseInt(lastId.replace(prefix, ""), 10);
    nextNumber = number + 1;
  }

  const padded = String(nextNumber).padStart(5, "0"); // 00001 format
  return `${prefix}${padded}`;
}

// Generate lead_id
async function generateLeadId() {
  return generateIncrementalId("C", "leads", "lead_id");
}

// Generate appointment_id
async function generateAppointmentId() {
  return generateIncrementalId("A", "projects", "appointment_id");
}

// POST: Add a new client
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.client_name || !data.client_phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const lead_id = data.lead_id ? data.lead_id : await generateLeadId(); // allow frontend to send existing lead_id
    const appointment_id = await generateAppointmentId();
    const today = new Date();
    const lead_date = today.toISOString().slice(0, 10); // YYYY-MM-DD

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get admin_id from agents table based on agent_id
      let admin_id = null;
      if (data.agent_id) {
        const [agentRow] = await connection.query(`SELECT admin_id FROM agents WHERE agent_id = ?`, [data.agent_id]);
        if ((agentRow as any).length > 0) {
          admin_id = (agentRow as any)[0].admin_id;
        }
      }

      // Check if lead_id exists if frontend provided it
      if (data.lead_id) {
        const [existing] = await connection.query(`SELECT lead_id FROM leads WHERE lead_id = ?`, [data.lead_id]);
        if ((existing as any).length === 0) {
          return NextResponse.json({ error: "Client does not exist" }, { status: 400 });
        }
      } else {
        // Insert into leads table only if it's a new client
        const insertLeadsQuery = `
          INSERT INTO leads
          (lead_id, admin_id, client_name, client_phone, email, whatsapp, address, city, state, pincode, lead_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(insertLeadsQuery, [
          lead_id,
          admin_id,
          data.client_name,
          data.client_phone,
          data.email || null,
          data.whatsapp || "",
          data.address || "",
          data.city || "",
          data.state || "",
          data.pincode || "",
          lead_date,
        ]);
      }

      // Insert into projects table
      const insertProjectsQuery = `
        INSERT INTO projects
        (appointment_id, lead_id, agent_id, admin_id, client_name, client_phone, location, project_value, commission, agent_share, details, property_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await connection.query(insertProjectsQuery, [
        appointment_id,
        lead_id,
        data.agent_id || null,
        admin_id,
        data.client_name,
        data.client_phone,
        data.address || "",          // location
        data.project_value || 0,
        data.commission || 0,
        data.agent_share || 0,
        data.details || "",
        data.property_type || "Residential",
        today
      ]);

      await connection.commit();
      return NextResponse.json({ message: "Client added successfully", lead_id, appointment_id });
    } catch (err) {
      await connection.rollback();
      console.error(err);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

// GET: Fetch leads with appointment_id, optionally filtered by agent_id
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = token.user_id as string;

    // Check if user is referuser
    const userRows = await pool.query('SELECT user_id FROM users_kp_db WHERE user_id = ? AND role = ?', [userId, 'referuser']);
    if ((userRows as any)[0].length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agent_id');

    // Ensure referuser can only access their own leads
    if (!agentId || agentId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let query = `
      SELECT
        leads.*,
        projects.appointment_id,
        projects.agent_id,
        projects.location,
        projects.project_value,
        projects.commission,
        projects.agent_share,
        projects.details,
        projects.property_type,
        projects.created_at
      FROM leads
      LEFT JOIN projects
        ON leads.lead_id = projects.lead_id
    `;

    const params: any[] = [];

    if (agentId) {
      query += ` WHERE projects.agent_id = ?`;
      params.push(agentId);
    }

    query += ` ORDER BY leads.lead_date DESC`;

    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}
