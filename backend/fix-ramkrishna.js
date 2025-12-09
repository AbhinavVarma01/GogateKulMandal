import { MongoClient } from 'mongodb';

const mongoUri = 'mongodb+srv://gogtekulam:gogtekul@cluster0.t3c0jt6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbName = 'test';
const collectionName = 'members';

async function fixRamkrishna() {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    console.log('Updating Ramkrishna\'s fatherSerNo from 28 to 27...');
    const result = await collection.updateOne(
      { serNo: 1 },
      { $set: { fatherSerNo: 27 } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Successfully updated Ramkrishna!');
      
      // Verify the update
      const updated = await collection.findOne({ serNo: 1 });
      console.log('\nVerification:');
      console.log('  serNo:', updated.serNo);
      console.log('  fatherSerNo:', updated.fatherSerNo);
    } else {
      console.log('❌ No records updated');
    }
  } catch (error) {
    console.error('Error while updating Ramkrishna record:', error);
    throw error;
  } finally {
    await client.close();
  }
}

fixRamkrishna().catch((error) => {
  console.error('Fatal error in fix-ramkrishna script:', error);
  process.exit(1);
});
