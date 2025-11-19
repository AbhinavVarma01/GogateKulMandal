import axios from 'axios';
import { spawn } from 'child_process';

// Wait 3 seconds for server to start
setTimeout(async () => {
  try {
    console.log('\n🔄 Testing /api/family/all endpoint...\n');
    const response = await axios.get('http://localhost:5000/api/family/all', { timeout: 5000 });
    
    console.log('✅ SUCCESS! Response received:');
    console.log(`Total records returned: ${response.data.data.length}`);
    
    if (response.data.data.length > 0) {
      const first = response.data.data[0];
      console.log('\n📋 First record:');
      console.log(JSON.stringify(first, null, 2));
    } else {
      console.log('\n⚠️  No records found in response');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}, 3000);
