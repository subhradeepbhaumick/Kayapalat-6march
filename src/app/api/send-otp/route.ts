import { NextRequest, NextResponse } from 'next/server';
import { sendOtpEmail } from '@/helpers/mailer';

// In-memory store for OTPs (in production, use Redis or database)
const otpStore: { [email: string]: { otp: string; expires: number } } = {};

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Store OTP with expiration (5 minutes)
    otpStore[email] = {
      otp,
      expires: Date.now() + 5 * 60 * 1000
    };

    // Send OTP email (always try to send, log OTP for debugging)
    console.log(`OTP for ${email} is ${otp}`);
    const emailSent = await sendOtpEmail(email, otp);

    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send OTP email' }, { status: 500 });
    }

    return NextResponse.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Function to verify OTP (export for use in signup)
export function verifyOtp(email: string, enteredOtp: string): boolean {
  const stored = otpStore[email];
  if (!stored) return false;

  if (Date.now() > stored.expires) {
    delete otpStore[email];
    return false;
  }

  if (stored.otp === enteredOtp) {
    delete otpStore[email]; // OTP used, remove it
    return true;
  }

  return false;
}
