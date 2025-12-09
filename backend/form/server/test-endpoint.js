import axios from 'axios';

(async () => {
  try {
    console.log('🔄 Testing /api/family/all endpoint...\n');
    const response = await axios.get('http://localhost:5000/api/family/all');
    console.log('\n✅ Response received:');
    console.log(`Total records: ${response.data.data.length}`);
    if (response.data.data.length > 0) {
      console.log('\nFirst record sample:');
      const first = response.data.data[0];
      console.log(`  - firstName: ${first.firstName}`);
      console.log(`  - lastName: ${first.lastName}`);
      console.log(`  - vansh: ${first.vansh}`);
      console.log(`  - serNo: ${first.serNo}`);
      console.log(`\nFull first record keys: ${Object.keys(first).join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
})();
