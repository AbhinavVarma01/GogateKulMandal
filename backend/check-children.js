import { MongoClient } from 'mongodb';

const mongoUri = 'mongodb+srv://gogtekulam:gogtekul@cluster0.t3c0jt6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbName = 'test';
const collectionName = 'members';

async function check() {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    console.log('=== Checking Ballal (serNo 28) childrenSerNos ===');
    const ballal = await collection.findOne({ serNo: 28 });
    if (ballal) {
      console.log('  childrenSerNos:', ballal.childrenSerNos);
      if (Array.isArray(ballal.childrenSerNos)) {
        console.log('  Count:', ballal.childrenSerNos.length);
        console.log('  Contains 1 (Ramkrishna)?', ballal.childrenSerNos.includes(1));
      }
    }
    
    console.log('\n=== Checking Ramkrishna (serNo 1) parent relationship ===');
    const ramkrishna = await collection.findOne({ serNo: 1 });
    if (ramkrishna) {
      console.log('  fatherSerNo:', ramkrishna.fatherSerNo);
      console.log('  Should be child of 28?', ramkrishna.fatherSerNo === 28);
    }
  } catch (error) {
    console.error('Error while checking children data:', error);
    throw error;
  } finally {
    await client.close();
  }
}

check().catch((error) => {
  console.error('Fatal error in check-children script:', error);
  process.exit(1);
});
