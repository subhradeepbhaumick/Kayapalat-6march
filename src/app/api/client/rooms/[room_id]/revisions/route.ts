import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { initializeDatabase } from '@/lib/initDB';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ room_id: string }> }
) {
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

    // Only allow clients to fetch their own rooms
    if (session.user.role !== 'client') {
      return NextResponse.json(
        { error: 'Access denied. Client role required.' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const roomId = parseInt(params.room_id, 10);
    if (isNaN(roomId)) {
      return NextResponse.json(
        { error: 'Invalid room ID' },
        { status: 400 }
      );
    }

    // Check if we should include the latest revision (for finalization modal)
    const url = new URL(request.url);
    const includeLatest = url.searchParams.get('includeLatest') === 'true';

    const clientId = session.user.id;

    // Verify the room belongs to the client
    const roomCheck = await db.query(
      'SELECT room_id FROM design_rooms WHERE room_id = ? AND client_id = ?',
      [roomId, clientId]
    );

    if (!roomCheck || roomCheck.length === 0) {
      return NextResponse.json(
        { error: 'Room not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch all revisions for the room (including latest for finalization modal)
    const revisions = await db.query(`
      SELECT
        rev.revision_id,
        rev.revision_number,
        rev.created_at,
        COUNT(d.id) as design_count
      FROM design_revisions rev
      LEFT JOIN designer_designs d ON rev.revision_id = d.revision_id AND d.status = 'active'
      WHERE rev.room_id = ?
      GROUP BY rev.revision_id
      ORDER BY rev.revision_number DESC
    `, [roomId]);

    // For each revision, fetch the designs
    const revisionsWithDesigns = await Promise.all(
      revisions.map(async (rev: any) => {
        const designs = await db.query(`
          SELECT
            d.*,
            u.name AS designer_name
          FROM designer_designs d
          LEFT JOIN users_kp_db u ON d.designer_id = u.user_id
          WHERE d.revision_id = ?
          AND d.status = 'active'
          ORDER BY d.timestamp ASC
        `, [rev.revision_id]);

        return {
          revision_id: rev.revision_id,
          revision_number: rev.revision_number,
          created_at: rev.created_at,
          designs: designs
        };
      })
    );

    return NextResponse.json({ revisions: revisionsWithDesigns });
  } catch (error) {
    console.error('Error fetching room revisions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revisions' },
      { status: 500 }
    );
  }
}
