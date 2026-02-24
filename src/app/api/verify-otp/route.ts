import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '../send-otp/route';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    const isValid = verifyOtp(email, otp);

    if (isValid) {
      return NextResponse.json({ message: 'OTP verified successfully' });
    } else {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
