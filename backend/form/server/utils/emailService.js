import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Generate a random password with specified length
 * @param {number} length - Length of password (default: 10)
 * @returns {string} - Random password
 */
export const generateRandomPassword = (length = 10) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  
  let password = '';
  
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Generate username from member data
 * @param {object} memberData - Member data containing personal details
 * @returns {string} - Generated username
 */
export const generateUsername = (memberData) => {
  const firstName = memberData.personalDetails?.firstName || 'user';
  const serNo = memberData.serNo || memberData.sNo || Math.floor(Math.random() * 10000);
  
  // Format: firstname_S.NO (e.g., john_123)
  return `${firstName.toLowerCase()}_${serNo}`;
};

/**
 * Create email transporter using Gmail SMTP
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER || process.env.EMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS
    }
  });
};

/**
 * Send approval email with credentials to the member
 * @param {object} params - Email parameters
 * @param {string} params.email - Recipient email
 * @param {string} params.firstName - Member's first name
 * @param {string} params.lastName - Member's last name
 * @param {string} params.username - Generated username
 * @param {string} params.password - Generated password
 * @returns {Promise<object>} - Email send result
 */
export const sendApprovalEmail = async ({ email, firstName, lastName, username, password }) => {
  try {
    const transporter = createTransporter();
    const CLIENT_URL = process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || 'http://localhost:3000';
    
    const mailOptions = {
      from: `"GogateKulMandal Heritage" <${process.env.EMAIL_FROM || process.env.GMAIL_USER}>`,
      to: email,
      subject: '🎉 Registration Approved - GogateKulMandal Heritage Portal',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background-color: #f3f4f6;
              padding: 20px;
              line-height: 1.6;
            }
            .email-wrapper {
              max-width: 650px;
              margin: 0 auto;
            }
            .email-container {
              background: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
            }
            .header {
              background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%);
              padding: 50px 40px;
              text-align: center;
              color: #ffffff;
              position: relative;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="rgba(255,255,255,0.05)"/></svg>');
              opacity: 0.1;
            }
            .header-content {
              position: relative;
              z-index: 1;
            }
            .header h1 {
              font-size: 32px;
              font-weight: 700;
              margin-bottom: 12px;
              letter-spacing: -0.5px;
            }
            .header p {
              font-size: 18px;
              opacity: 0.95;
              font-weight: 400;
            }
            .content {
              padding: 45px 40px;
            }
            .greeting {
              font-size: 20px;
              color: #111827;
              margin-bottom: 24px;
              font-weight: 600;
            }
            .message-text {
              font-size: 16px;
              color: #4b5563;
              margin-bottom: 20px;
              line-height: 1.7;
            }
            .credentials-section {
              background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
              border-radius: 12px;
              padding: 32px;
              margin: 32px 0;
              border: 1px solid #fdba74;
            }
            .credentials-section h2 {
              color: #c2410c;
              font-size: 20px;
              margin-bottom: 24px;
              font-weight: 700;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .credentials-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0 12px;
            }
            .credentials-table tr {
              background: #ffffff;
              border-radius: 8px;
            }
            .credentials-table td {
              padding: 18px 20px;
            }
            .credentials-table tr td:first-child {
              border-radius: 8px 0 0 8px;
            }
            .credentials-table tr td:last-child {
              border-radius: 0 8px 8px 0;
            }
            .credential-label {
              font-weight: 600;
              color: #374151;
              font-size: 15px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              width: 140px;
            }
            .credential-value {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              font-size: 17px;
              font-weight: 700;
              color: #ea580c;
              background: #fff7ed;
              padding: 10px 18px;
              border-radius: 6px;
              display: inline-block;
              border: 1px solid #fed7aa;
              word-break: break-all;
            }
            .security-notice {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 24px;
              margin: 32px 0;
              border-radius: 8px;
            }
            .security-notice h3 {
              color: #d97706;
              font-size: 17px;
              margin-bottom: 16px;
              font-weight: 700;
              display: flex;
              align-items: center;
              gap: 8px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            }
            .security-notice ul {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            .security-notice li {
              color: #92400e;
              margin: 12px 0;
              padding-left: 24px;
              position: relative;
              line-height: 1.7;
              font-size: 15px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            }
            .security-notice li::before {
              content: '✓';
              position: absolute;
              left: 0;
              color: #f59e0b;
              font-weight: bold;
              font-size: 16px;
            }
            .divider {
              height: 1px;
              background: linear-gradient(to right, transparent, #d1d5db, transparent);
              margin: 36px 0;
            }
            .closing {
              font-size: 16px;
              color: #4b5563;
              margin-top: 32px;
              line-height: 1.8;
            }
            .signature {
              margin-top: 24px;
              font-size: 16px;
              color: #111827;
            }
            .signature strong {
              display: block;
              margin-bottom: 4px;
            }
            .footer {
              background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
              padding: 40px;
              text-align: center;
              color: #9ca3af;
            }
            .footer-brand {
              color: #ffffff;
              font-size: 20px;
              font-weight: 700;
              margin-bottom: 8px;
            }
            .footer-tagline {
              color: #d1d5db;
              font-size: 15px;
              margin-bottom: 20px;
              font-style: italic;
            }
            .footer-info {
              font-size: 13px;
              color: #6b7280;
              margin-top: 24px;
              padding-top: 24px;
              border-top: 1px solid #374151;
            }
            @media only screen and (max-width: 600px) {
              body { padding: 10px; }
              .header { padding: 40px 24px; }
              .content { padding: 32px 24px; }
              .credentials-section { padding: 24px 20px; }
              .credentials-table td { 
                padding: 14px 16px; 
                font-size: 14px;
              }
              .credential-label {
                font-size: 14px;
                width: 100px;
              }
              .credential-value {
                font-size: 15px;
                padding: 8px 12px;
              }
              .security-notice { padding: 20px 16px; }
              .security-notice li { font-size: 14px; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="email-container">
              <div class="header">
                <div class="header-content">
                  <h1>✨ Registration Approved</h1>
                  <p>Welcome to GogateKulMandal Heritage</p>
                </div>
              </div>
              
              <div class="content">
                <div class="greeting">
                  Dear ${firstName} ${lastName},
                </div>
                
                <p class="message-text">
                  We are delighted to inform you that your registration has been successfully approved! 
                  Your account is now active and ready to use.
                </p>
                
                <p class="message-text">
                  You now have complete access to the GogateKulMandal Heritage portal where you can explore 
                  your ancestral lineage, discover family connections, stay updated with community news and events, 
                  and contribute to preserving our rich heritage for future generations.
                </p>
                
                <div class="credentials-section">
                  <h2>🔐 Your Account Credentials</h2>
                  <table class="credentials-table">
                    <tr>
                      <td class="credential-label">Username:</td>
                      <td class="credential-value">${username}</td>
                    </tr>
                    <tr>
                      <td class="credential-label">Password:</td>
                      <td class="credential-value">${password}</td>
                    </tr>
                  </table>
                </div>
                
                <div class="security-notice">
                  <h3>🛡️ Security Guidelines</h3>
                  <ul>
                    <li>Keep your credentials confidential and secure</li>
                    <li>Change your password immediately after your first login</li>
                    <li>Never share your password with anyone, including support staff</li>
                    <li>Use a strong, unique password combining letters, numbers, and symbols</li>
                    <li>Contact the administrator if you suspect any unauthorized access</li>
                  </ul>
                </div>
                
                <div class="divider"></div>
                
                <div class="closing">
                  <p>
                    If you need support or have any questions concerning the portal,
                    our team is available to assist you. Kindly reach out whenever necessary.
                  </p>
                </div>
                
                <div class="signature">
                  <strong>Warm regards,</strong>
                  <span>The GogateKulMandal Heritage Team</span>
                </div>
              </div>
              
              <div class="footer">
                <div class="footer-brand">GogateKulMandal Heritage</div>
                <div class="footer-tagline">Preserving Our Legacy • Connecting Our Future</div>
                <div class="footer-info">
                  This is an automated notification. Please do not reply to this email.<br>
                  © 2025 GogateKulMandal Heritage. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

/**
 * Send test email to verify email configuration
 * @param {string} testEmail - Email address to send test email to
 */
export const sendTestEmail = async (testEmail) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.GMAIL_USER,
      to: testEmail,
      subject: 'Test Email - GogateKulMandal Heritage',
      html: `
        <h1>Email Configuration Test</h1>
        <p>This is a test email to verify that your email service is working correctly.</p>
        <p>If you received this email, your configuration is correct!</p>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    throw error;
  }
};
