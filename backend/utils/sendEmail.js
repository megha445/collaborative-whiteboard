import 'dotenv/config';
import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';

const apiInstance = new TransactionalEmailsApi();
apiInstance.setApiKey(0, process.env.BREVO_API_KEY);

console.log('✅ Brevo configured');

export const sendOTPEmail = async (email, otp) => {
  try {
    const sendSmtpEmail = new SendSmtpEmail();
    sendSmtpEmail.subject = "Your OTP for Whiteboard Login";
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #333;">Login Verification</h2>
        <p>Your OTP code is:</p>
        <h1 style="color: #4F46E5; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
        <p style="color: #666;">This OTP will expire in 10 minutes.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
      </div>
    `;
    sendSmtpEmail.sender = { name: "Whiteboard App", email: "noreply@yourapp.com" };
    sendSmtpEmail.to = [{ email: email }];

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent successfully:', data.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email Error:', error);
    return false;
  }
};