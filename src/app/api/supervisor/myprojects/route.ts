// src/app/api/supervisor/myprojects/route.ts

import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import path from "path";
import fs from "fs";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const supervisorId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    /* ===========================
       🔹 NEW CHAT GET FUNCTION
    ============================ */
    if (type === "chat") {
      const appointment_id = searchParams.get("appointment_id");

      if (!appointment_id) {
        return NextResponse.json(
          { message: "Appointment ID is required" },
          { status: 400 }
        );
      }

      const [messages] = await executeQuery(
        `SELECT * FROM site_issues_chat
         WHERE appointment_id = ?
         ORDER BY created_at ASC`,
        [appointment_id]
      );

      return NextResponse.json(messages);
    }
    /* ===========================
   🔹 NEW MATERIAL EXPENSES GET
=========================== */
    if (type === "expenses") {
      const appointment_id = searchParams.get("appointment_id");

      if (!appointment_id) {
        return NextResponse.json(
          { message: "Appointment ID is required" },
          { status: 400 }
        );
      }

      const [expenses] = await executeQuery(
        `SELECT * FROM project_material_expenses_supervisor
     WHERE appointment_id = ?
     ORDER BY created_at DESC`,
        [appointment_id]
      );

      return NextResponse.json(expenses);
    }
    /* ===========================
       🔹 EXISTING LABOUR GET
    ============================ */
    if (type === "labour") {
      const appointment_id = searchParams.get("appointment_id");
      if (!appointment_id) {
        return NextResponse.json({ message: "Appointment ID is required" }, { status: 400 });
      }
      const [labourers] = await executeQuery(
        "SELECT * FROM labour_attendence WHERE appointment_id = ? ORDER BY created_at DESC",
        [appointment_id]
      );

      const now = new Date();
      const todayKolkata = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      const idsToReset: number[] = [];

      const updatedLabourers = (labourers as any[]).map((labour) => {
        const labourDate = new Date(labour.updated_at).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        if (labourDate !== todayKolkata && labour.present_tinytint === 1) {
          idsToReset.push(labour.id);
          return { ...labour, present_tinytint: 0 };
        }
        return labour;
      });

      if (idsToReset.length > 0) {
        const placeholders = idsToReset.map(() => '?').join(',');
        await executeQuery(
          `UPDATE labour_attendence SET present_tinytint = 0 WHERE id IN (${placeholders})`,
          idsToReset
        );
      }
      return NextResponse.json(updatedLabourers);
    }

    /* ===========================
       🔹 EXISTING PROJECT GET
    ============================ */
    const [projects] = await executeQuery(
      `
        SELECT 
          ps.appointment_id,
          ps.start_date,
          ps.end_date,
          ps.status,
          ps.progress,
          ps.today_labour,
          p.project_name,
          p.location
        FROM project_supervisor ps
        JOIN projects p ON ps.appointment_id = p.appointment_id
        WHERE ps.supervisor_id = ?
      `,
      [supervisorId]
    );

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { message: "Error fetching projects", error },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type");

    /* ===========================
       🔹 NEW CHAT POST FUNCTION
    ============================ */
    if (contentType?.includes("multipart/form-data")) {
      const formData = await req.formData();

      const type = formData.get("type");

      if (type === "chat") {
        const appointment_id = formData.get("appointment_id") as string;
        const sender_id = (session.user as any).id;
        const message = formData.get("message") as string;
        const image = formData.get("image") as File | null;

        if (!appointment_id) {
          return NextResponse.json(
            { message: "Appointment ID is required" },
            { status: 400 }
          );
        }

        let image_url: string | null = null;

        if (image && image.size > 0) {
          // 🔹 Allow only images
          if (!image.type.startsWith("image/")) {
            return NextResponse.json(
              { message: "Only image files are allowed" },
              { status: 400 }
            );
          }

          // 🔹 Limit file size (5MB)
          if (image.size > 5 * 1024 * 1024) {
            return NextResponse.json(
              { message: "Image size must be less than 5MB" },
              { status: 400 }
            );
          }

          const bytes = await image.arrayBuffer();
          const buffer = Buffer.from(bytes);

          const uploadDir = path.join(process.cwd(), "public/site_issues_chat");

          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }

          // 🔹 Clean filename
          const ext = image.name.split(".").pop();
          const safeFileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}.${ext}`;

          const filePath = path.join(uploadDir, safeFileName);

          fs.writeFileSync(filePath, buffer);

          image_url = `/site_issues_chat/${safeFileName}`;
        }
        // 🔹 Generate Asia/Kolkata time
        const kolkataNow = new Date(
          new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        );
        await executeQuery(
          `INSERT INTO site_issues_chat 
   (appointment_id, sender_id, message, image_url, created_at)
   VALUES (?, ?, ?, ?, ?)`,
          [
            appointment_id,
            sender_id,
            message || null,
            image_url,
            kolkataNow,
          ]
        );

        return NextResponse.json({ message: "Message sent successfully" });
      }
    }

    /* ===========================
       🔹 EXISTING JSON POST
    ============================ */
    const body = await req.json();
    /* ===========================
       🔹 NEW MATERIAL EXPENSE POST
    =========================== */
    if (body.type === "add_expense") {
      const { appointment_id, title, quantity, per_amount } = body;
      const added_by = (session.user as any).id;

      if (!appointment_id || !title || !quantity || !per_amount) {
        return NextResponse.json(
          { message: "Missing required fields" },
          { status: 400 }
        );
      }

      const total_amount = Number(quantity) * Number(per_amount);

      // Asia/Kolkata time
      const kolkataNow = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );

      await executeQuery(
        `INSERT INTO project_material_expenses_supervisor
     (appointment_id, added_by, title, quantity, per_amount, total_amount, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          appointment_id,
          added_by,
          title,
          quantity,
          per_amount,
          total_amount,
          kolkataNow,
        ]
      );

      return NextResponse.json({
        message: "Material expense added successfully",
      });
    }
    if (body.type === "labour") {
      const {
        supervisor_id,
        appointment_id,
        role,
        labour_name,
        present_tinytint,
      } = body;

      if (!supervisor_id || !appointment_id || !role || !labour_name) {
        return NextResponse.json(
          { message: "Missing required fields" },
          { status: 400 }
        );
      }

      const [result] = await executeQuery(
        `INSERT INTO labour_attendence 
        (supervisor_id, appointment_id, role, labour_name, present_tinytint, total_present, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [
          supervisor_id,
          appointment_id,
          role,
          labour_name,
          present_tinytint || 1,
        ]
      );

      const insertId = (result as any).insertId;
      const [newWorker] = await executeQuery(
        "SELECT * FROM labour_attendence WHERE id = ?",
        [insertId]
      );
      return NextResponse.json(newWorker[0]);
    }

    return NextResponse.json({ message: "Project created successfully" });
  } catch (error) {
    return NextResponse.json(
      { message: "Error creating project", error },
      { status: 500 }
    );
  }
}

/* ===========================
   🔹 YOUR PUT FUNCTION UNCHANGED
=========================== */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (body.type === "labour_status") {
      const { id, present_tinytint, updated_at } = body;
      if (!id) {
        return NextResponse.json({ message: "Worker ID is required" }, { status: 400 });
      }

      let query;
      if (present_tinytint === 1) {
        query = "UPDATE labour_attendence SET present_tinytint = 1, total_present = total_present + 1, updated_at = ? WHERE id = ? AND present_tinytint = 0";
      } else {
        query = "UPDATE labour_attendence SET present_tinytint = 0, total_present = GREATEST(0, total_present - 1), updated_at = ? WHERE id = ? AND present_tinytint = 1";
      }

      await executeQuery(query, [updated_at, id]);

      const [updatedWorker] = await executeQuery(
        "SELECT * FROM labour_attendence WHERE id = ?",
        [id]
      );
      return NextResponse.json({ message: "Status updated successfully", worker: updatedWorker[0] });
    }

    const { appointment_id, status, today_labour, progress } = body;

    if (!appointment_id) {
      return NextResponse.json({ message: "Missing required field: appointment_id" }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }

    if (today_labour !== undefined) {
      updates.push("today_labour = ?");
      values.push(today_labour);
    }

    if (progress !== undefined) {
      updates.push("progress = ?");
      values.push(progress);
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: "No fields to update" }, { status: 400 });
    }

    values.push(appointment_id);

    await executeQuery(
      `UPDATE project_supervisor SET ${updates.join(", ")} WHERE appointment_id = ?`,
      values
    );

    return NextResponse.json({ message: "Project updated successfully" });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ message: "Error updating project", error }, { status: 500 });
  }
}