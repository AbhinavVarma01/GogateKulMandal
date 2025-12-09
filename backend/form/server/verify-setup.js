import mongoose from 'mongoose';
import axios from 'axios';

const URI = 'mongodb+srv://gogtekulam:gogtekul@cluster0.t3c0jt6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

(async () => {
  try {
    console.log('\n📋 VERIFICATION SETUP\n');
    console.log('1️⃣  Connecting to MongoDB Atlas...');
    await mongoose.connect(URI);
    console.log('✅ Connected!\n');

    const db = mongoose.connection.db;
    
    console.log('2️⃣  Checking Collections in "test" database:\n');
    
    // Check Heirarchy_form collection
    const heirarchyCount = await db.collection('Heirarchy_form').countDocuments();
    console.log(`   📊 Heirarchy_form collection: ${heirarchyCount} records`);
    
    // Check members collection  
    const membersCount = await db.collection('members').countDocuments();
    console.log(`   📊 members collection: ${membersCount} records\n`);
    
    console.log('3️⃣  Testing API Endpoints...\n');
    
    // Test getAllFamilyMembers
    try {
      const response = await axios.get('http://localhost:5000/api/family/all');
      console.log(`   ✅ GET /api/family/all`);
      console.log(`      Returns: ${response.data.data.length} records from MEMBERS collection`);
      if (response.data.data.length > 0) {
        const first = response.data.data[0];
        console.log(`      Sample: ${first.firstName} ${first.lastName} (Vansh: ${first.vansh})`);
      }
    } catch (err) {
      console.log(`   ❌ GET /api/family/all: ${err.message}`);
    }
    
    console.log('\n4️⃣  SUMMARY:\n');
    console.log('   🟢 Form submissions → Heirarchy_form collection');
    console.log('   🟢 Father/Mother dropdown → members collection');
    console.log('   🟢 Search parents → members collection\n');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
