import mongoose from 'mongoose';

const URI = 'mongodb+srv://gogtekulam:gogtekul@cluster0.t3c0jt6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

try {
  await mongoose.connect(URI);
  console.log('✅ Connected to MongoDB');

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log('Available collections:', collections.map(c => c.name));

  const memberCount = await db.collection('members').countDocuments();
  console.log(`\n📊 Total members: ${memberCount}`);

  if (memberCount > 0) {
    const members = await db.collection('members').find({}).limit(5).toArray();
    console.log('\n=== Sample Members ===');
    members.forEach(m => {
      console.log(`Name: ${m.firstName} | Vansh: "${m.vansh}" (${typeof m.vansh})`);
    });

    const distinct = await db.collection('members').distinct('vansh');
    console.log('\n=== Unique Vansh Values (first 10) ===');
    distinct.slice(0, 10).forEach(v => console.log(`"${v}" (${typeof v})`));
  } else {
    console.log('\n⚠️ No members found in collection');
  }

  process.exit(0);
} catch (e) {
  console.error('❌ Error:', e.message);
  process.exit(1);
}
