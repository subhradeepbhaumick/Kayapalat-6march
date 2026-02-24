import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { executeQuery } from "@/lib/db";
import fs from "fs";
import path from "path";


// ======================================================
// ===============   GET API HANDLER   ==================
// ======================================================
export async function GET(request: NextRequest) {
  try {
    // --------------------------------------------------
    // Auth Check
    // --------------------------------------------------
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.user_id || (token.role !== 'sales_admin' && token.role !== 'superadmin')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.user_id;

    const url = new URL(request.url);
    const nextId = url.searchParams.get("nextId");
    const invoices = url.searchParams.get("invoices");
    const due = url.searchParams.get("due");
    const appointmentId = url.searchParams.get("appointmentId");

    // --------------------------------------------------
    // 1️⃣ Generate NEXT INVOICE ID
    // --------------------------------------------------
    if (nextId === "true") {
      const nextIdQuery = `
        SELECT MAX(CAST(SUBSTRING(invoice_id, 2) AS UNSIGNED)) AS max_num 
        FROM invoice
      `;

      const [res] = await executeQuery(nextIdQuery);
      const maxNum = res[0]?.max_num || 0;
      const nextInvoiceId = `I${String(maxNum + 1).padStart(4, '0')}`;

      return NextResponse.json({
        success: true,
        nextInvoiceId,
      });
    }

    // --------------------------------------------------
    // 2️⃣ Fetch ALL INVOICES or INVOICES for specific appointment
    // --------------------------------------------------
    if (invoices === "true") {
      let invoicesQuery = `
        SELECT
          i.invoice_id,
          i.appointment_id,
          a.agent_name,
          i.agent_id,

          p.client_name,
          p.client_phone AS client_contact,
          p.project_name,
          p.location,
          p.project_value AS total_estimate,

          i.agent_share,
          i.paid,
          i.due,
          i.payment_status,
          i.payment_date AS invoice_date,
          i.payment_time AS invoice_time,
          i.proof

        FROM invoice i
        LEFT JOIN projects p ON i.appointment_id = p.appointment_id
        LEFT JOIN agents a ON i.agent_id = a.agent_id
      `;

      const params = [];
      if (appointmentId) {
        invoicesQuery += ` WHERE i.appointment_id = ?`;
        params.push(appointmentId);
      }

      invoicesQuery += ` ORDER BY i.invoice_id DESC`;

      const [rows] = await executeQuery(invoicesQuery, params);
      return NextResponse.json({ success: true, data: rows });
    }

    // --------------------------------------------------
    // 3️⃣ Get DUE Amount for Appointment
    // --------------------------------------------------
    if (due === "true" && appointmentId) {
      // Check if there are any invoices for this appointment
      const invoiceCountQuery = `SELECT COUNT(*) AS count FROM invoice WHERE appointment_id = ?`;
      const [countResult] = await executeQuery(invoiceCountQuery, [appointmentId]);
      const hasInvoices = countResult[0].count > 0;

      if (!hasInvoices) {
        // No invoices yet, set agent_due to agent_share
        const initDueQuery = `
          UPDATE projects
          SET agent_due = agent_share
          WHERE appointment_id = ?
        `;
        await executeQuery(initDueQuery, [appointmentId]);
      }

      const q = `SELECT agent_due FROM projects WHERE appointment_id = ?`;
      const [rows] = await executeQuery(q, [appointmentId]);

      return NextResponse.json({
        success: true,
        due: rows.length > 0 ? rows[0].agent_due : 0,
      });
    }

    // --------------------------------------------------
    // 4️⃣ Get TOTAL PAID for Appointment
    // --------------------------------------------------
    if (url.searchParams.get("totalPaid") === "true" && appointmentId) {
      const q = `SELECT SUM(paid) AS total_paid FROM invoice WHERE appointment_id = ?`;
      const [rows] = await executeQuery(q, [appointmentId]);
      return NextResponse.json({
        success: true,
        totalPaid: rows.length > 0 ? rows[0].total_paid || 0 : 0,
      });
    }

    // --------------------------------------------------
    // 🆕 5️⃣ Fetch ALL Appointment IDs for Dropdown
    // --------------------------------------------------
    if (url.searchParams.get("appointmentList") === "true") {
      const q = `SELECT appointment_id FROM projects WHERE booking_status = 'Booked' ORDER BY appointment_id DESC`;
      const [rows] = await executeQuery(q);

      return NextResponse.json({
        success: true,
        appointmentIds: rows,
      });
    }

    // 🆕 6️⃣ Fetch Project Data for Specific Appointment ID
      if (url.searchParams.get("appointmentId")) {
        const appointmentId = url.searchParams.get("appointmentId");

        // ✅ 1. Initialize agent_due if NULL
        const initDueQuery = `
          UPDATE projects
          SET agent_due = agent_share
          WHERE appointment_id = ? AND agent_due IS NULL
        `;
        await executeQuery(initDueQuery, [appointmentId]);

        // ✅ 2. Fetch project data INCLUDING agent_due
        const q = `
          SELECT
            p.appointment_id,
            p.agent_id,
            a.agent_name,
            p.client_name,
            p.project_name,
            p.location,
            COALESCE(p.project_value, 0) AS client_estimate,
            COALESCE(p.commission, 0) AS commission,
            COALESCE(p.agent_share, 0) AS agent_share,
            COALESCE(p.agent_due, 0) AS agent_due
          FROM projects p
          LEFT JOIN agents a ON p.agent_id = a.agent_id
          WHERE p.appointment_id = ?
        `;

        const [rows] = await executeQuery(q, [appointmentId]);

        return NextResponse.json({
          success: true,
          data: rows,
        });
      }


    // --------------------------------------------------
    // 4️⃣ Fetch ALL PAYMENT PROFILES (Project List)
    // --------------------------------------------------
    const query = `
      SELECT
        p.appointment_id,
        p.agent_id,
        a.agent_name,
        p.client_name,
        p.client_phone AS clientContact,
        p.project_name,
        p.location,
        COALESCE(p.project_value, 0) AS client_estimate,
        COALESCE(p.commission, 0) AS commission,
        COALESCE(p.agent_share, 0) AS agent_share,
        COALESCE(p.agent_paid, 0) AS agent_paid,
        COALESCE(p.agent_due, 0) AS due,
        COALESCE(p.payment_status, 'Due') AS payment_status
      FROM projects p
      LEFT JOIN agents a ON p.agent_id = a.agent_id
      WHERE p.booking_status = 'Booked'
      ORDER BY p.created_at DESC
    `;

    const [rows] = await executeQuery(query);

    return NextResponse.json({
      success: true,
      data: rows,
    });

  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}



// ======================================================
// ===============   POST API HANDLER   =================
// ======================================================
export async function POST(request: NextRequest) {
  try {
    // --------------------------------------------------
    // Auth Check
    // --------------------------------------------------
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.user_id || (token.role !== 'sales_admin' && token.role !== 'superadmin')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.user_id;
    const invoiceData = await request.json();

    const {
      invoiceId,
      appointmentId,
      agentShare,
      paid,
      due,
      paymentStatus,
      invoiceDate,
      invoiceTime,
      agentDetails,
      proof,
    } = invoiceData;

    if (!invoiceId || !appointmentId) {
      return NextResponse.json(
        { error: "Invoice ID and Appointment ID are required" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Check Admin Ownership (skip for superadmin)
    // --------------------------------------------------
    if (token.role !== 'superadmin') {
      const checkQuery = `SELECT admin_id FROM projects WHERE appointment_id = ?`;
      const [check] = await executeQuery(checkQuery, [appointmentId]);

      if (!check.length || check[0].admin_id !== userId) {
        return NextResponse.json(
          { error: "Unauthorized or project not found" },
          { status: 403 }
        );
      }
    }

    // --------------------------------------------------
    // Handle Proof Upload
    // --------------------------------------------------
    let proofPath = null;

    if (proof) {
      const proofDir = path.join(process.cwd(), "public", "proof");
      fs.mkdirSync(proofDir, { recursive: true });

      const base64 = proof.split(",")[1];
      const buffer = Buffer.from(base64, "base64");
      const fileName = `${invoiceId}.png`;

      fs.writeFileSync(path.join(proofDir, fileName), buffer);
      proofPath = `/proof/${fileName}`;
    }

    // --------------------------------------------------
    // INSERT INTO INVOICE (Correct Final Query)
    // --------------------------------------------------
    const dbPaymentStatus = paymentStatus === 'Pending' ? 'Due' : paymentStatus;

    const insertQuery = `
      INSERT INTO invoice (
        invoice_id,
        appointment_id,
        agent_share,
        paid,
        due,
        payment_date,
        payment_time,
        payment_status,
        agent_id,
        proof
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await executeQuery(insertQuery, [
      invoiceId,
      appointmentId,
      agentShare,
      paid,
      due,
      invoiceDate,
      invoiceTime,
      dbPaymentStatus,
      agentDetails.id,
      proofPath,
    ]);
    // --------------------------------------------------
    // 🔽 Update agent_paid and agent_due after invoice payment
    // --------------------------------------------------
    // Calculate total paid from all invoices for this appointment
    const sumPaidQuery = `SELECT SUM(paid) AS total_paid FROM invoice WHERE appointment_id = ?`;
    const [sumResult] = await executeQuery(sumPaidQuery, [appointmentId]);
    const totalPaid = sumResult[0]?.total_paid || 0;

    // Update agent_paid and reduce agent_due (original logic)
    await executeQuery(
      `
      UPDATE projects
      SET
        agent_paid = ?,
        agent_due = GREATEST(agent_due - ?, 0),
        payment_status = CASE
          WHEN agent_due - ? <= 0 THEN 'Paid'
          ELSE 'Due'
        END
      WHERE appointment_id = ?
      `,
      [totalPaid, paid, paid, appointmentId]
    );

    return NextResponse.json({
      success: true,
      message: "Invoice saved successfully",
    });
  } catch (error) {
    console.error("Error saving invoice:", error);
    console.error("Error type:", typeof error);
    console.error("Error constructor:", error?.constructor?.name);

    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error, Object.getOwnPropertyNames(error));
    } else {
      errorMessage = String(error);
    }

    return NextResponse.json(
      { error: `Failed to save invoice: ${errorMessage}` },
      { status: 500 }
    );
  }
}



// ======================================================
// ===============   PUT API HANDLER   ==================
// ======================================================
export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.user_id || (token.role !== 'sales_admin' && token.role !== 'superadmin')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = token.user_id;
    const { appointment_id, payment_status, agent_paid } =
      await request.json();

    if (!appointment_id || !payment_status) {
      return NextResponse.json(
        { error: "Appointment ID and payment status are required" },
        { status: 400 }
      );
    }

    // Admin Ownership Check
    const checkQuery = `SELECT admin_id FROM projects WHERE appointment_id = ?`;
    const [check] = await executeQuery(checkQuery, [appointment_id]);

    if (!check.length || check[0].admin_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized or project not found" },
        { status: 403 }
      );
    }

    // Update payment
    const updateQuery = `
      UPDATE projects
      SET payment_status = ?, agent_paid = ?
      WHERE appointment_id = ?
    `;

    await executeQuery(updateQuery, [
      payment_status,
      agent_paid,
      appointment_id,
    ]);

    return NextResponse.json({
      success: true,
      message: "Payment status updated successfully",
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return NextResponse.json(
      { error: "Failed to update payment status" },
      { status: 500 }
    );
  }
}
