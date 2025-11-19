import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'test';

async function checkEventsData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    const eventsCollection = db.collection('events');
    
    // Count total documents
    const totalCount = await eventsCollection.countDocuments();
    console.log(`\n📊 Total events in collection: ${totalCount}`);
    
    if (totalCount === 0) {
      console.log('\n⚠️  No events found in the database!');
      console.log('Would you like to add sample events? (You can do this through the frontend "Add Event" button)');
    } else {
      // Get all events
      const allEvents = await eventsCollection.find({}).sort({ date: 1 }).toArray();
      
      console.log('\n🎉 Events in Database:');
      console.log('='.repeat(80));
      
      allEvents.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.title}`);
        console.log(`   ID: ${item._id}`);
        console.log(`   Type: ${item.eventType || 'N/A'}`);
        console.log(`   Date: ${item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}`);
        console.log(`   Time: ${item.fromTime || 'N/A'} - ${item.toTime || 'N/A'}`);
        console.log(`   Location: ${item.location || 'N/A'}`);
        console.log(`   Venue: ${item.venue || 'N/A'}`);
        console.log(`   Address: ${item.address || 'N/A'}`);
        console.log(`   Organizer: ${item.createdByName || 'Anonymous'} (SerNo: ${item.createdBySerNo || 'N/A'})`);
        console.log(`   Priority: ${item.priority || 'N/A'}`);
        console.log(`   Visible to All: ${item.visibleToAllVansh ? 'Yes' : 'No'}`);
        if (item.description) {
          console.log(`   Description: ${item.description.substring(0, 100)}...`);
        }
      });
      
      console.log('\n' + '='.repeat(80));
      
      // Event types breakdown
      const types = await eventsCollection.distinct('eventType');
      console.log(`\n🎭 Event Types: ${types.join(', ')}`);
      
      // Visibility breakdown
      const visibleToAll = await eventsCollection.countDocuments({ visibleToAllVansh: true });
      const notVisible = await eventsCollection.countDocuments({ visibleToAllVansh: false });
      console.log(`\n�️  Visible to All Vansh: ${visibleToAll}`);
      console.log(`🔒 Not Visible to All: ${notVisible}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

checkEventsData();
