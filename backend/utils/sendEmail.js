import 'dotenv/config';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

console.log('✅ Resend configured');

export const sendOTPEmail = async (email, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [email],
      subject: 'Your OTP for Whiteboard Login',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #333;">Login Verification</h2>
          <p>Your OTP code is:</p>
          <h1 style="color: #4F46E5; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          <p style="color: #666;">This OTP will expire in 10 minutes.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Resend Error:', error);
      return false;
    }

    console.log('✅ Email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('❌ Email Error:', error.message);
    return false;
  }
};