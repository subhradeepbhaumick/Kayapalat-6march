import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { executeQuery } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== "superadmin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

const [rows]: any = await executeQuery(
  `
  SELECT
    pt.id,
    pt.project_id,
    pt.amount,
    pt.payment_method,
    pt.transaction_proof_path,
    pt.status,
    pt.created_at,

    ip.project_name,
    ip.client_id,

    u.name AS customer_name,
    u.phone AS customer_phone

  FROM interior_payment_transactions pt
  INNER JOIN interior_projects ip
    ON pt.project_id = ip.id
  INNER JOIN users_kp_db u
    ON ip.client_id = u.user_id

  WHERE pt.id = ?
  `,
  [id]
);

    if (!rows.length) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch transaction history" },
      { status: 500 }
    );
  }
}