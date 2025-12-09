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
    
    console.log('=== Checking Ballal (serNo 28) ===');
    const ballal = await collection.findOne({ serNo: 28 });
    if (ballal) {
      console.log('Field check:');
      console.log('  level:', ballal.level);
      console.log('  personalDetails.level:', ballal.personalDetails?.level);
      console.log('\nAll root-level keys:');
      console.log(Object.keys(ballal).slice(0, 15).join(', '));
    }
    
    console.log('\n=== Sample of personalDetails ===');
    if (ballal?.personalDetails) {
      console.log(Object.keys(ballal.personalDetails).join(', '));
    }
  } catch (error) {
    console.error('Error while checking level metadata:', error);
    throw error;
  } finally {
    await client.close();
  }
}

check().catch((error) => {
  console.error('Fatal error in check-level script:', error);
  process.exit(1);
});
