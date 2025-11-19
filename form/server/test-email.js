import { sendTestEmail, generateRandomPassword, generateUsername } from './utils/emailService.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('=== Email Service Test ===\n');

// Check environment variables
console.log('Environment Variables:');
console.log('GMAIL_USER:', process.env.GMAIL_USER || process.env.EMAIL_USER || 'NOT SET');
console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '***' + process.env.GMAIL_APP_PASSWORD.slice(-4) : 'NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'NOT SET');
console.log();

// Test password generation
console.log('Testing Password Generation:');
const password1 = generateRandomPassword(8);
const password2 = generateRandomPassword(10);
const password3 = generateRandomPassword(12);
console.log('8 characters:', password1);
console.log('10 characters:', password2);
console.log('12 characters:', password3);
console.log();

// Test username generation
console.log('Testing Username Generation:');
const testMember1 = {
  personalDetails: { firstName: 'John' },
  serNo: 123
};
const testMember2 = {
  personalDetails: { firstName: 'Jane' },
  sNo: 456
};
console.log('Username 1:', generateUsername(testMember1));
console.log('Username 2:', generateUsername(testMember2));
console.log();

// Test email sending (replace with your email)
const testEmail = process.env.GMAIL_USER || 'your-email@gmail.com';

console.log(`Sending test email to: ${testEmail}`);
console.log('Please wait...\n');

sendTestEmail(testEmail)
  .then((result) => {
    console.log('✅ SUCCESS!');
    console.log('Message ID:', result.messageId);
    console.log('\nCheck your inbox for the test email.');
  })
  .catch((error) => {
    console.error('❌ FAILED!');
    console.error('Error:', error.message);
    console.error('\nPlease check your email configuration in .env file');
    console.error('Required variables: GMAIL_USER, GMAIL_APP_PASSWORD');
  });
