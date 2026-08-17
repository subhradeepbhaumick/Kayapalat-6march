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
          message: "Client ID is required.",
        },
        { status: 400 }
      );
    }

    const query = `
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
      ORDER BY created_at DESC, id DESC
    `;

    const [rows] = await executeQuery(query, [clientId]);

    return NextResponse.json({
      success: true,
      designs: rows,
    });
  } catch (error) {
    console.error("Error fetching referred designs:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch referred designs.",
      },
      { status: 500 }
    );
  }
}
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Design ID is required.",
        },
        { status: 400 }
      );
    }

    // Check that the design exists
    const [rows] = await executeQuery(
      `
        SELECT id
        FROM reference_images_upload
        WHERE id = ?
      `,
      [id]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Design not found.",
        },
        { status: 404 }
      );
    }

    // Delete the referred design
    await executeQuery(
      `
        DELETE FROM reference_images_upload
        WHERE id = ?
      `,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Referred design deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting referred design:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete referred design.",
      },
      { status: 500 }
    );
  }
}