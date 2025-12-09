import mongoose from 'mongoose';

const URI = 'mongodb+srv://gogtekulam:gogtekul@cluster0.t3c0jt6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

(async () => {
  try {
    await mongoose.connect(URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    console.log('🗑️  Clearing members collection...');
    await db.collection('members').deleteMany({});
    
    console.log('📥 Fetching from Heirarchy_form...');
    const familyMembers = await db.collection('Heirarchy_form').find().toArray();
    console.log(`Found ${familyMembers.length} documents\n`);

    let inserted = 0;
    for (const fm of familyMembers) {
      const personal = fm.personalDetails;
      
      if (!personal) {
        console.log(`⏭️  Skipping - no personalDetails`);
        continue;
      }

      const memberDoc = {
        firstName: personal.firstName,
        middleName: personal.middleName || '',
        lastName: personal.lastName,
        vansh: String(fm.vansh || personal.vansh),
        gender: personal.gender ? personal.gender.charAt(0).toUpperCase() + personal.gender.slice(1) : 'Other',
        dob: personal.dateOfBirth,
        email: personal.email || '',
        mobileNumber: personal.mobileNumber || '',
        Bio: personal.aboutYourself || '',
        profileImage: personal.profileImage?.data ? `data:${personal.profileImage.mimeType};base64,${personal.profileImage.data}` : null,
        serNo: fm.serNo,
      };

      console.log(`Inserting: ${memberDoc.firstName} ${memberDoc.lastName} (Vansh: ${memberDoc.vansh})`);
      
      await db.collection('members').insertOne(memberDoc);
      inserted++;
    }

    console.log(`\n✅ Inserted ${inserted} members`);
    
    const sample = await db.collection('members').find({}).limit(3).toArray();
    console.log('\nSample members:');
    sample.forEach(m => {
      console.log(`  - ${m.firstName} ${m.lastName} (Vansh: ${m.vansh})`);
    });
    
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
