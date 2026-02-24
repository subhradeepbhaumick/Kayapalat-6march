// src/app/api/businessBrand/dashboard_stats/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { pool } from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dealer_id = session.user.id;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        (SELECT COUNT(product_id) FROM product_details WHERE dealer_id = ?) as total_products,
        (SELECT COUNT(*) FROM buy_product WHERE dealer_id = ? AND booking_status = 'On the way') as active_orders,
        (SELECT COUNT(*) FROM buy_product WHERE dealer_id = ? AND booking_status = 'Booked') as pending_orders,
        (SELECT SUM(company_total_payment) FROM \`bought-product\` WHERE dealer_id = ?) as total_revenue`,
      [dealer_id, dealer_id, dealer_id, dealer_id]
    );
    
    const stats = rows[0];
    return NextResponse.json({
      totalProducts: stats?.total_products || 0,
      activeOrders: stats?.active_orders || 0,
      pendingOrders: stats?.pending_orders || 0,
      totalRevenue: stats?.total_revenue || 0
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
