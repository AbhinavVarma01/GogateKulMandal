import mongoose from 'mongoose';

const URI = 'mongodb+srv://gogtekulam:gogtekul@cluster0.t3c0jt6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

(async () => {
  try {
    await mongoose.connect(URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    const memberCount = await db.collection('members').countDocuments();
    console.log(`📊 Total members in collection: ${memberCount}`);
    
    if (memberCount > 0) {
      const members = await db.collection('members').find({}).limit(10).toArray();
      console.log('\n=== Sample Members ===');
      members.forEach(m => {
        console.log(`Name: ${m.firstName} ${m.lastName} | Vansh: "${m.vansh}" (${typeof m.vansh})`);
      });

      const vanshValues = await db.collection('members').distinct('vansh');
      console.log(`\n=== Unique Vansh Values ===`);
      console.log(vanshValues);
      
      console.log(`\n🔍 Looking for vansh="61"...`);
      const search61 = await db.collection('members').find({ vansh: "61" }).toArray();
      console.log(`Found ${search61.length} members with vansh="61"`);
      search61.forEach(m => {
        console.log(`  - ${m.firstName} ${m.lastName}`);
      });
    } else {
      console.log('⚠️  Members collection is empty!');
    }

    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
