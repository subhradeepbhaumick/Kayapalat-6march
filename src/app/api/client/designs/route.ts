import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { initializeDatabase } from '@/lib/initDB';

export async function GET(request: NextRequest) {
  try {
    // Initialize database
    await initializeDatabase();

    // Require authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only allow clients to fetch their own designs
    if (session.user.role !== 'client') {
      return NextResponse.json(
        { error: 'Access denied. Client role required.' },
        { status: 403 }
      );
    }

    const clientId = session.user.id;

    // Fetch rooms with latest revision for this client (only with active designs)
    const rooms = await db.query(`
      SELECT
        r.room_id,
        r.room_name,
        r.created_at as room_created_at,
        rev.revision_id,
        rev.revision_number,
        rev.created_at as revision_created_at,
        COUNT(d.id) as design_count
      FROM design_rooms r
      JOIN design_revisions rev ON r.room_id = rev.room_id
      LEFT JOIN designer_designs d ON rev.revision_id = d.revision_id AND d.status = 'active'
      WHERE r.client_id = ?
      GROUP BY r.room_id, rev.revision_id
      HAVING rev.revision_number = (
        SELECT MAX(revision_number)
        FROM design_revisions
        WHERE room_id = r.room_id
      ) AND COUNT(d.id) > 0
      ORDER BY rev.created_at DESC
    `, [clientId]);

    // For each room, fetch the designs in the latest revision
    const roomsWithDesigns = await Promise.all(
      rooms.map(async (room: any) => {
        const designs = await db.query(`
          SELECT
            d.*,
            u.name AS designer_name
          FROM designer_designs d
          LEFT JOIN users_kp_db u ON d.designer_id = u.user_id
          WHERE d.revision_id = ?
          AND d.status = 'active'
          ORDER BY d.timestamp ASC
        `, [room.revision_id]);

        // Check if comments are locked (revision_number >= 3)
        const canComment = room.revision_number < 3;

        return {
          room_id: room.room_id,
          room_name: room.room_name,
          room_created_at: room.room_created_at,
          latest_revision: {
            revision_id: room.revision_id,
            revision_number: room.revision_number,
            created_at: room.revision_created_at,
            designs: designs,
            can_comment: canComment
          }
        };
      })
    );

    return NextResponse.json(roomsWithDesigns);
  } catch (error) {
    console.error('Error fetching client designs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch designs' },
      { status: 500 }
    );
  }
}
