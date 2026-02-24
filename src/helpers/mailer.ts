import nodemailer from 'nodemailer';

// Email templates
const verificationEmail = (userId: string) => `
  <h1>Welcome to Kayapalat!</h1>
  <p>Please verify your email by clicking the link below:</p>
  <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${userId}">Verify Email</a>
`;

const resetPasswordEmail = (userId: string) => `
  <h1>Password Reset Request</h1>
  <p>Click the link below to reset your password:</p>
  <a href="${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${userId}">Reset Password</a>
`;

const otpEmail = (otp: string) => `
  <h1>Your OTP for Signup</h1>
  <p>Your 4-digit OTP is: <strong>${otp}</strong></p>
  <p>Please enter this code to verify your email.</p>
`;

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Send verification email
export const sendVerificationEmail = async (email: string, token: string) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Verify your email',
      html: verificationEmail(token),
    });
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string, token: string) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Reset your password',
      html: resetPasswordEmail(token),
    });
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

// Send OTP email
export const sendOtpEmail = async (email: string, otp: string) => {
  // Check if SMTP is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.log(`SMTP not configured. OTP for ${email}: ${otp}`);
    return true; // Allow signup in development without email
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Your OTP for Signup',
      html: otpEmail(otp),
    });
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

/**
 * Ensure a named `sendEmail` export exists for callers like:
 * import { sendEmail } from '@/helpers/mailer'
 *
 * This function will try to forward to common patterns if present in this file:
 * - a `sendMail` function
 * - a `transporter` object with `sendMail`
 *
 * Adjust forwarding logic to match your actual mailer implementation.
 */
export type SendEmailOptions = {
  email: string;
  emailType: string;
  userId: string;
  to?: string;
  subject?: string;
  text?: string;
  html?: string;
  from?: string;
  [key: string]: unknown;
};

export async function sendEmail(opts: SendEmailOptions) {
  const { email, emailType, userId } = opts;

  if (emailType === "VERIFY") {
    return sendVerificationEmail(email, userId);
  } else if (emailType === "RESET") {
    return sendPasswordResetEmail(email, userId);
  } else {
    console.warn('Unknown emailType:', emailType);
    return false;
  }
}

// Also expose a default object for any default-import consumers
export default {
  sendEmail,
};