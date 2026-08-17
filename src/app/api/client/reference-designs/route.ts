import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const clientId = searchParams.get("client_id");

    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          error: "Client ID is required.",
        },
        { status: 400 }
      );
    }

    const [images] = await executeQuery(
      `
      SELECT
        id,
        client_id,
        client_name,
        category_id,
        category_name,
        article_name,
        image_path,
        created_at
      FROM reference_images_upload
      WHERE client_id = ?
      ORDER BY created_at DESC
      `,
      [clientId]
    );

    return NextResponse.json({
      success: true,
      images,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch reference images.",
      },
      { status: 500 }
    );
  }
}