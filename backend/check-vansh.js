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
    
    console.log('=== Checking Ramkrishna (serNo 1) ===');
    const ramkrishna = await collection.findOne({ serNo: 1 });
    if (ramkrishna) {
      console.log('  serNo:', ramkrishna.serNo);
      console.log('  vansh:', ramkrishna.vansh);
      console.log('  personalDetails.vansh:', ramkrishna.personalDetails?.vansh);
    }
    
    console.log('\n=== Checking Ballal (serNo 28) ===');
    const ballal = await collection.findOne({ serNo: 28 });
    if (ballal) {
      console.log('  serNo:', ballal.serNo);
      console.log('  vansh:', ballal.vansh);
      console.log('  personalDetails.vansh:', ballal.personalDetails?.vansh);
    }
    
    console.log('\n=== Checking Wife (serNo 27) ===');
    const wife = await collection.findOne({ serNo: 27 });
    if (wife) {
      console.log('  serNo:', wife.serNo);
      console.log('  vansh:', wife.vansh);
      console.log('  personalDetails.vansh:', wife.personalDetails?.vansh);
    }
  } catch (error) {
    console.error('Error while verifying vansh data:', error);
    throw error;
  } finally {
    await client.close();
  }
}

check().catch((error) => {
  console.error('Fatal error in check-vansh script:', error);
  process.exit(1);
});
