import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { name, email, phone, location, password } = await request.json();

    // Check if user already exists
    const [existingUsers] = await executeQuery(
      'SELECT * FROM users_kp_db WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    await executeQuery(
      'INSERT INTO users_kp_db (name, email, phone, address, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [name, email, phone, location, hashedPassword, 'client']
    );

    return NextResponse.json(
      { message: 'User created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}



