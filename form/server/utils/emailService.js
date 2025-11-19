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
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.GMAIL_USER,
      to: email,
      subject: '🎉 Welcome to GogateKulMandal Heritage - Registration Approved!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
              padding: 20px;
              margin: 0;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 15px;
              overflow: hidden;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #f97316 0%, #dc2626 100%);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .header p {
              margin: 10px 0 0 0;
              font-size: 16px;
              opacity: 0.95;
            }
            .content {
              padding: 40px 30px;
            }
            .welcome-text {
              font-size: 18px;
              color: #333;
              margin-bottom: 20px;
              line-height: 1.6;
            }
            .credentials-box {
              background: linear-gradient(135deg, #fff5f0 0%, #ffe8e0 100%);
              border-left: 5px solid #f97316;
              padding: 25px;
              margin: 25px 0;
              border-radius: 10px;
            }
            .credentials-box h2 {
              color: #dc2626;
              margin-top: 0;
              margin-bottom: 20px;
              font-size: 20px;
            }
            .credential-item {
              background: white;
              padding: 15px;
              margin: 10px 0;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            }
            .credential-label {
              font-weight: 600;
              color: #666;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .credential-value {
              font-family: 'Courier New', monospace;
              font-size: 16px;
              font-weight: bold;
              color: #f97316;
              background: #fff5f0;
              padding: 8px 15px;
              border-radius: 5px;
            }
            .important-note {
              background: #fef3c7;
              border: 2px solid #fbbf24;
              padding: 20px;
              margin: 25px 0;
              border-radius: 10px;
            }
            .important-note h3 {
              color: #d97706;
              margin-top: 0;
              font-size: 16px;
              display: flex;
              align-items: center;
            }
            .important-note p {
              margin: 10px 0 0 0;
              color: #78350f;
              line-height: 1.6;
            }
            .login-button {
              display: inline-block;
              background: linear-gradient(135deg, #f97316 0%, #dc2626 100%);
              color: white;
              padding: 15px 40px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              margin: 20px 0;
              box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
              transition: all 0.3s ease;
            }
            .login-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
            }
            .footer {
              background: #f9fafb;
              padding: 30px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
            }
            .footer p {
              margin: 5px 0;
            }
            .divider {
              height: 1px;
              background: linear-gradient(to right, transparent, #e5e7eb, transparent);
              margin: 30px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>🎉 Registration Approved!</h1>
              <p>Welcome to the GogateKulMandal Heritage Family</p>
            </div>
            
            <div class="content">
              <p class="welcome-text">
                Dear <strong>${firstName} ${lastName}</strong>,
              </p>
              
              <p class="welcome-text">
                Congratulations! Your registration has been successfully approved by our administrator. 
                You now have full access to the GogateKulMandal Heritage portal where you can explore 
                your family tree, connect with relatives, and contribute to our rich heritage.
              </p>
              
              <div class="credentials-box">
                <h2>🔐 Your Login Credentials</h2>
                <div class="credential-item">
                  <span class="credential-label">Username</span>
                  <span class="credential-value">${username}</span>
                </div>
                <div class="credential-item">
                  <span class="credential-label">Password</span>
                  <span class="credential-value">${password}</span>
                </div>
              </div>
              
              <div class="important-note">
                <h3>⚠️ Important Security Information</h3>
                <p>
                  • Please keep these credentials safe and confidential<br>
                  • We recommend changing your password after your first login<br>
                  • Never share your password with anyone<br>
                  • If you forget your password, contact the administrator
                </p>
              </div>
              
              <div style="text-align: center;">
                <a href="http://localhost:3000/login" class="login-button">
                  Login to Your Account
                </a>
              </div>
              
              <div class="divider"></div>
              
              <p class="welcome-text" style="font-size: 16px;">
                If you have any questions or need assistance, please don't hesitate to contact our support team.
              </p>
              
              <p class="welcome-text" style="font-size: 16px; margin-top: 20px;">
                <strong>Best regards,</strong><br>
                GogateKulMandal Heritage Team
              </p>
            </div>
            
            <div class="footer">
              <p><strong>GogateKulMandal Heritage</strong></p>
              <p>Preserving Our Legacy, Connecting Our Future</p>
              <p style="margin-top: 15px; font-size: 12px;">
                This is an automated email. Please do not reply to this message.
              </p>
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
