import mongoose from 'mongoose';

const URI = 'mongodb+srv://gogtekulam:gogtekul@cluster0.t3c0jt6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

(async () => {
  try {
    await mongoose.connect(URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    const membersCount = await db.collection('members').countDocuments();
    console.log(`Members count: ${membersCount}`);
    
    const heirarchyCount = await db.collection('Heirarchy_form').countDocuments();
    console.log(`Heirarchy_form count: ${heirarchyCount}`);
    
    const sample = await db.collection('members').findOne({});
    console.log('\nSample member:', sample ? JSON.stringify(sample, null, 2) : 'No members found');
    
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
