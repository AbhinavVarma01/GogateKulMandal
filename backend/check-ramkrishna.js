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
      console.log('Found Ramkrishna:');
      console.log('  serNo:', ramkrishna.serNo);
      console.log('  fatherSerNo:', ramkrishna.fatherSerNo);
      console.log('  name:', ramkrishna.name);
    } else {
      console.log('Ramkrishna not found!');
    }
    
    console.log('\n=== Checking Ballal (serNo 27) ===');
    const ballal = await collection.findOne({ serNo: 27 });
    if (ballal) {
      console.log('Found Ballal:');
      console.log('  serNo:', ballal.serNo);
      console.log('  name:', ballal.name);
    } else {
      console.log('Ballal not found!');
    }
  } catch (error) {
    console.error('Error while checking Ramkrishna/Ballal data:', error);
    throw error;
  } finally {
    await client.close();
  }
}

check().catch((error) => {
  console.error('Fatal error in check-ramkrishna script:', error);
  process.exit(1);
});
