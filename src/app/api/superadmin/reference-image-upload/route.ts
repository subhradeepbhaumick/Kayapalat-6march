import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clientId,
      clientName,
      categoryId,
      categoryName,
      articleName,
      images,
    } = body;
    // Validation
    if (
      !clientId ||
      !clientName ||
      !categoryId ||
      !categoryName ||
      !articleName ||
      !articleName.trim() ||
      !images ||
      !Array.isArray(images) ||
      images.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields.",
        },
        {
          status: 400,
        }
      );
    }
    // Create one DB row for every selected image
    const values = images.map((imagePath: string) => [
      clientId,
      clientName,
      categoryId,
      categoryName,
      articleName.trim(),
      imagePath,
    ]);
    const query = `
      INSERT INTO reference_images_upload
      (
        client_id,
        client_name,
        category_id,
        category_name,
        article_name,
        image_path
      )
      VALUES ?
    `;
    await executeQuery(query, [values]);
    return NextResponse.json({
      success: true,
      message: "Reference images uploaded successfully.",
    });
  } catch (err) {
    console.error(
      "Error inserting reference images:",
      err
    );
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload reference images.",
      },
      {
        status: 500,
      }
    );
  }
}