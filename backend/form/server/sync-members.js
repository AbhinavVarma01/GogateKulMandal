import mongoose from 'mongoose';
import FamilyMember from './models/FamilyMember.js';
import Members from './models/Members.js';

const URI = 'mongodb+srv://gogtekulam:gogtekul@cluster0.t3c0jt6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

(async () => {
  try {
    await mongoose.connect(URI);
    console.log('✅ Connected to MongoDB');

    const familyMembers = await FamilyMember.find().select('personalDetails');
    console.log(`📥 Found ${familyMembers.length} family members to sync`);

    let synced = 0;
    let skipped = 0;
    
    for (const fm of familyMembers) {
      const personal = fm.personalDetails;
      
      const member = new Members({
        firstName: personal.firstName,
        middleName: personal.middleName,
        lastName: personal.lastName,
        vansh: String(personal.vansh),
        gender: personal.gender?.charAt(0).toUpperCase() + personal.gender?.slice(1).toLowerCase(),
        dob: personal.dateOfBirth,
        profileImage: personal.profileImage?.data ? `data:${personal.profileImage.mimeType};base64,${personal.profileImage.data}` : null,
        Bio: personal.aboutYourself,
      });

      try {
        await member.save();
        synced++;
        console.log(`✅ Synced: ${personal.firstName} ${personal.lastName} (Vansh: ${personal.vansh})`);
      } catch (e) {
        skipped++;
        console.log(`⏭️  Skipped: ${personal.firstName} ${personal.lastName} - ${e.message.split('\n')[0]}`);
      }
    }

    console.log(`\n📊 Sync complete:`);
    console.log(`   ✅ Synced: ${synced}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    
    const totalMembers = await Members.countDocuments();
    console.log(`   📈 Total in members collection: ${totalMembers}`);
    
    process.exit(0);
  } catch (e) {
    console.error('❌ Fatal Error:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();
