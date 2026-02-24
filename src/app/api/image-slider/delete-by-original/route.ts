import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { original_id, page_id } = await request.json();

    const query = `
      DELETE FROM imageslider
      WHERE testimonial_name = (
        SELECT testimonial_name FROM imageslider WHERE id = ?
      )
      AND page_id = ?
      AND id != ?
    `;

    await executeQuery(query, [original_id, page_id, original_id]);

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete duplicate" }, { status: 500 });
  }
}