import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { uploadDesignLocal } from '@/lib/uploadController-local';
import { initializeDatabase } from '@/lib/initDB';

export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized
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

    if (!designerId) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    console.log('Current DB:', await db.query('SELECT DATABASE()'));

    const formData = await request.formData();
    const client_id = formData.get('client_id') as string;
    const client_name = formData.get('client_name') as string;
    const room_name = formData.get('room_name') as string;
    const product_name = formData.get('product_name') as string;
    const image = formData.get('image') as File;
    const pdf = formData.get('pdf') as File; 

    if (!client_id || !client_name || !room_name || (!image && !pdf)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure the client is assigned to this designer
    const assignment = await db.query(
      `SELECT 1 as ok FROM designer_client_assignments WHERE designer_id = ? AND client_id = ? LIMIT 1`,
      [designerId, client_id]
    );
    if (!assignment || assignment.length === 0) {
      return NextResponse.json(
        { error: 'Client not assigned to this designer' },
        { status: 403 }
      );
    }

    // Check if room exists, create if not
    let roomResult = await db.query(
      'SELECT room_id FROM design_rooms WHERE client_id = ? AND room_name = ?',
      [client_id, room_name]
    );

    let roomId: number;
    if (roomResult && roomResult.length > 0) {
      roomId = roomResult[0].room_id;
    } else {
      // Create new room
      const insertRoom = await db.query(
        'INSERT INTO design_rooms (client_id, room_name) VALUES (?, ?)',
        [client_id, room_name]
      );
      roomId = (insertRoom as any).insertId;
    }
    let revisionId: number | null = null;

    // Fetch existing revisions to determine how to associate the new upload
    const existingRevisions = await db.query(
      'SELECT revision_id, revision_number FROM design_revisions WHERE room_id = ? ORDER BY revision_number DESC',
      [roomId]
    );
    
    const revisionCount = existingRevisions.length;

    if (image) {
      // Image upload creates a NEW revision
      if (revisionCount >= 3) {
        return NextResponse.json(
          { error: 'Maximum 3 revisions allowed per room' },
          { status: 400 }
        );
      }

      const nextRevisionNumber = revisionCount + 1;

      const insertRevision = await db.query(
        'INSERT INTO design_revisions (room_id, revision_number) VALUES (?, ?)',
        [roomId, nextRevisionNumber]
      );

      revisionId = (insertRevision as any).insertId;
    } else if (pdf) {
      // PDF-only upload: associate with the latest existing revision, 
      // or create the first one if the room is empty.
      if (revisionCount > 0) {
        // Use the latest existing revision ID
        revisionId = existingRevisions[0].revision_id;
      } else {
        // Create first revision if none exist yet for this room
        const insertRevision = await db.query(
          'INSERT INTO design_revisions (room_id, revision_number) VALUES (?, ?)',
          [roomId, 1]
        );
        revisionId = (insertRevision as any).insertId;
      }}

    // Generate unique filename
    const timestamp = Date.now();
    let imagePath: string | null = null;

if (image) {
  const timestamp = Date.now();
  const sanitizedName = image.name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\s+/g, "_");

  const filename = `clientdesigns/${timestamp}-${sanitizedName}`;

  let fileBuffer: Buffer;
  try {
    fileBuffer = Buffer.from(await image.arrayBuffer());
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid image file" },
      { status: 400 }
    );
  }

  const uploadResult = await uploadDesignLocal(
    filename,
    fileBuffer,
    image.type
  );

  if (!uploadResult.success) {
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }

  imagePath = filename;
}
let pdfPath: string | null = null;

if (pdf) {
  const date = new Date();
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);

  const sanitizedClient = client_name.replace(/[^a-zA-Z0-9]/g, "_");

  const pdfFileName = `2d-design/${sanitizedClient}-${dd}${mm}${yy}.pdf`;

  const buffer = Buffer.from(await pdf.arrayBuffer());

  const uploadPdf = await uploadDesignLocal(
    pdfFileName,
    buffer,
    pdf.type
  );

  if (!uploadPdf.success) {
    return NextResponse.json(
      { error: 'Failed to upload PDF' },
      { status: 500 }
    );
  }

  pdfPath = pdfFileName;
}

    // Save to database
    const result = await db.query(`
      INSERT INTO designer_designs (
        designer_id, client_id, client_name, image_path,2d_pdf_path,
        room_name, product_name, revision_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?,NOW())
    `, [
      designerId,
      client_id,
      client_name,
      imagePath,
      pdfPath,
      room_name,
      product_name,
      revisionId
    ]);

    return NextResponse.json({
      success: true,
      design_id: (result as any).insertId,
      message: 'Design uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading design:', error);
    return NextResponse.json(
      { error: 'Failed to upload design', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET designs: Starting');

    // Require authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const designerId = session.user.id;

    const { searchParams } = new URL(request.url);
    const clientFilter = searchParams.get('client');
    const sortOrder = searchParams.get('sort') || 'desc';

    let query = `
      SELECT * FROM designer_designs
      WHERE designer_id = ?
      AND status = 'active'
    `;
    let params: any[] = [designerId];

    if (clientFilter) {
      query += ' AND client_id = ?';
      params.push(clientFilter);
    }

    query += ` ORDER BY id ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`;

    console.log('GET designs: Query', query, params);

    // Test db connection
    const test = await db.query('SELECT 1 as test');
    console.log('GET designs: DB test', test);

    const designs = await db.query(query, params);
    console.log('GET designs: Designs', designs);

    return NextResponse.json(designs);
  } catch (error) {
    console.error('Error fetching designs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch designs', details: (error as Error).message },
      { status: 500 }
    );
  }
}
