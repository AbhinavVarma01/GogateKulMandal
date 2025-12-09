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
      console.log('Found Ballal:');
      console.log('  serNo:', ballal.serNo);
      console.log('  fatherSerNo:', ballal.fatherSerNo);
      console.log('  name:', ballal.name);
      console.log('  Has father?', ballal.fatherSerNo ? 'YES' : 'NO');
    } else {
      console.log('❌ Ballal (serNo 28) NOT FOUND IN DATABASE!');
    }
    
    console.log('\n=== Checking Ballal\'s wife (serNo 27) ===');
    const wife = await collection.findOne({ serNo: 27 });
    if (wife) {
      console.log('Found person with serNo 27:');
      console.log('  serNo:', wife.serNo);
      console.log('  fatherSerNo:', wife.fatherSerNo);
      console.log('  spouseSerNo:', wife.spouseSerNo);
    } else {
      console.log('Person with serNo 27 not found');
    }
  } catch (error) {
    console.error('Error while checking Ballal records:', error);
    throw error;
  } finally {
    await client.close();
  }
}

check().catch((error) => {
  console.error('Fatal error in check-ballal script:', error);
  process.exit(1);
});
