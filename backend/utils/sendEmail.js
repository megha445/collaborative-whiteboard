import 'dotenv/config';
import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Gmail configuration error:', error);
  } else {
    console.log('✅ Gmail configured and ready to send emails');
  }
});

export const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"Whiteboard App" <${process.env.GMAIL_USER}>`,
      to: email,
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
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email Error:', error.message);
    return false;
  }
};