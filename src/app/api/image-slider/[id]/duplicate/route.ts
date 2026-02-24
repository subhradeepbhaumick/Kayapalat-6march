import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const sliderId = parseInt(params.id, 10);
    const { page_id } = await request.json();

    if (!page_id) {
      return NextResponse.json({ error: "page_id is required" }, { status: 400 });
    }

    const [rows] = await executeQuery(
      "SELECT * FROM imageslider WHERE id = ?",
      [sliderId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Slider not found" }, { status: 404 });
    }

    const s = rows[0];

    const insertQuery = `
      INSERT INTO imageslider 
      (before_image, after_image, testimonial_dp, testimonial_name, designation, rating, comment, category_id, page_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await executeQuery(insertQuery, [
      s.before_image,
      s.after_image,
      s.testimonial_dp,
      s.testimonial_name,
      s.designation,
      s.rating,
      s.comment,
      s.category_id,
      page_id,
      s.status,
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to duplicate slider" }, { status: 500 });
  }
}