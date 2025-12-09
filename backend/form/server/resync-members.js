import mongoose from 'mongoose';
import FamilyMember from './models/FamilyMember.js';
import Members from './models/Members.js';

const URI = 'mongodb+srv://gogtekulam:gogtekul@cluster0.t3c0jt6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

(async () => {
  try {
    await mongoose.connect(URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing members
    console.log('🗑️  Clearing existing members collection...');
    await Members.deleteMany({});
    console.log('✅ Members collection cleared\n');

    // Get family members
    const familyMembers = await FamilyMember.find();
    console.log(`📥 Found ${familyMembers.length} family members to sync\n`);

    let synced = 0;
    
    for (const fm of familyMembers) {
      const personal = fm.personalDetails;
      
      console.log(`Processing: ${personal.firstName} ${personal.lastName} (Vansh: ${personal.vansh})`);
      
      const memberData = {
        firstName: personal.firstName,
        middleName: personal.middleName || '',
        lastName: personal.lastName,
        vansh: String(personal.vansh),
        gender: personal.gender ? personal.gender.charAt(0).toUpperCase() + personal.gender.slice(1) : 'Other',
        dob: personal.dateOfBirth,
        Bio: personal.aboutYourself || '',
      };
      
      console.log(`  Data to save:`, memberData);
      
      const member = new Members(memberData);
      await member.save();
      synced++;
      console.log(`  ✅ Saved\n`);
    }

    console.log(`\n📊 Sync complete: ${synced} members synced`);
    
    const total = await Members.countDocuments();
    const sample = await Members.find({}).limit(2);
    console.log(`Total in DB: ${total}`);
    console.log('Sample:', sample.map(m => ({ name: m.firstName, vansh: m.vansh })));
    
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();
