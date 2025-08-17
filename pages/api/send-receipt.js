// pages/api/send-receipt.js
import nodemailer from 'nodemailer';

// Configure email transporter (GoDaddy Microsoft Email)
const transporter = nodemailer.createTransporter({
  host: 'smtpout.secureserver.net',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, accessCode, restoredAt } = req.body;

  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required' 
    });
  }

  try {
    const receiptDate = new Date(restoredAt || Date.now());
    const formattedDate = receiptDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #10b981; margin: 0;">BetrParlay</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">Premium Access Activated</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
          <h2 style="color: white; margin: 0 0 10px 0;">🎉 Welcome to Premium!</h2>
          <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">Your premium access has been successfully activated</p>
        </div>

        <div style="background: #f9fafb; padding: 25px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #374151; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Activation Details</h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Email:</td>
              <td style="padding: 8px 0; color: #374151; font-weight: 600;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Access Code:</td>
              <td style="padding: 8px 0; color: #374151; font-family: monospace; font-weight: 600;">${accessCode || '••••••••'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Activated:</td>
              <td style="padding: 8px 0; color: #374151; font-weight: 600;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Status:</td>
              <td style="padding: 8px 0;">
                <span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
                  ✓ ACTIVE
                </span>
              </td>
            </tr>
          </table>
        </div>

        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #065f46; margin-top: 0;">🚀 What's Included in Premium:</h3>
          <ul style="color: #047857; margin: 0; padding-left: 20px; line-height: 1.6;">
            <li><strong>Advanced Parlay Calculations</strong> - Complex betting scenarios</li>
            <li><strong>Premium Analytics</strong> - Detailed performance insights</li>
            <li><strong>Priority Support</strong> - Fast response times</li>
            <li><strong>Exclusive Features</strong> - Access to latest tools first</li>
            <li><strong>Ad-Free Experience</strong> - Clean, distraction-free interface</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://aiparlaycalculator.com" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
            Start Using Premium Features
          </a>
        </div>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <div style="text-align: center;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Questions? Contact us at <a href="mailto:support@aiparlaycalculator.com" style="color: #10b981;">support@aiparlaycalculator.com</a>
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
            Thank you for choosing BetrParlay Premium!
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@aiparlaycalculator.com',
      to: email,
      subject: '🎉 BetrParlay Premium Activated - Welcome!',
      html: htmlContent,
    });

    console.log(`✅ Receipt sent to ${email}`);

    res.status(200).json({ 
      success: true, 
      message: 'Receipt sent successfully' 
    });

  } catch (error) {
    console.error('❌ Receipt sending error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send receipt' 
    });
  }
}