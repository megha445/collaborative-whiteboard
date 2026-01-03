import 'dotenv/config';
import nodemailer from 'nodemailer';

// Verify environment variables are loaded
console.log('Email User:', process.env.EMAIL_USER);
console.log('Email Pass Length:', process.env.EMAIL_PASS?.length);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


// Add transporter verification
transporter.verify(function(error, success) {
  if (error) {
    console.log('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to send emails');
  }
});

export const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP for Whiteboard Login',
    html: `
      <h2>Login Verification</h2>
      <p>Your OTP is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 10 minutes.</p>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email Error Details:', {
      message: error.message,
      code: error.code,
      command: error.command
    });
    return false;
  }
};