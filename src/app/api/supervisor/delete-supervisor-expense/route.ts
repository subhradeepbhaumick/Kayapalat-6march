import { NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";

export async function DELETE(req: NextRequest) {
  let connection;

  try {
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id");
    const appointment_id = searchParams.get("appointment_id");
    const labour_id = searchParams.get("labour_id");

    if (!id || !appointment_id || !labour_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    /* ===========================
       1️⃣ GET EXPENSE DETAILS
    =========================== */

    const [expenseRows]: any = await connection.execute(
      `
      SELECT total_amount, paid_from_cashInHand
      FROM project_material_expenses_supervisor
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (expenseRows.length === 0) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      );
    }

    const expense = expenseRows[0];

    const totalAmount = Number(expense.total_amount || 0);
    const paidFromCash = Number(expense.paid_from_cashInHand || 0);

    /* ===========================
       2️⃣ UPDATE project_supervisor
       ONLY IF PAID FROM CASH IN HAND
    =========================== */

    if (paidFromCash === 1) {
      const [supervisorRows]: any = await connection.execute(
        `
        SELECT paid, due
        FROM project_supervisor
        WHERE appointment_id = ?
        LIMIT 1
        `,
        [appointment_id]
      );

      if (supervisorRows.length > 0) {
        const currentPaid = Number(supervisorRows[0].paid || 0);
        const currentDue = Number(supervisorRows[0].due || 0);

        const newPaid = currentPaid - totalAmount;
        const newDue = currentDue + totalAmount;

        await connection.execute(
          `
          UPDATE project_supervisor
          SET paid = ?, due = ?
          WHERE appointment_id = ?
          `,
          [newPaid, newDue, appointment_id]
        );
      }
    }

    /* ===========================
       3️⃣ DELETE MATERIAL EXPENSE
    =========================== */

    await connection.execute(
      `DELETE FROM project_material_expenses_supervisor WHERE id = ?`,
      [id]
    );

    /* ===========================
       4️⃣ FIND LATEST LABOUR ROW
    =========================== */

    const [rows]: any = await connection.execute(
      `
      SELECT id
      FROM project_labour_expenses1
      WHERE appointment_id = ?
      AND labour_id = ?
      ORDER BY id DESC
      LIMIT 1
      `,
      [appointment_id, labour_id]
    );

    /* ===========================
       5️⃣ DELETE LATEST LABOUR ROW
    =========================== */

    if (rows.length > 0) {
      await connection.execute(
        `DELETE FROM project_labour_expenses1 WHERE id = ?`,
        [rows[0].id]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Expense deleted successfully",
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}