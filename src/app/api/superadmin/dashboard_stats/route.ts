import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function GET() {
  try {
    // Active Agents: count from agents table
    const [agentsResult] = await executeQuery("SELECT COUNT(*) as activeAgents FROM agents");
    const activeAgents = agentsResult[0]?.activeAgents || 0;

    // Total Leads: count from projects table
    const [leadsResult] = await executeQuery("SELECT COUNT(*) as totalLeads FROM projects");
    const totalLeads = leadsResult[0]?.totalLeads || 0;

    // Total Revenue: sum of project_value from projects table
    const [revenueResult] = await executeQuery("SELECT SUM(project_value) as totalRevenue FROM projects WHERE booking_status = 'Booked'");
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    return NextResponse.json({
      activeAgents,
      totalLeads,
      totalRevenue
    }, { status: 200 });
  } catch (error) {
    console.error("DASHBOARD STATS ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
