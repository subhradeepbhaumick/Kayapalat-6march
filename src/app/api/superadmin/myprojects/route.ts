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

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    /* ===========================
       🔹 LABOUR EXPENSES GET
    =========================== */
    if (type === "labour_expenses") {
      const appointment_id = searchParams.get("appointment_id");

      if (!appointment_id) {
        return NextResponse.json(
          { message: "Appointment ID is required" },
          { status: 400 }
        );
      }

      const [expenses] = await executeQuery(
        `SELECT * FROM project_labour_expenses
         WHERE appointment_id = ?
         ORDER BY created_at DESC`,
        [appointment_id]
      );

      return NextResponse.json({ expenses });
    }

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
       🔹 TASKS / ACTIVITIES GET
    =========================== */
    if (type === "tasks") {
      const appointment_id = searchParams.get("appointment_id");

      if (!appointment_id) {
        return NextResponse.json(
          { message: "Appointment ID is required" },
          { status: 400 }
        );
      }

      const [tasks] = await executeQuery(
        `SELECT * FROM project_supervisor_tasks
         WHERE appointment_id = ?
         AND type = 'task'
         AND status = 'pending'
         ORDER BY created_at DESC`,
        [appointment_id]
      );

      return NextResponse.json({ tasks });
    }

    if (type === "activities") {
      const appointment_id = searchParams.get("appointment_id");

      if (!appointment_id) {
        return NextResponse.json(
          { message: "Appointment ID is required" },
          { status: 400 }
        );
      }

      const [activities] = await executeQuery(
        `SELECT * FROM project_supervisor_tasks
         WHERE appointment_id = ?
         AND type = 'activity'
         ORDER BY created_at DESC`,
        [appointment_id]
      );

      return NextResponse.json({ activities });
    }

    /* ===========================
       🔹 WEBSITE ORDER DETAILS
    =========================== */
    if (type === 'order_details') {
      const o_id = searchParams.get('o_id');

      if (!o_id) {
        return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
      }

      const [rows] = await executeQuery(
        `SELECT
            bp.id,
            bp.product_id,
            bp.product_name,
            bp.quantity,
            ((pd.final_product_cost - pd.commission_amount) + bp.transport_exclude)*bp.quantity AS cost
        FROM
            buy_product bp
        LEFT JOIN
            product_details pd ON bp.product_id = pd.product_id
        WHERE
            bp.o_id = ?`,
        [o_id]
      );

      const materials = rows as any[];

      let total_amount = materials.reduce(
        (sum, item) => sum + (Number(item.cost) || 0),
        0
      );

      const [transportRow] = await executeQuery(
        `SELECT extra_trsnsport_cost 
         FROM \`bought-product\` 
         WHERE o_id = ?
         LIMIT 1`,
        [o_id]
      );

      const extraTransport =
        (transportRow as any[])[0]?.extra_trsnsport_cost || 0;

      total_amount = total_amount + Number(extraTransport);

      return NextResponse.json({
        materials: materials,
        extra_transport_cost: Number(extraTransport),
        total_amount: total_amount.toFixed(2)
      });
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

      const [budgetRow] = await executeQuery(
        `SELECT 
            total_budget,
            cash_in_hand,
            paid,
            due
         FROM project_supervisor
         WHERE appointment_id = ?
         LIMIT 1`,
        [appointment_id]
      );

      const row = (budgetRow as any[])[0] || {};

      const budget = Number(row.total_budget || 0);
      const cash_in_hand = Number(row.cash_in_hand || 0);
      const paid = Number(row.paid || 0);
      const due = Number(row.due || 0);

      return NextResponse.json({
        expenses,
        budget,
        cash_in_hand,
        paid,
        due
      });
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
       🔹 LABOUR SUMMARY DROPDOWN
    =========================== */
    if (type === "labour_summary") {
      const appointment_id = searchParams.get("appointment_id");

      if (!appointment_id) {
        return NextResponse.json(
          { message: "Appointment ID is required" },
          { status: 400 }
        );
      }

      const [labours] = await executeQuery(
        `SELECT t1.labour_id, t1.labour_name, t1.amount, t3.total_paid, t1.due_amount
         FROM project_labour_expenses1 t1
         JOIN (
             SELECT MAX(id) as max_id
             FROM project_labour_expenses1
             WHERE appointment_id = ?
             GROUP BY labour_id
         ) t2 ON t1.id = t2.max_id
         LEFT JOIN (
             SELECT labour_id, SUM(paid_amount) as total_paid
             FROM project_labour_expenses1
             WHERE appointment_id = ?
             GROUP BY labour_id
         ) t3 ON t1.labour_id = t3.labour_id
         ORDER BY t1.updated_at DESC`,
        [appointment_id, appointment_id]
      );

      return NextResponse.json({ labours });
    }

    /* ===========================
       🔹 EXISTING PROJECT GET (UPDATED FOR SUPERADMIN)
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
          (
            SELECT GROUP_CONCAT(DISTINCT supervisor_id SEPARATOR ', ') 
            FROM project_supervisor ps2 
            WHERE ps2.appointment_id = ps.appointment_id
          ) as supervisor_id,
          p.project_name,
          p.location
        FROM project_supervisor ps
        JOIN projects p ON ps.appointment_id = p.appointment_id
        WHERE ps.id IN (
            SELECT MIN(id) 
            FROM project_supervisor 
            GROUP BY appointment_id
        )
      `
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
          if (!image.type.startsWith("image/")) {
            return NextResponse.json(
              { message: "Only image files are allowed" },
              { status: 400 }
            );
          }

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

          const ext = image.name.split(".").pop();
          const safeFileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}.${ext}`;

          const filePath = path.join(uploadDir, safeFileName);

          fs.writeFileSync(filePath, buffer);

          image_url = `/site_issues_chat/${safeFileName}`;
        }
        
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

    const body = await req.json();

    /* ===========================
       🔹 ADD TASK / ACTIVITY
    =========================== */
    if (body.type === "task" || body.type === "activity") {
      const { appointment_id, text, details } = body;
      const supervisor_id = (session.user as any).id;

      if (!appointment_id || !text) {
        return NextResponse.json(
          { message: "Missing required fields" },
          { status: 400 }
        );
      }

      const kolkataNow = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );

      const status = body.type === "task" ? "pending" : "done";

      await executeQuery(
        `INSERT INTO project_supervisor_tasks
         (appointment_id, supervisor_id, type, text, details, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [appointment_id, supervisor_id, body.type, text, details || null, status, kolkataNow]
      );

      return NextResponse.json({ message: "Added successfully" });
    }

    /* ===========================
       🔹 LABOUR PAYMENT
    =========================== */
    if (body.type === "pay_labour_expense") {
      const { appointment_id, labour_id, paid_amount, labour_name, paid_by } = body;

      if (!appointment_id || !labour_id || !paid_amount || !labour_name) {
        return NextResponse.json(
          { message: "Missing required fields" },
          { status: 400 }
        );
      }

      const paymentAmount = Number(paid_amount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        return NextResponse.json(
          { message: "Invalid payment amount" },
          { status: 400 }
        );
      }

      const kolkataNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

      const [sumRows] = await executeQuery(
        `SELECT SUM(amount) as total_amount
         FROM project_labour_expenses
         WHERE labour_id = ? AND appointment_id = ?`,
        [labour_id, appointment_id]
      );
      const totalAmount = Number((sumRows as any[])[0]?.total_amount || 0);

      const [paidRows] = await executeQuery(
        `SELECT SUM(paid_amount) as total_paid
         FROM project_labour_expenses1
         WHERE labour_id = ? AND appointment_id = ?`,
        [labour_id, appointment_id]
      );
      const totalPreviouslyPaid = Number((paidRows as any[])[0]?.total_paid || 0);

      const newDueAmount = totalAmount - (totalPreviouslyPaid + paymentAmount);

      await executeQuery(
        `INSERT INTO project_labour_expenses1
         (labour_id, appointment_id, labour_name, amount, paid_amount, due_amount, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          labour_id,
          appointment_id,
          labour_name,
          totalAmount,
          paymentAmount,
          newDueAmount,
          kolkataNow,
          kolkataNow,
        ]
      );

      if (paid_by === "myself") {
        const [supervisorData] = await executeQuery(
          `SELECT cash_in_hand, paid FROM project_supervisor WHERE appointment_id = ?`,
          [appointment_id]
        );

        if ((supervisorData as any[]).length > 0) {
          const current_cash_in_hand = Number((supervisorData as any[])[0].cash_in_hand || 0);
          const current_paid = Number((supervisorData as any[])[0].paid || 0);

          const new_paid = current_paid + paymentAmount;
          const new_due = current_cash_in_hand - new_paid;

          await executeQuery(
            `UPDATE project_supervisor SET paid = ?, due = ? WHERE appointment_id = ?`,
            [new_paid, new_due, appointment_id]
          );
        }
      }

      return NextResponse.json({ message: "Labour payment recorded successfully" });
    }

    /* ===========================
       🔹 NEW MATERIAL EXPENSE POST
    =========================== */
    if (body.type === "add_expense") {
      const { appointment_id, title, quantity, per_amount, paid_by } = body;
      const added_by = (session.user as any).id;

      if (!appointment_id || !title || !quantity || !per_amount) {
        return NextResponse.json(
          { message: "Missing required fields" },
          { status: 400 }
        );
      }

      let labour_id = null;

      const [labourRow] = await executeQuery(
        `SELECT labour_id FROM project_labour_expenses WHERE labour_name = ? AND appointment_id = ? ORDER BY created_at DESC LIMIT 1`,
        [title, appointment_id]
      );

      if ((labourRow as any[]).length > 0) {
        labour_id = (labourRow as any[])[0].labour_id;
      }

      const total_amount = Number(quantity) * Number(per_amount);

      const kolkataNow = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );
      const paid_from_cashInHand = paid_by === "myself" ? 1 : 0;
      console.log("paid_by =", paid_by);
      console.log("paid_from_cashInHand =", paid_from_cashInHand);
      await executeQuery(
        `INSERT INTO project_material_expenses_supervisor
     (appointment_id, added_by, labour_id, title, quantity, per_amount, total_amount,paid_from_cashInHand, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)`,
        [
          appointment_id,
          added_by,
          labour_id,
          title,
          quantity,
          per_amount,
          total_amount,
          paid_from_cashInHand,
          kolkataNow,
        ]
      );

      if (paid_by === "myself") {
        const [supervisorData] = await executeQuery(
          `SELECT cash_in_hand, paid FROM project_supervisor WHERE appointment_id = ?`,
          [appointment_id]
        );

        if ((supervisorData as any[]).length > 0) {
          const current_cash_in_hand = Number((supervisorData as any[])[0].cash_in_hand || 0);
          const current_paid = Number((supervisorData as any[])[0].paid || 0);

          const new_paid = current_paid + total_amount;
          const new_due = current_cash_in_hand - new_paid;

          await executeQuery(
            `UPDATE project_supervisor SET paid = ?, due = ? WHERE appointment_id = ?`,
            [new_paid, new_due, appointment_id]
          );
        }
      }

      if (labour_id) {
        const [sumRows] = await executeQuery(
          `SELECT SUM(amount) as total_amount
           FROM project_labour_expenses
           WHERE labour_id = ? AND appointment_id = ?`,
          [labour_id, appointment_id]
        );
        const totalAmount = Number((sumRows as any[])[0]?.total_amount || 0);

        const [paidRows] = await executeQuery(
          `SELECT SUM(paid_amount) as total_paid
           FROM project_labour_expenses1
           WHERE labour_id = ? AND appointment_id = ?`,
          [labour_id, appointment_id]
        );
        const totalPreviouslyPaid = Number((paidRows as any[])[0]?.total_paid || 0);

        const newDueAmount = totalAmount - (totalPreviouslyPaid + total_amount);

        await executeQuery(
          `INSERT INTO project_labour_expenses1
           (labour_id, appointment_id, labour_name, amount, paid_amount, due_amount, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            labour_id,
            appointment_id,
            title,
            totalAmount,
            total_amount,
            newDueAmount,
            kolkataNow,
            kolkataNow,
          ]
        );
      }

      return NextResponse.json({
        message: "Material expense added successfully",
      });
    }

    /* ===========================
       🔹 ADD LABOUR EXPENSE
    =========================== */
    if (body.type === "add_labour_expense") {
      const {
        appointment_id,
        work_type,
        labour_name,
        article,
        rate,
        rate_unit,
        size
      } = body;

      const supervisor_id = (session.user as any).id;

      if (
        !appointment_id ||
        !work_type ||
        !labour_name ||
        !rate ||
        !rate_unit ||
        !size
      ) {
        return NextResponse.json(
          { message: "Missing required fields" },
          { status: 400 }
        );
      }

      const amount = Number(rate) * Number(size);

      let labour_id;

      const [existingLabour] = await executeQuery(
        `SELECT labour_id 
         FROM project_labour_expenses 
         WHERE labour_name = ? AND work_type = ?
         LIMIT 1`,
        [labour_name, work_type]
      );

      if ((existingLabour as any[]).length > 0) {
        labour_id = (existingLabour as any[])[0].labour_id;
      } else {
        const [maxRow] = await executeQuery(
          `SELECT MAX(labour_id) as max_id FROM project_labour_expenses`
        );
        const maxId = (maxRow as any[])[0]?.max_id || 0;
        labour_id = Number(maxId) + 1;
      }

      const kolkataNow = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );

      await executeQuery(
        `INSERT INTO project_labour_expenses
         (appointment_id, supervisor_id, work_type,labour_id, labour_name, article, rate, rate_unit, size, amount, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?)`,
        [
          appointment_id,
          supervisor_id,
          work_type,
          labour_id,
          labour_name,
          article || null,
          rate,
          rate_unit,
          size,
          amount,
          kolkataNow,
          kolkataNow
        ]
      );

      const [sumRows] = await executeQuery(
        `SELECT SUM(amount) as total_amount
         FROM project_labour_expenses
         WHERE labour_id = ? AND appointment_id = ?`,
        [labour_id, appointment_id]
      );
      const newTotalAmount = Number((sumRows as any[])[0]?.total_amount || 0);

      const [paidRows] = await executeQuery(
        `SELECT SUM(paid_amount) as total_paid
         FROM project_labour_expenses1
         WHERE labour_id = ? AND appointment_id = ?`,
        [labour_id, appointment_id]
      );
      const totalPaid = Number((paidRows as any[])[0]?.total_paid || 0);

      const newDueAmount = newTotalAmount - totalPaid;

      await executeQuery(
        `INSERT INTO project_labour_expenses1
         (labour_id, appointment_id, labour_name, amount, paid_amount, due_amount, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          labour_id,
          appointment_id,
          labour_name,
          newTotalAmount,
          0,
          newDueAmount,
          kolkataNow,
          kolkataNow,
        ]
      );
      return NextResponse.json({
        message: "Labour expense added successfully",
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

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    /* ===========================
       🔹 LABOUR STATUS UPDATE
    ============================ */
    if (body.type === "labour_status") {
      const { id, present_tinytint, updated_at } = body;

      if (!id) {
        return NextResponse.json(
          { message: "Worker ID is required" },
          { status: 400 }
        );
      }

      let query;

      if (present_tinytint === 1) {
        query =
          "UPDATE labour_attendence SET present_tinytint = 1, total_present = total_present + 1, updated_at = ? WHERE id = ? AND present_tinytint = 0";
      } else {
        query =
          "UPDATE labour_attendence SET present_tinytint = 0, total_present = GREATEST(0, total_present - 1), updated_at = ? WHERE id = ? AND present_tinytint = 1";
      }

      await executeQuery(query, [updated_at, id]);

      const [updatedWorker] = await executeQuery(
        "SELECT * FROM labour_attendence WHERE id = ?",
        [id]
      );

      return NextResponse.json({
        message: "Status updated successfully",
        worker: updatedWorker[0],
      });
    }

    /* ===========================
       🔹 COMPLETE TASK
    ============================ */
    if (body.type === "complete_task") {
      const { id } = body;

      if (!id) {
        return NextResponse.json(
          { message: "Task ID required" },
          { status: 400 }
        );
      }

      const kolkataNow = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );

      await executeQuery(
        `UPDATE project_supervisor_tasks
        SET status = 'done', updated_at = ?
        WHERE id = ?`,
        [kolkataNow, id]
      );

      const [task]: any = await executeQuery(
        `SELECT appointment_id, supervisor_id, text
         FROM project_supervisor_tasks
         WHERE id = ?`,
        [id]
      );

      if (task && task.length > 0) {
        const t = task[0];

        await executeQuery(
          `INSERT INTO project_supervisor_tasks
           (appointment_id, supervisor_id, type, text, details, status)
           VALUES (?, ?, 'activity', ?, ?, 'done')`,
          [
            t.appointment_id,
            t.supervisor_id,
            t.text,
            "Pending Task Completed",
          ]
        );
      }

      return NextResponse.json({ message: "Task completed" });
    }

    /* ===========================
       🔹 UPDATE LABOUR EXPENSE
    =========================== */
    if (body.type === "update_labour_expense") {
      const {
        id,
        work_type,
        labour_name,
        article,
        rate,
        rate_unit,
        size
      } = body;

      if (!id) {
        return NextResponse.json(
          { message: "Expense ID required" },
          { status: 400 }
        );
      }

      const amount = Number(rate) * Number(size);

      const [row] = await executeQuery(
        `SELECT labour_id, appointment_id
         FROM project_labour_expenses
         WHERE id = ?`,
        [id]
      );

      if ((row as any[]).length === 0) {
        return NextResponse.json(
          { message: "Expense not found" },
          { status: 404 }
        );
      }

      const labour_id = (row as any[])[0].labour_id;
      const appointment_id = (row as any[])[0].appointment_id;
      const kolkataNow = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );

      await executeQuery(
        `UPDATE project_labour_expenses
         SET work_type = ?, labour_name = ?, article = ?, rate = ?, rate_unit = ?, size = ?, amount = ?, updated_at = ?
         WHERE id = ?`,
        [
          work_type,
          labour_name,
          article,
          rate,
          rate_unit,
          size,
          amount,
          kolkataNow,
          id
        ]
      );

      const [sumRows] = await executeQuery(
        `SELECT SUM(amount) as total_amount
         FROM project_labour_expenses
         WHERE labour_id = ?
         AND appointment_id = ?`,
        [labour_id, appointment_id]
      );

      const totalAmount = (sumRows as any[])[0]?.total_amount || 0;

      const [summaryRow] = await executeQuery(
        `SELECT paid_amount
         FROM project_labour_expenses1
         WHERE labour_id = ? AND appointment_id = ?`,
        [labour_id, appointment_id]
      );

      const paidAmount = (summaryRow as any[])[0]?.paid_amount || 0;

      const dueAmount = totalAmount - paidAmount;

      await executeQuery(
        `UPDATE project_labour_expenses1
         SET amount = ?, due_amount = ?, updated_at = ?
         WHERE labour_id = ? AND appointment_id = ?`,
        [
          totalAmount,
          dueAmount,
          kolkataNow,
          labour_id,
          appointment_id
        ]
      );

      return NextResponse.json({
        message: "Labour expense updated successfully",
      });
    }

    /* ===========================
       🔹 PROJECT UPDATE
    ============================ */

    const { appointment_id, status, today_labour, progress } = body;

    if (!appointment_id) {
      return NextResponse.json(
        { message: "Missing required field: appointment_id" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { message: "No fields to update" },
        { status: 400 }
      );
    }

    values.push(appointment_id);

    await executeQuery(
      `UPDATE project_supervisor
       SET ${updates.join(", ")}
       WHERE appointment_id = ?`,
      values
    );

    return NextResponse.json({ message: "Project updated successfully" });

  } catch (error) {
    console.error("Error updating project:", error);

    return NextResponse.json(
      { message: "Error updating project", error },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const type = searchParams.get("type");

    if (!id) {
      return NextResponse.json(
        { message: "ID required" },
        { status: 400 }
      );
    }

    /* ===========================
       🔹 DELETE LABOUR EXPENSE
    =========================== */

    if (type === "labour_expense") {

      const [row] = await executeQuery(
        `SELECT labour_id, appointment_id 
         FROM project_labour_expenses 
         WHERE id = ?`,
        [id]
      );

      if ((row as any[]).length === 0) {
        return NextResponse.json({ message: "Expense not found" }, { status: 404 });
      }

      const labour_id = (row as any[])[0].labour_id;
      const appointment_id = (row as any[])[0].appointment_id;

      await executeQuery(
        `DELETE FROM project_labour_expenses WHERE id = ?`,
        [id]
      );

      const [sumRows] = await executeQuery(
        `SELECT SUM(amount) as total_amount
         FROM project_labour_expenses
         WHERE labour_id = ?`,
        [labour_id]
      );

      const totalAmount = (sumRows as any[])[0]?.total_amount || 0;

      await executeQuery(
        `UPDATE project_labour_expenses1
         SET amount = ?, due_amount = amount - paid_amount
         WHERE labour_id = ? AND appointment_id = ?`,
        [totalAmount, labour_id, appointment_id]
      );

      return NextResponse.json({
        message: "Labour article removed successfully",
      });
    }

    /* ===========================
       🔹 EXISTING TASK DELETE
    =========================== */

    await executeQuery(
      `DELETE FROM project_supervisor_tasks WHERE id = ?`,
      [id]
    );

    return NextResponse.json({ message: "Deleted successfully" });

  } catch (error) {
    console.error("Error deleting:", error);

    return NextResponse.json(
      { message: "Error deleting item", error },
      { status: 500 }
    );
  }
}