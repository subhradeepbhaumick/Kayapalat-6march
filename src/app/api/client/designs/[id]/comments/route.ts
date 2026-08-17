import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

async function verifyDesignAccess(designId: number, userId: string, role: string) {
  let condition = '';
  if (role === 'client') {
    condition = 'client_id = ?';
  } else if (role === 'designer') {
    condition = 'designer_id = ?';
  } else {
    return false;
  }
  const design = await db.query(
    `SELECT id FROM designer_designs WHERE id = ? AND ${condition} AND status = "active"`,
    [designId, userId]
  );
  return design && design.length > 0;
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user.role !== 'client' && session.user.role !== 'designer')) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const designIdStr = pathSegments[4];
    const designId = parseInt(designIdStr, 10);

    if (isNaN(designId)) {
        return NextResponse.json({ error: 'Invalid design ID in URL' }, { status: 400 });
    }

    const userId = session.user.id;
    const role = session.user.role;

    const hasAccess = await verifyDesignAccess(designId, userId, role);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Design not found or access denied' },
        { status: 404 }
      );
    }

    const dbComments: any[] = await db.query(
      'SELECT * FROM design_comments WHERE design_id = ? ORDER BY created_at DESC',
      [designId]
    );

    const comments = dbComments.map(c => {
      const createdAt = new Date(c.created_at);
      return {
        id: c.id,
        comment: c.comment,
        date: createdAt.toLocaleDateString(),
        time: createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const designIdStr = pathSegments[4];
    const designId = parseInt(designIdStr, 10);

    if (isNaN(designId)) {
        return NextResponse.json({ error: 'Invalid design ID in URL' }, { status: 400 });
    }

    const userId = session.user.id;
    const role = session.user.role;
    const { comment } = await request.json();

    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment is required' },
        { status: 400 }
      );
    }

    const hasAccess = await verifyDesignAccess(designId, userId, role);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Design not found or access denied' },
        { status: 404 }
      );
    }

    // Check if comments are locked (room has reached 3 revisions)
    const designInfo = await db.query(`
      SELECT dr.revision_number
      FROM designer_designs d
      JOIN design_revisions dr ON d.revision_id = dr.revision_id
      WHERE d.id = ?
    `, [designId]);

    if (designInfo && designInfo.length > 0 && designInfo[0].revision_number >= 3) {
      return NextResponse.json(
        { error: 'Comments are locked after 3 revisions' },
        { status: 400 }
      );
    }

    await db.query(
      'INSERT INTO design_comments (design_id, comment) VALUES (?, ?)',
      [designId, comment.trim()]
    );

    return NextResponse.json({ success: true, message: 'Comment added successfully' });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}
