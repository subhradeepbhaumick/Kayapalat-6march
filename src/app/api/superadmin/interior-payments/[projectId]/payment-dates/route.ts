import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
    request: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (
            !session ||
            !["superadmin", "client"].includes((session.user as any).role)
        ) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = await params;

        const rows = (await db.query(
            "SELECT * FROM interior_payment_schedule WHERE project_id = ?",
            [projectId]
        )) as any[];

        if (!rows || rows.length === 0) {
            return NextResponse.json({});
        }

        const schedule = rows[0];

        const formatDate = (date: any) => {
            if (!date) return "";
            const d = new Date(date);

            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");

            return `${year}-${month}-${day}`;
        };

        // Map DB columns to frontend keys expected by PaymentDatesModal.tsx
        const data: Record<string, any> = {
            p1_date: formatDate(schedule.first_payment_date),
            p1_amount: schedule.first_amount,
            p1_paid_date: formatDate(schedule.first_paid_date),
            p1_paid_amount: schedule.first_paid_amount,
            p1_status: schedule.first_status,

            p2_date: formatDate(schedule.second_payment_date),
            p2_amount: schedule.second_amount,
            p2_paid_date: formatDate(schedule.second_paid_date),
            p2_paid_amount: schedule.second_paid_amount,
            p2_status: schedule.second_status,

            p3_date: formatDate(schedule.third_payment_date),
            p3_amount: schedule.third_amount,
            p3_paid_date: formatDate(schedule.third_paid_date),
            p3_paid_amount: schedule.third_paid_amount,
            p3_status: schedule.third_status,

            p4_date: formatDate(schedule.fourth_payment_date),
            p4_amount: schedule.fourth_amount,
            p4_paid_date: formatDate(schedule.fourth_paid_date),
            p4_paid_amount: schedule.fourth_paid_amount,
            p4_status: schedule.fourth_status,

            p5_date: formatDate(schedule.fifth_payment_date),
            p5_amount: schedule.fifth_amount,
            p5_paid_date: formatDate(schedule.fifth_paid_date),
            p5_paid_amount: schedule.fifth_paid_amount,
            p5_status: schedule.fifth_status,
        };

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching payment schedule:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "superadmin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = await params;
        const formData = await request.json();

        // Fetch project info and join with users table to get the client name
        const projectRows = (await db.query(
            `SELECT p.client_id, u.name as client_name 
       FROM interior_projects p 
       JOIN users_kp_db u ON p.client_id = u.user_id 
       WHERE p.id = ?`,
            [projectId]
        )) as any[];

        if (!projectRows || projectRows.length === 0) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const { client_id, client_name } = projectRows[0];

        // Explicit check to see if a row exists to prevent duplicates if UNIQUE index is missing
        const existing = (await db.query(
            "SELECT id FROM interior_payment_schedule WHERE project_id = ?",
            [projectId]
        )) as any[];

        let query = "";
        let values: any[] = [];

        if (existing.length > 0) {
            // UPDATE existing row particularly
            query = `
        UPDATE interior_payment_schedule SET
          client_id = ?, client_name = ?,
          first_payment_date = ?, first_amount = ?, first_paid_date = ?, first_paid_amount = ?, first_status = ?,
          second_payment_date = ?, second_amount = ?, second_paid_date = ?, second_paid_amount = ?, second_status = ?,
          third_payment_date = ?, third_amount = ?, third_paid_date = ?, third_paid_amount = ?, third_status = ?,
          fourth_payment_date = ?, fourth_amount = ?, fourth_paid_date = ?, fourth_paid_amount = ?, fourth_status = ?,
          fifth_payment_date = ?, fifth_amount = ?, fifth_paid_date = ?, fifth_paid_amount = ?, fifth_status = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE project_id = ?
      `;
            values = [
                client_id, client_name,

                formData.p1_date || null,
                formData.p1_amount || null,
                formData.p1_paid_date || null,
                formData.p1_paid_amount || null,
                formData.p1_status || "Pending",

                formData.p2_date || null,
                formData.p2_amount || null,
                formData.p2_paid_date || null,
                formData.p2_paid_amount || null,
                formData.p2_status || "Pending",

                formData.p3_date || null,
                formData.p3_amount || null,
                formData.p3_paid_date || null,
                formData.p3_paid_amount || null,
                formData.p3_status || "Pending",

                formData.p4_date || null,
                formData.p4_amount || null,
                formData.p4_paid_date || null,
                formData.p4_paid_amount || null,
                formData.p4_status || "Pending",

                formData.p5_date || null,
                formData.p5_amount || null,
                formData.p5_paid_date || null,
                formData.p5_paid_amount || null,
                formData.p5_status || "Pending",

                projectId
            ];
        } else {
            // INSERT new row if none exists
            query = `
        INSERT INTO interior_payment_schedule (
          project_id, client_id, client_name,
          first_payment_date, first_amount, first_paid_date, first_paid_amount, first_status,
          second_payment_date, second_amount, second_paid_date, second_paid_amount, second_status,
          third_payment_date, third_amount, third_paid_date, third_paid_amount, third_status,
          fourth_payment_date, fourth_amount, fourth_paid_date, fourth_paid_amount, fourth_status,
          fifth_payment_date, fifth_amount, fifth_paid_date, fifth_paid_amount, fifth_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
            values = [
                projectId, client_id, client_name,

                formData.p1_date || null,
                formData.p1_amount || null,
                formData.p1_paid_date || null,
                formData.p1_paid_amount || null,
                formData.p1_status || "Pending",

                formData.p2_date || null,
                formData.p2_amount || null,
                formData.p2_paid_date || null,
                formData.p2_paid_amount || null,
                formData.p2_status || "Pending",

                formData.p3_date || null,
                formData.p3_amount || null,
                formData.p3_paid_date || null,
                formData.p3_paid_amount || null,
                formData.p3_status || "Pending",

                formData.p4_date || null,
                formData.p4_amount || null,
                formData.p4_paid_date || null,
                formData.p4_paid_amount || null,
                formData.p4_status || "Pending",

                formData.p5_date || null,
                formData.p5_amount || null,
                formData.p5_paid_date || null,
                formData.p5_paid_amount || null,
                formData.p5_status || "Pending",
            ];
        }

        await db.query(query, values);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving payment schedule:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}