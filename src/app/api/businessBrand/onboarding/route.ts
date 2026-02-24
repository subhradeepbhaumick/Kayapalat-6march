import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.user_id || token.role !== 'businessBrand') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const businessBrandId = token.user_id;

    // Parse FormData
    const formData = await request.formData();

    // Extract required fields
    const companyName = formData.get('companyName') as string;
    const address = formData.get('address') as string;
    const ownerName = formData.get('ownerName') as string;
    const phone = formData.get('phone') as string;
    const pan = formData.get('pan') as string;

    // Validate required fields
    if (!companyName || !address || !ownerName || !phone || !pan) {
      return NextResponse.json(
        { error: 'Company name, address, owner name, phone, and PAN are required' },
        { status: 400 }
      );
    }

    // Extract optional fields
    const gstin = formData.get('gstin') as string || '';
    const tan = formData.get('tan') as string || '';

    // Insert or update the manufacturer table with onboarding data
    await executeQuery(`
      INSERT INTO manufacturer (dealer_id, company_name, address, gstin, pan, tan, owner_name, whatsapp, password_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, '')
      ON DUPLICATE KEY UPDATE
        company_name = VALUES(company_name),
        address = VALUES(address),
        gstin = VALUES(gstin),
        pan = VALUES(pan),
        tan = VALUES(tan),
        owner_name = VALUES(owner_name),
        phone = VALUES(whatsapp),
        password_hash = VALUES(password_hash)
    `, [businessBrandId, companyName, address, gstin, pan, tan, ownerName, phone]);

    return NextResponse.json({
      message: 'Onboarding completed successfully',
      onboardingCompleted: true
    });

  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.user_id || token.role !== 'businessBrand') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const businessBrandId = token.user_id;

    // Parse FormData
    const formData = await request.formData();

    // Extract fields (all optional for updates)
    const companyName = formData.get('companyName') as string || '';
    const address = formData.get('address') as string || '';
    const gstin = formData.get('gstin') as string || '';
    const pan = formData.get('pan') as string || '';
    const tan = formData.get('tan') as string || '';
    const ownerName = formData.get('ownerName') as string || '';
    const phone = formData.get('phone') as string || '';

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];

    if (companyName) {
      updateFields.push('company_name = ?');
      updateValues.push(companyName);
    }
    if (address) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }
    if (gstin) {
      updateFields.push('gstin = ?');
      updateValues.push(gstin);
    }
    if (pan) {
      updateFields.push('pan = ?');
      updateValues.push(pan);
    }
    if (tan) {
      updateFields.push('tan = ?');
      updateValues.push(tan);
    }
    if (ownerName) {
      updateFields.push('owner_name = ?');
      updateValues.push(ownerName);
    }
    if (phone) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields provided for update' },
        { status: 400 }
      );
    }

    // Add the WHERE clause values
    updateValues.push(businessBrandId);

    const updateQuery = `
      UPDATE manufacturer SET
        ${updateFields.join(', ')}
      WHERE dealer_id = ?
    `;

    await executeQuery(updateQuery, updateValues);

    return NextResponse.json({
      message: 'Onboarding updated successfully'
    });

  } catch (error) {
    console.error('Error updating onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to update onboarding' },
      { status: 500 }
    );
  }
}
