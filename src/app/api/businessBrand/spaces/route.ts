import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getToken } from 'next-auth/jwt';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // ✅ Proper token validation
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const spaceType = searchParams.get('space_type');

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    if (spaceType) {
      // Fetch specific space details including dealer_id
      const [rows] = await connection.execute(`
        SELECT  space_type, size,price,dealer_id,client_name,  due,time_period,booking_status,booking_date, expire_date FROM \`showroom_a\` WHERE space_type = ?
      `, [spaceType]);

      await connection.end();

      if ((rows as any[]).length === 0) {
        return NextResponse.json({ error: 'Space not found' }, { status: 404 });
      }

      const space = (rows as any[])[0];
      return NextResponse.json({
        space_type: space.space_type,
        size: space.size.toString(),
        price: Number(space.price),
        dealer_id: space.dealer_id,
        company_name: space.company_name,
        time_period: space.time_period,
        booking_status: space.booking_status,
        booking_date: space.booking_date,
        expire_date: space.expire_date,
      });
    } else {
      // Fetch all spaces (frontend handles availability)
      const [rows] = await connection.execute(`
        SELECT space_type, size, price,time_period,dealer_id,booking_status,booking_date,expire_date FROM \`showroom_a\``);

      await connection.end();

      const spaces = (rows as any[]).map(row => ({
        space_type: row.space_type,
        size: row.size.toString(),
        price: Number(row.price),
        time_period: row.time_period,
        dealer_id: row.dealer_id,
        booking_status: row.booking_status || 'available',
        booking_date: row.booking_date,
        expire_date: row.expire_date,
      }));

      return NextResponse.json(spaces);
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spaces' },
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

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const space_type = formData.get('space_type') as string;
    const dealer_id = formData.get('dealer_id') as string;
    const company_name = formData.get('company_name') as string;
    const advance = formData.get('advance') as string;
    const booking_cost = formData.get('booking_cost') as string;
    const due = formData.get('due') as string;
    const time_period = formData.get('time_period') as string;
    const transaction_proof = formData.get('transaction_proof') as File;

    if (!space_type || !dealer_id || !company_name || !advance || !booking_cost || !time_period || !transaction_proof) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const timePeriodInt = parseInt(time_period);
    if (isNaN(timePeriodInt) || timePeriodInt <= 0) {
      return NextResponse.json({ error: 'Invalid time period' }, { status: 400 });
    }

    // Save the transaction proof file
    const uploadsDir = path.join(process.cwd(), 'public', 'transaction_proof');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const now = new Date();
    const fileName = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}.${transaction_proof.name.split('.').pop()}`;
    const filePath = path.join(uploadsDir, fileName);
    const buffer = Buffer.from(await transaction_proof.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const transactionProofPath = `/transaction_proof/${fileName}`;
    // Format: YYYYMMDDHHMMSS (en-IN style)
    const invoiceTimestamp =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0");

    const invoice_id = `INV-S-${invoiceTimestamp}`;
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Update the space with dealer_id, company_name, advance, booking_cost, time_period, transaction_proof_path, booking_date, expire_date, ensuring it's not already booked
    const [updateResult]: any = await connection.execute(`
      UPDATE \`showroom_a\`
      SET dealer_id = ?, client_name = ?, advance = ?, booking_cost = ?, due=?, time_period = ?, transaction_proof = ?, invoice_id = ?,booking_status = 'pending', booking_date = CURDATE(), expire_date = DATE_ADD(CURDATE(), INTERVAL ? MONTH)
      WHERE space_type = ? AND dealer_id IS NULL
    `, [dealer_id, company_name, advance, booking_cost, due, time_period, transactionProofPath,invoice_id, timePeriodInt, space_type]);

    if (updateResult.affectedRows === 0) {
      await connection.end();
      return NextResponse.json(
        { error: 'Slot already booked' },
        { status: 409 }
      );
    }

    await connection.end();

    return NextResponse.json({ message: 'Space booked successfully' });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to book space' },
      { status: 500 }
    );
  }
}
export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { space_type, booking_date, expire_date } = body;

    if (!space_type || !booking_date || !expire_date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const [result]: any = await connection.execute(
      `
      UPDATE showroom_a
      SET booking_date = ?, expire_date = ?, updated_at = NOW()
      WHERE space_type = ?
      `,
      [booking_date, expire_date, space_type]
    );

    await connection.end();

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Space not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Dates updated successfully",
    });

  } catch (error) {
    console.error("PUT API Error:", error);
    return NextResponse.json(
      { error: "Failed to update dates" },
      { status: 500 }
    );
  }
}
