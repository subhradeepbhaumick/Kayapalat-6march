import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || token.role !== 'designer' || !token.user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const designerId = token.user_id as string;
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    let query = `
      SELECT qp.*, u.name as client_name, u.email as client_email
      FROM quotation_pdfs qp
      JOIN users_kp_db u ON qp.client_id = u.user_id
      JOIN designer_client_assignments dca ON dca.client_id = qp.client_id
      WHERE dca.designer_id = ?
    `;
    const params: any[] = [designerId];

    if (clientId) {
      query += ' AND qp.client_id = ?';
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
