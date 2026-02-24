import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory store for OTPs (in production, use Redis or database)
import { otpStore } from "@/lib/otpStore";

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
    }

    const storedOtp = otpStore.get(phone);

    if (!storedOtp) {
      return NextResponse.json({ error: 'OTP not found or expired' }, { status: 400 });
    }

    if (Date.now() > storedOtp.expires) {
      otpStore.delete(phone);
      return NextResponse.json({ error: 'OTP expired' }, { status: 400 });
    }

    if (storedOtp.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // OTP verified successfully
    otpStore.delete(phone); // Remove used OTP

    return NextResponse.json({ success: true, message: 'Phone verified successfully' });
  } catch (error) {
    console.error('Error verifying phone OTP:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
