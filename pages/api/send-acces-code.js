// pages/api/send-access-code.js
import nodemailer from 'nodemailer';
import codeCache from '../../lib/cache';

// Function to generate random 8-character code
function generateAccessCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Configure your email transporter (GoDaddy Microsoft Email)
const transporter = nodemailer.createTransporter({
  host: 'smtpout.secureserver.net', // GoDaddy's SMTP server
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // noreply@aiparlaycalculator.com
    pass: process.env.EMAIL_PASS, // your email password
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

  const { email, reason = 'purchase' } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ 
      success: false, 
      message: 'Valid email is required' 
    });
  }

  try {
    // Generate new access code
    const accessCode = generateAccessCode();
    
    // Store in cache (expires in 30 days = 43200 minutes)
    codeCache.set(email, accessCode, 43200);

    // Send email
    const subject = reason === 'lost' 
      ? 'Your New BetrParlay Premium Access Code' 
      : 'Welcome to BetrParlay Premium!';
      
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #10b981; margin: 0;">BetrParlay Premium</h1>
        </div>
        
        <h2 style="color: #374151;">Welcome to Premium!</h2>
        
        <p style="font-size: 16px; line-height: 1.5;">
          Thank you for your premium purchase. Here are your access details:
        </p>
        
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
          <h3 style="color: white; margin: 0 0 10px 0;">Your Access Code</h3>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: white; font-family: 'Courier New', monospace; background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
            ${accessCode}
          </div>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h3 style="color: #374151; margin-top: 0;">How to restore your premium access:</h3>
          <ol style="line-height: 1.6;">
            <li>Go to the "Restore Premium" section in the app</li>
            <li>Enter your email: <strong>${email}</strong></li>
            <li>Enter your access code: <strong>${accessCode}</strong></li>
            <li>Click "Restore Premium Access"</li>
          </ol>
        </div>
        
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #dc2626;"><strong>⚠️ Important:</strong> This code expires in 30 days and is unique to your purchase.</p>
        </div>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <div style="text-align: center;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Need help? Contact us at <a href="mailto:support@aiparlaycalculator.com" style="color: #10b981;">support@aiparlaycalculator.com</a>
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
            This code should not be shared with others.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@aiparlaycalculator.com',
      to: email,
      subject: subject,
      html: htmlContent,
    });

    // Log for debugging (remove in production)
    console.log(`✅ Access code sent to ${email}: ${accessCode}`);
    console.log('📊 Cache stats:', codeCache.getStats());

    res.status(200).json({ 
      success: true, 
      message: 'Access code sent successfully',
      // Remove this in production:
      debug: { accessCode } // Only for testing
    });

  } catch (error) {
    console.error('❌ Email sending error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send access code' 
    });
  }
}