import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Helper to normalize email
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.sub) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const [user] = await db.query(
      `SELECT user_id as id, name, email, phone, whatsapp FROM users_kp_db WHERE user_id = ?`,
      [token.sub]
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Require authentication
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.sub) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let body: any = {};

    try {
      if (contentType.includes('application/json')) {
        body = await request.json();
      } else if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        body = Object.fromEntries(formData.entries());
      }
    } catch (e) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { name, phone, whatsapp, newPassword } = body;

    const userId = token.sub;

    if (!name && !newPassword) {
      return NextResponse.json(
        { error: 'No data provided for update' },
        { status: 400 }
      );
    }

    // Get current user to verify existence
    const currentUser = await db.query(
      `SELECT user_id FROM users_kp_db WHERE user_id = ?`,
      [userId]
    );

    if (!currentUser || currentUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Handle password change request separately
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.query(
        `UPDATE users_kp_db SET password_hash = ? WHERE user_id = ?`,
        [hashedPassword, userId]
      );
      return NextResponse.json({ success: true, message: 'Password updated successfully' });
    }

    // Handle normal profile update
    if (name) {
      await db.query(
        `UPDATE users_kp_db
         SET name = ?, phone = ?, whatsapp = ?
         WHERE user_id = ?`,
        [name, phone || '', whatsapp || '', userId]
      );
    }

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
