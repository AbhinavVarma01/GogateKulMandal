import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'test';

async function checkNewsData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    const newsCollection = db.collection('news');
    
    // Count total documents
    const totalCount = await newsCollection.countDocuments();
    console.log(`\n📊 Total news items in collection: ${totalCount}`);
    
    if (totalCount === 0) {
      console.log('\n⚠️  No news items found in the database!');
      console.log('Would you like to add sample news items? (You can do this through the frontend "Add News" button)');
    } else {
      // Get all news items
      const allNews = await newsCollection.find({}).sort({ createdAt: -1 }).toArray();
      
      console.log('\n📰 News Items in Database:');
      console.log('=' .repeat(80));
      
      allNews.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.title}`);
        console.log(`   ID: ${item._id}`);
        console.log(`   Category: ${item.category || 'N/A'}`);
        console.log(`   Priority: ${item.priority || 'N/A'}`);
        console.log(`   Author: ${item.authorName || 'Anonymous'} (SerNo: ${item.authorSerNo || 'N/A'})`);
        console.log(`   Published: ${item.isPublished ? 'Yes' : 'No'}`);
        console.log(`   Views: ${item.views || 0}`);
        console.log(`   Likes: ${item.likes?.length || 0}`);
        console.log(`   Comments: ${item.comments?.length || 0}`);
        console.log(`   Created: ${item.createdAt || 'N/A'}`);
        if (item.summary) {
          console.log(`   Summary: ${item.summary.substring(0, 100)}...`);
        }
      });
      
      console.log('\n' + '='.repeat(80));
      
      // Check for published vs unpublished
      const publishedCount = await newsCollection.countDocuments({ isPublished: true });
      console.log(`\n✅ Published: ${publishedCount}`);
      console.log(`📝 Unpublished: ${totalCount - publishedCount}`);
      
      // Category breakdown
      const categories = await newsCollection.distinct('category');
      console.log(`\n📂 Categories: ${categories.join(', ')}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

checkNewsData();
