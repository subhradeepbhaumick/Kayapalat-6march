import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

// ============================================
// GET PROJECTS + ASSIGNED VENDORS
// ============================================
export async function GET() {
    try {
        // FETCH ONLY BOOKED PROJECTS
        const [projects] = await executeQuery(
            `
            SELECT
                appointment_id,
                client_name,
                project_name,
                project_value
            FROM projects
            WHERE booking_status = 'Booked'
            ORDER BY created_at DESC
            `
        );

        // FETCH ASSIGNMENTS
        const [assignments] = await executeQuery(
            `
            SELECT
                pv.id,
                pv.appointment_id,
                pv.vendor_id,
                v.name AS vendor_name,
                v.profile_pic
            FROM project_vendor pv
            LEFT JOIN users_kp_db v
                ON pv.vendor_id = v.user_id
                AND v.role = 'vendor'
            `
        );

        // GROUP ASSIGNMENTS BY APPOINTMENT ID
        const groupedAssignments: any = {};

        (assignments as any[]).forEach((item) => {
            if (!groupedAssignments[item.appointment_id]) {
                groupedAssignments[item.appointment_id] = [];
            }

            groupedAssignments[item.appointment_id].push({
                id: item.id,
                vendor_id: item.vendor_id,
                vendor_name: item.vendor_name,
                profile_pic:
                    item.profile_pic ||
                    "/placeholder_person.jpg",
            });
        });

        return NextResponse.json({
            projects: (projects as any[]).map((p) => ({
                id: p.appointment_id,
                appointment_id: p.appointment_id,
                client_name: p.client_name,
                project_name: p.project_name,
                project_value: p.project_value,
            })),

            assignments: groupedAssignments,
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                error: "Failed to fetch project vendors",
            },
            {
                status: 500,
            }
        );
    }
}

// ============================================
// ADD VENDOR TO PROJECT
// ============================================
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            appointment_id,
            vendor_id,
        } = body;

        if (!appointment_id || !vendor_id) {
            return NextResponse.json(
                {
                    error:
                        "appointment_id and vendor_id are required",
                },
                {
                    status: 400,
                }
            );
        }

        // CHECK DUPLICATE
        const [existing] = await executeQuery(
            `
            SELECT id
            FROM project_vendor
            WHERE appointment_id = ?
            AND vendor_id = ?
            `,
            [appointment_id, vendor_id]
        );

        if ((existing as any[]).length > 0) {
            return NextResponse.json(
                {
                    error:
                        "Vendor already assigned to this project",
                },
                {
                    status: 400,
                }
            );
        }

        // INSERT
        const [result]: any = await executeQuery(
            `
            INSERT INTO project_vendor
            (
                appointment_id,
                vendor_id
            )
            VALUES (?, ?)
            `,
            [appointment_id, vendor_id]
        );

        return NextResponse.json({
            message: "Vendor assigned successfully",

            assignment: {
                id: result.insertId,
            },
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                error: "Failed to assign vendor",
            },
            {
                status: 500,
            }
        );
    }
}

// ============================================
// REMOVE VENDOR
// ============================================
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                {
                    error: "Assignment ID is required",
                },
                {
                    status: 400,
                }
            );
        }

        await executeQuery(
            `
            DELETE FROM project_vendor
            WHERE id = ?
            `,
            [id]
        );

        return NextResponse.json({
            message: "Vendor removed successfully",
        });
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                error: "Failed to remove vendor",
            },
            {
                status: 500,
            }
        );
    }
}