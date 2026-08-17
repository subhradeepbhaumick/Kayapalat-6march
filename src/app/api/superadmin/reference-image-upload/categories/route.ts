import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export async function GET() {
  try {
    const result = await executeQuery(
      `
      SELECT
        id,
        name
      FROM gallerycategories
      `
    );

    // The query result is an array where the first element contains the data rows.
    const categories = Array.isArray(result) ? result[0] : result;

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch categories",
      },
      { status: 500 }
    );
  }
}