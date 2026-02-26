import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { executeQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.user_id || token.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    let query = `
      SELECT qp.*, u.name as client_name, u.email as client_email
      FROM quotation_pdfs qp
      JOIN users_kp_db u ON qp.client_id = u.user_id
    `;
    let params: any[] = [];

    if (clientId) {
      query += ' WHERE qp.client_id = ?';
      params.push(clientId);
    }

    query += ' ORDER BY qp.uploaded_at DESC';

    const [rows] = await executeQuery(query, params);

    return NextResponse.json({ quotationPdfs: rows });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotation PDFs', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.user_id || token.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const clientId = formData.get('client_id') as string;
    const pdfFile = formData.get('pdf') as File;

    if (!clientId || !pdfFile) {
      return NextResponse.json({ error: 'Client ID and PDF file are required' }, { status: 400 });
    }

    // Validate PDF file type
    if (!pdfFile.type.includes('pdf')) {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Get client username for filename
    const [clientRows] = await executeQuery(
      'SELECT name FROM users_kp_db WHERE user_id = ? AND role = "client"',
      [clientId]
    );

    if (clientRows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const clientName = (clientRows[0] as any).name || 'Unknown';
    const timestamp = Date.now();
    const fileName = `${clientName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.pdf`;

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'quotation-pdfs');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);

    // Insert new record (allow multiple per client)
    await executeQuery(`
      INSERT INTO quotation_pdfs (client_id, pdf_path, file_name, file_size, uploaded_by)
      VALUES (?, ?, ?, ?, ?)
    `, [
      clientId,
      `uploads/quotation-pdfs/${fileName}`,
      pdfFile.name,
      pdfFile.size,
      token.user_id
    ]);

    // Save the file
    const bytes = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      success: true,
      message: 'PDF uploaded successfully',
      fileName,
      filePath: `uploads/quotation-pdfs/${fileName}`
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload PDF', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'PDF ID is required' }, { status: 400 });
    }

    // Get PDF path
    const [rows] = await executeQuery(
      'SELECT pdf_path FROM quotation_pdfs WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    const pdfPath = (rows[0] as any).pdf_path;
    const filePath = path.join(process.cwd(), 'public', pdfPath);

    // Delete file
    try {
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    // Delete database record
    await executeQuery('DELETE FROM quotation_pdfs WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: 'PDF deleted successfully' });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete PDF', details: String(error) },
      { status: 500 }
    );
  }
}
