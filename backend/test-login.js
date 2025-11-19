/**
 * Test script to verify login endpoint with test database
 * Run: node test-login.js
 */

const BASE_URL = 'http://localhost:4000';

// Test credentials from your schema
const testCredentials = {
  email: 'wife.of.hari.r.gogte8@example.com',
  password: 'pass8'
};

async function testLogin() {
  try {
    console.log('🧪 Testing Login Endpoint...\n');
    console.log('📋 Test Data:');
    console.log('  Email:', testCredentials.email);
    console.log('  Password:', testCredentials.password);
    console.log('  Database: test');
    console.log('  Collection: login');
    console.log('  URI: mongodb+srv://gogtekulam:gogtekul@cluster0.t3c0jt6.mongodb.net\n');

    console.log('🔄 Sending POST /api/auth/login...\n');

    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testCredentials.email,
        password: testCredentials.password
      })
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    console.log('✅ Login Successful!\n');
    console.log('📦 Response:');
    console.log(JSON.stringify(loginData, null, 2));

    // Test the /me endpoint
    if (loginData.token) {
      console.log('\n🔄 Testing GET /api/auth/me endpoint...\n');
      
      const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      });

      const meData = await meResponse.json();

      if (!meResponse.ok) {
        throw new Error(`Me endpoint failed: ${JSON.stringify(meData)}`);
      }

      console.log('✅ Me Endpoint Successful!\n');
      console.log('📦 User Info:');
      console.log(JSON.stringify(meData, null, 2));

      // Verify critical fields
      console.log('\n📝 Verification:');
      console.log(`  ✓ serNo present: ${meData.serNo !== undefined ? '✓' : '✗'} (Value: ${meData.serNo})`);
      console.log(`  ✓ role present: ${meData.role !== undefined ? '✓' : '✗'} (Value: ${meData.role})`);
      console.log(`  ✓ email correct: ${meData.email === testCredentials.email.toLowerCase() ? '✓' : '✗'}`);
    }
  } catch (error) {
    console.error('❌ Login Failed!\n');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testLogin();