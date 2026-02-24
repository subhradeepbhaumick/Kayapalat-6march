// File: src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, password, phone } = await request.json();
    if (!firstName || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = 'INSERT INTO users_kp_db (first_name, last_name, email, password, phone, type) VALUES (?, ?, ?, ?, ?, ?)';
    // New users default to 'client' role
    await executeQuery(query, [firstName, lastName, email, hashedPassword, phone, 'client']);

    // Here you would typically trigger an email verification flow

    return NextResponse.json({ message: 'User registered successfully.' }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to register user.' }, { status: 500 });
  }
}