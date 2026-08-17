import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
// ==========================================
// GET VENDOR PROJECTS + LABOUR EXPENSES
// ==========================================
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const vendor_id =
            searchParams.get("vendor_id");
        const appointment_id =
            searchParams.get("appointment_id");
        const type =
            searchParams.get("type");
        // ==========================================
        // GET LABOUR ARTICLES
        // ==========================================
        if (type === "labour_expenses") {
            if (
                !vendor_id ||
                !appointment_id
            ) {
                return NextResponse.json(
                    {
                        error:
                            "vendor_id and appointment_id are required",
                    },
                    {
                        status: 400,
                    }
                );
            }
            // ==========================================
            // GET SUPERVISOR ID
            // ==========================================
            const [supervisorRows]: any =
                await executeQuery(
                    `
            SELECT supervisor_id
            FROM project_supervisor
            WHERE appointment_id = ?
            ORDER BY id ASC
            LIMIT 1
            `,
                    [appointment_id]
                );
            if (
                supervisorRows.length === 0
            ) {
                return NextResponse.json(
                    {
                        error:
                            "No supervisor found for this appointment",
                    },
                    {
                        status: 404,
                    }
                );
            }
            const supervisor_id =
                supervisorRows[0].supervisor_id;
            // ==========================================
            // GET EXPENSES
            // ==========================================
            const [expenses] =
                await executeQuery(
                    `
                    SELECT
                        id,
                        appointment_id,
                        supervisor_id,
                        vendor_id,
                        work_type,
                        labour_id,
                        labour_name,
                        article,
                        rate,
                        rate_unit,
                        size,
                        amount,
                        created_at,
                        updated_at
                    FROM project_labour_expenses
                    WHERE appointment_id = ?
                    AND supervisor_id = ?
                    AND vendor_id = ?
                    ORDER BY id DESC
                    `,
                    [
                        appointment_id,
                        supervisor_id,
                        vendor_id,
                    ]
                );
            // ==========================================
            // GET LATEST PAYMENT SUMMARY
            // ==========================================
            // ==========================================
            // GET PAYMENT SUMMARY OF THIS VENDOR'S LABOUR
            // ==========================================

            // Find labour_id for this vendor in this project
            const [labourRows]: any =
                await executeQuery(
                    `
        SELECT labour_id
        FROM project_labour_expenses
        WHERE appointment_id = ?
        AND vendor_id = ?
        LIMIT 1
        `,
                    [appointment_id, vendor_id]
                );

            let payment_summary = {
                total: 0,
                paid: 0,
                due: 0,
            };

            if (labourRows.length > 0) {

                const labour_id =
                    labourRows[0].labour_id;

                const [summaryRows]: any =
                    await executeQuery(
                        `
            SELECT
                amount,
                paid_amount,
                due_amount
            FROM project_labour_expenses1
            WHERE appointment_id = ?
            AND labour_id = ?
            ORDER BY id DESC
            LIMIT 1
            `,
                        [appointment_id, labour_id]
                    );

                if (summaryRows.length > 0) {

                    payment_summary = {
                        total: Number(summaryRows[0].amount || 0),
                        paid: Number(summaryRows[0].paid_amount || 0),
                        due: Number(summaryRows[0].due_amount || 0),
                    };
                }
            }
            return NextResponse.json({
                supervisor_id,
                expenses, payment_summary,
            });
        }
        // ==========================================
        // GET PROJECTS
        // ==========================================
        if (!vendor_id) {
            return NextResponse.json(
                {
                    error:
                        "vendor_id is required",
                },
                {
                    status: 400,
                }
            );
        }
        const [projects] =
            await executeQuery(
                `
                SELECT
                    pv.id,
                    pv.vendor_id,
                    pv.appointment_id,
                    p.client_name,
                    p.client_phone,
                    p.project_name,
                    p.location,
                    p.project_value,
                    p.property_type,
                    p.details,
                    p.booking_status,
                    p.booking_date,
                    p.booking_time,
                    p.created_at
                FROM project_vendor pv
                LEFT JOIN projects p
                    ON pv.appointment_id =
                    p.appointment_id
                WHERE pv.vendor_id = ?
                ORDER BY pv.created_at DESC
                `,
                [vendor_id]
            );
        return NextResponse.json({
            projects,
        });
    } catch (error) {
        console.log(error);
        return NextResponse.json(
            {
                error:
                    "Failed to fetch data",
            },
            {
                status: 500,
            }
        );
    }
}
// ==========================================
// ADD NEW LABOUR EXPENSE
// ==========================================
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const {
            appointment_id,
            vendor_id,
            work_type,
            labour_name,
            article,
            rate,
            rate_unit,
            size,
        } = body;

        if (
            !appointment_id ||
            !vendor_id ||
            !work_type ||
            !labour_name ||
            !rate ||
            !rate_unit ||
            !size
        ) {
            return NextResponse.json(
                {
                    error: "Missing required fields",
                },
                {
                    status: 400,
                }
            );
        }

        // ==========================================
        // GET SUPERVISOR ID
        // ==========================================

        const [supervisorRows]: any =
            await executeQuery(
                `
                SELECT supervisor_id
                FROM project_supervisor
                WHERE appointment_id = ?
                LIMIT 1
                `,
                [appointment_id]
            );

        if (supervisorRows.length === 0) {
            return NextResponse.json(
                {
                    error: "No supervisor found",
                },
                {
                    status: 404,
                }
            );
        }

        const supervisor_id =
            supervisorRows[0].supervisor_id;

        // ==========================================
        // FIND labour_id
        // ==========================================

        let labour_id;

        const [existingLabour]: any =
            await executeQuery(
                `
                SELECT labour_id
                FROM project_labour_expenses
                WHERE labour_name = ?
                AND work_type = ?
                LIMIT 1
                `,
                [labour_name, work_type]
            );

        if (existingLabour.length > 0) {
            labour_id =
                existingLabour[0].labour_id;
        } else {
            const [maxRow]: any =
                await executeQuery(
                    `
                    SELECT MAX(labour_id) as max_id
                    FROM project_labour_expenses
                    `
                );

            const maxId =
                maxRow[0]?.max_id || 0;

            labour_id = Number(maxId) + 1;
        }

        // ==========================================
        // CALCULATE AMOUNT
        // ==========================================

        const amount =
            Number(rate) * Number(size);

        // ==========================================
        // INSERT
        // ==========================================

        await executeQuery(
            `
            INSERT INTO project_labour_expenses
            (
                appointment_id,
                supervisor_id,
                vendor_id,
                work_type,
                labour_id,
                labour_name,
                article,
                rate,
                rate_unit,
                size,
                amount,
                created_at,
                updated_at
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `,
            [
                appointment_id,
                supervisor_id,
                vendor_id,
                work_type,
                labour_id,
                labour_name,
                article || null,
                rate,
                rate_unit,
                size,
                amount,
            ]
        );
        // ==========================================
        // UPDATE project_labour_expenses1
        // ==========================================

        // Get total labour amount
        const [sumRows]: any =
            await executeQuery(
                `
        SELECT SUM(amount) as total_amount
        FROM project_labour_expenses
        WHERE labour_id = ?
        AND appointment_id = ?
        `,
                [labour_id, appointment_id]
            );

        const totalAmount =
            Number(sumRows[0]?.total_amount || 0);

        // Get already paid amount
        const [paidRows]: any =
            await executeQuery(
                `
        SELECT SUM(paid_amount) as total_paid
        FROM project_labour_expenses1
        WHERE labour_id = ?
        AND appointment_id = ?
        `,
                [labour_id, appointment_id]
            );

        const totalPaid =
            Number(paidRows[0]?.total_paid || 0);

        const dueAmount =
            totalAmount - totalPaid;

        // ==========================================
        // CHECK EXISTING SUMMARY ROW
        // ==========================================

        const [existingSummary]: any =
            await executeQuery(
                `
        SELECT id, paid_amount
        FROM project_labour_expenses1
        WHERE labour_id = ?
        AND appointment_id = ?
        ORDER BY id DESC
        LIMIT 1
        `,
                [labour_id, appointment_id]
            );

        if (existingSummary.length > 0) {

            const existingPaid =
                Number(existingSummary[0].paid_amount || 0);

            const dueAmount =
                totalAmount - existingPaid;

            // UPDATE SAME ROW
            await executeQuery(
                `
        UPDATE project_labour_expenses1
        SET
            labour_name = ?,
            amount = ?,
            due_amount = ?,
            updated_at = NOW()
        WHERE id = ?
        `,
                [
                    labour_name,
                    totalAmount,
                    dueAmount,
                    existingSummary[0].id,
                ]
            );

        } else {

            // FIRST TIME INSERT
            await executeQuery(
                `
        INSERT INTO project_labour_expenses1
        (
            labour_id,
            appointment_id,
            labour_name,
            amount,
            paid_amount,
            due_amount,
            created_at,
            updated_at
        )
        VALUES
        (?, ?, ?, ?, ?, ?, NOW(), NOW())
        `,
                [
                    labour_id,
                    appointment_id,
                    labour_name,
                    totalAmount,
                    0,
                    totalAmount,
                ]
            );

        }
        return NextResponse.json({
            message:
                "Labour expense added successfully",
        });
    } catch (error) {
        console.log(error);

        return NextResponse.json(
            {
                error:
                    "Failed to add labour expense",
            },
            {
                status: 500,
            }
        );
    }
}
// ==========================================
// UPDATE LABOUR EXPENSE
// ==========================================
export async function PUT(req: NextRequest) {

    try {

        const body = await req.json();

        const {
            id,
            work_type,
            labour_name,
            article,
            rate,
            rate_unit,
            size,
        } = body;

        if (!id) {

            return NextResponse.json(
                {
                    error: "Expense ID required",
                },
                {
                    status: 400,
                }
            );
        }

        const amount =
            Number(rate) * Number(size);

        // ==========================================
        // GET labour_id + appointment_id
        // ==========================================

        const [row]: any =
            await executeQuery(
                `
                SELECT labour_id, appointment_id
                FROM project_labour_expenses
                WHERE id = ?
                `,
                [id]
            );

        if (row.length === 0) {

            return NextResponse.json(
                {
                    error: "Expense not found",
                },
                {
                    status: 404,
                }
            );
        }

        const labour_id =
            row[0].labour_id;

        const appointment_id =
            row[0].appointment_id;

        // ==========================================
        // UPDATE EXPENSE
        // ==========================================

        await executeQuery(
            `
            UPDATE project_labour_expenses
            SET
                work_type = ?,
                labour_name = ?,
                article = ?,
                rate = ?,
                rate_unit = ?,
                size = ?,
                amount = ?,
                updated_at = NOW()
            WHERE id = ?
            `,
            [
                work_type,
                labour_name,
                article,
                rate,
                rate_unit,
                size,
                amount,
                id,
            ]
        );

        // ==========================================
        // RECALCULATE TOTAL
        // ==========================================

        const [sumRows]: any =
            await executeQuery(
                `
                SELECT SUM(amount) as total_amount
                FROM project_labour_expenses
                WHERE labour_id = ?
                AND appointment_id = ?
                `,
                [labour_id, appointment_id]
            );

        const totalAmount =
            Number(sumRows[0]?.total_amount || 0);

        // ==========================================
        // TOTAL PAID
        // ==========================================

        const [paidRows]: any =
            await executeQuery(
                `
                SELECT SUM(paid_amount) as total_paid
                FROM project_labour_expenses1
                WHERE labour_id = ?
                AND appointment_id = ?
                `,
                [labour_id, appointment_id]
            );

        const totalPaid =
            Number(paidRows[0]?.total_paid || 0);

        const dueAmount =
            totalAmount - totalPaid;

        // ==========================================
        // GET EXISTING SUMMARY ROW
        // ==========================================

        const [existingSummary]: any =
            await executeQuery(
                `
        SELECT id, paid_amount
        FROM project_labour_expenses1
        WHERE labour_id = ?
        AND appointment_id = ?
        ORDER BY id DESC
        LIMIT 1
        `,
                [labour_id, appointment_id]
            );

        const existingPaid =
            Number(existingSummary[0]?.paid_amount || 0);

        const newDueAmount =
            totalAmount - existingPaid;

        // ==========================================
        // UPDATE SAME ROW
        // ==========================================

        await executeQuery(
            `
    UPDATE project_labour_expenses1
    SET
        labour_name = ?,
        amount = ?,
        due_amount = ?,
        updated_at = NOW()
    WHERE id = ?
    `,
            [
                labour_name,
                totalAmount,
                newDueAmount,
                existingSummary[0].id,
            ]
        );

        return NextResponse.json({
            message:
                "Labour expense updated successfully",
        });

    } catch (error) {

        console.log(error);

        return NextResponse.json(
            {
                error:
                    "Failed to update labour expense",
            },
            {
                status: 500,
            }
        );
    }
}
// ==========================================
// DELETE LABOUR EXPENSE
// ==========================================
export async function DELETE(req: NextRequest) {

    try {

        const { searchParams } =
            new URL(req.url);

        const id =
            searchParams.get("id");

        if (!id) {

            return NextResponse.json(
                {
                    error: "Expense id is required",
                },
                {
                    status: 400,
                }
            );
        }

        // ==========================================
        // GET labour info
        // ==========================================

        const [row]: any =
            await executeQuery(
                `
                SELECT labour_id, appointment_id, labour_name
                FROM project_labour_expenses
                WHERE id = ?
                `,
                [id]
            );

        if (row.length === 0) {

            return NextResponse.json(
                {
                    error: "Expense not found",
                },
                {
                    status: 404,
                }
            );
        }

        const labour_id =
            row[0].labour_id;

        const appointment_id =
            row[0].appointment_id;

        const labour_name =
            row[0].labour_name;

        // ==========================================
        // DELETE EXPENSE
        // ==========================================

        await executeQuery(
            `
            DELETE FROM project_labour_expenses
            WHERE id = ?
            `,
            [id]
        );

        // ==========================================
        // RECALCULATE TOTAL
        // ==========================================

        const [sumRows]: any =
            await executeQuery(
                `
                SELECT SUM(amount) as total_amount
                FROM project_labour_expenses
                WHERE labour_id = ?
                AND appointment_id = ?
                `,
                [labour_id, appointment_id]
            );

        const totalAmount =
            Number(sumRows[0]?.total_amount || 0);

        // ==========================================
        // TOTAL PAID
        // ==========================================

        const [paidRows]: any =
            await executeQuery(
                `
                SELECT SUM(paid_amount) as total_paid
                FROM project_labour_expenses1
                WHERE labour_id = ?
                AND appointment_id = ?
                `,
                [labour_id, appointment_id]
            );

        const totalPaid =
            Number(paidRows[0]?.total_paid || 0);

        const dueAmount =
            totalAmount - totalPaid;
        // ==========================================
        // GET EXISTING SUMMARY ROW
        // ==========================================

        const [existingSummary]: any =
            await executeQuery(
                `
        SELECT id, paid_amount
        FROM project_labour_expenses1
        WHERE labour_id = ?
        AND appointment_id = ?
        ORDER BY id DESC
        LIMIT 1
        `,
                [labour_id, appointment_id]
            );

        const existingPaid =
            Number(existingSummary[0]?.paid_amount || 0);

        const newDueAmount =
            totalAmount - existingPaid;

        // ==========================================
        // UPDATE SAME ROW
        // ==========================================

        await executeQuery(
            `
            UPDATE project_labour_expenses1
            SET
                amount = ?,
                due_amount = ?,
                updated_at = NOW()
            WHERE id = ?
            `,
            [
                totalAmount,
                newDueAmount,
                existingSummary[0].id,
            ]
        );

        return NextResponse.json({
            message:
                "Expense deleted successfully",
        });

    } catch (error) {

        console.log(error);

        return NextResponse.json(
            {
                error:
                    "Failed to delete expense",
            },
            {
                status: 500,
            }
        );
    }
}