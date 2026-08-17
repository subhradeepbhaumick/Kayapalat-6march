import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const categoryId = req.nextUrl.searchParams.get("category_id");

    if (!categoryId) {
      return NextResponse.json(
        {
          success: false,
          error: "category_id is required",
        },
        { status: 400 }
      );
    }

    const result = await executeQuery(
      `
      SELECT
          id,
          title,
          image_path
      FROM galleryimages
      WHERE
          category_id = ?
          AND status='published'
      ORDER BY created_at DESC
      `,
      [categoryId]
    );

    // The query result is an array where the first element contains the data rows.
    const images = Array.isArray(result) ? result[0] : result;

    return NextResponse.json({
      success: true,
      images,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch images",
      },
      { status: 500 }
    );
  }
}