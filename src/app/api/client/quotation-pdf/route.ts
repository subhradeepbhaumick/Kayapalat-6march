import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { executeQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.user_id || token.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pdfId = searchParams.get('id');

    if (pdfId) {
      // Fetch specific PDF file
      const [rows] = await executeQuery(
        'SELECT * FROM quotation_pdfs WHERE id = ? AND client_id = ?',
        [pdfId, token.user_id]
      );

      if (rows.length === 0) {
        return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
      }

      const pdfData = rows[0] as any;
      const filePath = path.join(process.cwd(), 'public', pdfData.pdf_path);

      if (!existsSync(filePath)) {
        return NextResponse.json({ error: 'PDF file not found' }, { status: 404 });
      }

      // Read and return the PDF file
      const fileBuffer = await readFile(filePath);

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${pdfData.file_name}"`,
        },
      });
    } else {
      // Fetch all client's quotation PDFs
      const [rows] = await executeQuery(
        'SELECT id, file_name, file_size, uploaded_at FROM quotation_pdfs WHERE client_id = ? ORDER BY uploaded_at DESC',
        [token.user_id]
      );

      return NextResponse.json({
        hasPdfs: rows.length > 0,
        pdfs: rows
      });
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotation PDFs', details: String(error) },
      { status: 500 }
    );
  }
}
