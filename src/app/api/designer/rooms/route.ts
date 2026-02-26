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

    const designerId = session.user.id;

    // Fetch all rooms for this designer
    const rooms = await db.query(`
      SELECT DISTINCT
        r.room_id,
        r.room_name,
        r.client_id,
        u.name AS client_name
      FROM design_rooms r
      LEFT JOIN users_kp_db u ON r.client_id = u.user_id
      JOIN design_revisions rev ON r.room_id = rev.room_id
      JOIN designer_designs d ON rev.revision_id = d.revision_id AND d.status = 'active'
      WHERE d.designer_id = ?
      ORDER BY r.room_name ASC
    `, [designerId]);

    // For each room, fetch all revisions with their designs
    const roomsWithRevisions = await Promise.all(
      rooms.map(async (room: any) => {
        const revisions = await db.query(`
          SELECT
            rev.revision_id,
            rev.revision_number,
            rev.created_at as revision_created_at,
            COUNT(d.id) as design_count
          FROM design_revisions rev
          LEFT JOIN designer_designs d ON rev.revision_id = d.revision_id AND d.status = 'active'
          WHERE rev.room_id = ?
          GROUP BY rev.revision_id
          ORDER BY rev.revision_number ASC
        `, [room.room_id]);

        // For each revision, fetch the designs
        const revisionsWithDesigns = await Promise.all(
          revisions.map(async (revision: any) => {
            const designs = await db.query(`
              SELECT
                d.*,
                u.name AS designer_name
              FROM designer_designs d
              LEFT JOIN users_kp_db u ON d.designer_id = u.user_id
              WHERE d.revision_id = ?
              AND d.status = 'active'
              ORDER BY d.timestamp ASC
            `, [revision.revision_id]);

            return {
              revision_id: revision.revision_id,
              revision_number: revision.revision_number,
              created_at: revision.revision_created_at,
              designs: designs
            };
          })
        );

        // Check current revision count for upload status
        const currentRevisionCount = revisions.length;
        const canUpload = currentRevisionCount < 3;

        return {
          room_id: room.room_id,
          room_name: room.room_name,
          client_id: room.client_id,
          client_name: room.client_name,
          revisions: revisionsWithDesigns,
          current_revision_count: currentRevisionCount,
          can_upload: canUpload
        };
      })
    );

    return NextResponse.json(roomsWithRevisions);
  } catch (error) {
    console.error('Error fetching designer rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}
