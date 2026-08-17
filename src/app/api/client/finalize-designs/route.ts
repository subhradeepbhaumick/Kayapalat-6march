import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, executeQuery, pool } from '@/lib/db';
import { initializeDatabase } from '@/lib/initDB';

export async function GET(request: NextRequest) {
  try {
    await initializeDatabase();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (session.user.role !== 'client') {
      return NextResponse.json({ error: 'Access denied. Client role required.' }, { status: 403 });
    }

    const clientId = session.user.id;

    // Fetch finalized selections (source of truth: client_finalized_designs)
    // Some DBs may not have the optional `created_by` column (migration mismatch).
    // Detect column existence and build SELECT dynamically to avoid SQL errors.
    const colInfo = await db.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'client_finalized_designs' AND COLUMN_NAME IN ('created_by')`
    );
    const hasCreatedBy = Array.isArray(colInfo) && colInfo.length > 0;

    const selectFields = [
      'cfd.room_id',
      'cfd.design_id',
      'cfd.finalized_at',
      ...(hasCreatedBy ? ['cfd.created_by'] : []),
      'd.image_path AS image_path',
      'r.room_name',
    ].join(', ');

    const selections = await db.query(
      `SELECT ${selectFields}
       FROM client_finalized_designs cfd
       JOIN designer_designs d ON cfd.design_id = d.id
       JOIN design_rooms r ON cfd.room_id = r.room_id
       WHERE cfd.client_id = ?
       ORDER BY cfd.finalized_at DESC`,
      [clientId]
    );

    const finalized = Array.isArray(selections) && selections.length > 0;

    return NextResponse.json({ finalized, selections });
  } catch (error) {
    console.error('Error fetching finalized designs:', error);
    return NextResponse.json({ error: 'Failed to fetch finalized designs', details: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (session.user.role !== 'client') {
      return NextResponse.json({ error: 'Access denied. Client role required.' }, { status: 403 });
    }

    const clientId = session.user.id;
    const body = await request.json();
    const selections: Array<{ room_id: number; design_id: number }> = body?.selections;
    if (!Array.isArray(selections) || selections.length === 0) {
      return NextResponse.json({ error: 'Selections are required' }, { status: 400 });
    }

    // === Determine active rooms for this client ===
    // Active room definition (enforced server-side):
    // - Exists in design_rooms
    // - Has at least one active designer_designs entry (joined via design_revisions)
const activeRoomsRows = await db.query(`
  SELECT DISTINCT r.room_id
  FROM design_rooms r
  WHERE r.client_id = ?
  AND EXISTS (
    SELECT 1 
    FROM design_revisions rev
    JOIN designer_designs d ON rev.revision_id = d.revision_id
    WHERE rev.room_id = r.room_id
      AND d.status = 'active'
      AND (d.product_name IS NULL OR d.product_name != '2D Design')
  )
`, [clientId]);
    const activeRoomIds: number[] = (activeRoomsRows || []).map((r: any) => Number(r.room_id));

    // Require one selection per active room
const requiredRoomIds = activeRoomsRows.map((r: any) => Number(r.room_id));

const selectedRoomSet = new Set(selections.map(s => Number(s.room_id)));

if (selectedRoomSet.size !== requiredRoomIds.length) {
  return NextResponse.json(
    { error: 'You must select one design for each room' },
    { status: 400 }
  );
}
    for (const rid of activeRoomIds) {
      if (!selectedRoomSet.has(Number(rid))) {
        return NextResponse.json({ error: 'Selections must include every active room' }, { status: 400 });
      }
    }

    // Validate each selected design belongs to the client and room and is active
    for (const sel of selections) {
      const rows = await db.query(`
        SELECT d.id, d.status FROM designer_designs d
        JOIN design_revisions rev ON d.revision_id = rev.revision_id
        JOIN design_rooms r ON rev.room_id = r.room_id
        WHERE d.id = ? AND r.room_id = ? AND r.client_id = ?
      `, [sel.design_id, sel.room_id, clientId]);

      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: `Invalid selection: design ${sel.design_id} does not exist for room ${sel.room_id}` }, { status: 400 });
      }

      if (rows[0].status !== 'active') {
        return NextResponse.json({ error: `Invalid selection: design ${sel.design_id} is not active (status: ${rows[0].status})` }, { status: 400 });
      }
    }

    // All validation passed; perform transactional insert + flag update
    const connection = await pool.getConnection();
    try {
      await executeQuery('START TRANSACTION', [], connection);

      const createdBy = session.user.id;

      // Insert or update each selection
      for (const sel of selections) {
        await executeQuery(`
          INSERT INTO client_finalized_designs (client_id, room_id, design_id, finalized_at, created_by)
          VALUES (?, ?, ?, NOW(), ?)
          ON DUPLICATE KEY UPDATE design_id = VALUES(design_id), finalized_at = NOW(), created_by = VALUES(created_by)
        `, [clientId, sel.room_id, sel.design_id, createdBy], connection);
      }

      // Update derived flag (note: this is convenience only, source-of-truth is client_finalized_designs)
      await executeQuery(`UPDATE users_kp_db SET designs_finalized = 1 WHERE user_id = ?`, [clientId], connection);

      await executeQuery('COMMIT', [], connection);
    } catch (txErr) {
      await executeQuery('ROLLBACK', [], connection);
      console.error('Transaction error finalizing designs:', txErr);
      return NextResponse.json({ error: 'Failed to finalize designs' }, { status: 500 });
    } finally {
      connection.release();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in finalize-designs POST:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}
