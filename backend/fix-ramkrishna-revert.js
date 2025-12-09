import { MongoClient } from 'mongodb';

const mongoUri = 'mongodb+srv://gogtekulam:gogtekul@cluster0.t3c0jt6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbName = 'test';
const collectionName = 'members';

async function revertRamkrishna() {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    console.log('Reverting Ramkrishna\'s fatherSerNo back to 28...');
    const result = await collection.updateOne(
      { serNo: 1 },
      { $set: { fatherSerNo: 28 } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Successfully reverted Ramkrishna!');
      
      // Verify the update
      const updated = await collection.findOne({ serNo: 1 });
      console.log('\nVerification:');
      console.log('  serNo:', updated.serNo);
      console.log('  fatherSerNo:', updated.fatherSerNo);
    } else {
      console.log('❌ No records updated');
    }
  } catch (error) {
    console.error('Error while reverting Ramkrishna record:', error);
    throw error;
  } finally {
    await client.close();
  }
}

revertRamkrishna().catch((error) => {
  console.error('Fatal error in fix-ramkrishna-revert script:', error);
  process.exit(1);
});
