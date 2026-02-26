import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import { uploadToB2 } from '@/lib/uploadController';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const client_id = formData.get('client_id') as string;
    const client_name = formData.get('client_name') as string;
    const room_name = formData.get('room_name') as string;
    const product_name = formData.get('product_name') as string;
    const image = formData.get('image') as File;

    if (!client_id || !client_name || !room_name || !image) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `clientdesigns/${timestamp}-${image.name.replace(/\s/g, '_')}`;

    // Upload to B2
    const fileBuffer = Buffer.from(await image.arrayBuffer());
    const uploadResult = await uploadToB2(filename, fileBuffer, image.type);

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Save to database
    const [result] = await db.query(`
      INSERT INTO designs (
        designer_id, client_id, client_name, image_path,
        room_name, product_name, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [
      token.id, // designer_id from token
      client_id,
      client_name,
      filename, // B2 key
      room_name,
      product_name
    ]);

    return NextResponse.json({
      success: true,
      design_id: (result as any).insertId,
      message: 'Design uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading design:', error);
    return NextResponse.json(
      { error: 'Failed to upload design' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clientFilter = searchParams.get('client');
    const sortOrder = searchParams.get('sort') || 'desc';

    let query = `
      SELECT * FROM designs
      WHERE designer_id = ?
      AND status = 'active'
    `;
    let params: any[] = [token.id];

    if (clientFilter) {
      query += ' AND client_id = ?';
      params.push(clientFilter);
    }

    query += ` ORDER BY timestamp ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`;

    const designs = await db.query(query, params);

    return NextResponse.json(designs);
  } catch (error) {
    console.error('Error fetching designs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch designs' },
      { status: 500 }
    );
  }
}
