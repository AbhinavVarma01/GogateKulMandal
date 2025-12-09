import fs from 'fs';

try {
  const content = fs.readFileSync('./controllers/familyController.js', 'utf8');
  const lines = content.split('\n');

  // Find the getAllFamilyMembers function
  const startIdx = lines.findIndex(l => l.includes('export const getAllFamilyMembers'));
  console.log('\n🔍 Checking getAllFamilyMembers function:\n');
  console.log('Lines 180-195:');
  for (let i = 180; i < 195 && i < lines.length; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }

  // Check for Members import
  const importsSection = lines.slice(0, 10);
  const hasMembersImport = importsSection.some(l => l.includes('import Members'));
  console.log(`\n✅ Members import found: ${hasMembersImport}`);

  // Check for FamilyMember import
  const hasFamilyMemberImport = importsSection.some(l => l.includes('import FamilyMember'));
  console.log(`✅ FamilyMember import found: ${hasFamilyMemberImport}`);

  // Count occurrences of Members.find vs FamilyMember.find
  const membersFindCount = (content.match(/Members\.find/g) || []).length;
  const familyMemberFindCount = (content.match(/FamilyMember\.find/g) || []).length;
  console.log(`\n📊 Members.find() calls: ${membersFindCount}`);
  console.log(`📊 FamilyMember.find() calls: ${familyMemberFindCount}`);
} catch (error) {
  console.error('Error verifying controller code:', error);
  process.exit(1);
}
