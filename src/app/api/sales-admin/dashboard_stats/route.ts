import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    console.log('Dashboard Stats API: Request received');
    console.log('Dashboard Stats API: Request headers:', req.headers);
    console.log('Dashboard Stats API: NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set');

    // --------------------------------------------------
    // Auth Check - Middleware handles authentication
    // --------------------------------------------------
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    console.log('Dashboard Stats API: Retrieved token:', token);

    if (!token || !token.user_id || !token.role) {
      console.log('Dashboard Stats API: Token validation failed - missing user_id or role');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = token;
    console.log('Dashboard Stats API: Decoded token:', decoded);

    if (!decoded || !decoded.user_id || (decoded.role !== 'sales_admin' && decoded.role !== 'superadmin')) {
      console.log('Dashboard Stats API: Role validation failed - invalid role or missing user_id');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('Dashboard Stats API: Authentication successful for user:', decoded.user_id, 'role:', decoded.role);

    const userId = decoded.user_id as string;
    const isSuperAdmin = decoded.role === 'superadmin';

    let adminId: string | null = null;

    if (!isSuperAdmin) {
      // Determine the admin_id for the user
      const [agentRows] = await executeQuery('SELECT admin_id FROM agents WHERE agent_id = ?', [userId]);
      if (agentRows.length > 0) {
        adminId = agentRows[0].admin_id;
      } else {
        adminId = userId; // User is the admin
      }
    }

    let agentsQuery: string, agentsParams: any[], leadsQuery: string, leadsParams: any[], revenueQuery: string, revenueParams: any[];

    if (isSuperAdmin) {
      // Superadmin sees all data
      agentsQuery = 'SELECT COUNT(*) as count FROM agents';
      agentsParams = [];
      leadsQuery = 'SELECT COUNT(*) as count FROM projects';
      leadsParams = [];
      revenueQuery = 'SELECT COALESCE(SUM(project_value), 0) as total FROM projects WHERE booking_status = \'Booked\'';
      revenueParams = [];
    } else {
      // Sales admin or agent sees data for their admin
      agentsQuery = 'SELECT COUNT(*) as count FROM agents WHERE admin_id = ?';
      agentsParams = [adminId];
      leadsQuery = 'SELECT COUNT(*) as count FROM projects WHERE admin_id = ? ';
      leadsParams = [adminId];
      revenueQuery = 'SELECT COALESCE(SUM(project_value), 0) as total FROM projects WHERE admin_id = ? AND booking_status = \'Booked\'';
      revenueParams = [adminId];
    }

    const [agentsResult] = await executeQuery(agentsQuery, agentsParams);
    const activeAgents = parseInt(agentsResult[0].count);

    const [leadsResult] = await executeQuery(leadsQuery, leadsParams);
    const totalLeads = parseInt(leadsResult[0].count);

    const [revenueResult] = await executeQuery(revenueQuery, revenueParams);
    const totalRevenue = parseFloat(revenueResult[0].total);

    return NextResponse.json({
      activeAgents,
      totalLeads,
      totalRevenue
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
