import 'dotenv/config';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

console.log('Resend configured');

export const sendOTPEmail = async (email, otp) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `Whiteboard <${process.env.EMAIL_USER}>`,
      to: [email],
      subject: 'Your OTP for Whiteboard Login',
      html: `
        <h2>Login Verification</h2>
        <p>Your OTP is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
      `
    });

    if (error) {
      console.error('❌ Resend Error:', error);
      return false;
    }

    console.log('✅ Email sent:', data);
    return true;
  } catch (error) {
    console.error('❌ Email Error:', error.message);
    return false;
  }
};