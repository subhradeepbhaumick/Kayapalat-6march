import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { executeQuery } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.user_id || token.role !== 'businessBrand') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const businessBrandId = token.user_id;

    // Select from users_kp_db table for businessBrand profile
    const [businessBrandResult] = await executeQuery(`
      SELECT * FROM users_kp_db WHERE user_id = ? AND role = 'businessBrand'
    `, [businessBrandId]);

    if (businessBrandResult.length === 0) {
      return NextResponse.json(
        { error: 'Business Brand not found' },
        { status: 404 }
      );
    }

    const businessBrand = businessBrandResult[0];

    // Also fetch manufacturer data if it exists
    const [manufacturerResult] = await executeQuery(`
      SELECT * FROM manufacturer WHERE dealer_id = ?
    `, [businessBrandId]);

    const manufacturer = manufacturerResult.length > 0 ? manufacturerResult[0] : null;

    const profileData = {
      businessBrand: {
        user_id: businessBrand.user_id,
        name: businessBrand.name,
        email: businessBrand.email,
        phone: businessBrand.phone || manufacturer?.phone,
        whatsapp: businessBrand.whatsapp,
        profile_pic: businessBrand.profile_pic,
        company_name: businessBrand.company_name || manufacturer?.company_name,
        address: businessBrand.address || manufacturer?.address,
        gstin: businessBrand.gstin || manufacturer?.gstin,
        pan: businessBrand.pan || manufacturer?.pan,
        tan: businessBrand.tan || manufacturer?.tan,
        owner_name: businessBrand.owner_name || manufacturer?.owner_name,
        company_logo: manufacturer?.company_logo || businessBrand.company_logo,
        account_holder_name: manufacturer?.account_holder || '',
        bank_name: manufacturer?.bank_name || '',
        account_number: manufacturer?.account_number || '',
        ifsc_code: manufacturer?.ifsc_code || '',
        upi_id: manufacturer?.upi_id || '',
      }
    };

    // Debug logging
    console.log('Profile API Debug:');
    console.log('Business Brand ID:', businessBrandId);
    console.log('Users_kp_db data:', businessBrand);
    console.log('Manufacturer data:', manufacturer);
    console.log('Final profile data:', profileData.businessBrand);

    // Check required fields
    const { company_name, address, owner_name, phone, pan } = profileData.businessBrand;
    const requiredFieldsCheck = {
      company_name: company_name && company_name.trim() !== '',
      address: address && address.trim() !== '',
      owner_name: owner_name && owner_name.trim() !== '',
      phone: phone && phone.trim() !== '',
      pan: pan && pan.trim() !== ''
    };
    console.log('Required fields check:', requiredFieldsCheck);
    console.log('All required fields filled:', Object.values(requiredFieldsCheck).every(Boolean));

    return NextResponse.json(profileData);

  } catch (error) {
    console.error('Error fetching businessBrand profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
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

    // Extract fields
    const companyName = formData.get('companyName') as string || '';
    const address = formData.get('address') as string || '';
    const gstin = formData.get('gstin') as string || '';
    const pan = formData.get('pan') as string || '';
    const tan = formData.get('tan') as string || '';
    const ownerName = formData.get('ownerName') as string || '';
    const phone = formData.get('phone') as string || '';
    const accountHolderName = formData.get('accountHolderName') as string || '';
    const bankName = formData.get('bankName') as string || '';
    const accountNumber = formData.get('accountNumber') as string || '';
    const ifscCode = formData.get('ifscCode') as string || '';
    const upiId = formData.get('upiId') as string || '';

    // Handle file upload
    let companyLogoPath = null;
    const companyLogoFile = formData.get('companyLogo') as File | null;
    if (companyLogoFile) {
      // Ensure the company_logo directory exists
      const dirPath = path.join(process.cwd(), 'public/company_logo');
      await fs.mkdir(dirPath, { recursive: true });

      // Generate unique filename
      const fileExtension = path.extname(companyLogoFile.name);
      const fileName = `${businessBrandId}_${Date.now()}${fileExtension}`;
      const filePath = path.join(dirPath, fileName);

      // Convert file to buffer and save
      const buffer = Buffer.from(await companyLogoFile.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      companyLogoPath = `/company_logo/${fileName}`;
    }

    // Check if manufacturer record exists
    const [existingManufacturer] = await executeQuery(`
      SELECT dealer_id FROM manufacturer WHERE dealer_id = ?
    `, [businessBrandId]);

    if (existingManufacturer.length > 0) {
      // Update existing record
      await executeQuery(`
        UPDATE manufacturer SET
          company_name = ?,
          address = ?,
          gstin = ?,
          pan = ?,
          tan = ?,
          owner_name = ?,
          phone = ?,
          company_logo = ?,
          bank_name = ?,
          account_holder = ?,
          account_number = ?,
          ifsc_code = ?,
          upi_id = ?,
          updated_at = NOW()
        WHERE dealer_id = ?
      `, [companyName, address, gstin, pan, tan, ownerName, phone, companyLogoPath, bankName, accountHolderName, accountNumber, ifscCode, upiId, businessBrandId]);
    } else {
      // Insert new record with minimal required fields
      await executeQuery(`
        INSERT INTO manufacturer (dealer_id, company_name, address, gstin, pan, tan, owner_name, phone, company_logo, bank_name, account_holder, account_number, ifsc_code, upi_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [businessBrandId, companyName, address, gstin, pan, tan, ownerName, phone, companyLogoPath, bankName, accountHolderName, accountNumber, ifscCode, upiId]);
    }

    // Also update basic fields in users_kp_db if needed
    const userName = formData.get('userName') as string || '';
    const whatsapp = formData.get('whatsapp') as string || '';
    const email = formData.get('email') as string || '';

    await executeQuery(`
      UPDATE users_kp_db SET
        name = ?,
        whatsapp = ?,
        email = ?
      WHERE user_id = ? AND role = 'businessBrand'
    `, [userName, whatsapp, email, businessBrandId]);

    // Update company_name in buy_product table where dealer_id matches
    await executeQuery(`
      UPDATE buy_product SET
        company_name = ?
      WHERE dealer_id = ?
    `, [companyName, businessBrandId]);

    return NextResponse.json({
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating businessBrand profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
